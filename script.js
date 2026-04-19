// ====== DOM Elements ======
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const referenceInput = document.getElementById('referenceString');
const frameInput = document.getElementById('frameCount');
const algoSelect = document.getElementById('algorithm');
const simulateBtn = document.getElementById('simulateBtn');
const nextStepBtn = document.getElementById('nextStepBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const errorMsg = document.getElementById('errorMsg');
const resultsWrapper = document.getElementById('resultsWrapper');
const autoAnimateCheckbox = document.getElementById('autoAnimate');
const randomStringBtn = document.getElementById('randomStringBtn');
const animationSpeedSelect = document.getElementById('animationSpeed');

// Table & Stats Elements
const totalFaultsEl = document.getElementById('totalFaults');
const totalHitsEl = document.getElementById('totalHits');
const hitRatioEl = document.getElementById('hitRatio');
const tableHeaderRow = document.getElementById('tableHeaderRow');
const tableBody = document.getElementById('tableBody');

// Chart instance
let comparisonChart = null;

// Audio Context
let audioCtx = null;

// Simulation State
let simulationSteps = [];
let currentStepIdx = 0;
let animationTimeout = null;

// ====== Random Generator ======
randomStringBtn.addEventListener('click', () => {
    // Generate exactly 20 random pages between 0 and 9
    const randomPages = Array.from({length: 20}, () => Math.floor(Math.random() * 10));
    referenceInput.value = randomPages.join(' ');
});

// ====== Sound Effect ======
function playFaultSound() {
    try {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, audioCtx.currentTime); // Low pitch beep
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
        // Ignore audio errors
    }
}

// ====== Theme Toggling ======
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    if (document.body.classList.contains('dark-theme')) {
        themeIcon.textContent = '☀️';
    } else {
        themeIcon.textContent = '🌙';
    }
    // Update chart colors if chart exists
    if (comparisonChart) {
        updateChartTheme();
    }
});

function updateChartTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    const color = isDark ? '#cbd5e1' : '#475569';
    comparisonChart.options.scales.x.ticks.color = color;
    comparisonChart.options.scales.x.title.color = color;
    comparisonChart.options.scales.y.ticks.color = color;
    comparisonChart.options.scales.y.title.color = color;
    comparisonChart.options.plugins.legend.labels.color = color;
    comparisonChart.update();
}

// ====== Input Validation & Parsing ======
function parseInput() {
    const refStr = referenceInput.value.trim();
    const framesStr = frameInput.value.trim();
    
    errorMsg.textContent = '';
    
    if (!refStr) {
        errorMsg.textContent = 'Please enter a page reference string.';
        return null;
    }
    
    // Replace extra spaces and split by space
    const stringParts = refStr.replace(/\s+/g, ' ').split(' ');
    const pages = [];
    
    for (let part of stringParts) {
        const num = parseInt(part, 10);
        if (isNaN(num) || num < 0) {
            errorMsg.textContent = `Invalid number in reference string: "${part}". Please enter positive integers.`;
            return null;
        }
        pages.push(num);
    }
    
    const frames = parseInt(framesStr, 10);
    if (isNaN(frames) || frames <= 0) {
        errorMsg.textContent = 'Please enter a valid frame size (greater than 0).';
        return null;
    }
    
    return { pages, frames, algorithm: algoSelect.value };
}

// ====== Algorithms ======

function runFIFO(pages, frames) {
    let queue = [];
    let hits = 0;
    let faults = 0;
    let steps = [];
    
    for (let i = 0; i < pages.length; i++) {
        let page = pages[i];
        let isHit = false;
        let replaceReason = "";
        
        if (queue.includes(page)) {
            isHit = true;
            hits++;
        } else {
            faults++;
            if (queue.length === frames) {
                let old = queue.shift(); // Remove oldest
                replaceReason = `Page ${old} was replaced because it was the first one added to memory (Oldest).`;
            } else {
                replaceReason = `Empty frame filled with Page ${page}.`;
            }
            queue.push(page); // Add new
        }
        
        steps.push({
            step: i + 1,
            page: page,
            framesState: [...queue],
            isHit: isHit,
            replaceReason: replaceReason
        });
    }
    
    return { hits, faults, steps };
}

function runLRU(pages, frames) {
    let memory = []; 
    let timeMap = new Map(); 
    let hits = 0;
    let faults = 0;
    let steps = [];
    
    for (let i = 0; i < pages.length; i++) {
        let page = pages[i];
        let isHit = false;
        let replaceReason = "";
        
        if (memory.includes(page)) {
            isHit = true;
            hits++;
            timeMap.set(page, i); 
        } else {
            faults++;
            if (memory.length === frames) {
                let lruPage = memory[0];
                let minTime = timeMap.get(lruPage);
                
                for (let j = 1; j < memory.length; j++) {
                    let t = timeMap.get(memory[j]);
                    if (t < minTime) {
                        minTime = t;
                        lruPage = memory[j];
                    }
                }
                
                replaceReason = `Page ${lruPage} was replaced because it was used least recently (at step ${minTime + 1}).`;
                let index = memory.indexOf(lruPage);
                memory[index] = page;
            } else {
                replaceReason = `Empty frame filled with Page ${page}.`;
                memory.push(page);
            }
            timeMap.set(page, i);
        }
        
        steps.push({
            step: i + 1,
            page: page,
            framesState: [...memory],
            isHit: isHit,
            replaceReason: replaceReason
        });
    }
    
    return { hits, faults, steps };
}

function runOptimal(pages, frames) {
    let memory = [];
    let hits = 0;
    let faults = 0;
    let steps = [];
    
    for (let i = 0; i < pages.length; i++) {
        let page = pages[i];
        let isHit = false;
        let replaceReason = "";
        
        if (memory.includes(page)) {
            isHit = true;
            hits++;
        } else {
            faults++;
            if (memory.length === frames) {
                let furthest = -1;
                let replaceIndex = -1;
                
                for (let j = 0; j < memory.length; j++) {
                    let memPage = memory[j];
                    let nextUse = pages.indexOf(memPage, i + 1);
                    
                    if (nextUse === -1) {
                        replaceIndex = j;
                        replaceReason = `Page ${memPage} was replaced because it is never used again in the future.`;
                        break;
                    } else {
                        if (nextUse > furthest) {
                            furthest = nextUse;
                            replaceIndex = j;
                            replaceReason = `Page ${memPage} was replaced because its next use is the furthest in the future (at step ${nextUse + 1}).`;
                        }
                    }
                }
                memory[replaceIndex] = page;
            } else {
                replaceReason = `Empty frame filled with Page ${page}.`;
                memory.push(page);
            }
        }
        
        steps.push({
            step: i + 1,
            page: page,
            framesState: [...memory],
            isHit: isHit,
            replaceReason: replaceReason
        });
    }
    
    return { hits, faults, steps };
}

function runClock(pages, frames) {
    let memory = []; // array of {page, useBit}
    let pointer = 0;
    let hits = 0;
    let faults = 0;
    let steps = [];
    
    for (let i = 0; i < pages.length; i++) {
        let page = pages[i];
        let isHit = false;
        let replaceReason = "";
        
        let existingIndex = memory.findIndex(m => m.page === page);
        
        if (existingIndex !== -1) {
            isHit = true;
            hits++;
            memory[existingIndex].useBit = 1; // set use bit
        } else {
            faults++;
            if (memory.length < frames) {
                memory.push({page: page, useBit: 1});
                replaceReason = `Empty frame filled with Page ${page}.`;
            } else {
                while (memory[pointer].useBit === 1) {
                    memory[pointer].useBit = 0; // give second chance
                    pointer = (pointer + 1) % frames;
                }
                
                let old = memory[pointer].page;
                memory[pointer] = {page: page, useBit: 1};
                replaceReason = `Page ${old} was replaced. Clock pointer found it with use bit 0.`;
                pointer = (pointer + 1) % frames;
            }
        }
        
        steps.push({
            step: i + 1,
            page: page,
            framesState: memory.map(m => m.page),
            isHit: isHit,
            replaceReason: replaceReason
        });
    }
    
    return { hits, faults, steps };
}

function runLFU(pages, frames) {
    let memory = [];
    let freqMap = new Map();
    let arrivalMap = new Map(); // For FIFO tie breaker
    let hits = 0;
    let faults = 0;
    let steps = [];
    
    for (let i = 0; i < pages.length; i++) {
        let page = pages[i];
        let isHit = false;
        let replaceReason = "";
        
        freqMap.set(page, (freqMap.get(page) || 0) + 1);
        
        if (memory.includes(page)) {
            isHit = true;
            hits++;
        } else {
            faults++;
            if (memory.length < frames) {
                memory.push(page);
                arrivalMap.set(page, i);
                replaceReason = `Empty frame filled with Page ${page}.`;
            } else {
                let minFreq = Infinity;
                let potentialEvicts = [];
                
                for(let memPage of memory) {
                    let freq = freqMap.get(memPage);
                    if (freq < minFreq) {
                        minFreq = freq;
                        potentialEvicts = [memPage];
                    } else if (freq === minFreq) {
                        potentialEvicts.push(memPage);
                    }
                }
                
                let toEvict = potentialEvicts[0];
                let oldest = arrivalMap.get(toEvict);
                
                for(let j = 1; j < potentialEvicts.length; j++) {
                    let p = potentialEvicts[j];
                    let arrTime = arrivalMap.get(p);
                    if (arrTime < oldest) {
                        oldest = arrTime;
                        toEvict = p;
                    }
                }
                
                replaceReason = `Page ${toEvict} replaced (Lowest Frequency: ${minFreq}). Tie broken by earliest arrival if needed.`;
                let index = memory.indexOf(toEvict);
                memory[index] = page;
                arrivalMap.set(page, i);
            }
        }
        
        steps.push({
            step: i + 1,
            page: page,
            framesState: [...memory],
            isHit: isHit,
            replaceReason: replaceReason
        });
    }
    return { hits, faults, steps };
}

function runMFU(pages, frames) {
    let memory = [];
    let freqMap = new Map();
    let arrivalMap = new Map(); // For FIFO tie breaker
    let hits = 0;
    let faults = 0;
    let steps = [];
    
    for (let i = 0; i < pages.length; i++) {
        let page = pages[i];
        let isHit = false;
        let replaceReason = "";
        
        freqMap.set(page, (freqMap.get(page) || 0) + 1);
        
        if (memory.includes(page)) {
            isHit = true;
            hits++;
        } else {
            faults++;
            if (memory.length < frames) {
                memory.push(page);
                arrivalMap.set(page, i);
                replaceReason = `Empty frame filled with Page ${page}.`;
            } else {
                let maxFreq = -1;
                let potentialEvicts = [];
                
                for(let memPage of memory) {
                    let freq = freqMap.get(memPage);
                    if (freq > maxFreq) {
                        maxFreq = freq;
                        potentialEvicts = [memPage];
                    } else if (freq === maxFreq) {
                        potentialEvicts.push(memPage);
                    }
                }
                
                let toEvict = potentialEvicts[0];
                let oldest = arrivalMap.get(toEvict);
                
                for(let j = 1; j < potentialEvicts.length; j++) {
                    let p = potentialEvicts[j];
                    let arrTime = arrivalMap.get(p);
                    if (arrTime < oldest) {
                        oldest = arrTime;
                        toEvict = p;
                    }
                }
                
                replaceReason = `Page ${toEvict} replaced (Highest Frequency: ${maxFreq}). Tie broken by earliest arrival if needed.`;
                let index = memory.indexOf(toEvict);
                memory[index] = page;
                arrivalMap.set(page, i);
            }
        }
        
        steps.push({
            step: i + 1,
            page: page,
            framesState: [...memory],
            isHit: isHit,
            replaceReason: replaceReason
        });
    }
    return { hits, faults, steps };
}


// ====== Visualization & Rendering ======

function buildTableHeader(frames) {
    tableHeaderRow.innerHTML = `
        <th>Step</th>
        <th>Page Request</th>
    `;
    for (let i = 1; i <= frames; i++) {
        tableHeaderRow.innerHTML += `<th>Frame ${i}</th>`;
    }
    tableHeaderRow.innerHTML += `<th>Result</th>`;
}

function renderRow(stepData, frameSize) {
    const tr = document.createElement('tr');
    
    // Step & Page
    tr.innerHTML = `
        <td>${stepData.step}</td>
        <td><strong>${stepData.page}</strong></td>
    `;
    
    // Frames
    for (let i = 0; i < frameSize; i++) {
        const val = stepData.framesState[i];
        if (val !== undefined) {
            tr.innerHTML += `<td><span class="frame-cell filled">${val}</span></td>`;
        } else {
            tr.innerHTML += `<td><span class="frame-cell"></span></td>`;
        }
    }
    
    // Result
    if (stepData.isHit) {
        tr.innerHTML += `<td><span class="result-badge hit">Hit</span></td>`;
    } else {
        tr.innerHTML += `
        <td>
            <div class="tooltip-container">
                <span class="result-badge fault">Fault</span>
                <span class="tooltip-text">${stepData.replaceReason}</span>
            </div>
        </td>`;
    }
    
    tableBody.appendChild(tr);

    // Play sound if fault
    if (!stepData.isHit) {
        playFaultSound();
    }
}

function updateStats(hits, faults, total) {
    totalFaultsEl.textContent = faults;
    totalHitsEl.textContent = hits;
    const ratio = total > 0 ? ((hits / total) * 100).toFixed(1) : 0;
    hitRatioEl.textContent = `${ratio}%`;
}

// Chart drawing
function drawChart(f, lru, opt, clk, lfu, mfu) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#cbd5e1' : '#475569';
    
    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['FIFO', 'LRU', 'Optimal', 'Clock', 'LFU', 'MFU'],
            datasets: [{
                label: 'Total Page Faults',
                data: [f, lru, opt, clk, lfu, mfu],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.7)',  // Blue
                    'rgba(16, 185, 129, 0.7)',  // Emerald
                    'rgba(139, 92, 246, 0.7)',  // Violet
                    'rgba(245, 158, 11, 0.7)',  // Amber
                    'rgba(239, 68, 68, 0.7)',   // Red
                    'rgba(6, 182, 212, 0.7)'    // Cyan
                ],
                borderColor: [
                    'rgb(59, 130, 246)',
                    'rgb(16, 185, 129)',
                    'rgb(139, 92, 246)',
                    'rgb(245, 158, 11)',
                    'rgb(239, 68, 68)',
                    'rgb(6, 182, 212)'
                ],
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor, stepSize: 1 },
                    title: {
                        display: true,
                        text: 'Number of Faults',
                        color: textColor
                    }
                },
                x: {
                    ticks: { color: textColor },
                    title: {
                        display: true,
                        text: 'Algorithms',
                        color: textColor
                    }
                }
            },
            plugins: {
                legend: {
                    labels: { color: textColor }
                }
            }
        }
    });
}

// ====== Main Orchestration ======

simulateBtn.addEventListener('click', () => {
    // Clear any ongoing animation
    if (animationTimeout) {
        clearTimeout(animationTimeout);
    }
    
    // Parse Input
    const input = parseInput();
    if (!input) return;
    
    // Run all algos for chart compare
    const fifoData = runFIFO(input.pages, input.frames);
    const lruData = runLRU(input.pages, input.frames);
    const optimalData = runOptimal(input.pages, input.frames);
    const clockData = runClock(input.pages, input.frames);
    const lfuData = runLFU(input.pages, input.frames);
    const mfuData = runMFU(input.pages, input.frames);
    
    drawChart(fifoData.faults, lruData.faults, optimalData.faults, clockData.faults, lfuData.faults, mfuData.faults);
    
    // Select specific algorithm data for table
    let selectedData;
    switch(input.algorithm) {
        case 'FIFO': selectedData = fifoData; break;
        case 'LRU': selectedData = lruData; break;
        case 'Optimal': selectedData = optimalData; break;
        case 'Clock': selectedData = clockData; break;
        case 'LFU': selectedData = lfuData; break;
        case 'MFU': selectedData = mfuData; break;
    }
    
    // Prepare table visualization
    resultsWrapper.classList.remove('hidden');
    buildTableHeader(input.frames);
    tableBody.innerHTML = '';
    
    simulationSteps = selectedData.steps;
    currentStepIdx = 0;
    
    // Show stats initially 0
    updateStats(0, 0, input.pages.length);
    
    const isAutoAnimate = autoAnimateCheckbox.checked;
    
    if (isAutoAnimate) {
        simulateBtn.disabled = true;
        nextStepBtn.disabled = true;
        // Scroll to results cleanly
        document.getElementById('resultsWrapper').scrollIntoView({ behavior: 'smooth' });
        animateTable(input.frames);
    } else {
        simulateBtn.disabled = false;
        nextStepBtn.disabled = false;
        document.getElementById('resultsWrapper').scrollIntoView({ behavior: 'smooth' });
    }
});

function animateTable(frameSize) {
    if (currentStepIdx >= simulationSteps.length) {
        simulateBtn.disabled = false;
        nextStepBtn.disabled = true;
        return;
    }
    
    const stepData = simulationSteps[currentStepIdx];
    renderRow(stepData, frameSize);
    
    // Update live stats up to current step
    let cHits = 0;
    let cFaults = 0;
    for (let i = 0; i <= currentStepIdx; i++) {
        if (simulationSteps[i].isHit) cHits++;
        else cFaults++;
    }
    updateStats(cHits, cFaults, simulationSteps.length);
    
    currentStepIdx++;
    
    // Auto advance based on speed selector
    const speed = parseInt(animationSpeedSelect.value, 10) || 500;
    
    animationTimeout = setTimeout(() => {
        animateTable(frameSize);
    }, speed);
}

// Bonus: Manual Step
nextStepBtn.addEventListener('click', () => {
    // Stop auto-animation if running
    if (animationTimeout) {
        clearTimeout(animationTimeout);
        animationTimeout = null;
    }
    
    const input = parseInput();
    if (!input) return;
    
    if (currentStepIdx < simulationSteps.length) {
        const stepData = simulationSteps[currentStepIdx];
        renderRow(stepData, input.frames);
        
        let cHits = 0;
        let cFaults = 0;
        for (let i = 0; i <= currentStepIdx; i++) {
            if (simulationSteps[i].isHit) cHits++;
            else cFaults++;
        }
        updateStats(cHits, cFaults, simulationSteps.length);
        
        currentStepIdx++;
        
        if (currentStepIdx >= simulationSteps.length) {
            nextStepBtn.disabled = true;
        }
    }
});

// Auto animate checkbox toggling behavior while mid-simulation
autoAnimateCheckbox.addEventListener('change', (e) => {
    // If we turned it on during manual mode, and we have steps left
    if (e.target.checked && currentStepIdx > 0 && currentStepIdx < simulationSteps.length) {
        const input = parseInput();
        if (input) {
            nextStepBtn.disabled = true;
            simulateBtn.disabled = true;
            animateTable(input.frames);
        }
    } else if (!e.target.checked && animationTimeout) {
        // If we turned it off while animating
        clearTimeout(animationTimeout);
        animationTimeout = null;
        simulateBtn.disabled = false;
        if (currentStepIdx < simulationSteps.length) {
            nextStepBtn.disabled = false;
        }
    }
});

// PDF Export Feature
exportPdfBtn.addEventListener('click', () => {
    // We export the resultsWrapper div
    if (resultsWrapper.classList.contains('hidden')) {
        errorMsg.textContent = "Empty results. Please simulate first.";
        return;
    }
    
    exportPdfBtn.textContent = "Exporting...";
    exportPdfBtn.disabled = true;
    
    const element = document.getElementById('resultsWrapper');
    const opt = {
      margin:       0.5,
      filename:     `PageReplacement_${algoSelect.value}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        exportPdfBtn.textContent = "Export PDF";
        exportPdfBtn.disabled = false;
    });
});
