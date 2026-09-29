/**
 * Interactive 3D Bloch Sphere Visualizer
 * Renders qubit states on the unit sphere S^2 with quantum gate animations and measurement collapse.
 */

class BlochSphere {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        // Spherical coordinates: theta in [0, pi], phi in [0, 2*pi]
        this.theta = Math.PI / 3; // 60 deg
        this.phi = Math.PI / 4;   // 45 deg

        // Target coordinates for animated transitions
        this.targetTheta = this.theta;
        this.targetPhi = this.phi;

        // Camera rotation angles
        this.cameraRotX = 0.35;
        this.cameraRotY = 0.55;

        this.radius = 120;
        this.stateHistory = []; // Trajectory trail

        this.initEvents();
        this.resize();
        this.startLoop();
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

            this.cameraRotY += dx * 0.01;
            this.cameraRotX += dy * 0.01;
            // Clamp camera tilt
            this.cameraRotX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.cameraRotX));
        });

        window.addEventListener('mouseup', () => { isDragging = false; });
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const w = rect.width > 20 ? rect.width : (this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 600) || 600;
        const h = rect.height > 20 ? rect.height : (this.canvas.parentElement ? this.canvas.parentElement.clientHeight : 330) || 330;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.radius = Math.min(this.canvas.width, this.canvas.height) * 0.32;
    }

    setState(theta, phi) {
        this.targetTheta = Math.max(0, Math.min(Math.PI, theta));
        this.targetPhi = ((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    }

    /**
     * Apply quantum gate to the qubit state
     */
    applyGate(gateName, angle = Math.PI / 2) {
        // Convert current theta, phi to state vector [alpha, beta]
        let alpha = Math.cos(this.theta / 2);
        let beta = new Complex(
            Math.sin(this.theta / 2) * Math.cos(this.phi),
            Math.sin(this.theta / 2) * Math.sin(this.phi)
        );

        let newAlpha, newBeta;

        switch (gateName) {
            case 'X': // Bit flip
                newAlpha = beta;
                newBeta = new Complex(alpha, 0);
                break;
            case 'Y': // Bit + phase flip
                newAlpha = new Complex(beta.im, -beta.re);
                newBeta = new Complex(0, alpha);
                break;
            case 'Z': // Phase flip
                newAlpha = new Complex(alpha, 0);
                newBeta = beta.scale(-1);
                break;
            case 'H': // Hadamard
                const invSqrt2 = 1 / Math.SQRT2;
                newAlpha = new Complex(alpha, 0).add(beta).scale(invSqrt2);
                newBeta = new Complex(alpha, 0).sub(beta).scale(invSqrt2);
                break;
            case 'S': // Phase gate (e^(i*pi/2))
                newAlpha = new Complex(alpha, 0);
                newBeta = beta.mul(new Complex(0, 1));
                break;
            case 'T': // T gate (e^(i*pi/4))
                newAlpha = new Complex(alpha, 0);
                newBeta = beta.mul(new Complex(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4)));
                break;
            default:
                return;
        }

        // Extract global phase and convert back to theta, phi
        const globalPhase = newAlpha instanceof Complex ? newAlpha.arg() : 0;
        const normAlpha = newAlpha instanceof Complex ? newAlpha.abs() : Math.abs(newAlpha);
        
        let relBeta = (newBeta instanceof Complex ? newBeta : new Complex(newBeta, 0))
            .mul(new Complex(Math.cos(-globalPhase), Math.sin(-globalPhase)));

        const newTheta = 2 * Math.acos(Math.max(-1, Math.min(1, normAlpha)));
        const newPhi = relBeta.arg();

        this.setState(newTheta, newPhi);
    }

    /**
     * Simulate Pauli-Z projective measurement collapse
     */
    measure() {
        const prob0 = Math.pow(Math.cos(this.theta / 2), 2);
        const rand = Math.random();
        const outcome = rand < prob0 ? 0 : 1;

        if (outcome === 0) {
            this.setState(0, 0); // |0>
        } else {
            this.setState(Math.PI, 0); // |1>
        }

        return {
            outcome: outcome,
            prob0: prob0,
            prob1: 1 - prob0
        };
    }

    // 3D to 2D projection
    project(x, y, z) {
        // Rotate around Y axis
        const cosY = Math.cos(this.cameraRotY);
        const sinY = Math.sin(this.cameraRotY);
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;

        // Rotate around X axis
        const cosX = Math.cos(this.cameraRotX);
        const sinX = Math.sin(this.cameraRotX);
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        // Screen center
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        return {
            x: cx + x1,
            y: cy - y2,
            depth: z2
        };
    }

    startLoop() {
        const animate = () => {
            // Smooth interpolation
            this.theta += (this.targetTheta - this.theta) * 0.12;
            this.phi += (this.targetPhi - this.phi) * 0.12;

            // Record state trail
            const bx = this.radius * Math.sin(this.theta) * Math.cos(this.phi);
            const by = this.radius * Math.sin(this.theta) * Math.sin(this.phi);
            const bz = this.radius * Math.cos(this.theta);

            this.stateHistory.push({ x: bx, y: by, z: bz });
            if (this.stateHistory.length > 40) this.stateHistory.shift();

            this.render();
            requestAnimationFrame(animate);
        };
        animate();
    }

    render() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        const R = this.radius;

        const isDark = document.body && document.body.classList.contains('dark-theme');
        const equatorColor = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(30, 34, 41, 0.22)';
        const meridianColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(30, 34, 41, 0.1)';

        // 1. Draw Equator & Latitude rings
        this.drawCircle3D(0, 0, 0, R, 'xy', equatorColor); // Equator
        this.drawCircle3D(0, 0, 0, R, 'xz', meridianColor); // Meridian 1
        this.drawCircle3D(0, 0, 0, R, 'yz', meridianColor); // Meridian 2

        // 2. Coordinate Axes (X, Y, Z)
        this.drawAxis(0, 0, -R * 1.3, 0, 0, R * 1.3, '#7928ca', '|0⟩ (Z+)', '|1⟩ (Z-)');
        this.drawAxis(-R * 1.3, 0, 0, R * 1.3, 0, 0, '#00df89', '|-⟩ (X-)', '|+⟩ (X+)');
        this.drawAxis(0, -R * 1.3, 0, 0, R * 1.3, 0, '#00f2fe', '|-i⟩ (Y-)', '|i⟩ (Y+)');

        // 3. Trajectory trail
        if (this.stateHistory.length > 1) {
            ctx.beginPath();
            for (let i = 0; i < this.stateHistory.length; i++) {
                const pt = this.project(this.stateHistory[i].x, this.stateHistory[i].y, this.stateHistory[i].z);
                if (i === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            }
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // 4. Quantum State Vector (Bloch Vector)
        const bx = R * Math.sin(this.theta) * Math.cos(this.phi);
        const by = R * Math.sin(this.theta) * Math.sin(this.phi);
        const bz = R * Math.cos(this.theta);

        const center = this.project(0, 0, 0);
        const tip = this.project(bx, by, bz);

        // Vector line
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = 'rgba(0, 242, 254, 0.8)';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Glowing vector tip
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // 5. Projection lines to XY plane
        const base = this.project(bx, by, 0);
        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(base.x, base.y);
        ctx.lineTo(center.x, center.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawCircle3D(cx, cy, cz, r, plane, color) {
        const ctx = this.ctx;
        const steps = 60;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

        for (let i = 0; i <= steps; i++) {
            const angle = (i / steps) * 2 * Math.PI;
            let x = 0, y = 0, z = 0;
            if (plane === 'xy') {
                x = cx + r * Math.cos(angle);
                y = cy + r * Math.sin(angle);
                z = cz;
            } else if (plane === 'xz') {
                x = cx + r * Math.cos(angle);
                y = cy;
                z = cz + r * Math.sin(angle);
            } else if (plane === 'yz') {
                x = cx;
                y = cy + r * Math.cos(angle);
                z = cz + r * Math.sin(angle);
            }
            const p = this.project(x, y, z);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    }

    drawAxis(x1, y1, z1, x2, y2, z2, color, labelNeg, labelPos) {
        const ctx = this.ctx;
        const p1 = this.project(x1, y1, z1);
        const p2 = this.project(x2, y2, z2);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '11px sans-serif';
        if (labelPos) ctx.fillText(labelPos, p2.x + 4, p2.y - 4);
        if (labelNeg) ctx.fillText(labelNeg, p1.x + 4, p1.y + 12);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlochSphere;
}
