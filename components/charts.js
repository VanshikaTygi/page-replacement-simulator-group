window.SimAlgo = window.SimAlgo || {};

window.SimAlgo.ComparisonChart = class ComparisonChart {
    constructor(canvasEl) {
        this.canvas = canvasEl;
        this.chart = null;
        this.ALGO_LABELS = ['FIFO', 'LRU', 'Optimal', 'Clock', 'LFU', 'MFU'];
        this.COLORS = [
            { bg: 'rgba(99,179,237,0.75)',  border: 'rgb(99,179,237)' },
            { bg: 'rgba(103,232,249,0.75)', border: 'rgb(6,182,212)' },
            { bg: 'rgba(167,139,250,0.75)', border: 'rgb(139,92,246)' },
            { bg: 'rgba(251,191,36,0.75)',  border: 'rgb(245,158,11)' },
            { bg: 'rgba(239,68,68,0.75)',   border: 'rgb(239,68,68)' },
            { bg: 'rgba(52,211,153,0.75)',  border: 'rgb(16,185,129)' },
        ];
    }

    _textColor() {
        return document.body.classList.contains('dark-theme') ? '#cbd5e1' : '#475569';
    }

    render(faultCounts) {
        const tc = this._textColor();
        if (this.chart) this.chart.destroy();

        this.chart = new Chart(this.canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: this.ALGO_LABELS,
                datasets: [{
                    label: 'Page Faults',
                    data: faultCounts,
                    backgroundColor: this.COLORS.map(c => c.bg),
                    borderColor: this.COLORS.map(c => c.border),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 800, easing: 'easeOutBounce' },
                plugins: {
                    legend: {
                        labels: { color: tc, font: { family: 'Inter', weight: '600' } }
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` Faults: ${ctx.raw}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: tc, stepSize: 1, font: { family: 'Inter' } },
                        title: { display: true, text: 'Page Faults', color: tc, font: { family: 'Inter', weight: '600' } },
                        grid: { color: 'rgba(148,163,184,0.1)' }
                    },
                    x: {
                        ticks: { color: tc, font: { family: 'Inter', weight: '600' } },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    updateTheme() {
        if (!this.chart) return;
        const tc = this._textColor();
        this.chart.options.scales.x.ticks.color = tc;
        this.chart.options.scales.y.ticks.color = tc;
        this.chart.options.scales.y.title.color = tc;
        this.chart.options.plugins.legend.labels.color = tc;
        this.chart.update();
    }

    destroy() {
        if (this.chart) { this.chart.destroy(); this.chart = null; }
    }
};
