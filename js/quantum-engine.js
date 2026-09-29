/**
 * Quantum Mechanics Computation Engine
 * Handles Bra-Ket algebra, Quantum Operators, Commutators, Expectation Values,
 * Tensor Products, and Spectral Decomposition.
 */

if (typeof Complex === 'undefined' && typeof require !== 'undefined') {
    var Complex = require('./complex.js');
}
if (typeof MathEngine === 'undefined' && typeof require !== 'undefined') {
    var MathEngine = require('./math-engine.js');
}

class QuantumEngine {
    constructor(mathEngine) {
        this.math = mathEngine || new MathEngine();
        this.initStandardOperators();
    }

    initStandardOperators() {
        // Identity I
        this.I = [
            [new Complex(1, 0), new Complex(0, 0)],
            [new Complex(0, 0), new Complex(1, 0)]
        ];

        // Pauli X (Bit flip)
        this.sigmaX = [
            [new Complex(0, 0), new Complex(1, 0)],
            [new Complex(1, 0), new Complex(0, 0)]
        ];

        // Pauli Y (Bit + Phase flip)
        this.sigmaY = [
            [new Complex(0, 0), new Complex(0, -1)],
            [new Complex(0, 1), new Complex(0, 0)]
        ];

        // Pauli Z (Phase flip)
        this.sigmaZ = [
            [new Complex(1, 0), new Complex(0, 0)],
            [new Complex(0, 0), new Complex(-1, 0)]
        ];

        // Hadamard H = (1/√2) [ [1, 1], [1, -1] ]
        const invSqrt2 = 1 / Math.SQRT2;
        this.Hadamard = [
            [new Complex(invSqrt2, 0), new Complex(invSqrt2, 0)],
            [new Complex(invSqrt2, 0), new Complex(-invSqrt2, 0)]
        ];

        // Phase S = [ [1, 0], [0, i] ]
        this.S = [
            [new Complex(1, 0), new Complex(0, 0)],
            [new Complex(0, 0), new Complex(0, 1)]
        ];

        // T gate = [ [1, 0], [0, e^(i*pi/4)] ]
        this.T = [
            [new Complex(1, 0), new Complex(0, 0)],
            [new Complex(0, 0), new Complex(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4))]
        ];
    }

    /**
     * Create a Quantum State Ket vector |psi>
     * @param {Array<Complex|number|string>} amplitudes 
     */
    createKet(amplitudes) {
        return amplitudes.map(a => Complex.from(a));
    }

    /**
     * Calculate State Norm: sqrt(<psi|psi>)
     */
    stateNorm(ket) {
        let sumSq = 0;
        for (let i = 0; i < ket.length; i++) {
            sumSq += ket[i].absSq();
        }
        return Math.sqrt(sumSq);
    }

    /**
     * Normalize a state vector |psi> -> |psi> / sqrt(<psi|psi>)
     */
    normalize(ket) {
        const norm = this.stateNorm(ket);
        if (norm === 0) throw new Error("Cannot normalize null state vector (norm is 0)");
        return {
            normalized: ket.map(c => c.scale(1 / norm)),
            originalNorm: norm,
            normalizationFactor: 1 / norm
        };
    }

    /**
     * Inner product: <phi | psi>
     */
    innerProduct(braKetPhi, ketPsi) {
        if (braKetPhi.length !== ketPsi.length) {
            throw new Error(`Dimension mismatch in inner product: <phi| is dim ${braKetPhi.length}, |psi> is dim ${ketPsi.length}`);
        }
        let sum = new Complex(0, 0);
        for (let i = 0; i < braKetPhi.length; i++) {
            // <phi| has conjugate elements
            sum = sum.add(braKetPhi[i].conj().mul(ketPsi[i]));
        }
        return sum;
    }

    /**
     * Outer product: |psi><phi| (creates an operator matrix)
     */
    outerProduct(ketPsi, braPhi) {
        const rows = ketPsi.length;
        const cols = braPhi.length;
        const mat = this.math.createMatrix(rows, cols);
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                mat[i][j] = ketPsi[i].mul(braPhi[j].conj());
            }
        }
        return mat;
    }

    /**
     * Tensor Product (Kronecker product) for multi-qubit states or operators
     */
    tensorProduct(A, B) {
        // Detect if vector or matrix
        const isMatA = Array.isArray(A[0]);
        const isMatB = Array.isArray(B[0]);

        if (!isMatA && !isMatB) {
            // Vector tensor product |psi_A> (x) |psi_B>
            const res = [];
            for (let i = 0; i < A.length; i++) {
                for (let j = 0; j < B.length; j++) {
                    res.push(Complex.from(A[i]).mul(Complex.from(B[j])));
                }
            }
            return res;
        }

        // Matrix Kronecker product
        const rA = A.length, cA = A[0].length;
        const rB = B.length, cB = B[0].length;
        const res = this.math.createMatrix(rA * rB, cA * cB);

        for (let i = 0; i < rA; i++) {
            for (let j = 0; j < cA; j++) {
                for (let k = 0; k < rB; k++) {
                    for (let l = 0; l < cB; l++) {
                        res[i * rB + k][j * cB + l] = Complex.from(A[i][j]).mul(Complex.from(B[k][l]));
                    }
                }
            }
        }
        return res;
    }

    /**
     * Apply operator to ket: |psi'> = O |psi>
     */
    applyOperator(operator, ket) {
        const rows = operator.length;
        const cols = operator[0].length;
        if (cols !== ket.length) {
            throw new Error(`Operator dimension (${rows}x${cols}) cannot act on ket of dimension ${ket.length}`);
        }
        const res = [];
        for (let i = 0; i < rows; i++) {
            let sum = new Complex(0, 0);
            for (let j = 0; j < cols; j++) {
                sum = sum.add(Complex.from(operator[i][j]).mul(ket[j]));
            }
            res.push(sum);
        }
        return res;
    }

    /**
     * Quantum Commutator: [A, B] = AB - BA
     */
    commutator(A, B) {
        const AB = this.math.matrixMul(A, B);
        const BA = this.math.matrixMul(B, A);
        return this.math.matrixSub(AB, BA);
    }

    /**
     * Quantum Anti-Commutator: {A, B} = AB + BA
     */
    antiCommutator(A, B) {
        const AB = this.math.matrixMul(A, B);
        const BA = this.math.matrixMul(B, A);
        return this.math.matrixAdd(AB, BA);
    }

    /**
     * Expectation Value of an observable: <O> = <psi | O | psi>
     */
    expectationValue(operator, ket) {
        const norm = this.stateNorm(ket);
        const oPsi = this.applyOperator(operator, ket);
        const rawExpectation = this.innerProduct(ket, oPsi);
        // Normalize: <psi|O|psi> / <psi|psi>
        return rawExpectation.scale(1 / (norm * norm));
    }

    /**
     * Quantum Variance & Standard Deviation (Uncertainty)
     * (Delta O)^2 = <O^2> - <O>^2
     */
    quantumUncertainty(operator, ket) {
        const expVal = this.expectationValue(operator, ket);
        const opSq = this.math.matrixMul(operator, operator);
        const expSq = this.expectationValue(opSq, ket);

        // Var = <O^2> - <O>^2
        const expValSq = expVal.mul(expVal);
        const variance = expSq.sub(expValSq);
        
        const delta = Math.sqrt(Math.max(0, variance.re));
        return {
            expectationValue: expVal,
            expectationSq: expSq,
            variance: variance,
            delta: delta
        };
    }

    /**
     * Heisenberg Uncertainty Relation check for two observables A and B:
     * Delta A * Delta B >= (1/2) | <[A, B]> |
     */
    checkHeisenbergUncertainty(A, B, ket) {
        const uncA = this.quantumUncertainty(A, ket);
        const uncB = this.quantumUncertainty(B, ket);
        const comm = this.commutator(A, B);
        const expComm = this.expectationValue(comm, ket);
        const lowerBound = 0.5 * expComm.abs();
        const actualProduct = uncA.delta * uncB.delta;
        const satisfied = actualProduct >= lowerBound - 1e-9;

        return {
            deltaA: uncA.delta,
            deltaB: uncB.delta,
            actualProduct: actualProduct,
            commutatorExpectation: expComm,
            heisenbergLowerBound: lowerBound,
            satisfied: satisfied,
            compatible: this.isZeroMatrix(comm)
        };
    }

    /**
     * Checks if a matrix is effectively zero
     */
    isZeroMatrix(mat, tol = 1e-9) {
        for (let i = 0; i < mat.length; i++) {
            for (let j = 0; j < mat[i].length; j++) {
                if (Complex.from(mat[i][j]).abs() > tol) return false;
            }
        }
        return true;
    }

    /**
     * Checks if a matrix is Identity
     */
    isIdentity(mat, tol = 1e-9) {
        const n = mat.length;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const c = Complex.from(mat[i][j]);
                if (i === j) {
                    if (Math.abs(c.re - 1) > tol || Math.abs(c.im) > tol) return false;
                } else {
                    if (c.abs() > tol) return false;
                }
            }
        }
        return true;
    }

    /**
     * Formats state vector to Dirac bra-ket string
     * e.g., (0.7071)|0> + (0.7071)|1>
     */
    ketToString(ket, precision = 4) {
        const terms = [];
        for (let i = 0; i < ket.length; i++) {
            const amp = Complex.from(ket[i]);
            if (amp.abs() > 1e-6) {
                const basis = `|${i.toString(2).padStart(Math.ceil(Math.log2(ket.length) || 1), '0')}>`;
                terms.push(`(${amp.toString(precision)})${basis}`);
            }
        }
        return terms.length ? terms.join(" + ") : "|0>";
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuantumEngine;
}
