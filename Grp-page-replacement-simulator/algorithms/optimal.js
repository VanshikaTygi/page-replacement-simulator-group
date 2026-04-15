window.SimAlgo = window.SimAlgo || {};
window.SimAlgo.runOptimal = function(pages, frames) {
    const memory = [];
    let rHits = 0, rFaults = 0;
    const steps = [];
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        let isHit = false, replaceReason = '', replacedPage = null;
        if (memory.includes(page)) {
            isHit = true; rHits++;
            replaceReason = `Page ${page} is in memory — Hit!`;
        } else {
            rFaults++;
            if (memory.length === frames) {
                let far = -1, idx = -1, victim = null;
                for (let j=0;j<memory.length;j++) {
                    const next = pages.indexOf(memory[j], i+1);
                    if (next === -1) { idx=j; victim=memory[j]; replaceReason=`Page ${victim} removed — never used again.`; break; }
                    if (next > far) { far=next; idx=j; victim=memory[j]; replaceReason=`Page ${victim} removed — furthest next use (step ${next+1}).`; }
                }
                replacedPage = victim; memory[idx] = page;
            } else { replaceReason = `Empty frame filled with Page ${page}.`; memory.push(page); }
        }
        steps.push({ step:i+1, page, framesState:[...memory], framePadded:padF([...memory],frames), isHit, replaceReason, replacedPage, runningHits:rHits, runningFaults:rFaults });
    }
    return { hits:rHits, faults:rFaults, steps };
};
function padF(arr,size){const r=[...arr];while(r.length<size)r.push(null);return r;}
