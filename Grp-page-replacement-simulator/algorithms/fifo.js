window.SimAlgo = window.SimAlgo || {};
window.SimAlgo.runFIFO = function(pages, frames) {
    const queue = [];
    let rHits = 0, rFaults = 0;
    const steps = [];
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        let isHit = false, replaceReason = '', replacedPage = null;
        if (queue.includes(page)) {
            isHit = true; rHits++;
            replaceReason = `Page ${page} is already in memory — Hit!`;
        } else {
            rFaults++;
            if (queue.length === frames) {
                replacedPage = queue.shift();
                replaceReason = `Page ${replacedPage} removed — oldest page in memory (FIFO).`;
            } else {
                replaceReason = `Empty frame filled with Page ${page}.`;
            }
            queue.push(page);
        }
        steps.push({ step: i+1, page, framesState:[...queue], framePadded: padF([...queue],frames), isHit, replaceReason, replacedPage, runningHits: rHits, runningFaults: rFaults });
    }
    return { hits: rHits, faults: rFaults, steps };
};
function padF(arr, size) { const r=[...arr]; while(r.length<size) r.push(null); return r; }
