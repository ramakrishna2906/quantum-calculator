/**
 * Automated Verification Script for Math & Quantum Engines
 */

const Complex = require('./complex.js');
const MathEngine = require('./math-engine.js');
const QuantumEngine = require('./quantum-engine.js');
const QuantumDebugger = require('./quantum-debugger.js');

console.log("=== RUNNING MATHEMATICAL & QUANTUM ENGINE VERIFICATION ===");

const math = new MathEngine();
const qe = new QuantumEngine(math);
const qd = new QuantumDebugger(qe);

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`[PASS] ${message}`);
        passed++;
    } else {
        console.error(`[FAIL] ${message}`);
        failed++;
    }
}

// 1. Complex Numbers
const z1 = new Complex(3, 4);
assert(z1.abs() === 5, "Complex absolute value |3 + 4i| = 5");
const z2 = Complex.parse("1 - 2i");
assert(z2.re === 1 && z2.im === -2, "Complex string parsing '1 - 2i'");

// 2. Arithmetic & PEMDAS
const arith = math.evaluateArithmetic("3 + 4 * 2 / (1 - 5)^2 + sqrt(16)");
assert(arith.success && Math.abs(arith.result - 7.5) < 1e-6, "Tier 1: Arithmetic & PEMDAS evaluation");

// 3. Calculus: Derivative of x^3 at x = 2 (should be 3*x^2 = 12)
const diff = math.differentiate("x^3", 2);
assert(diff.success && Math.abs(diff.derivative - 12) < 1e-3, "Tier 3: Numerical derivative d/dx(x^3) at x=2");

// 4. Calculus: Integral of x^2 from 0 to 1 (should be 1/3 ~ 0.33333)
const integ = math.integrate("x^2", 0, 1);
assert(integ.success && Math.abs(integ.integral - (1/3)) < 1e-4, "Tier 3: Simpson's rule integral of x^2 on [0, 1]");

// 5. Linear Algebra: Pauli Matrices Commutator [sigma_x, sigma_y] = 2i * sigma_z
const commXY = qe.commutator(qe.sigmaX, qe.sigmaY);
const expected2iZ = [
    [new Complex(0, 2), new Complex(0, 0)],
    [new Complex(0, 0), new Complex(0, -2)]
];
const diffMat = math.matrixSub(commXY, expected2iZ);
assert(qe.isZeroMatrix(diffMat, 1e-5), "Tier 5: Pauli commutator [σ_x, σ_y] = 2i σ_z");

// 6. Quantum Debugger: Normalization test
const unnormalizedKet = qe.createKet([1, 2]); // norm = sqrt(1 + 4) = sqrt(5) ~ 2.236
const stateDebug = qd.debugState(unnormalizedKet);
assert(!stateDebug.isNormalized && stateDebug.status === 'FAIL', "Quantum Debugger flags unnormalized state");

const normRes = qe.normalize(unnormalizedKet);
const fixedStateDebug = qd.debugState(normRes.normalized);
assert(fixedStateDebug.isNormalized && fixedStateDebug.status === 'PASS', "Quantum Debugger verifies auto-normalized state");

// 7. Quantum Debugger: Hermiticity check
const nonHermitianH = [
    [new Complex(1, 0), new Complex(0, 1)],
    [new Complex(0, 1), new Complex(2, 0)] // H_10 is i, but H_01 is i (instead of -i)
];
const opDebug = qd.debugOperator(nonHermitianH);
assert(!opDebug.isHermitian && opDebug.status === 'FAIL', "Quantum Debugger flags non-Hermitian Hamiltonian");

const hermitianH = [
    [new Complex(1, 0), new Complex(0, -1)],
    [new Complex(0, 1), new Complex(2, 0)]
];
const validOpDebug = qd.debugOperator(hermitianH);
assert(validOpDebug.isHermitian && validOpDebug.status === 'PASS', "Quantum Debugger confirms Hermitian Hamiltonian");

// 8. Quantum Debugger: Unitarity check
const hadamardDebug = qd.debugOperator(qe.Hadamard);
assert(hadamardDebug.isUnitary, "Quantum Debugger confirms Hadamard gate unitarity U† U = I");

console.log(`\nVerification complete: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
