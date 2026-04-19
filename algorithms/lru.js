window.SimAlgo = window.SimAlgo || {};
window.SimAlgo.runLRU = function(pages, frames) {
    const memory = [], timeMap = new Map();
    let rHits = 0, rFaults = 0;
    const steps = [];
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        let isHit = false, replaceReason = '', replacedPage = null;
        if (memory.includes(page)) {
            isHit = true; rHits++; timeMap.set(page, i);
            replaceReason = `Page ${page} is in memory — Hit!`;
        } else {
            rFaults++;
            if (memory.length === frames) {
                let lru = memory[0], minT = timeMap.get(lru);
                for (let j=1;j<memory.length;j++){ const t=timeMap.get(memory[j]); if(t<minT){minT=t;lru=memory[j];} }
                replacedPage = lru;
                replaceReason = `Page ${lru} removed — least recently used (last used step ${minT+1}).`;
                memory[memory.indexOf(lru)] = page;
            } else { replaceReason = `Empty frame filled with Page ${page}.`; memory.push(page); }
            timeMap.set(page, i);
        }
        steps.push({ step:i+1, page, framesState:[...memory], framePadded:padF([...memory],frames), isHit, replaceReason, replacedPage, runningHits:rHits, runningFaults:rFaults });
    }
    return { hits:rHits, faults:rFaults, steps };
};
function padF(arr,size){const r=[...arr];while(r.length<size)r.push(null);return r;}
