window.SimAlgo = window.SimAlgo || {};

window.SimAlgo.parsePageString = function(str) {
    const parts = str.trim().replace(/\s+/g, ' ').split(' ');
    const pages = [];
    for (const part of parts) {
        const n = parseInt(part, 10);
        if (isNaN(n) || n < 0) return null;
        pages.push(n);
    }
    return pages.length > 0 ? pages : null;
};

window.SimAlgo.formatPercent = function(ratio) {
    return (ratio * 100).toFixed(1) + '%';
};

window.SimAlgo.downloadCSV = function(rows, filename = 'simulation.csv') {
    const csvContent = rows.map(r => r.map(cell =>
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
    ).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

window.SimAlgo.countUpAnimation = function(el, target, duration = 600) {
    const start = performance.now();
    const from = parseInt(el.textContent) || 0;
    function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(from + (target - from) * eased);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
};

window.SimAlgo.playSimSound = function(type = 'fault') {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!window._simAudioCtx) window._simAudioCtx = new AudioContext();
        const ctx = window._simAudioCtx;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'hit') {
            // High-pitched "Tick"
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.04);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
            osc.start();
            osc.stop(ctx.currentTime + 0.04);
        } else {
            // Low-pitched "Thud" for Fault
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        }
    } catch (e) {}
};

window.SimAlgo.playFaultSound = function() { window.SimAlgo.playSimSound('fault'); };

window.SimAlgo.applyTiltEffect = function(el) {
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        el.style.transform = `perspective(600px) rotateX(${-dy * 8}deg) rotateY(${dx * 8}deg) translateZ(4px)`;
    });
    el.addEventListener('mouseleave', () => {
        el.style.transform = '';
    });
};
