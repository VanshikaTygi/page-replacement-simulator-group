window.SimAlgo = window.SimAlgo || {};

window.SimAlgo.LiquidChart = class LiquidChart {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.animId = null;
        this.hitRatio = 0;     // 0 to 1
        this.faultRatio = 0;   // 0 to 1
        this.targetHit = 0;
        this.targetFault = 0;
        this.waveOffset = 0;
        this.running = false;
    }

    update(hits, faults, total) {
        if (total === 0) { this.targetHit = 0; this.targetFault = 0; return; }
        this.targetHit = hits / total;
        this.targetFault = faults / total;
        if (!this.running) this.start();
    }

    start() {
        this.running = true;
        const animate = () => {
            if (!this.running) return;
            this.waveOffset += 0.03;

            this.hitRatio += (this.targetHit - this.hitRatio) * 0.05;
            this.faultRatio += (this.targetFault - this.faultRatio) * 0.05;

            this._draw();
            this.animId = requestAnimationFrame(animate);
        };
        animate();
    }

    stop() {
        this.running = false;
        if (this.animId) cancelAnimationFrame(this.animId);
    }

    reset() {
        this.hitRatio = 0; this.faultRatio = 0;
        this.targetHit = 0; this.targetFault = 0;
        this._draw();
    }

    _draw() {
        const { canvas, ctx } = this;
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        this._drawPanel(ctx, 0, w / 2, h, this.hitRatio, '#3b82f6', '#60a5fa', '💧 Hit', this.hitRatio);

        ctx.strokeStyle = 'rgba(148,163,184,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.stroke();

        this._drawPanel(ctx, w / 2, w / 2, h, this.faultRatio, '#ef4444', '#f87171', '⚡ Fault', this.faultRatio);
    }

    _drawPanel(ctx, x, w, h, ratio, color1, color2, label, ratio2) {
        const fillH = h * ratio;
        const waveAmp = 6;

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, 0, w, h);
        ctx.clip();

        if (fillH > 0) {
            const fillY = h - fillH;
            ctx.beginPath();
            ctx.moveTo(x, h);
            ctx.lineTo(x, fillY + waveAmp * Math.sin(this.waveOffset));
            for (let px = x; px <= x + w; px += 4) {
                const relX = px - x;
                const wy = fillY + waveAmp * Math.sin(this.waveOffset + relX * 0.04)
                         + (waveAmp / 2) * Math.sin(this.waveOffset * 1.3 + relX * 0.07);
                ctx.lineTo(px, wy);
            }
            ctx.lineTo(x + w, h);
            ctx.closePath();

            const grad = ctx.createLinearGradient(x, fillY, x, h);
            grad.addColorStop(0, color2 + 'cc');
            grad.addColorStop(1, color1 + 'ff');
            ctx.fillStyle = grad;
            ctx.fill();
        }

        ctx.fillStyle = 'rgba(248,250,252,0.92)';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + w / 2, 22);

        ctx.font = 'bold 26px Inter, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText((ratio2 * 100).toFixed(1) + '%', x + w / 2, h / 2 + 10);

        ctx.restore();
    }
};
