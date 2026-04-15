window.SimAlgo = window.SimAlgo || {};
window.SimAlgo.runClock = function(pages, frames) {
    const memory = []; let ptr = 0;
    let rHits = 0, rFaults = 0;
    const steps = [];
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        let isHit = false, replaceReason = '', replacedPage = null;
        const ei = memory.findIndex(m => m.page === page);
        if (ei !== -1) {
            isHit = true; rHits++; memory[ei].useBit = 1;
            replaceReason = `Page ${page} in memory, use bit set to 1 — Hit!`;
        } else {
            rFaults++;
            if (memory.length < frames) {
                memory.push({page, useBit:1});
                replaceReason = `Empty frame filled with Page ${page}.`;
            } else {
                while (memory[ptr].useBit === 1) { memory[ptr].useBit = 0; ptr = (ptr+1)%frames; }
                replacedPage = memory[ptr].page;
                replaceReason = `Page ${replacedPage} removed — clock pointer found use bit 0 (no second chance).`;
                memory[ptr] = {page, useBit:1}; ptr = (ptr+1)%frames;
            }
        }
        steps.push({ step:i+1, page, framesState:memory.map(m=>m.page), framePadded:padF(memory.map(m=>m.page),frames), isHit, replaceReason, replacedPage, runningHits:rHits, runningFaults:rFaults });
    }
    return { hits:rHits, faults:rFaults, steps };
};
function padF(arr,size){const r=[...arr];while(r.length<size)r.push(null);return r;}
