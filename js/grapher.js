/**
 * Interactive 2D Grapher for Calculus & Functions
 * Visualizes functions, derivative tangents, and definite integral shaded regions.
 */

class FunctionGrapher {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        // Viewport bounds
        this.xMin = -5;
        this.xMax = 5;
        this.yMin = -4;
        this.yMax = 4;

        // Current functions and overlays
        this.func = null;
        this.funcStr = "";
        this.integralArea = null; // { a, b }
        this.tangentPoint = null; // x0

        this.initEvents();
        this.resize();
        this.render();
    }

    initEvents() {
        window.addEventListener('resize', () => this.resize());

        let isDragging = false;
        let lastX = 0, lastY = 0;

        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;

            const scaleX = (this.xMax - this.xMin) / this.canvas.width;
            const scaleY = (this.yMax - this.yMin) / this.canvas.height;

            this.xMin -= dx * scaleX;
            this.xMax -= dx * scaleX;
            this.yMin += dy * scaleY;
            this.yMax += dy * scaleY;

            this.render();
        });

        window.addEventListener('mouseup', () => { isDragging = false; });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoom = e.deltaY < 0 ? 0.9 : 1.1;
            const mouseX = e.offsetX;
            const mouseY = e.offsetY;

            const xVal = this.toWorldX(mouseX);
            const yVal = this.toWorldY(mouseY);

            this.xMin = xVal + (this.xMin - xVal) * zoom;
            this.xMax = xVal + (this.xMax - xVal) * zoom;
            this.yMin = yVal + (this.yMin - yVal) * zoom;
            this.yMax = yVal + (this.yMax - yVal) * zoom;

            this.render();
        });
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const w = rect.width > 20 ? rect.width : (this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 600) || 600;
        const h = rect.height > 20 ? rect.height : (this.canvas.parentElement ? this.canvas.parentElement.clientHeight : 330) || 330;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.render();
    }

    setFunction(fn, fnStr) {
        this.func = fn;
        this.funcStr = fnStr || "";
        this.render();
    }

    setIntegral(a, b) {
        this.integralArea = { a: Math.min(a, b), b: Math.max(a, b) };
        this.render();
    }

    clearIntegral() {
        this.integralArea = null;
        this.render();
    }

    setTangent(x0) {
        this.tangentPoint = x0;
        this.render();
    }

    clearTangent() {
        this.tangentPoint = null;
        this.render();
    }

    resetView() {
        this.xMin = -5;
        this.xMax = 5;
        this.yMin = -4;
        this.yMax = 4;
        this.render();
    }

    toScreenX(x) {
        return ((x - this.xMin) / (this.xMax - this.xMin)) * this.canvas.width;
    }

    toScreenY(y) {
        return this.canvas.height - ((y - this.yMin) / (this.yMax - this.yMin)) * this.canvas.height;
    }

    toWorldX(px) {
        return this.xMin + (px / this.canvas.width) * (this.xMax - this.xMin);
    }

    toWorldY(py) {
        return this.yMin + ((this.canvas.height - py) / this.canvas.height) * (this.yMax - this.yMin);
    }

    render() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Draw Grid and Axes
        this.drawAxes();

        // Draw Integral Shaded Area
        if (this.func && this.integralArea) {
            this.drawIntegralArea();
        }

        // Draw Function Curve
        if (this.func) {
            this.drawCurve();
        }

        // Draw Tangent Line
        if (this.func && this.tangentPoint !== null) {
            this.drawTangentLine();
        }
    }

    drawAxes() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        const isDark = document.body && document.body.classList.contains('dark-theme');
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
        const labelColor = isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.55)';
        const axisColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;

        // Grid lines (step size approx 1)
        const stepX = this.calculateStep(this.xMax - this.xMin);
        const stepY = this.calculateStep(this.yMax - this.yMin);

        const startX = Math.floor(this.xMin / stepX) * stepX;
        for (let x = startX; x <= this.xMax; x += stepX) {
            const sx = this.toScreenX(x);
            ctx.beginPath();
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, h);
            ctx.stroke();

            // Label
            ctx.fillStyle = labelColor;
            ctx.font = '10px monospace';
            if (Math.abs(x) > 1e-6) {
                ctx.fillText(x.toFixed(stepX < 1 ? 2 : 0), sx + 4, this.toScreenY(0) - 4);
            }
        }

        const startY = Math.floor(this.yMin / stepY) * stepY;
        for (let y = startY; y <= this.yMax; y += stepY) {
            const sy = this.toScreenY(y);
            ctx.beginPath();
            ctx.moveTo(0, sy);
            ctx.lineTo(w, sy);
            ctx.stroke();

            if (Math.abs(y) > 1e-6) {
                ctx.fillStyle = labelColor;
                ctx.font = '10px monospace';
                ctx.fillText(y.toFixed(stepY < 1 ? 2 : 0), this.toScreenX(0) + 4, sy - 4);
            }
        }

        // Main Axes
        ctx.strokeStyle = axisColor;
        ctx.lineWidth = 1.5;

        // X Axis
        const y0 = this.toScreenY(0);
        ctx.beginPath();
        ctx.moveTo(0, y0);
        ctx.lineTo(w, y0);
        ctx.stroke();

        // Y Axis
        const x0 = this.toScreenX(0);
        ctx.beginPath();
        ctx.moveTo(x0, 0);
        ctx.lineTo(x0, h);
        ctx.stroke();
    }

    calculateStep(range) {
        const rough = range / 10;
        const power = Math.pow(10, Math.floor(Math.log10(rough)));
        const normalized = rough / power;
        if (normalized < 2) return power;
        if (normalized < 5) return 2 * power;
        return 5 * power;
    }

    drawCurve() {
        const ctx = this.ctx;
        const w = this.canvas.width;

        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(0, 242, 254, 0.6)';
        ctx.shadowBlur = 8;
        ctx.beginPath();

        let first = true;
        for (let px = 0; px <= w; px += 2) {
            const x = this.toWorldX(px);
            try {
                const y = this.func(x);
                if (isNaN(y) || !isFinite(y)) {
                    first = true;
                    continue;
                }
                const py = this.toScreenY(y);
                if (first) {
                    ctx.moveTo(px, py);
                    first = false;
                } else {
                    ctx.lineTo(px, py);
                }
            } catch (e) {
                first = true;
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawIntegralArea() {
        const ctx = this.ctx;
        const { a, b } = this.integralArea;
        const startPx = Math.max(0, this.toScreenX(a));
        const endPx = Math.min(this.canvas.width, this.toScreenX(b));
        const y0 = this.toScreenY(0);

        ctx.fillStyle = 'rgba(0, 223, 137, 0.25)';
        ctx.strokeStyle = 'rgba(0, 223, 137, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        ctx.moveTo(startPx, y0);
        for (let px = startPx; px <= endPx; px += 2) {
            const x = this.toWorldX(px);
            const y = this.func(x);
            if (!isNaN(y) && isFinite(y)) {
                ctx.lineTo(px, this.toScreenY(y));
            }
        }
        ctx.lineTo(endPx, y0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawTangentLine() {
        const ctx = this.ctx;
        const x0 = this.tangentPoint;
        const y0 = this.func(x0);
        if (isNaN(y0) || !isFinite(y0)) return;

        // Derivative using delta
        const h = 1e-5;
        const slope = (this.func(x0 + h) - this.func(x0 - h)) / (2 * h);

        const xLeft = this.xMin;
        const yLeft = y0 + slope * (xLeft - x0);
        const xRight = this.xMax;
        const yRight = y0 + slope * (xRight - x0);

        ctx.strokeStyle = '#ff3366';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.toScreenX(xLeft), this.toScreenY(yLeft));
        ctx.lineTo(this.toScreenX(xRight), this.toScreenY(yRight));
        ctx.stroke();

        // Point (x0, y0)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.toScreenX(x0), this.toScreenY(y0), 5, 0, 2 * Math.PI);
        ctx.fill();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FunctionGrapher;
}
