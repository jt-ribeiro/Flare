export const CATEGORIES = [
  { id: "all", name: "Todos" },
  { id: "lidar", name: "🌌 3D LiDAR" },
  { id: "tekno", name: "☣️ Tekno" },
  { id: "glitch", name: "🧪 Glitch" },
  { id: "art", name: "🎨 Graffiti" },
  { id: "optical", name: "🌀 Optical" },
  { id: "club", name: "⚡ Club" },
];

export const LOOKS = [
  // 🌌 3D LIDAR (AFTERLIFE)
  { id: "lidarAfterlife", name: "Afterlife 3D", hint: "Holograma Tale of Us", category: "lidar" },
  { id: "lidarMatrix", name: "Matrix LiDAR", hint: "Laser verde volumétrico", category: "lidar" },
  { id: "lidarGhost", name: "Spectral Embers", hint: "Partículas anti-gravidade", category: "lidar" },
  { id: "lidarAcidTekno", name: "Acid Particle", hint: "Dispersão cromática 3D", category: "lidar" },

  // ☣️ TEKNO
  { id: "teknoStrobe", name: "Tekno Strobe", hint: "Estrobo 200 BPM", category: "tekno" },
  { id: "acidSpiral", name: "Acid Spiral", hint: "Túnel psicadélico", category: "tekno" },
  { id: "shockwave", name: "Shockwave", hint: "Sub-grave cinético", category: "tekno" },
  { id: "raveBeams", name: "Rave Beams", hint: "Lasers warehouse", category: "tekno" },
  { id: "acid", name: "Acid", hint: "Hue no baixo", category: "tekno" },
  { id: "thermal", name: "Thermal", hint: "Calor da pista", category: "tekno" },
  { id: "neon", name: "Neon", hint: "Linhas a brilhar", category: "tekno" },

  // 🧪 GLITCH
  { id: "datamosh", name: "Datamosh", hint: "Quebra de codec", category: "glitch" },
  { id: "cctv", name: "CCTV 90s", hint: "Vigilância rave", category: "glitch" },
  { id: "glitch", name: "Glitch", hint: "RGB split", category: "glitch" },
  { id: "vhs", name: "VHS", hint: "Fita gasta", category: "glitch" },
  { id: "scan", name: "Scan", hint: "Feixe laser", category: "glitch" },
  { id: "pixel", name: "Pixel", hint: "8-bit", category: "glitch" },
  { id: "prism", name: "Prism", hint: "Cromático", category: "glitch" },

  // 🎨 GRAFFITI & ART
  { id: "graffiti", name: "Graffiti", hint: "Stencil & spray", category: "art" },
  { id: "pop", name: "Pop", hint: "Poster", category: "art" },
  { id: "comic", name: "Comic", hint: "Tinta e retícula", category: "art" },
  { id: "anime", name: "Anime", hint: "Cel + traço", category: "art" },
  { id: "sketch", name: "Sketch", hint: "Lápis", category: "art" },
  { id: "oil", name: "Óleo", hint: "Pintura viva", category: "art" },
  { id: "duotone", name: "Duotone", hint: "Magenta / navy", category: "art" },

  // 🌀 OPTICAL
  { id: "kaleido", name: "Kaleido", hint: "Caleidoscópio", category: "optical" },
  { id: "melt", name: "Melt", hint: "Ondulação", category: "optical" },
  { id: "mirror", name: "Mirror", hint: "Espelho", category: "optical" },
  { id: "xray", name: "X-ray", hint: "Negativo", category: "optical" },
  { id: "trails", name: "Trails", hint: "Fantasmas", category: "optical" },

  // ⚡ CLUB
  { id: "live", name: "Live", hint: "Grau de clube", category: "club" },
  { id: "film", name: "Film", hint: "Carta de cinema", category: "club" },
  { id: "night", name: "Night", hint: "Visão nocturna", category: "club" },
  { id: "blueprint", name: "Planta", hint: "Traço técnico", category: "club" },
];

export const RANDOM_MODES = [
  // 🌐 MODOS DIMENSÃO & AUTO
  {
    id: "random_all",
    name: "🌐 Modo Auto: 2D + 3D (Tudo)",
    hint: "Roda todos os 34 visuais (2D & 3D)",
    badge: "🌐 2D + 3D",
    type: "dimension",
    dimension: "all",
  },
  {
    id: "random_3d",
    name: "🌌 Modo Auto: Apenas 3D LiDAR",
    hint: "Roda apenas hologramas 3D Afterlife",
    badge: "🌌 SÓ 3D",
    type: "dimension",
    dimension: "3d",
  },
  {
    id: "random_2d",
    name: "📺 Modo Auto: Apenas 2D (Rave)",
    hint: "Roda apenas efeitos 2D clássicos",
    badge: "📺 SÓ 2D",
    type: "dimension",
    dimension: "2d",
  },
  // 📁 RANDOM POR CATEGORIA
  {
    id: "random_tekno",
    name: "☣️ Random: Tekno",
    hint: "Apenas efeitos Tekno",
    badge: "☣️ RND TEKNO",
    type: "random",
    category: "tekno",
  },
  {
    id: "random_glitch",
    name: "🧪 Random: Glitch",
    hint: "Apenas efeitos Glitch",
    badge: "🧪 RND GLITCH",
    type: "random",
    category: "glitch",
  },
  {
    id: "random_art",
    name: "🎨 Random: Graffiti & Art",
    hint: "Apenas efeitos Urban & Art",
    badge: "🎨 RND GRAFFITI",
    type: "random",
    category: "art",
  },
  {
    id: "random_optical",
    name: "🌀 Random: Optical",
    hint: "Apenas efeitos Óticos",
    badge: "🌀 RND OPTICAL",
    type: "random",
    category: "optical",
  },
  {
    id: "random_club",
    name: "⚡ Random: Club",
    hint: "Apenas efeitos Club",
    badge: "⚡ RND CLUB",
    type: "random",
    category: "club",
  },
  // ⚡ VIBES CURADAS ESPECÍFICAS
  {
    id: "free_tekno",
    name: "☣️ Free Tekno 23",
    hint: "Hardcore, acid & lasers",
    badge: "☣️ FREE TEKNO",
    type: "curated",
    looks: ["teknoStrobe", "acidSpiral", "shockwave", "raveBeams", "datamosh", "acid", "thermal"],
  },
  {
    id: "berghain",
    name: "⚡ Berghain Darkroom",
    hint: "Industrial, CCTV & mono",
    badge: "⚡ BERGHAIN",
    type: "curated",
    looks: ["cctv", "teknoStrobe", "xray", "night", "blueprint", "film"],
  },
  {
    id: "acid_trip",
    name: "🌀 Acid Underground",
    hint: "Psicadélico & líquido",
    badge: "🌀 ACID TRIP",
    type: "curated",
    looks: ["acidSpiral", "acid", "melt", "kaleido", "prism"],
  },
  {
    id: "glitchcore",
    name: "🧪 Cyber Glitchcore",
    hint: "Datamosh, VHS & scan",
    badge: "🧪 GLITCHCORE",
    type: "curated",
    looks: ["glitch", "datamosh", "vhs", "cctv", "scan", "pixel"],
  },
  {
    id: "street_raw",
    name: "🎨 Raw Street Graffiti",
    hint: "Stencil spray & pop art",
    badge: "🎨 GRAFFITI",
    type: "curated",
    looks: ["graffiti", "pop", "comic", "sketch", "duotone", "anime"],
  },
];

export const CAM_MODES = [
  { id: "auto", name: "Auto A/B", code: 2 },
  { id: "a", name: "PC (A)", code: 0 },
  { id: "b", name: "Tel (B)", code: 1 },
  { id: "crossfade", name: "Fader A/B", code: 2 },
  { id: "pip_a", name: "PIP DJ", code: 3 },
  { id: "pip_b", name: "PIP Pista", code: 4 },
  { id: "split", name: "Split 50/50", code: 5 },
];

export const CAM_MIX_GLSL = `#version 300 es
precision highp float;

uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform int uMode;
uniform float uMix;
uniform float uHasA;
uniform float uHasB;
uniform vec2 uRes;
uniform float uTime;

in vec2 vUv;
out vec4 fragColor;

void main() {
  if (uHasA < 0.5 && uHasB > 0.5) {
    fragColor = texture(uTexB, vUv);
    return;
  }
  if (uHasB < 0.5 && uHasA > 0.5) {
    fragColor = texture(uTexA, vUv);
    return;
  }
  if (uHasA < 0.5 && uHasB < 0.5) {
    fragColor = vec4(0.02, 0.03, 0.04, 1.0);
    return;
  }

  if (uMode == 0) {
    fragColor = texture(uTexA, vUv);
  } else if (uMode == 1) {
    fragColor = texture(uTexB, vUv);
  } else if (uMode == 2) {
    vec4 colA = texture(uTexA, vUv);
    vec4 colB = texture(uTexB, vUv);
    fragColor = mix(colA, colB, clamp(uMix, 0.0, 1.0));
  } else if (uMode == 3 || uMode == 4) {
    vec4 mainCol = (uMode == 3) ? texture(uTexB, vUv) : texture(uTexA, vUv);
    vec2 pipMin = vec2(0.68, 0.06);
    vec2 pipMax = vec2(0.96, 0.38);
    vec2 border = vec2(0.005, 0.007 * (uRes.x / max(1.0, uRes.y)));

    if (vUv.x >= pipMin.x && vUv.x <= pipMax.x && vUv.y >= pipMin.y && vUv.y <= pipMax.y) {
      if (vUv.x <= pipMin.x + border.x || vUv.x >= pipMax.x - border.x ||
          vUv.y <= pipMin.y + border.y || vUv.y >= pipMax.y - border.y) {
        float pulse = 0.85 + 0.15 * sin(uTime * 6.0);
        fragColor = vec4(vec3(0.83, 1.0, 0.0) * pulse, 1.0);
      } else {
        vec2 pipUv = (vUv - (pipMin + border)) / (pipMax - pipMin - 2.0 * border);
        vec4 insetCol = (uMode == 3) ? texture(uTexA, pipUv) : texture(uTexB, pipUv);
        float scan = sin(pipUv.y * 140.0) * 0.04;
        fragColor = vec4(insetCol.rgb + scan, 1.0);
      }
    } else {
      fragColor = mainCol;
    }
  } else if (uMode == 5) {
    float divider = 0.5;
    float halfThick = 0.003;
    if (abs(vUv.x - divider) < halfThick) {
      fragColor = vec4(0.83, 1.0, 0.0, 1.0);
    } else if (vUv.x < divider) {
      vec2 uvA = vec2(vUv.x * 0.8 + 0.1, vUv.y);
      fragColor = texture(uTexA, uvA);
    } else {
      vec2 uvB = vec2((vUv.x - 0.5) * 0.8 + 0.1, vUv.y);
      fragColor = texture(uTexB, uvB);
    }
  } else {
    fragColor = mix(texture(uTexA, vUv), texture(uTexB, vUv), clamp(uMix, 0.0, 1.0));
  }
}
`;

export const COMMON_GLSL = `#version 300 es
precision highp float;

uniform sampler2D uVideo;
uniform sampler2D uPrev;
uniform sampler2D uPrevVideo;
uniform float uMotionMask;
uniform vec2 uRes;
uniform float uTime;
uniform float uIntensity;
uniform float uBass;
uniform float uBeat;
uniform float uBassReact;
uniform float uBassFlash;
uniform float uBassShake;
uniform float uBassZoom;
uniform float uBassRgb;
uniform float uHueShift;
uniform float uBpm;
uniform float uBeatPhase;

in vec2 vUv;
out vec4 fragColor;

vec3 vid(vec2 uv) {
  return texture(uVideo, clamp(uv, 0.0, 1.0)).rgb;
}

float luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

vec2 texel() {
  return 1.0 / uRes;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float sobel(vec2 uv) {
  vec2 px = texel();
  float tl = luma(vid(uv + vec2(-px.x, -px.y)));
  float t  = luma(vid(uv + vec2(0.0, -px.y)));
  float tr = luma(vid(uv + vec2(px.x, -px.y)));
  float l  = luma(vid(uv + vec2(-px.x, 0.0)));
  float r  = luma(vid(uv + vec2(px.x, 0.0)));
  float bl = luma(vid(uv + vec2(-px.x, px.y)));
  float b  = luma(vid(uv + vec2(0.0, px.y)));
  float br = luma(vid(uv + vec2(px.x, px.y)));
  float gx = -tl + tr - 2.0 * l + 2.0 * r - bl + br;
  float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
  return length(vec2(gx, gy));
}

vec3 smooth5(vec2 uv) {
  vec2 px = texel() * 1.4;
  vec3 c = vid(uv) * 4.0;
  c += (vid(uv + vec2(-px.x, 0.0)) + vid(uv + vec2(px.x, 0.0)) +
        vid(uv + vec2(0.0, -px.y)) + vid(uv + vec2(0.0, px.y))) * 2.0;
  c += (vid(uv + vec2(-px.x, -px.y)) + vid(uv + vec2(px.x, -px.y)) +
        vid(uv + vec2(-px.x, px.y)) + vid(uv + vec2(px.x, px.y)));
  return c / 16.0;
}

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

float kick() {
  return max(uBass * 0.7, uBeat) * uBassReact;
}

vec2 warpedUv(vec2 uv) {
  float k = kick();
  if (uBassShake > 0.5) {
    float t = uTime * 42.0;
    uv += vec2(sin(t * 1.7), cos(t * 2.1)) * (0.003 + k * 0.026);
    uv += vec2(hash(vec2(uTime * 13.0, 0.3)) - 0.5, hash(vec2(1.1, uTime * 17.0)) - 0.5) * k * 0.022;
  }
  if (uBassZoom > 0.5) {
    uv = (uv - 0.5) * (1.0 - k * 0.16) + 0.5;
  }
  return uv;
}

vec3 finish(vec3 col) {
  float k = kick();
  float n = hash(vUv * uRes + uTime) - 0.5;
  col += n * 0.03 * uIntensity;
  vec2 d = vUv - 0.5;
  col *= 1.0 - dot(d, d) * 0.32;
  if (uBassFlash > 0.5) {
    col *= 1.0 + k * 0.22;
    col += vec3(uBeat * uBassReact * 0.28);
  }
  if (uBassRgb > 0.5) {
    float s = k * 0.016;
    vec3 split;
    split.r = vid(vUv + vec2(s, 0.0)).r;
    split.g = col.g;
    split.b = vid(vUv - vec2(s, 0.0)).b;
    col = mix(col, split, 0.65 * uBassReact);
  }
  if (uHueShift > 0.001) {
    vec3 hsv = rgb2hsv(col);
    hsv.x = fract(hsv.x + uHueShift);
    col = hsv2rgb(hsv);
  }
  if (uMotionMask > 0.01) {
    vec3 currentVid = vid(vUv);
    vec3 prevVid = texture(uPrevVideo, clamp(vUv, 0.0, 1.0)).rgb;
    float delta = length(currentVid - prevVid);
    float motion = smoothstep(0.03, 0.18, delta);
    float scanline = sin(vUv.y * uRes.y * 1.5) * 0.12;
    vec3 bgDark = vec3(0.03, 0.04, 0.05) + scanline * 0.02;
    vec3 bgCol = mix(col * 0.18, bgDark, 0.70);
    vec3 fgCol = col * 1.45 + vec3(0.12, 0.28, 0.08) * motion;
    vec3 maskedCol = mix(bgCol, fgCol, motion);
    col = mix(col, maskedCol, uMotionMask);
  }
  return clamp(col, 0.0, 1.0);
}
`;

export const SHADES = {
  // === NOVO: ☣️ TEKNO STROBE ===
  teknoStrobe: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  float l = luma(orig);
  float k = kick();
  float thresh = mix(0.48, 0.35 + 0.3 * sin(uTime * 28.0), k);
  float bin = step(thresh, l);
  if (k > 0.45 && fract(uTime * 14.0) > 0.5) {
    bin = 1.0 - bin;
  }
  vec3 c = vec3(bin);
  float e = sobel(uv);
  vec3 edgeColor = mix(vec3(0.0, 1.0, 0.8), vec3(1.0, 0.0, 0.4), sin(uTime * 8.0) * 0.5 + 0.5);
  c += edgeColor * smoothstep(0.12, 0.5, e) * 2.5;
  return mix(orig, c, uIntensity);
}
`,

  // === NOVO: 🌀 ACID SPIRAL ===
  acidSpiral: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  vec2 p = uv - 0.5;
  float r = length(p);
  float a = atan(p.y, p.x);
  float k = kick();
  float twist = r * mix(6.0, 18.0, uIntensity) - uTime * 2.4 - k * 3.5;
  a += twist;
  vec2 suv = vec2(cos(a), sin(a)) * r + 0.5;
  vec3 c = vid(suv);
  vec3 hsv = rgb2hsv(c);
  hsv.x = fract(hsv.x + r * 1.5 + uTime * 0.15 + k * 0.3);
  hsv.y = clamp(hsv.y * 1.6, 0.0, 1.0);
  hsv.z = pow(hsv.z, vec3(0.85).x);
  c = hsv2rgb(hsv);
  return mix(orig, c, uIntensity);
}
`,

  // === NOVO: 💥 BASS SHOCKWAVE ===
  shockwave: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  vec2 p = uv - 0.5;
  float r = length(p);
  float k = kick();
  float waveTime = fract(uTime * 1.6 + k * 0.4);
  float waveDist = waveTime * 0.85;
  float diff = abs(r - waveDist);
  float shock = smoothstep(0.08, 0.0, diff) * (1.0 - waveTime) * (0.4 + k * 1.2);
  vec2 displacedUv = uv + normalize(p + 0.0001) * shock * 0.06 * uIntensity;
  vec3 c = vid(displacedUv);
  c.r = vid(displacedUv + shock * 0.02).r;
  c.b = vid(displacedUv - shock * 0.02).b;
  c += vec3(0.0, 1.0, 0.85) * shock * 0.6 * uIntensity;
  return mix(orig, c, uIntensity);
}
`,

  // === NOVO: ⚡ RAVE BEAMS ===
  raveBeams: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  vec3 c = orig * 0.25;
  float k = kick();
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float angle = sin(uTime * 1.2 + fi * 1.57) * 1.2;
    vec2 dir = vec2(cos(angle), sin(angle));
    float dist = abs(dot(uv - vec2(0.5, 0.1), vec2(-dir.y, dir.x)));
    float beam = smoothstep(mix(0.015, 0.04, k), 0.0, dist);
    vec3 beamColor = (i % 2 == 0) ? vec3(0.0, 1.0, 0.8) : vec3(1.0, 0.0, 0.5);
    c += beamColor * beam * mix(1.5, 3.5, uIntensity + k);
  }
  float grid = step(0.97, fract(uv.x * 16.0)) + step(0.97, fract(uv.y * 16.0));
  c += vec3(0.2, 0.5, 1.0) * grid * uBeat * 0.4;
  return mix(orig, c, uIntensity);
}
`,

  // === NOVO: 💾 DATAMOSH ===
  datamosh: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  float k = kick();
  vec2 blockSize = vec2(28.0, 16.0);
  vec2 blockId = floor(uv * blockSize);
  float rnd = hash(blockId + floor(uTime * 8.0));
  vec2 moshUv = uv;
  if (rnd > mix(0.88, 0.55, uIntensity + k * 0.35)) {
    float shift = (hash(blockId * 1.7) - 0.5) * 0.08 * uIntensity;
    moshUv.x += shift;
    moshUv.y += (hash(blockId * 3.1) - 0.5) * 0.04 * uIntensity;
  }
  vec3 c = vid(moshUv);
  vec3 prev = texture(uPrev, moshUv).rgb;
  c = mix(c, prev, mix(0.2, 0.65, uIntensity));
  if (rnd > 0.94) {
    c.r = vid(moshUv + vec2(0.02, 0.0)).r;
    c.b = vid(moshUv - vec2(0.02, 0.0)).b;
  }
  return mix(orig, c, uIntensity);
}
`,

  // === NOVO: 📹 CCTV 90s ===
  cctv: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  float l = luma(orig);
  l = pow(l, 0.75) * 1.35;
  float scan = sin(uv.y * uRes.y * 3.14159 * 0.5) * 0.18;
  float grain = (hash(uv * uRes + floor(uTime * 30.0)) - 0.5) * 0.18;
  float cctv = clamp(l - scan + grain, 0.0, 1.0);
  vec3 c = vec3(cctv * 0.65, cctv * 1.05, cctv * 0.75);
  if (uv.y > 0.92 && uv.x < 0.35) {
    float box = step(0.04, abs(fract(uv.x * 20.0) - 0.5));
    c = mix(c, vec3(0.9, 1.0, 0.8), 0.6 * box);
  }
  vec2 d = uv - 0.5;
  c *= 1.0 - dot(d, d) * 0.65;
  return mix(orig, c, uIntensity);
}
`,

  // === NOVO: 🎨 GRAFFITI STENCIL ===
  graffiti: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  float l = luma(smooth5(uv));
  float noise = hash(uv * uRes * 1.5) * 0.25 - 0.125;
  l = clamp(l + noise, 0.0, 1.0);
  float e = sobel(uv);
  vec3 c = vec3(0.06, 0.07, 0.09);
  if (l > 0.22) c = mix(c, vec3(0.18, 0.02, 0.1), 0.95);
  if (l > 0.45) c = mix(c, vec3(0.82, 1.0, 0.05), 0.95);
  if (l > 0.72) c = mix(c, vec3(1.0, 0.1, 0.45), 0.95);
  float ink = smoothstep(0.18, 0.45, e);
  c = mix(c, vec3(0.01), ink * 0.85);
  return mix(orig, c, uIntensity);
}
`,

  // === EXISTENTES ===
  anime: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  vec3 c = smooth5(uv);
  float levels = mix(14.0, 5.0, uIntensity);
  c = floor(c * levels + 0.5) / levels;
  float e = sobel(uv);
  float ink = 1.0 - smoothstep(mix(0.38, 0.1, uIntensity), mix(0.75, 0.32, uIntensity), e);
  c *= mix(1.0, ink, 0.9);
  c = mix(vec3(luma(c)), c, 1.2);
  c = pow(c, vec3(0.92));
  return mix(orig, c, uIntensity);
}
`,
  comic: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  vec3 c = smooth5(uv);
  c = floor(c * mix(10.0, 4.0, uIntensity) + 0.5) / mix(10.0, 4.0, uIntensity);
  float e = sobel(uv);
  c *= 1.0 - smoothstep(0.2, 0.55, e) * 0.85;
  vec2 cells = fract(uv * uRes / 7.0) - 0.5;
  float dots = smoothstep(0.45, 0.15, length(cells) + luma(c) * 0.25);
  c = mix(c, c * 0.55 + vec3(0.05), dots * 0.35 * uIntensity);
  return mix(orig, c, uIntensity);
}
`,
  neon: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  float e = sobel(uv);
  vec3 base = orig * 0.12;
  vec3 glow = vec3(0.15, 0.95, 0.82) * pow(e, 0.75) * mix(2.2, 6.5, uIntensity);
  glow += vec3(1.0, 0.18, 0.72) * pow(e, 1.6) * 4.0;
  vec3 c = base + glow + orig * luma(orig) * 0.25;
  return mix(orig, c, uIntensity);
}
`,
  oil: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  vec2 px = texel() * mix(1.0, 2.2, uIntensity);
  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  for (int y = -2; y <= 2; y++) {
    for (int x = -2; x <= 2; x++) {
      vec3 s = vid(uv + vec2(float(x), float(y)) * px);
      float w = exp(-abs(luma(s) - luma(orig)) * 8.0);
      acc += s * w;
      wsum += w;
    }
  }
  vec3 c = acc / max(wsum, 0.001);
  float levels = mix(18.0, 7.0, uIntensity);
  c = floor(c * levels + 0.5) / levels;
  return mix(orig, c, uIntensity);
}
`,
  thermal: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  float l = luma(orig) + uBass * 0.12;
  vec3 c = mix(vec3(0.02, 0.0, 0.18), vec3(0.0, 0.85, 1.0), smoothstep(0.0, 0.35, l));
  c = mix(c, vec3(1.0, 0.9, 0.12), smoothstep(0.35, 0.62, l));
  c = mix(c, vec3(1.0, 0.12, 0.04), smoothstep(0.62, 1.0, l));
  return mix(orig, c, uIntensity);
}
`,
  vhs: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  vec2 uv2 = uv;
  uv2.y += sin(uv.x * 42.0 + uTime * 2.2) * 0.003 * uIntensity;
  vec3 c;
  c.r = vid(uv2 + vec2(0.007 * uIntensity, 0.0)).r;
  c.g = vid(uv2).g;
  c.b = vid(uv2 - vec2(0.007 * uIntensity, 0.0)).b;
  float scan = sin(uv.y * uRes.y * 3.14159) * 0.1 * uIntensity;
  c *= 1.0 - scan;
  float bar = smoothstep(0.03, 0.0, abs(fract(uTime * 0.06) - uv.y));
  c = mix(c, c * 0.45 + vec3(0.18), bar * uIntensity);
  return mix(orig, c, uIntensity);
}
`,
  glitch: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  float line = hash(vec2(floor(uv.y * 48.0), floor(uTime * 9.0)));
  vec2 uv2 = uv;
  uv2.x += (hash(vec2(uTime, uv.y)) - 0.5) * 0.05 * uIntensity * (0.25 + uBass);
  if (line > 0.92) uv2.x += 0.04 * uIntensity;
  vec3 c;
  c.r = vid(uv2 + vec2(0.012 * uIntensity, 0.0)).r;
  c.g = vid(uv2).g;
  c.b = vid(uv2 - vec2(0.012 * uIntensity, 0.0)).b;
  return mix(orig, c, uIntensity);
}
`,
  kaleido: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  vec2 p = uv - 0.5;
  float a = atan(p.y, p.x);
  float r = length(p);
  float segs = mix(4.0, 12.0, uIntensity);
  a = mod(a, 6.2831853 / segs);
  a = abs(a - 3.14159265 / segs);
  vec2 kuv = vec2(cos(a), sin(a)) * r + 0.5;
  vec3 c = vid(kuv);
  return mix(orig, c, uIntensity);
}
`,
  blueprint: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  float e = sobel(uv);
  vec3 c = vec3(0.03, 0.07, 0.14);
  c += vec3(0.45, 0.78, 1.0) * smoothstep(0.1, 0.48, e);
  c += vec3(0.15) * luma(orig) * 0.22;
  vec2 g = abs(fract(uv * vec2(16.0, 9.0)) - 0.5);
  float grid = 1.0 - smoothstep(0.0, 0.03, min(g.x, g.y));
  c += vec3(0.2, 0.45, 0.75) * grid * 0.22;
  return mix(orig, c, uIntensity);
}
`,
  trails: `
vec3 shade(vec2 uv) {
  vec3 now = vid(uv);
  vec3 prev = texture(uPrev, uv).rgb;
  float keep = mix(0.45, 0.9, uIntensity);
  vec3 c = max(now, prev * keep);
  return mix(now, c, uIntensity);
}
`,
  acid: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  vec3 hsv = rgb2hsv(orig);
  hsv.x = fract(hsv.x + uTime * 0.06 + uBass * 0.22);
  hsv.y = clamp(hsv.y * (1.0 + uIntensity * 0.8), 0.0, 1.0);
  hsv.z = pow(hsv.z, mix(1.0, 0.85, uIntensity));
  return mix(orig, hsv2rgb(hsv), uIntensity);
}
`,
  live: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  vec3 c = orig * vec3(1.04, 0.96, 1.08);
  c = mix(vec3(luma(c)), c, 1.18);
  c = pow(c, vec3(0.9));
  c += vec3(0.02, 0.0, 0.04) * uBass;
  return mix(orig, c, uIntensity);
}
`,
  pixel: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  float cells = mix(90.0, 16.0, uIntensity);
  vec2 aspect = vec2(cells, cells * uRes.y / uRes.x);
  vec3 c = vid((floor(uv * aspect) + 0.5) / aspect);
  return mix(orig, c, uIntensity);
}
`,
  duotone: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  float l = luma(orig);
  vec3 c = mix(vec3(0.03, 0.06, 0.22), vec3(1.0, 0.32, 0.78), smoothstep(0.08, 0.88, l));
  return mix(orig, c, uIntensity);
}
`,
  sketch: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  float e = sobel(uv);
  float paper = 0.94 - e * mix(1.1, 3.4, uIntensity);
  vec3 c = vec3(paper) * (0.96 + hash(uv * uRes) * 0.08);
  return mix(orig, c, uIntensity);
}
`,
  night: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  float l = luma(orig);
  vec3 c = vec3(0.04, l * 1.4, 0.07);
  c += vec3(0.0, 0.12, 0.0) * hash(uv * 90.0 + floor(uTime * 24.0));
  float scan = sin(uv.y * uRes.y * 3.14159) * 0.1;
  c *= 1.0 - scan * uIntensity;
  return mix(orig, c, uIntensity);
}
`,
  mirror: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  vec2 m = uv;
  m.x = 0.5 - abs(uv.x - 0.5);
  vec3 c = vid(m);
  return mix(orig, c, uIntensity);
}
`,
  pop: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  vec3 c = smooth5(uv);
  c = floor(c * 3.0 + 0.5) / 3.0;
  c = mix(vec3(luma(c)), c, 1.85);
  c *= 1.0 - smoothstep(0.22, 0.58, sobel(uv));
  c = pow(c, vec3(0.78));
  return mix(orig, c, uIntensity);
}
`,
  melt: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  vec2 uv2 = uv;
  uv2.x += sin(uv.y * 20.0 + uTime * 1.5) * 0.03 * uIntensity;
  uv2.y += cos(uv.x * 14.0 + uTime * 0.9) * 0.02 * uIntensity;
  return mix(orig, vid(uv2), uIntensity);
}
`,
  xray: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  float l = 1.0 - luma(orig);
  vec3 c = vec3(l * 0.5, l * 0.82, l * 1.08);
  c += sobel(uv) * vec3(0.35, 0.85, 1.0);
  return mix(orig, c, uIntensity);
}
`,
  prism: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  float s = 0.01 * uIntensity;
  vec3 c;
  c.r = vid(uv + vec2(s, -s * 0.25)).r;
  c.g = vid(uv).g;
  c.b = vid(uv - vec2(s, s * 0.25)).b;
  vec3 hsv = rgb2hsv(c);
  hsv.y = clamp(hsv.y * 1.35, 0.0, 1.0);
  return mix(orig, hsv2rgb(hsv), uIntensity);
}
`,
  scan: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  vec3 c = orig * vec3(0.16, 0.18, 0.38);
  c += vec3(1.0, 0.22, 0.48) * sobel(uv) * mix(1.6, 4.2, uIntensity);
  float beam = smoothstep(0.045, 0.0, abs(fract(uTime * 0.13) - uv.y));
  c += vec3(1.0, 0.45, 0.75) * beam * 0.5;
  return mix(orig, c, uIntensity);
}
`,
  film: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  vec3 c = orig * vec3(1.07, 0.96, 0.86);
  c = mix(vec3(luma(c)), c, 0.82);
  c = pow(c, vec3(0.9));
  float bar = step(uv.y, 0.09 * uIntensity) + step(1.0 - 0.09 * uIntensity, uv.y);
  c *= 1.0 - bar;
  return mix(orig, c, uIntensity);
}
`,
  lidarAfterlife: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  float l = luma(orig);
  float mot = length(orig - texture(uPrevVideo, uv).rgb);
  vec3 cyan = vec3(0.0, 0.94, 1.0);
  vec3 gold = vec3(1.0, 0.84, 0.2);
  vec3 holo = mix(cyan, gold, clamp(l * 1.3, 0.0, 1.0)) * (l * 1.8 + mot * 2.0);
  holo += vec3(uBass * 0.3) * cyan;
  return mix(orig * 0.2, holo, uIntensity);
}
`,
  lidarMatrix: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  float l = luma(orig);
  float mot = length(orig - texture(uPrevVideo, uv).rgb);
  float scan = sin(uv.y * 120.0 - uTime * 8.0);
  vec3 green = vec3(0.05, 1.0, 0.35);
  vec3 laser = green * (l * 2.0 + mot * 3.0) * (0.8 + 0.2 * scan);
  return mix(orig * 0.15, laser, uIntensity);
}
`,
  lidarGhost: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  float l = luma(orig);
  float mot = length(orig - texture(uPrevVideo, uv).rgb);
  vec3 violet = vec3(0.68, 0.25, 1.0);
  vec3 silver = vec3(0.88, 0.92, 1.0);
  vec3 ghost = mix(violet, silver, l) * (l + mot * 2.5);
  return mix(orig * 0.1, ghost, uIntensity);
}
`,
  lidarAcidTekno: `
vec3 shade(vec2 uv) {
  vec3 orig = vid(uv);
  float l = luma(orig);
  float mot = length(orig - texture(uPrevVideo, uv).rgb);
  vec3 acid = vec3(0.83, 1.0, 0.0);
  vec3 pink = vec3(1.0, 0.0, 0.33);
  vec3 pCol = mix(acid, pink, fract(uv.x * 3.0 + uTime * 0.5));
  pCol *= (l * 1.6 + mot * 3.0 + uBass * 0.4);
  return mix(orig * 0.15, pCol, uIntensity);
}
`,
};

export function lookById(id) {
  return LOOKS.find((look) => look.id === id) || LOOKS[0];
}

export function randomModeById(id) {
  return RANDOM_MODES.find((m) => m.id === id) || RANDOM_MODES[0];
}

export function is3DLook(lookOrId) {
  const id = typeof lookOrId === "string" ? lookOrId : lookOrId?.id;
  return typeof id === "string" && id.startsWith("lidar");
}

export function filterLooks(dimension = "all", category = "all") {
  let list = LOOKS;
  if (dimension === "3d") {
    list = list.filter((l) => is3DLook(l));
  } else if (dimension === "2d") {
    list = list.filter((l) => !is3DLook(l));
  }
  if (category && category !== "all") {
    list = list.filter((l) => l.category === category);
  }
  return list;
}

export const TRANSITION_GLSL = `#version 300 es
precision highp float;

uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform float uProgress;
uniform float uTime;
uniform vec2 uRes;

in vec2 vUv;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  float p = smoothstep(0.0, 1.0, clamp(uProgress, 0.0, 1.0));
  
  // Organic subtle dither dissolve over the 10-second transition
  float noise = (hash(vUv * 48.0 + floor(uTime * 3.0)) - 0.5) * 0.08;
  float blend = smoothstep(0.0, 1.0, clamp((p - 0.5) * 1.15 + 0.5 + noise, 0.0, 1.0));

  // Subtle wave/morph displacement in the middle
  float mid = sin(p * 3.14159265);
  vec2 uvDisp = vec2(sin(vUv.y * 12.0 + uTime * 2.0), cos(vUv.x * 12.0 + uTime * 2.0)) * 0.008 * mid;

  vec4 colA = texture(uTexA, clamp(vUv + uvDisp * (1.0 - p), 0.0, 1.0));
  vec4 colB = texture(uTexB, clamp(vUv - uvDisp * p, 0.0, 1.0));

  // Gentle chromatic aura during mid-morph
  if (mid > 0.6) {
    float s = (mid - 0.6) * 0.012;
    colA.r = texture(uTexA, clamp(vUv + vec2(s, 0.0), 0.0, 1.0)).r;
    colB.b = texture(uTexB, clamp(vUv - vec2(s, 0.0), 0.0, 1.0)).b;
  }

  vec4 blended = mix(colA, colB, blend);
  blended.rgb += vec3(mid * 0.06);

  fragColor = clamp(blended, 0.0, 1.0);
}
`;
