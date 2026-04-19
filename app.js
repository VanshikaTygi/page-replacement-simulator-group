document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    const particleCanvas   = $('particleCanvas');
    const themeToggleBtn   = $('themeToggle');
    const referenceInput   = $('referenceString');
    const frameInput       = $('frameCount');
    const algoSelect       = $('algorithm');
    const modeToggle       = $('modeToggle');
    const randomBtn        = $('randomBtn');
    const genModal         = $('genModal');
    const genCloseBtn      = $('genClose');
    const genLenInput      = $('genLength');
    const genMinInput      = $('genMin');
    const genMaxInput      = $('genMax');
    const genApplyBtn      = $('genApply');
    const errorMsg         = $('errorMsg');
    const resultsSection   = $('resultsSection');
    const compSection      = $('compSection');
    const runBtn           = $('runBtn');
    const pauseBtn         = $('pauseBtn');
    const nextBtn          = $('nextBtn');
    const resetBtn         = $('resetBtn');
    const speedSelect      = $('speedSelect');
    const exportCsvBtn     = $('exportCsvBtn');
    const exportPdfBtn     = $('exportPdfBtn');
    const compareAllBtn    = $('compareAllBtn');
    const tableHeader      = $('tableHeaderRow');
    const tableBody        = $('tableBody');
    const faultsEl         = $('totalFaults');
    const hitsEl           = $('totalHits');
    const ratioEl          = $('hitRatio');
    const liquidCanvas     = $('liquidCanvas');
    const chartCanvas      = $('comparisonChart');
    const compTableBody    = $('compTableBody');
    const statCards        = document.querySelectorAll('.stat-card');

    const SA = window.SimAlgo;

    // Subsystem Init
    const particles  = new SA.ParticleSystem(particleCanvas);
    particles.init(55);
    particles.start();

    const simTable  = new SA.SimulationTable(tableHeader, tableBody);
    const metrics   = new SA.MetricsDisplay(faultsEl, hitsEl, ratioEl);
    const barChart  = new SA.ComparisonChart(chartCanvas);
    const liquid    = new SA.LiquidChart(liquidCanvas);
    const controls  = new SA.PlaybackControls({ runBtn, pauseBtn, nextBtn, resetBtn, speedSelect });

    statCards.forEach(c => SA.applyTiltEffect(c));

    function resizeLiquidCanvas() {
        const container = liquidCanvas.parentElement;
        if (container.offsetWidth === 0) return;
        liquidCanvas.width = container.offsetWidth;
        liquidCanvas.height = container.offsetHeight;
        if (liquid) liquid._draw();
    }
    resizeLiquidCanvas();
    window.addEventListener('resize', resizeLiquidCanvas);

    const ALGOS = {
        FIFO: SA.runFIFO, LRU: SA.runLRU, Optimal: SA.runOptimal,
        Clock: SA.runClock, LFU: SA.runLFU, MFU: SA.runMFU
    };

    // Nav Click Interception
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href').substring(1);
            if (targetId === 'compSection' && compSection.classList.contains('hidden')) {
                e.preventDefault();
                compareAllBtn.click();
            } else if (targetId === 'resultsSection' && resultsSection.classList.contains('hidden')) {
                e.preventDefault();
                runBtn.click();
            }
        });
    });

    const ALGO_KEYS = Object.keys(ALGOS);

    let simSteps   = [];
    let stepIdx    = 0;
    let animTimer  = null;
    let currentInput = null;
    let allAlgoResults = null;

    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        themeToggleBtn.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
        particles.setTheme(isDark);
        barChart.updateTheme();
    });

    randomBtn.addEventListener('click', () => genModal.classList.add('open'));
    genCloseBtn.addEventListener('click', () => genModal.classList.remove('open'));
    genModal.addEventListener('click', e => { if (e.target === genModal) genModal.classList.remove('open'); });

    genApplyBtn.addEventListener('click', () => {
        const len = parseInt(genLenInput.value) || 20;
        const min = parseInt(genMinInput.value) || 0;
        const max = parseInt(genMaxInput.value) || 9;
        referenceInput.value = SA.generateRandom(
            Math.min(Math.max(len, 5), 60),
            Math.max(min, 0),
            Math.min(Math.max(max, min + 1), 20)
        );
        genModal.classList.remove('open');
    });

    function getInput() {
        errorMsg.textContent = '';
        const pages = SA.parsePageString(referenceInput.value);
        if (!pages) { errorMsg.textContent = '⚠ Invalid page string — use space-separated positive integers.'; return null; }
        const frames = parseInt(frameInput.value, 10);
        if (isNaN(frames) || frames < 1 || frames > 20) { errorMsg.textContent = '⚠ Frame count must be between 1 and 20.'; return null; }
        return { pages, frames, algorithm: algoSelect.value };
    }

    function runAllAlgos(pages, frames) {
        return Object.fromEntries(ALGO_KEYS.map(k => [k, ALGOS[k](pages, frames)]));
    }

    controls.onRun(() => {
        if (controls.state === SA.PlaybackControls.STATES.PAUSED) {
            controls.setState(SA.PlaybackControls.STATES.RUNNING);
            scheduleNext();
            return;
        }

        const input = getInput();
        if (!input) return;
        currentInput = input;

        allAlgoResults = runAllAlgos(input.pages, input.frames);
        const selected = allAlgoResults[input.algorithm];
        simSteps = selected.steps;
        stepIdx = 0;

        simTable.buildHeader(input.frames);
        simTable.clear();
        metrics.reset();
        resultsSection.classList.remove('hidden');
        resizeLiquidCanvas();
        liquid.reset();

        barChart.render(ALGO_KEYS.map(k => allAlgoResults[k].faults));

        resultsSection.scrollIntoView({ behavior: 'smooth' });

        const isAnimated = modeToggle.value === 'animated';

        if (isAnimated) {
            controls.setState(SA.PlaybackControls.STATES.RUNNING);
            const baseSpeed = controls.speed || 500;
            const speedFact = Math.max(0.6, 2.5 - (baseSpeed / 600)); 
            particles.setSpeedMultiplier(speedFact);
            scheduleNext();
        } else {
            for (const step of simSteps) simTable.renderRow(step);
            metrics.update(selected.hits, selected.faults, input.pages.length);
            liquid.update(selected.hits, selected.faults, input.pages.length);
            controls.setState(SA.PlaybackControls.STATES.DONE);
            particles.setSpeedMultiplier(1.0);
        }
    });

    controls.onPause(() => {
        clearTimeout(animTimer);
        animTimer = null;
        controls.setState(SA.PlaybackControls.STATES.PAUSED);
        particles.setSpeedMultiplier(1.0);
    });

    controls.onNext(() => {
        if (controls.state === SA.PlaybackControls.STATES.RUNNING) {
            clearTimeout(animTimer);
            animTimer = null;
            controls.setState(SA.PlaybackControls.STATES.PAUSED);
        }
        if (stepIdx < simSteps.length) renderNextStep();
        if (stepIdx >= simSteps.length) particles.setSpeedMultiplier(1.0);
    });

    controls.onReset(() => {
        clearTimeout(animTimer);
        animTimer = null;
        simSteps = [];
        stepIdx = 0;
        simTable.clear();
        metrics.reset();
        liquid.reset();
        controls.reset();
        resultsSection.classList.add('hidden');
        compSection.classList.add('hidden');
        errorMsg.textContent = '';
        particles.setSpeedMultiplier(1.0);
    });

    function scheduleNext() {
        if (stepIdx >= simSteps.length) {
            controls.setState(SA.PlaybackControls.STATES.DONE);
            particles.setSpeedMultiplier(1.0);
            return;
        }
        renderNextStep();
        if (stepIdx < simSteps.length) animTimer = setTimeout(scheduleNext, controls.speed);
        else {
            controls.setState(SA.PlaybackControls.STATES.DONE);
            particles.setSpeedMultiplier(1.0);
        }
    }

    function renderNextStep() {
        if (stepIdx >= simSteps.length) return;
        const step = simSteps[stepIdx];
        const row = simTable.renderRow(step);

        if (step.isHit) {
            SA.glowHitRow(row);
            SA.playSimSound('hit');
            if (modeToggle.value === 'animated') particles.triggerFlash();
        } else {
            SA.flashFaultRow(row);
            SA.playSimSound('fault');
        }

        simTable.scrollToLatest();

        metrics.update(step.runningHits, step.runningFaults, simSteps.length);
        liquid.update(step.runningHits, step.runningFaults, simSteps.length);

        stepIdx++;
    }

    compareAllBtn.addEventListener('click', () => {
        const input = getInput();
        if (!input) return;

        allAlgoResults = runAllAlgos(input.pages, input.frames);
        barChart.render(ALGO_KEYS.map(k => allAlgoResults[k].faults));

        compTableBody.innerHTML = '';
        const resultsArray = ALGO_KEYS.map(k => ({ name: k, ...allAlgoResults[k] }));
        const minFaults = Math.min(...resultsArray.map(r => r.faults));

        for (const resObj of resultsArray) {
            const key = resObj.name;
            const res = resObj;
            const total = input.pages.length;
            const hitRat = total > 0 ? (res.hits / total * 100).toFixed(1) : '0.0';
            const isWinner = res.faults === minFaults;

            const tr = document.createElement('tr');
            if (isWinner) tr.classList.add('winner-row');
            tr.innerHTML = `
                <td><strong>${key}</strong> ${isWinner ? '🏆' : ''}</td>
                <td class="fault-text">${res.faults}</td>
                <td class="hit-text">${res.hits}</td>
                <td>${hitRat}%</td>
            `;
            compTableBody.appendChild(tr);
        }

        resultsSection.classList.remove('hidden');
        compSection.classList.remove('hidden');
        compSection.scrollIntoView({ behavior: 'smooth' });
    });

    exportCsvBtn.addEventListener('click', () => {
        if (!simSteps.length) { errorMsg.textContent = '⚠ Run simulation first.'; return; }
        const rows = [
            ['Step', 'Page', 'Frames', 'Result', 'Reason'],
            ...simSteps.map(s => [
                s.step, s.page, s.framePadded.map(v => v ?? '-').join('|'),
                s.isHit ? 'Hit' : 'Fault', s.replaceReason
            ])
        ];
        SA.downloadCSV(rows, `PageReplacement_${currentInput.algorithm}.csv`);
    });

    exportPdfBtn.addEventListener('click', () => {
        if (!simSteps.length) { errorMsg.textContent = '⚠ Run simulation first.'; return; }
        exportPdfBtn.textContent = '⏳ Exporting...';
        exportPdfBtn.disabled = true;
        const el = document.getElementById('resultsSection');
        const opt = {
            margin: 0.5, filename: `PageReplacement_${currentInput.algorithm}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter' }
        };
        html2pdf().set(opt).from(el).save().then(() => {
            exportPdfBtn.textContent = '📄 Export PDF';
            exportPdfBtn.disabled = false;
        });
    });

    controls.setState(SA.PlaybackControls.STATES.IDLE);
    controls.resetBtn.disabled = true;
});
