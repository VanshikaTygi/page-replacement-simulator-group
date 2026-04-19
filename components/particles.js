window.SimAlgo = window.SimAlgo || {};

window.SimAlgo.ParticleSystem = class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animId = null;
        this.isDark = true;
        this.speedMultiplier = 1.0;
        this.flashIntensity = 0;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init(count = 60) {
        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 3 + 1,
            opacity: Math.random() * 0.4 + 0.1,
            label: Math.floor(Math.random() * 10),
            pulse: Math.random() * Math.PI * 2
        };
    }

    setTheme(isDark) {
        this.isDark = isDark;
    }

    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
    }

    triggerFlash() {
        this.flashIntensity = 1.0;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const colorBase = this.isDark ? '99, 179, 237' : '66, 153, 225';
        const hitColor = '52, 211, 153'; // Emerald-400

        if (this.flashIntensity > 0) {
            this.ctx.fillStyle = `rgba(${hitColor}, ${this.flashIntensity * 0.05})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.flashIntensity -= 0.02;
        }
        
        for (const p of this.particles) {
            p.x += p.vx * this.speedMultiplier;
            p.y += p.vy * this.speedMultiplier;
            p.pulse += 0.02 * this.speedMultiplier;

            if (p.x < -10) p.x = this.canvas.width + 10;
            if (p.x > this.canvas.width + 10) p.x = -10;
            if (p.y < -10) p.y = this.canvas.height + 10;
            if (p.y > this.canvas.height + 10) p.y = -10;

            const alpha = p.opacity * (0.8 + 0.2 * Math.sin(p.pulse));
            const size = p.size * (1 + 0.1 * Math.sin(p.pulse * 1.3));

            const finalColor = this.flashIntensity > 0.5 ? hitColor : colorBase;

            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.strokeStyle = `rgba(${finalColor}, ${alpha})`;
            this.ctx.lineWidth = 0.8;
            this.ctx.strokeRect(p.x - size * 3, p.y - size * 3, size * 6, size * 6);

            for (const q of this.particles) {
                const dist = Math.hypot(p.x - q.x, p.y - q.y);
                const limit = 120 * (this.speedMultiplier > 1.5 ? 1.2 : 1.0);
                if (dist < limit && dist > 0) {
                    this.ctx.globalAlpha = alpha * (1 - dist / limit) * 0.3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(q.x, q.y);
                    this.ctx.stroke();
                }
            }
            this.ctx.restore();
        }
    }

    start() {
        const loop = () => {
            this.draw();
            this.animId = requestAnimationFrame(loop);
        };
        loop();
    }

    stop() {
        if (this.animId) cancelAnimationFrame(this.animId);
    }
};
