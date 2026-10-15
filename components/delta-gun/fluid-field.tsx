"use client";

import { useEffect, useRef } from "react";

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}`;
const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uTime;
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  float pull=exp(-length(uv-uMouse)*2.4);
  vec2 q=uv+(uMouse-0.5)*0.12*pull;
  float a=0.5+0.5*sin(q.x*3.1+uTime*0.16);
  float b=0.5+0.5*sin(q.y*2.6-uTime*0.11+1.3);
  float c=0.5+0.5*sin((q.x+q.y)*1.8+uTime*0.08);
  vec3 col=vec3(0.025,0.035,0.05);
  col+=vec3(0.04,0.22,0.34)*smoothstep(0.25,0.95,a)*0.62;
  col+=vec3(0.02,0.10,0.20)*b*0.38;
  col+=vec3(0.05,0.14,0.24)*c*0.28;
  gl_FragColor=vec4(col,1.0);
}`;

/** 低分辨率网格渐变。鼠标轻轻推动，停住后不再跑帧。 */
export function FluidField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse), (max-width: 767px)").matches;
    if (reduce || coarse) return;

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
    if (!gl) return;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "uRes");
    const uMouse = gl.getUniformLocation(program, "uMouse");
    const uTime = gl.getUniformLocation(program, "uTime");

    const width = 192;
    const height = 108;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    gl.uniform2f(uRes, width, height);

    let raf = 0;
    let frames = 0;
    let hidden = document.hidden;
    let time = 0;
    const mouse = { x: 0.5, y: 0.62, tx: 0.5, ty: 0.62 };

    const draw = () => {
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      time += 0.016;
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = () => {
      if (hidden) {
        raf = 0;
        return;
      }
      draw();
      frames -= 1;
      raf = frames > 0 ? requestAnimationFrame(loop) : 0;
    };
    const kick = (n = 90) => {
      frames = Math.max(frames, n);
      if (!raf && !hidden) raf = requestAnimationFrame(loop);
    };

    draw();
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      mouse.tx = event.clientX / window.innerWidth;
      mouse.ty = 1 - event.clientY / window.innerHeight;
      kick();
    };
    const onVisibility = () => {
      hidden = document.hidden;
      if (hidden && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!hidden && frames > 0) kick(frames);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(14,70,96,0.55),transparent_55%),radial-gradient(ellipse_at_80%_70%,rgba(8,28,48,0.65),#07080c_70%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
