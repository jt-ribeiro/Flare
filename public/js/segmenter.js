// Real-time AI Human Body Segmentation (MediaPipe Tasks Vision + Smart Fallback)
// Produces a 256x144 alpha/luminance mask canvas where white (255) = Person and black (0) = Background.

const MASK_W = 256;
const MASK_H = 144;

export class BodySegmenter {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = MASK_W;
    this.canvas.height = MASK_H;
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });

    this.workCanvas = document.createElement("canvas");
    this.workCanvas.width = MASK_W;
    this.workCanvas.height = MASK_H;
    this.workCtx = this.workCanvas.getContext("2d", { willReadFrequently: true });

    this.prevData = null;
    this.segmenter = null;
    this.loading = false;
    this.ready = false;
    this.failed = false;
    this.enabled = false;
    this.lastRunMs = 0;

    // Initialize black mask
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, MASK_W, MASK_H);
  }

  async init() {
    if (this.ready || this.loading || this.failed) return;
    this.loading = true;
    try {
      const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs");
      const filesetResolver = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      this.segmenter = await vision.ImageSegmenter.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      });
      this.ready = true;
      console.log("✅ AI Body Segmenter (MediaPipe GPU) ativo!");
    } catch (err) {
      console.warn("MediaPipe AI offline/indisponível, a usar isolamento inteligente local:", err);
      this.failed = true;
    } finally {
      this.loading = false;
    }
  }

  setEnabled(on) {
    this.enabled = Boolean(on);
    if (this.enabled && !this.ready && !this.loading && !this.failed) {
      this.init();
    }
  }

  update(videoEl, nowMs) {
    if (!this.enabled || !videoEl || videoEl.readyState < 2 || videoEl.videoWidth === 0) {
      return null;
    }

    // Run at ~30 FPS (every 32ms) to keep WebGL rendering at a locked 60 FPS
    if (nowMs - this.lastRunMs < 32) {
      return this.canvas;
    }
    this.lastRunMs = nowMs;

    if (this.ready && this.segmenter) {
      try {
        const result = this.segmenter.segmentForVideo(videoEl, nowMs);
        const mask = result?.confidenceMasks?.[0];
        if (mask) {
          const floatArr = mask.getAsFloat32Array();
          const imgData = this.ctx.createImageData(MASK_W, MASK_H);
          const data = imgData.data;
          const len = Math.min(floatArr.length, MASK_W * MASK_H);
          for (let i = 0; i < len; i++) {
            // Smooth threshold for crisp body silhouette
            const c = floatArr[i];
            const v = c > 0.35 ? Math.min(255, Math.round(((c - 0.25) / 0.55) * 255)) : 0;
            const p = i * 4;
            data[p] = v;
            data[p + 1] = v;
            data[p + 2] = v;
            data[p + 3] = 255;
          }
          this.ctx.putImageData(imgData, 0, 0);
          mask.close?.();
          return this.canvas;
        }
      } catch {}
    }

    // Smart fallback (Foreground presence + temporal motion accumulation)
    try {
      this.workCtx.drawImage(videoEl, 0, 0, MASK_W, MASK_H);
      const frame = this.workCtx.getImageData(0, 0, MASK_W, MASK_H);
      const curr = frame.data;
      if (!this.prevData) {
        this.prevData = new Float32Array(MASK_W * MASK_H);
      }
      const out = this.ctx.createImageData(MASK_W, MASK_H);
      const outData = out.data;

      for (let i = 0, p = 0; i < MASK_W * MASK_H; i++, p += 4) {
        const r = curr[p];
        const g = curr[p + 1];
        const b = curr[p + 2];
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        const diff = Math.abs(luma - this.prevData[i]);
        this.prevData[i] = this.prevData[i] * 0.88 + luma * 0.12;

        // Center-weighted subject + motion energy
        const x = (i % MASK_W) / MASK_W - 0.5;
        const y = Math.floor(i / MASK_W) / MASK_H - 0.5;
        const centerWeight = Math.max(0, 1.0 - (x * x * 1.8 + y * y * 1.4));
        const score = Math.min(255, diff * 6.5 + luma * centerWeight * 0.9);
        const v = score > 55 ? Math.min(255, (score - 45) * 2.4) : 0;

        outData[p] = v;
        outData[p + 1] = v;
        outData[p + 2] = v;
        outData[p + 3] = 255;
      }
      this.ctx.putImageData(out, 0, 0);
    } catch {}

    return this.canvas;
  }
}
