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

function programCustom(gl, vertSrc, fragSrc) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vertSrc));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) || "custom program link failed");
  }
  return p;
}

function makeParticleGridBuffer(gl, cols = 400, rows = 225) {
  const count = cols * rows;
  const data = new Float32Array(count * 2);
  let idx = 0;
  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows;
    for (let x = 0; x < cols; x++) {
      const u = (x + 0.5) / cols;
      data[idx++] = u;
      data[idx++] = v;
    }
  }
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return { buf, count };
}

const LIDAR_VERT = `#version 300 es
precision highp float;

in vec2 aGridUv;

uniform sampler2D uVideo;
uniform sampler2D uPrevVideo;
uniform vec2 uRes;
uniform float uTime;
uniform float uBass;
uniform float uIntensity;
uniform float uMotionMask;
uniform float uHueShift;
uniform int uStyle;

out vec4 vColor;
out float vDepth;
out float vMotion;

mat3 rotateY(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(
    vec3(c, 0.0, -s),
    vec3(0.0, 1.0, 0.0),
    vec3(s, 0.0, c)
  );
}

mat3 rotateX(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(
    vec3(1.0, 0.0, 0.0),
    vec3(0.0, c, s),
    vec3(0.0, -s, c)
  );
}

void main() {
  vec2 uv = aGridUv;
  vec4 cam = texture(uVideo, uv);
  vec4 prev = texture(uPrevVideo, uv);

  float luma = dot(cam.rgb, vec3(0.299, 0.587, 0.114));
  float motion = length(cam.rgb - prev.rgb);
  vMotion = motion;

  float aspect = uRes.x / max(uRes.y, 1.0);
  vec3 pos = vec3((uv.x - 0.5) * 2.8 * (aspect / 1.777), (uv.y - 0.5) * 1.6, 0.0);

  // Depth displacement (Z axis)
  float zDisp = (luma * 1.8 - 0.4) * uIntensity;
  zDisp += motion * 3.2 * max(0.35, uMotionMask);

  if (uStyle == 0) {
    // Afterlife: undulating wave extrusion with bass impact
    zDisp += sin(uv.x * 12.0 + uTime * 2.0) * (uBass * 0.45);
    zDisp += cos(uv.y * 10.0 + uTime * 1.6) * (uBass * 0.35);
  } else if (uStyle == 1) {
    // Cyber Matrix: scanning horizontal laser plane
    float scan = sin(uv.y * 28.0 - uTime * 7.0);
    zDisp += scan * 0.35 + (uBass * 0.4);
  } else if (uStyle == 2) {
    // Spectral Ghost: anti-gravity upward floating embers
    float floatOffset = fract(uTime * 0.22 + uv.x * 2.5 + luma * 0.8);
    pos.y += floatOffset * 0.45 * motion;
    zDisp += sin(uTime * 3.0 + uv.x * 16.0) * 0.5 * motion;
  } else if (uStyle == 3) {
    // Acid Particle Blast: explosive radial shockwaves from center on bass
    vec2 centerDist = uv - vec2(0.5);
    float r = length(centerDist);
    pos.xy += (centerDist / max(r, 0.001)) * sin(r * 24.0 - uTime * 8.0) * (uBass * 0.18);
    zDisp += sin(r * 32.0 - uTime * 10.0) * (uBass * 0.6);
  }

  pos.z = zDisp;

  // Camera Orbit Dynamics (Afterlife cinematic rotating camera)
  float rotY = sin(uTime * 0.32) * 0.32 + sin(uTime * 0.1) * 0.15;
  float rotX = sin(uTime * 0.2) * 0.14;

  // Bass reactive camera shake / lurch
  rotX += (uBass - 0.5) * 0.06;
  rotY += sin(uTime * 14.0) * (uBass * 0.035);

  vec3 rotPos = rotateY(rotY) * rotateX(rotX) * pos;

  float camDist = 2.4 - (uBass * 0.25 * uIntensity);
  float zProj = rotPos.z + camDist;
  vDepth = zProj;

  float fov = 1.85;
  vec2 screenPos = (rotPos.xy * fov) / max(zProj, 0.1);
  gl_Position = vec4(screenPos, clamp(zProj * 0.05, 0.0, 1.0), 1.0);

  // Point size attenuation
  float baseSize = 4.2;
  if (uStyle == 1) baseSize = 3.6;
  if (uStyle == 2) baseSize = 5.2;
  if (uStyle == 3) baseSize = 4.6;

  float pSize = (baseSize / max(zProj, 0.3)) * (1.0 + uBass * 0.65) * (0.6 + luma * 0.85);
  gl_PointSize = clamp(pSize, 1.0, 26.0);

  // Particle Color Styling
  vec3 col = cam.rgb;
  if (uStyle == 0) {
    // Afterlife: Holographic Cyan (#00f0ff) & Burnished Gold (#ffd700)
    vec3 cyan = vec3(0.0, 0.94, 1.0);
    vec3 gold = vec3(1.0, 0.84, 0.2);
    vec3 particleCol = mix(cyan, gold, clamp(luma * 1.2 + zDisp * 0.4, 0.0, 1.0));
    particleCol += vec3(motion * 0.9);
    col = mix(cam.rgb * 0.25, particleCol, 0.88);
  } else if (uStyle == 1) {
    // Matrix LiDAR: Cyber Laser Green & CRT Phosphor
    vec3 green = vec3(0.05, 1.0, 0.35);
    vec3 whiteLaser = vec3(0.85, 1.0, 0.95);
    vec3 particleCol = mix(green * luma * 1.6, whiteLaser, clamp(motion * 3.2, 0.0, 1.0));
    col = particleCol;
  } else if (uStyle == 2) {
    // Spectral Ghost: Silver, Violet & Ultra-violet
    vec3 violet = vec3(0.68, 0.25, 1.0);
    vec3 silver = vec3(0.88, 0.92, 1.0);
    vec3 particleCol = mix(violet, silver, clamp(luma + motion, 0.0, 1.0));
    particleCol += vec3(0.35) * uBass;
    col = particleCol;
  } else if (uStyle == 3) {
    // Acid Tekno: Toxic Lime (#d4ff00) & Laser Pink (#ff0055)
    vec3 acid = vec3(0.83, 1.0, 0.0);
    vec3 pink = vec3(1.0, 0.0, 0.33);
    vec3 particleCol = mix(acid, pink, fract(uv.x * 2.0 + uTime * 0.5 + luma));
    particleCol += vec3(motion * 1.6);
    col = particleCol;
  }

  float alpha = smoothstep(0.03, 0.16, luma + motion * 0.55);
  vColor = vec4(col, alpha);
}
`;

const LIDAR_FRAG = `#version 300 es
precision highp float;

in vec4 vColor;
in float vDepth;
in float vMotion;

uniform float uIntensity;
uniform float uHueShift;

out vec4 fragColor;

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float distSq = dot(coord, coord);
  if (distSq > 0.25) discard;

  float radial = exp(-distSq * 10.0);
  float core = smoothstep(0.08, 0.0, distSq) * 0.7;

  float glow = radial + core;
  vec3 col = vColor.rgb * glow * 1.5;

  if (abs(uHueShift) > 0.001) {
    vec3 hsv = rgb2hsv(col);
    hsv.x = fract(hsv.x + uHueShift);
    col = hsv2rgb(hsv);
  }

  fragColor = vec4(col, vColor.a * glow * clamp(uIntensity, 0.35, 1.0));
}
`;

const LIDAR_UNIFORMS = [
  "uVideo",
  "uPrevVideo",
  "uRes",
  "uTime",
  "uBass",
  "uIntensity",
  "uMotionMask",
  "uHueShift",
  "uStyle",
];

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

    this.particleGrid = makeParticleGridBuffer(gl, 400, 225);
    this.lidarProg = programCustom(gl, LIDAR_VERT, LIDAR_FRAG);
    this.lidarUniforms = {};
    for (const u of LIDAR_UNIFORMS) {
      this.lidarUniforms[u] = gl.getUniformLocation(this.lidarProg, u);
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
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        if (isA) {
          this.videoWA = sw;
          this.videoHA = sh;
          this.videoReadyA = true;
        } else {
          this.videoWB = sw;
          this.videoHB = sh;
          this.videoReadyB = true;
        }
      }
    } catch (err) {
      console.warn("uploadSingle warning:", err);
      if (isA) this.videoReadyA = false;
      else this.videoReadyB = false;
    }
  }

  upload(sourceA, sourceB) {
    if (sourceA && (sourceA.readyState >= 2 || sourceA.videoWidth > 0)) {
      this.uploadSingle(this.videoTexA, sourceA, true);
    } else if (sourceA === null) {
      this.videoReadyA = false;
    }

    if (sourceB && (sourceB.readyState >= 2 || sourceB.videoWidth > 0)) {
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

  isLidarLook(id) {
    return typeof id === "string" && id.startsWith("lidar");
  }

  getLidarStyleCode(id) {
    if (id === "lidarMatrix") return 1;
    if (id === "lidarGhost") return 2;
    if (id === "lidarAcidTekno") return 3;
    return 0; // lidarAfterlife
  }

  renderLidarPass(lookId, targetFbo, w, h) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, targetFbo);
    gl.viewport(0, 0, w, h);

    // Deep dark atmospheric background
    gl.clearColor(0.015, 0.02, 0.03, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Additive luminous blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.useProgram(this.lidarProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particleGrid.buf);

    const loc = gl.getAttribLocation(this.lidarProg, "aGridUv");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = this.lidarUniforms;
    gl.uniform2f(u.uRes, w, h);
    gl.uniform1f(u.uTime, this.params.time);
    gl.uniform1f(u.uIntensity, this.params.intensity);
    gl.uniform1f(u.uBass, this.params.bass);
    gl.uniform1f(u.uMotionMask, this.params.motionMask ?? 0);
    gl.uniform1f(u.uHueShift, this.params.hueShift ?? 0);
    gl.uniform1i(u.uStyle, this.getLidarStyleCode(lookId));

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.camMixTarget.tex);
    gl.uniform1i(u.uVideo, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.prevVideoTex);
    gl.uniform1i(u.uPrevVideo, 1);

    gl.drawArrays(gl.POINTS, 0, this.particleGrid.count);

    gl.disable(gl.BLEND);
  }

  renderLookPass(lookId, targetFbo, w, h) {
    if (this.isLidarLook(lookId)) {
      this.renderLidarPass(lookId, targetFbo, w, h);
      return;
    }

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

