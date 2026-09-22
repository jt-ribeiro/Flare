export class AudioPulse {
  constructor() {
    this.bass = 0;
    this.beat = 0;
    this.bpm = 124;
    this.beatPhase = 0;
    this.autoBpm = true;
    this.enabled = false;
    this._lastBeat = 0;
    this._avg = 0.18;
    this._ctx = null;
    this._data = null;
    this._analyser = null;
    this._tapHistory = [];
    this._beatIntervalHistory = [];
    this._lastAutoBpmUpdate = 0;
  }

  async start() {
    if (this.enabled) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      video: false,
    });
    this._ctx = new AudioContext();
    if (this._ctx.state === "suspended") await this._ctx.resume();
    this._analyser = this._ctx.createAnalyser();
    this._analyser.fftSize = 512;
    this._analyser.smoothingTimeConstant = 0.55;
    this._data = new Uint8Array(this._analyser.frequencyBinCount);
    this._ctx.createMediaStreamSource(stream).connect(this._analyser);
    this.enabled = true;
  }

  tap(now = performance.now()) {
    if (this._tapHistory.length > 0 && now - this._tapHistory[this._tapHistory.length - 1] > 2200) {
      this._tapHistory = [];
    }
    this._tapHistory.push(now);
    if (this._tapHistory.length > 6) this._tapHistory.shift();

    if (this._tapHistory.length >= 2) {
      const intervals = [];
      for (let i = 1; i < this._tapHistory.length; i++) {
        intervals.push(this._tapHistory[i] - this._tapHistory[i - 1]);
      }
      const sum = intervals.reduce((a, b) => a + b, 0);
      const avg = sum / intervals.length;
      if (avg >= 250 && avg <= 1500) {
        this.bpm = Math.min(240, Math.max(40, Math.round(60000 / avg)));
        this.autoBpm = false;
      }
    }
    this.pulse();
    return this.bpm;
  }

  setBpm(value) {
    if (Number.isFinite(value)) {
      this.bpm = Math.min(240, Math.max(40, Math.round(value)));
    }
  }

  tick(now) {
    const bps = this.bpm / 60;
    this.beatPhase = ((now / 1000) * bps) % 1.0;

    if (!this.enabled || !this._analyser) {
      this.bass *= 0.9;
      this.beat *= 0.84;
      return;
    }

    this._analyser.getByteFrequencyData(this._data);
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += this._data[i];
    const next = sum / (10 * 255);
    this.bass = this.bass * 0.45 + next * 0.55;
    this._avg = this._avg * 0.98 + this.bass * 0.02;
    const thresh = Math.max(0.22, this._avg * 1.55);

    if (this.bass > thresh && now - this._lastBeat > 240) {
      const interval = now - this._lastBeat;
      this._lastBeat = now;
      this.beat = 1;

      if (this.autoBpm && interval >= 260 && interval <= 1200) {
        this._beatIntervalHistory.push(interval);
        if (this._beatIntervalHistory.length > 8) this._beatIntervalHistory.shift();

        if (this._beatIntervalHistory.length >= 4 && now - this._lastAutoBpmUpdate > 1800) {
          const sorted = [...this._beatIntervalHistory].sort((a, b) => a - b);
          const median = sorted[Math.floor(sorted.length / 2)];
          const consistent = this._beatIntervalHistory.filter((x) => Math.abs(x - median) < 70);
          if (consistent.length >= 3) {
            const avg = consistent.reduce((a, b) => a + b, 0) / consistent.length;
            const detected = Math.round(60000 / avg);
            if (detected >= 60 && detected <= 200) {
              this.bpm = Math.round(this.bpm * 0.75 + detected * 0.25);
              this._lastAutoBpmUpdate = now;
            }
          }
        }
      }
    } else {
      this.beat *= 0.78;
    }
  }

  pulse() {
    this.beat = 1;
    this.bass = Math.max(this.bass, 0.7);
  }
}
