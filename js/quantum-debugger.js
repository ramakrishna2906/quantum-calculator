/**
 * Quantum Equation Diagnostic Debugger
 * Automatically detects physical, mathematical, and dimensional violations
 * in quantum states, operators, Hamiltonians, and equations.
 */

if (typeof Complex === 'undefined' && typeof require !== 'undefined') {
    var Complex = require('./complex.js');
}
if (typeof QuantumEngine === 'undefined' && typeof require !== 'undefined') {
    var QuantumEngine = require('./quantum-engine.js');
}

class QuantumDebugger {
    constructor(quantumEngine) {
        this.qe = quantumEngine || new QuantumEngine();
        this.math = this.qe.math;
    }

    /**
     * Comprehensive Diagnostic Suite on a Quantum State |psi>
     */
    debugState(amplitudes) {
        const ket = this.qe.createKet(amplitudes);
        const norm = this.qe.stateNorm(ket);
        const normSq = norm * norm;
        const isNormalized = Math.abs(norm - 1.0) < 1e-6;

        const probabilities = ket.map((c, idx) => ({
            basisIndex: idx,
            label: `|${idx}>`,
            amplitude: c,
            probability: c.absSq() / (normSq || 1),
            rawSquare: c.absSq()
        }));

        const diagnostics = [];
        let status = 'PASS';

        if (norm === 0) {
            status = 'CRITICAL_ERROR';
            diagnostics.push({
                level: 'error',
                code: 'NULL_STATE_VECTOR',
                title: 'Null State Vector (|ψ⟩ = 0)',
                message: 'All amplitudes are zero. In quantum mechanics, a physical state must be non-zero.',
                fix: 'Define non-zero probability amplitudes.'
            });
        } else if (!isNormalized) {
            status = 'FAIL';
            diagnostics.push({
                level: 'warning',
                code: 'UNNORMALIZED_STATE',
                title: 'State Vector Is Unnormalized (∑|cᵢ|² ≠ 1)',
                message: `Total state norm is |||ψ⟩|| = ${norm.toFixed(6)} (∑|cᵢ|² = ${normSq.toFixed(6)}). By the Born rule, the sum of measurement probabilities across all mutually orthogonal basis states must equal exactly 1.`,
                fix: `Multiply the state by the normalization constant 1/√N = ${(1 / norm).toFixed(6)}.`,
                autoFixAvailable: true,
                autoFixAction: () => this.qe.normalize(ket)
            });
        } else {
            diagnostics.push({
                level: 'success',
                code: 'STATE_NORMALIZED',
                title: 'Unitary State Normalization Satisfied',
                message: `Total norm |||ψ⟩|| = ${norm.toFixed(6)}. Conservation of probability is preserved.`
            });
        }

        return {
            status,
            norm,
            normSq,
            isNormalized,
            probabilities,
            diagnostics,
            ketString: this.qe.ketToString(ket)
        };
    }

    /**
     * Comprehensive Diagnostic on an Observable / Hamiltonian Operator H
     */
    debugOperator(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const diagnostics = [];
        let status = 'PASS';

        // 1. Square Matrix Check
        if (rows !== cols) {
            return {
                status: 'CRITICAL_ERROR',
                diagnostics: [{
                    level: 'error',
                    code: 'NON_SQUARE_OPERATOR',
                    title: 'Operator Matrix Must Be Square',
                    message: `Provided matrix has dimensions ${rows}x${cols}. Quantum operators on a Hilbert space of dimension N must be NxN square matrices.`,
                    fix: 'Ensure equal number of rows and columns.'
                }]
            };
        }

        // 2. Hermiticity Check (H = H†)
        const H_dagger = this.math.conjugateTranspose(matrix);
        let isHermitian = true;
        const nonHermitianCells = [];

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const diff = Complex.from(matrix[i][j]).sub(H_dagger[i][j]);
                if (diff.abs() > 1e-6) {
                    isHermitian = false;
                    nonHermitianCells.push({
                        row: i,
                        col: j,
                        val: Complex.from(matrix[i][j]),
                        conjugateTransposeVal: H_dagger[i][j],
                        diff: diff.abs()
                    });
                }
            }
        }

        if (!isHermitian) {
            status = 'FAIL';
            diagnostics.push({
                level: 'error',
                code: 'NON_HERMITIAN_OBSERVABLE',
                title: 'Observable Is Non-Hermitian (H ≠ H†)',
                message: `The operator violates Hermiticity at ${nonHermitianCells.length} matrix elements. In standard quantum mechanics, observables and Hamiltonians must be self-adjoint (Hermitian) to guarantee real energy eigenvalues and unitary time evolution e^(-iHt/ħ).`,
                details: nonHermitianCells.slice(0, 3),
                fix: 'Ensure diagonal elements are real and off-diagonal elements satisfy H[i][j] = (H[j][i])*'
            });
        } else {
            diagnostics.push({
                level: 'success',
                code: 'HERMITIAN_VERIFIED',
                title: 'Hermiticity Verified (H = H†)',
                message: 'All eigenvalues are guaranteed to be strictly real. Physical energy spectrum is valid.'
            });
        }

        // 3. Unitarity Check (U† U = I)
        const U_dagger_U = this.math.matrixMul(H_dagger, matrix);
        const isUnitary = this.qe.isIdentity(U_dagger_U);

        if (isUnitary) {
            diagnostics.push({
                level: 'success',
                code: 'UNITARY_VERIFIED',
                title: 'Unitarity Verified (U† U = I)',
                message: 'Operator preserves inner products and quantum state lengths. Valid as a quantum gate or time evolution operator.'
            });
        } else {
            diagnostics.push({
                level: 'info',
                code: 'NON_UNITARY',
                title: 'Operator Is Non-Unitary',
                message: 'This operator changes state vector length. Normal for Hamiltonians and projectors, but cannot serve directly as a closed-system quantum gate.'
            });
        }

        // 4. Trace & Eigenvalues (if 2x2)
        let eigenvalues = null;
        if (rows === 2) {
            try {
                eigenvalues = this.math.eigenvalues2x2(matrix);
            } catch (e) {
                // Ignore eigensolver error
            }
        }

        return {
            status,
            dimensions: `${rows}x${cols}`,
            isHermitian,
            isUnitary,
            nonHermitianCells,
            eigenvalues,
            trace: this.math.matrixTrace(matrix),
            diagnostics
        };
    }

    /**
     * Debugs Commutativity and Simultaneous Measurability
     */
    debugCommutator(A, B, nameA = "A", nameB = "B") {
        const comm = this.qe.commutator(A, B);
        const isZero = this.qe.isZeroMatrix(comm);

        const diagnostics = [];
        let status = isZero ? 'PASS' : 'WARNING';

        if (isZero) {
            diagnostics.push({
                level: 'success',
                code: 'COMPATIBLE_OBSERVABLES',
                title: `Commutator [${nameA}, ${nameB}] = 0 (Compatible Observables)`,
                message: `Operators ${nameA} and ${nameB} commute! They share a simultaneous eigenbasis and can be measured concurrently with zero quantum backaction.`
            });
        } else {
            diagnostics.push({
                level: 'warning',
                code: 'INCOMPATIBLE_OBSERVABLES',
                title: `Commutator [${nameA}, ${nameB}] ≠ 0 (Heisenberg Incompatibility)`,
                message: `These observables do not commute. Measuring ${nameA} unavoidably perturbs the outcome of measuring ${nameB}. The Robertson-Schrödinger uncertainty bound applies: σ_A σ_B ≥ (1/2)|⟨[${nameA}, ${nameB}]⟩|.`
            });
        }

        return {
            status,
            commutatorMatrix: comm,
            isZero,
            diagnostics
        };
    }

    /**
     * Linter for Quantum Equation Syntax & Common Errors
     */
    lintQuantumExpression(text) {
        const issues = [];
        let clean = text.trim();

        // Check for unbalanced bra-kets
        const openKets = (clean.match(/\|/g) || []).length;
        const closeKets = (clean.match(/>/g) || []).length;
        const openBras = (clean.match(/</g) || []).length;

        if (openBras !== (clean.match(/\|/g) || []).length && (clean.includes('<') && !clean.includes('|'))) {
            issues.push({
                line: 1,
                severity: 'error',
                message: 'Unbalanced Dirac Bra: missing vertical bar in bra ⟨ψ|'
            });
        }

        if (clean.includes('><')) {
            issues.push({
                line: 1,
                severity: 'info',
                message: 'Detected outer product operator form |ψ⟩⟨ϕ|'
            });
        }

        if (clean.includes('>>') || clean.includes('<<')) {
            issues.push({
                line: 1,
                severity: 'error',
                message: 'Syntax error: Double bracket >> or << detected. Use single |ψ⟩ notation.'
            });
        }

        return {
            valid: issues.filter(i => i.severity === 'error').length === 0,
            issues
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuantumDebugger;
}
