export class DemoSource {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1280;
    this.canvas.height = 720;
    this.ctx = this.canvas.getContext("2d");
    this.people = Array.from({ length: 6 }, (_, i) => ({
      x: 0.18 + i * 0.13,
      phase: i * 1.7,
      h: 0.28 + (i % 3) * 0.06,
      hue: 190 + i * 22,
    }));
  }

  draw(timeSec, bass, beat) {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const t = timeSec;

    ctx.fillStyle = "#07080d";
    ctx.fillRect(0, 0, w, h);

    const floor = ctx.createLinearGradient(0, h * 0.45, 0, h);
    floor.addColorStop(0, "#10131c");
    floor.addColorStop(1, "#1a1020");
    ctx.fillStyle = floor;
    ctx.fillRect(0, h * 0.48, w, h * 0.52);

    ctx.strokeStyle = "rgba(125,255,212,0.12)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const y = h * 0.5 + i * i * 3.2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const lights = [
      { x: 0.25, color: "rgba(80,180,255,0.18)" },
      { x: 0.5, color: "rgba(255,70,160,0.16)" },
      { x: 0.78, color: "rgba(125,255,212,0.16)" },
    ];
    for (const light of lights) {
      const swing = Math.sin(t * 0.8 + light.x * 6) * 0.12;
      const g = ctx.createRadialGradient(
        w * (light.x + swing),
        h * 0.08,
        10,
        w * (light.x + swing),
        h * 0.55,
        h * 0.7
      );
      g.addColorStop(0, light.color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.fillStyle = "#151820";
    ctx.fillRect(w * 0.38, h * 0.58, w * 0.24, h * 0.12);
    ctx.fillStyle = `rgba(255,255,255,${0.08 + bass * 0.35 + beat * 0.3})`;
    ctx.fillRect(w * 0.4, h * 0.6, w * 0.2, h * 0.03);

    for (const p of this.people) {
      const bob = Math.sin(t * 3.2 + p.phase) * (0.03 + bass * 0.05);
      const x = (p.x + Math.sin(t * 0.4 + p.phase) * 0.03) * w;
      const y = h * (0.78 + bob);
      const hh = h * p.h * (1 + beat * 0.08);
      ctx.fillStyle = `hsl(${p.hue} 70% ${38 + bass * 20}%)`;
      ctx.beginPath();
      ctx.ellipse(x, y - hh, hh * 0.22, hh, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y - hh * 1.35, hh * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
