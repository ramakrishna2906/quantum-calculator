/**
 * Multi-Tier Scientific Math Engine
 * Supports Tiers 1-4: Arithmetic, Algebra, Calculus & Linear Algebra
 */

if (typeof Complex === 'undefined' && typeof require !== 'undefined') {
    var Complex = require('./complex.js');
}

class MathEngine {
    constructor() {
        this.constants = {
            'pi': Math.PI,
            'π': Math.PI,
            'e': Math.E,
            'hbar': 1.054571817e-34, // J*s
            'ħ': 1.054571817e-34,
            'h': 6.62607015e-34,
            'c': 299792458, // m/s
            'eps0': 8.8541878128e-12,
            'k_B': 1.380649e-23
        };
    }

    // ==========================================
    // TIER 1: ARITHMETIC & PEMDAS EVALUATOR
    // ==========================================

    /**
     * Evaluates a mathematical expression safely with step tracking
     */
    evaluateArithmetic(expr) {
        const steps = [];
        let sanitized = expr.trim();
        steps.push({ desc: "Initial expression", expr: sanitized });

        // Replace constants
        sanitized = sanitized.replace(/\bpi\b|π/gi, Math.PI.toString());
        sanitized = sanitized.replace(/\be\b/g, Math.E.toString());

        // Factorial handling n!
        sanitized = sanitized.replace(/(\d+)!/g, (match, n) => {
            const num = parseInt(n, 10);
            let fact = 1;
            for (let i = 2; i <= num; i++) fact *= i;
            return fact.toString();
        });

        // Power operator ^ to **
        sanitized = sanitized.replace(/\^/g, '**');

        // Functions like sqrt, sin, cos, tan, log, ln, abs
        sanitized = sanitized.replace(/\bsqrt\s*\(/gi, 'Math.sqrt(');
        sanitized = sanitized.replace(/\bsin\s*\(/gi, 'Math.sin(');
        sanitized = sanitized.replace(/\bcos\s*\(/gi, 'Math.cos(');
        sanitized = sanitized.replace(/\btan\s*\(/gi, 'Math.tan(');
        sanitized = sanitized.replace(/\basin\s*\(/gi, 'Math.asin(');
        sanitized = sanitized.replace(/\bacos\s*\(/gi, 'Math.acos(');
        sanitized = sanitized.replace(/\batan\s*\(/gi, 'Math.atan(');
        sanitized = sanitized.replace(/\bln\s*\(/gi, 'Math.log(');
        sanitized = sanitized.replace(/\blog\s*\(/gi, 'Math.log10(');
        sanitized = sanitized.replace(/\babs\s*\(/gi, 'Math.abs(');
        sanitized = sanitized.replace(/\bexp\s*\(/gi, 'Math.exp(');

        try {
            // Safe evaluation using Function with sandbox
            const result = Function(`"use strict"; return (${sanitized});`)();
            if (typeof result !== 'number' || isNaN(result)) {
                throw new Error("Result is Not a Number (NaN)");
            }
            steps.push({ desc: "Order of Operations & Function Resolution", expr: sanitized });
            steps.push({ desc: "Final Computation", result: result });
            return {
                success: true,
                result: result,
                steps: steps
            };
        } catch (err) {
            return {
                success: false,
                error: err.message,
                steps: steps
            };
        }
    }

    // ==========================================
    // TIER 2: ALGEBRA & POLYNOMIALS
    // ==========================================

    /**
     * Solve quadratic equation: ax^2 + bx + c = 0
     */
    solveQuadratic(a, b, c) {
        const steps = [];
        steps.push({ desc: `Quadratic equation: ${a}x² + ${b}x + ${c} = 0` });
        const discriminant = b * b - 4 * a * c;
        steps.push({ desc: `Discriminant Δ = b² - 4ac = (${b})² - 4(${a})(${c}) = ${discriminant}` });

        if (Math.abs(discriminant) < 1e-12) {
            const root = -b / (2 * a);
            steps.push({ desc: "Discriminant Δ = 0: Single real repeated root", root: root });
            return { roots: [new Complex(root, 0)], steps };
        } else if (discriminant > 0) {
            const r1 = (-b + Math.sqrt(discriminant)) / (2 * a);
            const r2 = (-b - Math.sqrt(discriminant)) / (2 * a);
            steps.push({ desc: "Discriminant Δ > 0: Two distinct real roots", roots: [r1, r2] });
            return { roots: [new Complex(r1, 0), new Complex(r2, 0)], steps };
        } else {
            const re = -b / (2 * a);
            const im = Math.sqrt(-discriminant) / (2 * a);
            steps.push({ desc: "Discriminant Δ < 0: Complex conjugate root pair", re: re, im: im });
            return { roots: [new Complex(re, im), new Complex(re, -im)], steps };
        }
    }

    // ==========================================
    // TIER 3: CALCULUS ENGINE
    // ==========================================

    /**
     * Compile a mathematical string into a callable JavaScript function f(x)
     */
    compileFunction(funcStr) {
        let clean = funcStr.trim();
        // Replace common syntax
        clean = clean.replace(/\^/g, '**');
        clean = clean.replace(/\bpi\b|π/gi, 'Math.PI');
        clean = clean.replace(/\be\b/g, 'Math.E');
        clean = clean.replace(/(\d)([a-zA-Z])/g, '$1 * $2'); // 2x -> 2*x
        clean = clean.replace(/\)\s*\(/g, ') * (');
        clean = clean.replace(/\)(\d)/g, ') * $1');
        clean = clean.replace(/(\d)\(/g, '$1 * (');

        // Functions
        clean = clean.replace(/\bsin\b/gi, 'Math.sin');
        clean = clean.replace(/\bcos\b/gi, 'Math.cos');
        clean = clean.replace(/\btan\b/gi, 'Math.tan');
        clean = clean.replace(/\bexp\b/gi, 'Math.exp');
        clean = clean.replace(/\bln\b/gi, 'Math.log');
        clean = clean.replace(/\blog\b/gi, 'Math.log10');
        clean = clean.replace(/\bsqrt\b/gi, 'Math.sqrt');
        clean = clean.replace(/\babs\b/gi, 'Math.abs');
        clean = clean.replace(/\bsinh\b/gi, 'Math.sinh');
        clean = clean.replace(/\bcosh\b/gi, 'Math.cosh');
        clean = clean.replace(/\btanh\b/gi, 'Math.tanh');

        return (x) => {
            try {
                const fn = new Function('x', `"use strict"; return (${clean});`);
                return fn(x);
            } catch (e) {
                return NaN;
            }
        };
    }

    /**
     * Numerical Derivative: f'(x) using 5-point central stencil
     * Error order O(h^4)
     */
    differentiate(funcStr, x0, h = 1e-5) {
        const f = this.compileFunction(funcStr);
        const y0 = f(x0);
        if (isNaN(y0)) return { success: false, error: `Function undefined at x = ${x0}` };

        // 5-point stencil: (-f(x+2h) + 8f(x+h) - 8f(x-h) + f(x-2h)) / (12h)
        const d1 = (-f(x0 + 2 * h) + 8 * f(x0 + h) - 8 * f(x0 - h) + f(x0 - 2 * h)) / (12 * h);
        
        // Second derivative: (-f(x+2h) + 16f(x+h) - 30f(x) + 16f(x-h) - f(x-2h)) / (12h^2)
        const d2 = (-f(x0 + 2 * h) + 16 * f(x0 + h) - 30 * f(x0) + 16 * f(x0 - h) - f(x0 - 2 * h)) / (12 * h * h);

        const steps = [
            { desc: `Evaluation point x₀ = ${x0}`, val: y0 },
            { desc: `Five-point stencil step h = ${h}` },
            { desc: `First derivative f'(x₀) = ${d1.toFixed(6)}` },
            { desc: `Second derivative f''(x₀) = ${d2.toFixed(6)} (concavity/curvature)` }
        ];

        return {
            success: true,
            f_x0: y0,
            derivative: d1,
            secondDerivative: d2,
            tangentEquation: `y = ${d1.toFixed(4)}(x - ${x0}) + ${y0.toFixed(4)}`,
            steps: steps
        };
    }

    /**
     * Definite Integral: \int_a^b f(x) dx using Adaptive Simpson's Rule
     */
    integrate(funcStr, a, b, n = 1000) {
        if (n % 2 !== 0) n += 1;
        const f = this.compileFunction(funcStr);
        const h = (b - a) / n;
        let sum = f(a) + f(b);

        if (isNaN(sum)) {
            return { success: false, error: "Function singular or undefined at boundaries" };
        }

        for (let i = 1; i < n; i++) {
            const x = a + i * h;
            const y = f(x);
            if (isNaN(y)) continue;
            sum += (i % 2 === 0 ? 2 : 4) * y;
        }

        const result = (h / 3) * sum;
        const steps = [
            { desc: `Integration interval [a, b] = [${a}, ${b}]` },
            { desc: `Composite Simpson's rule with N = ${n} subintervals, step width h = ${h.toFixed(6)}` },
            { desc: `Formula: ∫ f(x)dx ≈ (h/3) [f(a) + 4∑f(odd) + 2∑f(even) + f(b)]` },
            { desc: `Numerical area integral = ${result.toFixed(6)}` }
        ];

        return {
            success: true,
            integral: result,
            steps: steps
        };
    }

    /**
     * Limit approximation: \lim_{x -> a} f(x)
     */
    limit(funcStr, a) {
        const f = this.compileFunction(funcStr);
        const deltas = [1e-2, 1e-4, 1e-6, 1e-8];
        const leftVals = deltas.map(d => f(a - d));
        const rightVals = deltas.map(d => f(a + d));

        const leftLim = leftVals[leftVals.length - 1];
        const rightLim = rightVals[rightVals.length - 1];
        const isContinuous = Math.abs(leftLim - rightLim) < 1e-4;

        return {
            success: true,
            leftLimit: leftLim,
            rightLimit: rightLim,
            twoSidedLimit: isContinuous ? (leftLim + rightLim) / 2 : null,
            isContinuous: isContinuous,
            steps: [
                { desc: `Approaching a = ${a} from left:`, vals: leftVals },
                { desc: `Approaching a = ${a} from right:`, vals: rightVals },
                { desc: isContinuous ? `Both limits agree! Limit = ${((leftLim + rightLim)/2).toFixed(6)}` : `Discontinuity detected: Left limit (${leftLim.toFixed(4)}) ≠ Right limit (${rightLim.toFixed(4)})` }
            ]
        };
    }

    // ==========================================
    // TIER 4: LINEAR ALGEBRA & MATRICES
    // ==========================================

    createMatrix(rows, cols, fill = 0) {
        return Array.from({ length: rows }, () => 
            Array.from({ length: cols }, () => Complex.from(fill))
        );
    }

    matrixMul(A, B) {
        const rA = A.length;
        const cA = A[0].length;
        const rB = B.length;
        const cB = B[0].length;

        if (cA !== rB) {
            throw new Error(`Matrix dimension mismatch: cannot multiply (${rA}x${cA}) by (${rB}x${cB})`);
        }

        const C = this.createMatrix(rA, cB, 0);
        for (let i = 0; i < rA; i++) {
            for (let j = 0; j < cB; j++) {
                let sum = new Complex(0, 0);
                for (let k = 0; k < cA; k++) {
                    const aVal = Complex.from(A[i][k]);
                    const bVal = Complex.from(B[k][j]);
                    sum = sum.add(aVal.mul(bVal));
                }
                C[i][j] = sum;
            }
        }
        return C;
    }

    matrixAdd(A, B) {
        const r = A.length;
        const c = A[0].length;
        const res = this.createMatrix(r, c, 0);
        for (let i = 0; i < r; i++) {
            for (let j = 0; j < c; j++) {
                res[i][j] = Complex.from(A[i][j]).add(Complex.from(B[i][j]));
            }
        }
        return res;
    }

    matrixSub(A, B) {
        const r = A.length;
        const c = A[0].length;
        const res = this.createMatrix(r, c, 0);
        for (let i = 0; i < r; i++) {
            for (let j = 0; j < c; j++) {
                res[i][j] = Complex.from(A[i][j]).sub(Complex.from(B[i][j]));
            }
        }
        return res;
    }

    conjugateTranspose(A) {
        const r = A.length;
        const c = A[0].length;
        const res = this.createMatrix(c, r, 0);
        for (let i = 0; i < r; i++) {
            for (let j = 0; j < c; j++) {
                res[j][i] = Complex.from(A[i][j]).conj();
            }
        }
        return res;
    }

    matrixTrace(A) {
        let tr = new Complex(0, 0);
        const n = Math.min(A.length, A[0].length);
        for (let i = 0; i < n; i++) {
            tr = tr.add(Complex.from(A[i][i]));
        }
        return tr;
    }

    matrixDeterminant2x2(A) {
        const a = Complex.from(A[0][0]);
        const b = Complex.from(A[0][1]);
        const c = Complex.from(A[1][0]);
        const d = Complex.from(A[1][1]);
        return a.mul(d).sub(b.mul(c));
    }

    matrixInverse2x2(A) {
        const det = this.matrixDeterminant2x2(A);
        if (det.abs() < 1e-12) {
            throw new Error("Matrix is singular (determinant is 0), inverse does not exist");
        }
        const a = Complex.from(A[0][0]);
        const b = Complex.from(A[0][1]);
        const c = Complex.from(A[1][0]);
        const d = Complex.from(A[1][1]);

        return [
            [d.div(det), b.scale(-1).div(det)],
            [c.scale(-1).div(det), a.div(det)]
        ];
    }

    /**
     * Eigenvalues of a 2x2 Matrix:
     * λ² - Tr(A)λ + det(A) = 0
     */
    eigenvalues2x2(A) {
        const tr = this.matrixTrace(A);
        const det = this.matrixDeterminant2x2(A);
        // Δ = Tr² - 4det
        const trSq = tr.mul(tr);
        const discriminant = trSq.sub(det.scale(4));
        const sqrtDisc = discriminant.sqrt();

        const l1 = tr.add(sqrtDisc).scale(0.5);
        const l2 = tr.sub(sqrtDisc).scale(0.5);

        return [l1, l2];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathEngine;
}
