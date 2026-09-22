import { CAM_MIX_GLSL, COMMON_GLSL, LOOKS, SHADES, TRANSITION_GLSL } from "./looks.js";

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

function compile(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(log || "shader compile failed");
  }
  return shader;
}

function program(gl, fragSrc) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) || "program link failed");
  }
  return p;
}

function makeTexture(gl) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  return tex;
}

function makeTarget(gl, w, h) {
  const tex = makeTexture(gl);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { tex, fbo, w, h };
}

const LOOK_UNIFORMS = [
  "uRes",
  "uTime",
  "uIntensity",
  "uBass",
  "uBeat",
  "uBassReact",
  "uBassFlash",
  "uBassShake",
  "uBassZoom",
  "uBassRgb",
  "uHueShift",
  "uBpm",
  "uBeatPhase",
  "uVideo",
  "uPrev",
  "uPrevVideo",
  "uMotionMask",
];

const CAM_MIX_UNIFORMS = ["uTexA", "uTexB", "uMode", "uMix", "uHasA", "uHasB", "uRes", "uTime"];
const TRANSITION_UNIFORMS = ["uTexA", "uTexB", "uProgress", "uTime", "uRes"];

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
    });
    if (!this.gl) throw new Error("WebGL2 indisponível neste browser.");
    const gl = this.gl;
    this.look = LOOKS[0].id;
    this.params = {
      time: 0,
      intensity: 0.72,
      bass: 0,
      beat: 0,
      bassReact: 0.7,
      bassFlash: 1,
      bassShake: 1,
      bassZoom: 0,
      bassRgb: 0,
      hueShift: 0,
      bpm: 124,
      beatPhase: 0,
      camMode: "auto",
      camMix: 0.5,
      motionMask: 0.0,
    };

    this.programs = {};
    this.uniforms = {};

    this.videoTexA = makeTexture(gl);
    this.videoTexB = makeTexture(gl);
    this.videoTex = this.videoTexA;
    this.prevVideoTex = makeTexture(gl);

    this.videoWA = 0;
    this.videoHA = 0;
    this.videoReadyA = false;
    this.videoWB = 0;
    this.videoHB = 0;
    this.videoReadyB = false;

    this.prev = null;
    this.ping = null;
    this.targetA = null;
    this.targetB = null;
    this.camMixTarget = null;

    this.needsResize = true;
    if (typeof ResizeObserver !== "undefined") {
      this.ro = new ResizeObserver(() => {
        this.needsResize = true;
      });
      this.ro.observe(canvas);
    } else {
      window.addEventListener("resize", () => {
        this.needsResize = true;
      });
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    this.buf = buf;

    for (const look of LOOKS) {
      const frag = `${COMMON_GLSL}\n${SHADES[look.id]}\nvoid main(){ fragColor = vec4(finish(shade(warpedUv(vUv))), 1.0); }`;
      const p = program(gl, frag);
      this.programs[look.id] = p;
      this.uniforms[look.id] = {};
      for (const u of LOOK_UNIFORMS) {
        this.uniforms[look.id][u] = gl.getUniformLocation(p, u);
      }
    }

    this.camMixProg = program(gl, CAM_MIX_GLSL);
    this.camMixUniforms = {};
    for (const u of CAM_MIX_UNIFORMS) {
      this.camMixUniforms[u] = gl.getUniformLocation(this.camMixProg, u);
    }

    this.transitionProg = program(gl, TRANSITION_GLSL);
    this.transitionUniforms = {};
    for (const u of TRANSITION_UNIFORMS) {
      this.transitionUniforms[u] = gl.getUniformLocation(this.transitionProg, u);
    }

    this.transition = null;
  }

  setLook(id, withTransition = true, duration = 10000) {
    if (!this.programs[id] || id === this.look) return;
    if (withTransition) {
      const from = this.transition?.toLook || this.look;
      this.transition = {
        fromLook: from,
        toLook: id,
        startTime: performance.now(),
        duration: Number.isFinite(duration) ? duration : 10000,
      };
    } else {
      this.transition = null;
    }
    this.look = id;
  }

  setParams(params) {
    Object.assign(this.params, params);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.min(1920, Math.floor(this.canvas.clientWidth * dpr));
    const h = Math.min(1080, Math.floor(this.canvas.clientHeight * dpr));
    if (this.canvas.width === w && this.canvas.height === h && this.ping) return;
    this.canvas.width = Math.max(2, w);
    this.canvas.height = Math.max(2, h);
    const gl = this.gl;
    this.ping = makeTarget(gl, this.canvas.width, this.canvas.height);
    this.prev = makeTarget(gl, this.canvas.width, this.canvas.height);
    this.targetA = makeTarget(gl, this.canvas.width, this.canvas.height);
    this.targetB = makeTarget(gl, this.canvas.width, this.canvas.height);
    this.camMixTarget = makeTarget(gl, this.canvas.width, this.canvas.height);

    gl.bindTexture(gl.TEXTURE_2D, this.prevVideoTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.canvas.width, this.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  }

  uploadSingle(tex, source, isA) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    try {
      const sw = source.videoWidth || source.width || 0;
      const sh = source.videoHeight || source.height || 0;
      if (sw > 0 && sh > 0) {
        const curW = isA ? this.videoWA : this.videoWB;
        const curH = isA ? this.videoHA : this.videoHB;
        if (curW === sw && curH === sh) {
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
        } else {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
          if (isA) {
            this.videoWA = sw;
            this.videoHA = sh;
          } else {
            this.videoWB = sw;
            this.videoHB = sh;
          }
        }
        if (isA) this.videoReadyA = true;
        else this.videoReadyB = true;
      }
    } catch {
      if (isA) this.videoReadyA = false;
      else this.videoReadyB = false;
    }
  }

  upload(sourceA, sourceB) {
    if (sourceA && sourceA.readyState >= 2) {
      this.uploadSingle(this.videoTexA, sourceA, true);
    } else if (sourceA === null) {
      this.videoReadyA = false;
    }

    if (sourceB && sourceB.readyState >= 2) {
      this.uploadSingle(this.videoTexB, sourceB, false);
    } else if (sourceB === null) {
      this.videoReadyB = false;
    }
  }

  getCamModeCode() {
    const m = this.params.camMode || "auto";
    if (m === "a") return 0;
    if (m === "b") return 1;
    if (m === "crossfade" || m === "mix") return 2;
    if (m === "pip_a") return 3;
    if (m === "pip_b") return 4;
    if (m === "split") return 5;
    if (this.videoReadyA && this.videoReadyB) return 2;
    if (this.videoReadyB && !this.videoReadyA) return 1;
    return 0;
  }

  renderCamMixPass(w, h) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.camMixTarget.fbo);
    gl.viewport(0, 0, w, h);
    gl.useProgram(this.camMixProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);

    const loc = gl.getAttribLocation(this.camMixProg, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = this.camMixUniforms;
    gl.uniform1i(u.uMode, this.getCamModeCode());
    gl.uniform1f(u.uMix, this.params.camMix ?? 0.5);
    gl.uniform1f(u.uHasA, this.videoReadyA ? 1.0 : 0.0);
    gl.uniform1f(u.uHasB, this.videoReadyB ? 1.0 : 0.0);
    gl.uniform2f(u.uRes, w, h);
    gl.uniform1f(u.uTime, this.params.time);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexA);
    gl.uniform1i(u.uTexA, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexB);
    gl.uniform1i(u.uTexB, 1);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  renderLookPass(lookId, targetFbo, w, h) {
    const gl = this.gl;
    const prog = this.programs[lookId];
    const u = this.uniforms[lookId];

    gl.bindFramebuffer(gl.FRAMEBUFFER, targetFbo);
    gl.viewport(0, 0, w, h);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);

    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(u.uRes, w, h);
    gl.uniform1f(u.uTime, this.params.time);
    gl.uniform1f(u.uIntensity, this.params.intensity);
    gl.uniform1f(u.uBass, this.params.bass);
    gl.uniform1f(u.uBeat, this.params.beat);
    gl.uniform1f(u.uBassReact, this.params.bassReact ?? 0);
    gl.uniform1f(u.uBassFlash, this.params.bassFlash ? 1 : 0);
    gl.uniform1f(u.uBassShake, this.params.bassShake ? 1 : 0);
    gl.uniform1f(u.uBassZoom, this.params.bassZoom ? 1 : 0);
    gl.uniform1f(u.uBassRgb, this.params.bassRgb ? 1 : 0);
    gl.uniform1f(u.uHueShift, this.params.hueShift ?? 0);
    gl.uniform1f(u.uBpm, this.params.bpm ?? 124);
    gl.uniform1f(u.uBeatPhase, this.params.beatPhase ?? 0);
    gl.uniform1f(u.uMotionMask, this.params.motionMask ?? 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.camMixTarget.tex);
    gl.uniform1i(u.uVideo, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.prev.tex);
    gl.uniform1i(u.uPrev, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.prevVideoTex);
    gl.uniform1i(u.uPrevVideo, 2);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  draw(sourceA, sourceB) {
    if (this.needsResize || !this.ping) {
      this.resize();
      this.needsResize = false;
    }
    if (sourceA !== undefined || sourceB !== undefined) {
      this.upload(sourceA, sourceB);
    }
    const gl = this.gl;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.renderCamMixPass(w, h);

    let inTransition = false;
    let progress = 1.0;

    if (this.transition) {
      const elapsed = performance.now() - this.transition.startTime;
      progress = elapsed / this.transition.duration;
      if (progress >= 1.0) {
        this.transition = null;
      } else {
        inTransition = true;
      }
    }

    if (!inTransition) {
      this.renderLookPass(this.look, this.ping.fbo, w, h);
    } else {
      this.renderLookPass(this.transition.fromLook, this.targetA.fbo, w, h);
      this.renderLookPass(this.transition.toLook, this.targetB.fbo, w, h);

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.ping.fbo);
      gl.viewport(0, 0, w, h);
      gl.useProgram(this.transitionProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);

      const loc = gl.getAttribLocation(this.transitionProg, "aPos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      gl.uniform1f(this.transitionUniforms.uProgress, progress);
      gl.uniform1f(this.transitionUniforms.uTime, this.params.time);
      gl.uniform2f(this.transitionUniforms.uRes, w, h);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.targetA.tex);
      gl.uniform1i(this.transitionUniforms.uTexA, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.targetB.tex);
      gl.uniform1i(this.transitionUniforms.uTexB, 1);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // Capture camera frame for motion differential in the next frame
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.camMixTarget.fbo);
    gl.bindTexture(gl.TEXTURE_2D, this.prevVideoTex);
    gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, w, h);

    // Blit to screen
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.ping.fbo);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.COLOR_BUFFER_BIT, gl.LINEAR);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const tmp = this.ping;
    this.ping = this.prev;
    this.prev = tmp;
  }
}

