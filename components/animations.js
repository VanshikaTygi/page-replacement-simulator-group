window.SimAlgo = window.SimAlgo || {};

window.SimAlgo.animateFrameInsert = function(el) {
    el.classList.remove('frame-insert');
    void el.offsetWidth;
    el.classList.add('frame-insert');
    el.addEventListener('animationend', () => el.classList.remove('frame-insert'), { once: true });
};

window.SimAlgo.flashFaultRow = function(row) {
    row.classList.add('flash-fault');
    row.addEventListener('animationend', () => row.classList.remove('flash-fault'), { once: true });
};

window.SimAlgo.glowHitRow = function(row) {
    row.classList.add('glow-hit');
    row.addEventListener('animationend', () => row.classList.remove('glow-hit'), { once: true });
};

window.SimAlgo.pulseReplacedCell = function(row, frameIdx) {
    const cells = row.querySelectorAll('.frame-cell');
    if (cells[frameIdx]) {
        cells[frameIdx].classList.add('pulse-replace');
        cells[frameIdx].addEventListener('animationend', () =>
            cells[frameIdx].classList.remove('pulse-replace'), { once: true });
    }
};
