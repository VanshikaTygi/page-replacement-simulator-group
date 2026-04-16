window.SimAlgo = window.SimAlgo || {};

window.SimAlgo.PlaybackControls = class PlaybackControls {
    static STATES = { IDLE: 'IDLE', RUNNING: 'RUNNING', PAUSED: 'PAUSED', DONE: 'DONE' };

    constructor({ runBtn, pauseBtn, nextBtn, resetBtn, speedSelect }) {
        this.runBtn = runBtn;
        this.pauseBtn = pauseBtn;
        this.nextBtn = nextBtn;
        this.resetBtn = resetBtn;
        this.speedSelect = speedSelect;

        this.state = window.SimAlgo.PlaybackControls.STATES.IDLE;
        this._onRun = null;
        this._onPause = null;
        this._onNext = null;
        this._onReset = null;

        this._bindEvents();
    }

    _bindEvents() {
        this.runBtn.addEventListener('click', () => {
            if (this.state === window.SimAlgo.PlaybackControls.STATES.IDLE ||
                this.state === window.SimAlgo.PlaybackControls.STATES.PAUSED) {
                this._onRun?.();
            }
        });
        this.pauseBtn.addEventListener('click', () => {
            if (this.state === window.SimAlgo.PlaybackControls.STATES.RUNNING) {
                this._onPause?.();
            }
        });
        this.nextBtn.addEventListener('click', () => {
            if (this.state !== window.SimAlgo.PlaybackControls.STATES.DONE) {
                this._onNext?.();
            }
        });
        this.resetBtn.addEventListener('click', () => this._onReset?.());

        document.addEventListener('keydown', (e) => {
            const tag = document.activeElement.tagName;
            if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.state === window.SimAlgo.PlaybackControls.STATES.RUNNING) this._onPause?.();
                else if (this.state !== window.SimAlgo.PlaybackControls.STATES.DONE) this._onRun?.();
            }
            if (e.code === 'ArrowRight') {
                e.preventDefault();
                if (this.state !== window.SimAlgo.PlaybackControls.STATES.DONE) this._onNext?.();
            }
        });
    }

    get speed() {
        return parseInt(this.speedSelect?.value || '500', 10);
    }

    onRun(fn) { this._onRun = fn; return this; }
    onPause(fn) { this._onPause = fn; return this; }
    onNext(fn) { this._onNext = fn; return this; }
    onReset(fn) { this._onReset = fn; return this; }

    setState(state) {
        this.state = state;
        this._syncUI();
    }

    _syncUI() {
        const { IDLE, RUNNING, PAUSED, DONE } = window.SimAlgo.PlaybackControls.STATES;
        this.runBtn.disabled  = this.state === RUNNING;
        this.pauseBtn.disabled = this.state !== RUNNING;
        this.nextBtn.disabled  = this.state === RUNNING || this.state === DONE;
        this.resetBtn.disabled = this.state === IDLE;

        this.runBtn.textContent = this.state === PAUSED ? '▶ Resume' : '▶ Run';
    }

    reset() {
        this.setState(window.SimAlgo.PlaybackControls.STATES.IDLE);
        this.runBtn.textContent = '▶ Run';
    }
};
