"use client";

import { useEffect, useRef } from "react";

/**
 * 噪声流动改自 metaory/gradient-gl 的 common.glsl + c1（MIT）。
 * 颜色收成夜蓝，鼠标只推一下，停住后不再跑帧。
 *
 * Copyright (c) 2025 metaory
 * https://github.com/metaory/gradient-gl
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 */
const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}`;
const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uTime;
vec2 hash2(vec2 p){
  p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));
  return fract(sin(p)*43758.5453);
}
float noise(vec2 p){
  vec2 i=floor(p);
  vec2 f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  float n=mix(mix(dot(-1.0+2.0*hash2(i),f),
                  dot(-1.0+2.0*hash2(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),
              mix(dot(-1.0+2.0*hash2(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),
                  dot(-1.0+2.0*hash2(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);
  return 0.5+0.5*n;
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  float t=uTime*0.35;
  float pull=exp(-length(uv-uMouse)*2.4);
  vec2 p=uv+(uMouse-0.5)*0.14*pull;
  float n1=noise(p*2.5+t*0.4);
  float n2=noise(p*1.8+vec2(5.0,3.0)-t*0.35);
  vec2 flow=p+vec2(n1-0.5,n2-0.5)*0.3;
  float blend=smoothstep(0.2,0.8,flow.x+sin(flow.y*2.5+t*0.6)*0.25+0.2);
  vec3 deep=vec3(0.018,0.028,0.045);
  vec3 ink=vec3(0.03,0.09,0.16);
  vec3 tide=vec3(0.05,0.2,0.32);
  vec3 col=mix(deep,ink,n2);
  col=mix(col,tide,blend*0.7);
  col+=tide*pull*0.28;
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
