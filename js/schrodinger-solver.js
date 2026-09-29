/**
 * 1D Time-Dependent Schrödinger Equation Simulator
 * Numerical wave mechanics using symplectic leapfrog integration.
 */

class SchrodingerSolver {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.N = 256;          // Spatial grid points
        this.dx = 0.08;        // Spatial resolution
        this.dt = 0.0025;      // Time step
        this.isRunning = true;
        this.time = 0;

        // Wavefunction arrays: Re(psi), Im(psi), Potential V(x)
        this.re = new Float32Array(this.N);
        this.im = new Float32Array(this.N);
        this.V = new Float32Array(this.N);

        this.currentPreset = 'tunneling';
        this.loadPreset(this.currentPreset);

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.startLoop();
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const w = rect.width > 20 ? rect.width : (this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 600) || 600;
        const h = rect.height > 20 ? rect.height : (this.canvas.parentElement ? this.canvas.parentElement.clientHeight : 330) || 330;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
    }

    loadPreset(preset) {
        this.currentPreset = preset;
        this.time = 0;
        this.re.fill(0);
        this.im.fill(0);
        this.V.fill(0);

        const mid = Math.floor(this.N / 2);

        if (preset === 'tunneling') {
            // Potential barrier in the middle
            const barrierHeight = 12.0;
            const barrierWidth = 14;
            for (let i = mid - barrierWidth; i <= mid + barrierWidth; i++) {
                this.V[i] = barrierHeight;
            }

            // Gaussian wavepacket on the left moving right with momentum k0
            const x0 = Math.floor(this.N * 0.22);
            const sigma = 14;
            const k0 = 3.2;

            for (let i = 0; i < this.N; i++) {
                const env = Math.exp(-Math.pow(i - x0, 2) / (2 * sigma * sigma));
                this.re[i] = env * Math.cos(k0 * (i - x0) * this.dx);
                this.im[i] = env * Math.sin(k0 * (i - x0) * this.dx);
            }
        } else if (preset === 'harmonic') {
            // Parabolic Harmonic Oscillator V(x) = 0.5 * k * (x - mid)^2
            const k = 0.0035;
            for (let i = 0; i < this.N; i++) {
                this.V[i] = k * Math.pow(i - mid, 2);
            }

            // Displaced Gaussian (coherent state that oscillates back and forth)
            const x0 = mid - 40;
            const sigma = 12;
            for (let i = 0; i < this.N; i++) {
                this.re[i] = Math.exp(-Math.pow(i - x0, 2) / (2 * sigma * sigma));
                this.im[i] = 0;
            }
        } else if (preset === 'box') {
            // Infinite Square Well (hard wall boundaries at edges)
            // Superposition of n=1 and n=2 states: psi = (psi1 + psi2)/sqrt(2)
            for (let i = 1; i < this.N - 1; i++) {
                const normX = i / (this.N - 1);
                const psi1 = Math.sin(Math.PI * normX);
                const psi2 = Math.sin(2 * Math.PI * normX);
                this.re[i] = (psi1 + psi2) / Math.SQRT2;
                this.im[i] = 0;
            }
        }

        this.normalize();
    }

    normalize() {
        let sum = 0;
        for (let i = 0; i < this.N; i++) {
            sum += (this.re[i] * this.re[i] + this.im[i] * this.im[i]) * this.dx;
        }
        const normFactor = Math.sqrt(sum) || 1;
        for (let i = 0; i < this.N; i++) {
            this.re[i] /= normFactor;
            this.im[i] /= normFactor;
        }
    }

    /**
     * Symplectic time-integration step
     */
    step() {
        const dx2 = this.dx * this.dx;
        const halfDt = 0.5 * this.dt;

        // 1. Update Real part using Im part
        for (let i = 1; i < this.N - 1; i++) {
            const d2Im = (this.im[i + 1] - 2 * this.im[i] + this.im[i - 1]) / dx2;
            const H_im = -0.5 * d2Im + this.V[i] * this.im[i];
            this.re[i] += this.dt * H_im;
        }

        // 2. Update Imaginary part using Re part
        for (let i = 1; i < this.N - 1; i++) {
            const d2Re = (this.re[i + 1] - 2 * this.re[i] + this.re[i - 1]) / dx2;
            const H_re = -0.5 * d2Re + this.V[i] * this.re[i];
            this.im[i] -= this.dt * H_re;
        }

        // Boundary damping / hard walls
        this.re[0] = 0; this.im[0] = 0;
        this.re[this.N - 1] = 0; this.im[this.N - 1] = 0;

        this.time += this.dt;
    }

    startLoop() {
        const loop = () => {
            if (this.isRunning) {
                // Substep for numerical stability
                for (let s = 0; s < 4; s++) {
                    this.step();
                }
            }
            this.render();
            requestAnimationFrame(loop);
        };
        loop();
    }

    render() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        const groundY = h * 0.78;
        const scaleY = h * 1.8;
        const vScaleY = h * 0.025;

        // 1. Draw Potential V(x)
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        for (let i = 0; i < this.N; i++) {
            const px = (i / (this.N - 1)) * w;
            const py = groundY - this.V[i] * vScaleY;
            ctx.lineTo(px, py);
        }
        ctx.lineTo(w, groundY);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 170, 0, 0.15)';
        ctx.fill();
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 2. Draw Probability Density P(x) = |psi(x)|^2
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        for (let i = 0; i < this.N; i++) {
            const prob = (this.re[i] * this.re[i] + this.im[i] * this.im[i]);
            const px = (i / (this.N - 1)) * w;
            const py = groundY - prob * scaleY;
            ctx.lineTo(px, py);
        }
        ctx.lineTo(w, groundY);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 242, 254, 0.28)';
        ctx.fill();

        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(0, 242, 254, 0.8)';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 3. Draw Real part Re(psi) as wave oscillations
        const isDark = document.body && document.body.classList.contains('dark-theme');
        const waveColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.5)';
        const groundColor = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(15, 23, 42, 0.15)';

        ctx.beginPath();
        for (let i = 0; i < this.N; i++) {
            const px = (i / (this.N - 1)) * w;
            const py = groundY - this.re[i] * (scaleY * 0.5);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = waveColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Ground reference line
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(w, groundY);
        ctx.strokeStyle = groundColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Overlay text
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText(`Preset: ${this.currentPreset.toUpperCase()} | Time t: ${this.time.toFixed(2)}`, 14, 24);
        ctx.fillStyle = '#00f2fe';
        ctx.fillText(`■ Probability Density |ψ(x)|²`, 14, 44);
        ctx.fillStyle = '#ffaa00';
        ctx.fillText(`■ Potential Barrier V(x)`, 14, 64);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SchrodingerSolver;
}
