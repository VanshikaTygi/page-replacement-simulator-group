window.SimAlgo = window.SimAlgo || {};

window.SimAlgo.MetricsDisplay = class MetricsDisplay {
    constructor(faultsEl, hitsEl, ratioEl) {
        this.faultsEl = faultsEl;
        this.hitsEl = hitsEl;
        this.ratioEl = ratioEl;
        this._lastFaults = 0;
        this._lastHits = 0;
    }

    applyTiltToCards(cards) {
        cards.forEach(card => window.SimAlgo.applyTiltEffect(card));
    }

    update(hits, faults, total) {
        const newFaults = faults;
        const newHits = hits;

        if (newFaults !== this._lastFaults) {
            window.SimAlgo.countUpAnimation(this.faultsEl, newFaults, 400);
            this._lastFaults = newFaults;
        }
        if (newHits !== this._lastHits) {
            window.SimAlgo.countUpAnimation(this.hitsEl, newHits, 400);
            this._lastHits = newHits;
        }

        const ratio = total > 0 ? (hits / total) : 0;
        this.ratioEl.textContent = window.SimAlgo.formatPercent(ratio);

        const pct = ratio * 100;
        if (pct >= 60) {
            this.ratioEl.style.color = 'var(--hit-color)';
        } else if (pct >= 30) {
            this.ratioEl.style.color = 'var(--warn-color)';
        } else {
            this.ratioEl.style.color = 'var(--fault-color)';
        }
    }

    reset() {
        this.faultsEl.textContent = '0';
        this.hitsEl.textContent = '0';
        this.ratioEl.textContent = '0.0%';
        this.ratioEl.style.color = '';
        this._lastFaults = 0;
        this._lastHits = 0;
    }
};
