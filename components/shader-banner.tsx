"use client";

import { useEffect, useRef } from "react";

export function ShaderBanner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vsSource = `
      attribute vec4 aVertexPosition;
      void main() { gl_Position = aVertexPosition; }
    `;

    const fsSource = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;

      const float overallSpeed = 0.2;
      const float gridSmoothWidth = 0.015;
      const float axisWidth = 0.05;
      const float majorLineWidth = 0.025;
      const float minorLineWidth = 0.0125;
      const float majorLineFrequency = 5.0;
      const float minorLineFrequency = 1.0;
      const float scale = 5.0;
      const vec4 lineColor = vec4(0.0, 0.8, 0.9, 1.0);
      const float minLineWidth = 0.01;
      const float maxLineWidth = 0.15;
      const float lineSpeed = 1.0 * overallSpeed;
      const float lineAmplitude = 1.0;
      const float lineFrequency = 0.2;
      const float warpSpeed = 0.2 * overallSpeed;
      const float warpFrequency = 0.5;
      const float warpAmplitude = 1.0;
      const float offsetFrequency = 0.5;
      const float offsetSpeed = 1.33 * overallSpeed;
      const float minOffsetSpread = 0.6;
      const float maxOffsetSpread = 2.0;
      const int linesPerGroup = 12;

      #define drawSmoothLine(pos, halfWidth, t) smoothstep(halfWidth, 0.0, abs(pos - (t)))
      #define drawCrispLine(pos, halfWidth, t) smoothstep(halfWidth + gridSmoothWidth, halfWidth, abs(pos - (t)))
      #define drawCircle(pos, radius, coord) smoothstep(radius + gridSmoothWidth, radius, length(coord - (pos)))

      float random(float t) {
        return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0;
      }

      float getPlasmaY(float x, float horizontalFade, float offset) {
        return random(x * lineFrequency + iTime * lineSpeed) * horizontalFade * lineAmplitude + offset;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        vec2 space = (gl_FragCoord.xy - iResolution.xy / 2.0) / iResolution.x * 2.0 * scale;

        float horizontalFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
        float verticalFade = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);

        space.y += random(space.x * warpFrequency + iTime * warpSpeed) * warpAmplitude * (0.5 + horizontalFade);
        space.x += random(space.y * warpFrequency + iTime * warpSpeed + 2.0) * warpAmplitude * horizontalFade;

        vec4 lines = vec4(0.0);

        for (int l = 0; l < linesPerGroup; l++) {
          float normalizedLineIndex = float(l) / float(linesPerGroup);
          float offsetTime = iTime * offsetSpeed;
          float offsetPosition = float(l) + space.x * offsetFrequency;
          float rand = random(offsetPosition + offsetTime) * 0.5 + 0.5;
          float halfWidth = mix(minLineWidth, maxLineWidth, rand * horizontalFade) / 2.0;
          float offset = random(offsetPosition + offsetTime * (1.0 + normalizedLineIndex)) * mix(minOffsetSpread, maxOffsetSpread, horizontalFade);
          float linePosition = getPlasmaY(space.x, horizontalFade, offset);
          float line = drawSmoothLine(linePosition, halfWidth, space.y) / 2.0 + drawCrispLine(linePosition, halfWidth * 0.15, space.y);
          float circleX = mod(float(l) + iTime * lineSpeed, 25.0) - 12.0;
          vec2 circlePosition = vec2(circleX, getPlasmaY(circleX, horizontalFade, offset));
          float circle = drawCircle(circlePosition, 0.01, space) * 4.0;
          lines += (line + circle) * lineColor * rand;
        }

        vec4 bgColor = mix(vec4(0.04, 0.08, 0.18, 1.0), vec4(0.02, 0.12, 0.18, 1.0), uv.x);
        bgColor *= verticalFade;
        bgColor.a = 1.0;
        gl_FragColor = bgColor + lines;
      }
    `;

    const loadShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = loadShader(gl.VERTEX_SHADER, vsSource);
    const fs = loadShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "aVertexPosition");
    const resLoc = gl.getUniformLocation(program, "iResolution");
    const timeLoc = gl.getUniformLocation(program, "iTime");

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener("resize", resize);
    resize();

    const start = Date.now();
    let raf: number;
    const render = () => {
      const t = (Date.now() - start) / 1000;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, t);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(posLoc);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />;
}
