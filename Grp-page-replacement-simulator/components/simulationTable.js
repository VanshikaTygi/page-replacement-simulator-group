window.SimAlgo = window.SimAlgo || {};

window.SimAlgo.SimulationTable = class SimulationTable {
    constructor(headerEl, bodyEl) {
        this.headerEl = headerEl;
        this.bodyEl = bodyEl;
        this.frameSize = 0;
    }

    buildHeader(frames) {
        this.frameSize = frames;
        this.headerEl.innerHTML = '<th>Step</th><th>Page</th>';
        for (let i = 1; i <= frames; i++) {
            this.headerEl.innerHTML += `<th>Frame ${i}</th>`;
        }
        this.headerEl.innerHTML += '<th>Result</th>';
    }

    clear() {
        this.bodyEl.innerHTML = '';
    }

    renderRow(stepData) {
        const tr = document.createElement('tr');
        tr.dataset.step = stepData.step;

        tr.innerHTML = `<td class="step-num">${stepData.step}</td><td class="page-ref"><span class="page-badge">${stepData.page}</span></td>`;

        const prevFrames = this._getPrevFrames(stepData);
        for (let i = 0; i < this.frameSize; i++) {
            const val = stepData.framePadded[i];
            const prevVal = prevFrames[i];
            const isNew = val !== null && val !== prevVal;
            const isReplaced = isNew && prevVal !== null;

            let cellClass = 'frame-cell';
            if (val !== null) cellClass += ' filled';
            if (isNew && !stepData.isHit) cellClass += ' new-entry';
            if (isReplaced) cellClass += ' replaced';

            tr.innerHTML += `<td><span class="${cellClass}">${val !== null ? val : ''}</span></td>`;
        }

        if (stepData.isHit) {
            tr.innerHTML += `<td><span class="result-badge hit" title="${stepData.replaceReason}">✓ Hit</span></td>`;
            tr.classList.add('row-hit');
        } else {
            tr.innerHTML += `
                <td>
                    <div class="tooltip-wrap">
                        <span class="result-badge fault">✗ Fault</span>
                        <div class="tooltip-box">${stepData.replaceReason}</div>
                    </div>
                </td>`;
            tr.classList.add('row-fault');
        }

        this.bodyEl.appendChild(tr);

        requestAnimationFrame(() => tr.classList.add('row-visible'));

        return tr;
    }

    _getPrevFrames(stepData) {
        const rows = this.bodyEl.querySelectorAll('tr');
        if (rows.length === 0) return new Array(this.frameSize).fill(null);
        const lastRow = rows[rows.length - 1];
        const cells = lastRow.querySelectorAll('.frame-cell');
        return Array.from(cells).map(c => c.textContent.trim() !== '' ? parseInt(c.textContent) : null);
    }

    scrollToLatest() {
        const last = this.bodyEl.lastElementChild;
        if (last) last.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
};
