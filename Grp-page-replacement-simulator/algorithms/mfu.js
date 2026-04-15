window.SimAlgo = window.SimAlgo || {};
window.SimAlgo.runMFU = function(pages, frames) {
    const memory=[], freqMap=new Map(), arrMap=new Map();
    let rHits=0, rFaults=0;
    const steps=[];
    for (let i=0;i<pages.length;i++) {
        const page=pages[i];
        let isHit=false, replaceReason='', replacedPage=null;
        freqMap.set(page,(freqMap.get(page)||0)+1);
        if (memory.includes(page)) {
            isHit=true; rHits++;
            replaceReason=`Page ${page} in memory (freq:${freqMap.get(page)}) — Hit!`;
        } else {
            rFaults++;
            if (memory.length<frames) { memory.push(page); arrMap.set(page,i); replaceReason=`Empty frame filled with Page ${page}.`; }
            else {
                let maxF=-1, cands=[];
                for (const mp of memory) { const f=freqMap.get(mp); if(f>maxF){maxF=f;cands=[mp];}else if(f===maxF)cands.push(mp); }
                let toEvict=cands[0], oldArr=arrMap.get(toEvict);
                for (let k=1;k<cands.length;k++){const a=arrMap.get(cands[k]);if(a<oldArr){oldArr=a;toEvict=cands[k];}}
                replacedPage=toEvict;
                replaceReason=`Page ${toEvict} removed — highest frequency (${maxF} uses).`;
                memory[memory.indexOf(toEvict)]=page; arrMap.set(page,i);
            }
        }
        steps.push({step:i+1,page,framesState:[...memory],framePadded:padF([...memory],frames),isHit,replaceReason,replacedPage,runningHits:rHits,runningFaults:rFaults});
    }
    return {hits:rHits,faults:rFaults,steps};
};
function padF(arr,size){const r=[...arr];while(r.length<size)r.push(null);return r;}
