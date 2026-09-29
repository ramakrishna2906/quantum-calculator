/**
 * Complex Number Library for Scientific & Quantum Computation
 * Represents z = real + imag * i
 */
class Complex {
    constructor(real = 0, imag = 0) {
        this.re = Number(real) || 0;
        this.im = Number(imag) || 0;
    }

    static from(val, im = 0) {
        if (val instanceof Complex) return new Complex(val.re, val.im);
        if (typeof val === 'number') return new Complex(val, im);
        if (typeof val === 'string') return Complex.parse(val);
        return new Complex(0, 0);
    }

    static parse(str) {
        if (!str || typeof str !== 'string') return new Complex(0, 0);
        let s = str.replace(/\s+/g, '');
        if (s === 'i' || s === '+i') return new Complex(0, 1);
        if (s === '-i') return new Complex(0, -1);

        // Pattern for a + bi or a - bi
        const fullRegex = /^([+-]?(?:\d+(?:\.\d+)?(?:e[+-]?\d+)?|\.\d+))?([+-](?:\d+(?:\.\d+)?(?:e[+-]?\d+)?|\.\d+)?)i$/i;
        const match = s.match(fullRegex);
        if (match) {
            const rePart = match[1] !== undefined ? parseFloat(match[1]) : 0;
            let imStr = match[2];
            let imPart = 1;
            if (imStr === '+' || imStr === '') imPart = 1;
            else if (imStr === '-') imPart = -1;
            else imPart = parseFloat(imStr);
            return new Complex(rePart, imPart);
        }

        // Pure imaginary (e.g., 3i, -2.5i)
        const pureImRegex = /^([+-]?(?:\d+(?:\.\d+)?(?:e[+-]?\d+)?|\.\d+)?)i$/i;
        const imMatch = s.match(pureImRegex);
        if (imMatch) {
            let imStr = imMatch[1];
            if (imStr === '' || imStr === '+') return new Complex(0, 1);
            if (imStr === '-') return new Complex(0, -1);
            return new Complex(0, parseFloat(imStr));
        }

        // Pure real
        const reVal = parseFloat(s);
        return new Complex(isNaN(reVal) ? 0 : reVal, 0);
    }

    add(other) {
        const c = Complex.from(other);
        return new Complex(this.re + c.re, this.im + c.im);
    }

    sub(other) {
        const c = Complex.from(other);
        return new Complex(this.re - c.re, this.im - c.im);
    }

    mul(other) {
        const c = Complex.from(other);
        return new Complex(
            this.re * c.re - this.im * c.im,
            this.re * c.im + this.im * c.re
        );
    }

    div(other) {
        const c = Complex.from(other);
        const denom = c.re * c.re + c.im * c.im;
        if (denom === 0) {
            return new Complex(Infinity, Infinity);
        }
        return new Complex(
            (this.re * c.re + this.im * c.im) / denom,
            (this.im * c.re - this.re * c.im) / denom
        );
    }

    scale(scalar) {
        return new Complex(this.re * scalar, this.im * scalar);
    }

    conj() {
        return new Complex(this.re, -this.im);
    }

    abs() {
        return Math.hypot(this.re, this.im);
    }

    absSq() {
        return this.re * this.re + this.im * this.im;
    }

    arg() {
        return Math.atan2(this.im, this.re);
    }

    exp() {
        const r = Math.exp(this.re);
        return new Complex(r * Math.cos(this.im), r * Math.sin(this.im));
    }

    log() {
        return new Complex(Math.log(this.abs()), this.arg());
    }

    sqrt() {
        const r = Math.sqrt(this.abs());
        const theta = this.arg() / 2;
        return new Complex(r * Math.cos(theta), r * Math.sin(theta));
    }

    pow(n) {
        if (typeof n === 'number') {
            const r = Math.pow(this.abs(), n);
            const theta = this.arg() * n;
            return new Complex(r * Math.cos(theta), r * Math.sin(theta));
        }
        const c = Complex.from(n);
        // z^w = exp(w * ln(z))
        return this.log().mul(c).exp();
    }

    sin() {
        return new Complex(
            Math.sin(this.re) * Math.cosh(this.im),
            Math.cos(this.re) * Math.sinh(this.im)
        );
    }

    cos() {
        return new Complex(
            Math.cos(this.re) * Math.cosh(this.im),
            -Math.sin(this.re) * Math.sinh(this.im)
        );
    }

    isZero(tol = 1e-10) {
        return Math.abs(this.re) < tol && Math.abs(this.im) < tol;
    }

    isReal(tol = 1e-10) {
        return Math.abs(this.im) < tol;
    }

    toString(precision = 4) {
        const r = Math.abs(this.re) < 1e-12 ? 0 : parseFloat(this.re.toFixed(precision));
        const i = Math.abs(this.im) < 1e-12 ? 0 : parseFloat(this.im.toFixed(precision));

        if (i === 0) return `${r}`;
        if (r === 0) {
            if (i === 1) return 'i';
            if (i === -1) return '-i';
            return `${i}i`;
        }
        const sign = i > 0 ? '+' : '-';
        const absI = Math.abs(i);
        const iStr = absI === 1 ? 'i' : `${absI}i`;
        return `${r} ${sign} ${iStr}`;
    }

    toLatex(precision = 4) {
        return this.toString(precision);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Complex;
}
