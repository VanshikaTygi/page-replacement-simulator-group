window.SimAlgo = window.SimAlgo || {};

window.SimAlgo.generateRandom = function(length = 20, minPage = 0, maxPage = 9) {
    const pages = [];
    for (let i = 0; i < length; i++) {
        pages.push(Math.floor(Math.random() * (maxPage - minPage + 1)) + minPage);
    }
    return pages.join(' ');
};
