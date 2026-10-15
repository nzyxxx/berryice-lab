"use client";

import { useEffect, useRef } from "react";
import type { TextureDataType } from "three";

/**
 * 首页水面。经典高度场 ping-pong（jQuery ripples / React Bits Ripple 同款）：
 * 一张贴图记高度和速度，另一张写下一步，来回交换。
 * 画布盖在雨上面、内容下面，用 soft-light 把坡度轻轻揉进雨景，看起来像拨了一下水。
 * 没有光标图形。空闲、隐藏、触控、减少动效时都不跑动画帧。
 */
const SIM = 256;
const DROP_RADIUS = 0.045;
const DROP_STRENGTH = 0.028;

const UPDATE_FRAG = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec2 uDelta;
  uniform vec2 uCenters[8];
  uniform float uCount;
  uniform float uBias;
  varying vec2 vUv;
  void main() {
    vec4 info = texture2D(uTex, vUv);
    vec2 dx = vec2(uDelta.x, 0.0);
    vec2 dy = vec2(0.0, uDelta.y);
    float average = (
      texture2D(uTex, vUv - dx).r +
      texture2D(uTex, vUv + dx).r +
      texture2D(uTex, vUv - dy).r +
      texture2D(uTex, vUv + dy).r
    ) * 0.25;
    float height = info.r - uBias;
    float vel = info.g - uBias;
    vel += (average - uBias - height) * 2.0;
    vel *= 0.982;
    height += vel;
    for (int i = 0; i < 8; i++) {
      float live = step(float(i) + 0.5, uCount);
      float dist = distance(vUv, uCenters[i]);
      float bump = exp(-dist * dist / (DROP_RADIUS * DROP_RADIUS));
      height += bump * DROP_STRENGTH * live;
    }
    height = clamp(height, -0.45, 0.45);
    vel = clamp(vel, -0.45, 0.45);
    gl_FragColor = vec4(height + uBias, vel + uBias, 0.0, 1.0);
  }
`.replace("DROP_RADIUS * DROP_RADIUS", `${DROP_RADIUS * DROP_RADIUS}`).replace("DROP_STRENGTH", `${DROP_STRENGTH}`);

const VIEW_FRAG = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec2 uDelta;
  uniform float uBias;
  varying vec2 vUv;
  void main() {
    float h = texture2D(uTex, vUv).r - uBias;
    float hx = texture2D(uTex, vUv + vec2(uDelta.x, 0.0)).r - texture2D(uTex, vUv - vec2(uDelta.x, 0.0)).r;
    float hy = texture2D(uTex, vUv + vec2(0.0, uDelta.y)).r - texture2D(uTex, vUv - vec2(0.0, uDelta.y)).r;
    float slope = length(vec2(hx, hy));
    float alpha = smoothstep(0.004, 0.045, slope);
    float crest = clamp(h * 12.0, -1.0, 1.0);
    vec3 deep = vec3(0.02, 0.05, 0.09);
    vec3 sheen = vec3(0.86, 0.93, 1.0);
    vec3 color = mix(deep, sheen, crest * 0.5 + 0.5);
    gl_FragColor = vec4(color, alpha * 0.45);
  }
`;

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export function WaterRipple({ enabled }: { enabled: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!enabled || !host) return;
    const fine = window.matchMedia("(pointer: fine) and (min-width: 768px)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    let dead = false;
    let raf = 0;
    let framesLeft = 0;
    let hidden = document.hidden;
    const centers: number[] = [];
    let lastX = -1;
    let lastY = -1;

    const cleanups: Array<() => void> = [];

    void import("three").then((THREE) => {
      if (dead) return;

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
        premultipliedAlpha: false,
      });
      renderer.setPixelRatio(1);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;
      host.appendChild(renderer.domElement);

      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const geom = new THREE.PlaneGeometry(2, 2);
      const makeTarget = (type: TextureDataType) => {
        const target = new THREE.WebGLRenderTarget(SIM, SIM, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
          type,
          depthBuffer: false,
          stencilBuffer: false,
        });
        target.texture.colorSpace = THREE.LinearSRGBColorSpace;
        return target;
      };
      let read = makeTarget(THREE.HalfFloatType);
      let write = makeTarget(THREE.HalfFloatType);
      renderer.setRenderTarget(read);
      const gl = renderer.getContext();
      const halfOk = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      let bias = 0;
      if (!halfOk) {
        read.dispose();
        write.dispose();
        read = makeTarget(THREE.UnsignedByteType);
        write = makeTarget(THREE.UnsignedByteType);
        bias = 0.5;
      }

      const delta = new THREE.Vector2(1 / SIM, 1 / SIM);
      const centerUniforms = Array.from({ length: 8 }, () => new THREE.Vector2(0.5, 0.5));
      const updateMat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: UPDATE_FRAG,
        uniforms: {
          uTex: { value: read.texture },
          uDelta: { value: delta },
          uCenters: { value: centerUniforms },
          uCount: { value: 0 },
          uBias: { value: bias },
        },
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      });
      const viewMat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: VIEW_FRAG,
        uniforms: {
          uTex: { value: read.texture },
          uDelta: { value: delta },
          uBias: { value: bias },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      });
      const simScene = new THREE.Scene();
      const viewScene = new THREE.Scene();
      simScene.add(new THREE.Mesh(geom, updateMat));
      viewScene.add(new THREE.Mesh(geom, viewMat));

      const resize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight, false);
      };
      resize();

      const rest = bias === 0 ? 0x000000 : 0x808080;
      const clearTarget = (target: typeof read) => {
        renderer.setRenderTarget(target);
        renderer.setClearColor(rest, 1);
        renderer.clear();
      };
      clearTarget(read);
      clearTarget(write);
      renderer.setRenderTarget(null);
      renderer.setClearColor(0x000000, 0);

      const step = () => {
        const count = Math.min(8, centers.length / 2);
        updateMat.uniforms.uCount.value = count;
        for (let i = 0; i < 8; i += 1) {
          const point = centerUniforms[i];
          if (i < count) point.set(centers[i * 2], centers[i * 2 + 1]);
        }
        centers.length = 0;
        updateMat.uniforms.uTex.value = read.texture;
        renderer.setRenderTarget(write);
        renderer.render(simScene, camera);
        const swap = read;
        read = write;
        write = swap;
        viewMat.uniforms.uTex.value = read.texture;
        renderer.setRenderTarget(null);
        renderer.setClearColor(0x000000, 0);
        renderer.clear();
        renderer.render(viewScene, camera);
      };

      const loop = () => {
        if (dead || hidden) {
          raf = 0;
          return;
        }
        step();
        framesLeft -= 1;
        raf = framesLeft > 0 ? requestAnimationFrame(loop) : 0;
        if (!raf) {
          renderer.setRenderTarget(null);
          renderer.setClearColor(0x000000, 0);
          renderer.clear();
        }
      };
      const kick = () => {
        if (dead || hidden) return;
        if (!raf) raf = requestAnimationFrame(loop);
      };

      const onPointer = (event: PointerEvent) => {
        if (event.pointerType === "touch") return;
        const x = event.clientX / window.innerWidth;
        const y = 1 - event.clientY / window.innerHeight;
        if (lastX >= 0) {
          const dist = Math.hypot(x - lastX, y - lastY);
          const steps = Math.min(8, Math.max(1, Math.ceil(dist / 0.012)));
          for (let i = 1; i <= steps; i += 1) {
            const t = i / steps;
            centers.push(lastX + (x - lastX) * t, lastY + (y - lastY) * t);
          }
        } else {
          centers.push(x, y);
        }
        lastX = x;
        lastY = y;
        framesLeft = 160;
        kick();
      };
      const onVisibility = () => {
        hidden = document.hidden;
        if (hidden) {
          if (raf) cancelAnimationFrame(raf);
          raf = 0;
          return;
        }
        if (framesLeft > 0) kick();
      };

      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("resize", resize);
      document.addEventListener("visibilitychange", onVisibility);

      cleanups.push(() => {
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("resize", resize);
        document.removeEventListener("visibilitychange", onVisibility);
        if (raf) cancelAnimationFrame(raf);
        geom.dispose();
        updateMat.dispose();
        viewMat.dispose();
        read.dispose();
        write.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      });
    });

    return () => {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      for (const fn of cleanups) fn();
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div ref={hostRef} className="water-ripple" aria-hidden />;
}
