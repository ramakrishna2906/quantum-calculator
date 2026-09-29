/**
 * QuantumCalc — Multi-Page Studio Controller
 * Coordinates:
 * - Tactile Level Slider & Segmented Navigation
 * - Horizontal Slide Viewport ("Changes page within pages")
 * - 5 Dedicated Level Studios (Arithmetic, Algebra/Trig, Calculus, Matrices, Quantum/Debug)
 * - Light/Dark Theme Engine with high contrast
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Core Engines & Visualizers
    const math = new MathEngine();
    const qe = new QuantumEngine(math);
    const qd = new QuantumDebugger(qe);

    const grapher = new FunctionGrapher('grapher-canvas');
    const bloch = new BlochSphere('bloch-canvas');
    const schrodinger = new SchrodingerSolver('schrodinger-canvas');

    // 2. State Variables
    let currentLevel = 1;
    const historyTape = [];
    let currentKet = null;

    // 3. Navigation & Slider DOM Elements
    const bodyEl = document.getElementById('app-body');
    const themeBtn = document.getElementById('theme-btn');
    const themeIcon = document.getElementById('theme-icon');
    const pagesSliderTrack = document.getElementById('pages-slider-track');
    const levelPills = document.querySelectorAll('.level-pill');

    // Level Titles & Presets Configuration
    const levelMeta = {
        1: {
            name: "ARITHMETIC",
            defaultExpr: "125 * 4 + sqrt(144)",
            presets: [
                { label: "125 × 4 + √144", expr: "125 * 4 + sqrt(144)" },
                { label: "3⁴ − 2! × 5", expr: "3^4 - 2! * 5" },
                { label: "(15 + 25) ÷ 2³", expr: "(15 + 25) / 2^3" },
                { label: "10! ÷ (5! × 5!)", expr: "10! / (5! * 5!)" },
                { label: "25 % 7 + abs(-18)", expr: "25 % 7 + abs(-18)" }
            ]
        },
        2: {
            name: "ALGEBRA & TRIG",
            defaultExpr: "sin(pi/4) + cos(pi/4)",
            presets: [
                { label: "sin(π/4) + cos(π/4)", expr: "sin(pi/4) + cos(pi/4)" },
                { label: "Complex: (3 + 4i) × (1 − 2i)", expr: "complex_mul:(3+4i)*(1-2i)" },
                { label: "Quadratic: x² − 5x + 6 = 0", expr: "quad:1,-5,6" },
                { label: "ln(e³) + log₁₀(1000)", expr: "ln(e^3) + log(1000)" },
                { label: "cos(π/3)² + sin(π/3)²", expr: "cos(pi/3)^2 + sin(pi/3)^2" }
            ]
        },
        3: {
            name: "CALCULUS",
            defaultExpr: "diff:x^3 - 4*x,2",
            presets: [
                { label: "d/dx(x³ − 4x) at x=2", expr: "diff:x^3 - 4*x,2" },
                { label: "∫ x² dx on [0, 2]", expr: "integ:x^2,0,2" },
                { label: "∫ sin(x) dx on [0, π]", expr: "integ:sin(x),0,pi" },
                { label: "lim (sin(x)/x) as x→0", expr: "lim:sin(x)/x,0" },
                { label: "d/dx(sin(x) · e⁻ˣ) at x=1", expr: "diff:sin(x)*exp(-x),1" }
            ]
        },
        4: {
            name: "MATRICES",
            defaultExpr: "mat_det:[[1, 2], [3, 4]]",
            presets: [
                { label: "det([[1, 2], [3, 4]])", expr: "mat_det:[[1, 2], [3, 4]]" },
                { label: "inv([[4, 7], [2, 6]])", expr: "mat_inv:[[4, 7], [2, 6]]" },
                { label: "Eigenvalues [[2, 1], [1, 2]]", expr: "mat_eigen:[[2, 1], [1, 2]]" },
                { label: "Trace [[5, -1], [3, 2]]", expr: "mat_tr:[[5, -1], [3, 2]]" },
                { label: "A × B Multiply", expr: "mat_mul:[[1, 2], [3, 4]]*[[2, 0], [1, 2]]" }
            ]
        },
        5: {
            name: "QUANTUM & DEBUG",
            defaultExpr: "q_debug_state:[1, 2]",
            presets: [
                { label: "⚡ DEBUG: Unnormalized |0⟩ + 2|1⟩", expr: "q_debug_state:[1, 2]" },
                { label: "⚡ DEBUG: Non-Hermitian Ĥ", expr: "q_debug_op:[[1, i], [i, 2]]" },
                { label: "Pauli Commutator [σ_x, σ_y]", expr: "q_comm:sigmaX,sigmaY" },
                { label: "Bell State (|00⟩ + |11⟩)/√2", expr: "q_bell" },
                { label: "Hadamard Gate Unitarity", expr: "q_debug_op:Hadamard" },
                { label: "Expectation ⟨+|σ_z|+⟩", expr: "q_exp:sigmaZ,[0.7071, 0.7071]" }
            ]
        }
    };

    // ==========================================
    // 4. THEME SWITCHING ENGINE (Light & Dark)
    // ==========================================
    let lastThemeToggle = 0;

    window.toggleThemeGlobal = function() {
        const now = Date.now();
        if (now - lastThemeToggle < 100) return; // Prevent double-triggering / rapid accidental click cancellation
        lastThemeToggle = now;

        const body = document.getElementById('app-body') || document.body;
        const root = document.documentElement;
        const isDark = (body && body.classList.contains('dark-theme')) || root.classList.contains('dark-theme');
        const newTheme = !isDark;

        try {
            localStorage.setItem('quantumcalc_theme', newTheme ? 'dark' : 'light');
        } catch(e) {}

        applyTheme(newTheme);
    };

    function applyTheme(isDark) {
        const body = document.getElementById('app-body') || document.body;
        const root = document.documentElement;
        const tIcon = document.getElementById('theme-icon');
        const tBtn = document.getElementById('theme-btn');

        if (isDark) {
            if (body) {
                body.classList.add('dark-theme');
                body.classList.remove('light-theme');
            }
            root.classList.add('dark-theme');
            root.classList.remove('light-theme');
            if (tIcon) tIcon.textContent = '☀️';
            document.querySelectorAll('.quick-theme-btn').forEach(b => b.textContent = '☀️');
            if (tBtn) {
                tBtn.title = "Switch to Light Mode";
                tBtn.setAttribute('aria-label', "Switch to Light Mode");
            }
        } else {
            if (body) {
                body.classList.remove('dark-theme');
                body.classList.add('light-theme');
            }
            root.classList.remove('dark-theme');
            root.classList.add('light-theme');
            if (tIcon) tIcon.textContent = '🌙';
            document.querySelectorAll('.quick-theme-btn').forEach(b => b.textContent = '🌙');
            if (tBtn) {
                tBtn.title = "Switch to Dark Mode";
                tBtn.setAttribute('aria-label', "Switch to Dark Mode");
            }
        }

        refreshCurrentPageCanvases();
    }

    function refreshCurrentPageCanvases() {
        try {
            if (typeof grapher !== 'undefined' && grapher && typeof grapher.render === 'function') {
                grapher.render();
            }
            if (typeof bloch !== 'undefined' && bloch && typeof bloch.render === 'function') {
                bloch.render();
            }
            if (typeof schrodinger !== 'undefined' && schrodinger && typeof schrodinger.render === 'function') {
                schrodinger.render();
            }
            if (typeof renderTrigUnitCircle === 'function') renderTrigUnitCircle();
            if (typeof renderQuadraticGraph === 'function') renderQuadraticGraph();
            if (typeof renderComplexPlane === 'function') renderComplexPlane();
            if (typeof renderRiemannSum === 'function') renderRiemannSum();
            if (typeof renderMatrixGrid === 'function') renderMatrixGrid();
        } catch(e) {
            console.warn('Canvas refresh warning on theme switch:', e);
        }
    }

    function initTheme() {
        let savedTheme = null;
        try {
            savedTheme = localStorage.getItem('quantumcalc_theme');
        } catch(e) {}
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
        applyTheme(isDark);

        if (themeBtn) {
            themeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.toggleThemeGlobal();
            });
        }
        document.querySelectorAll('.quick-theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.toggleThemeGlobal();
            });
        });
    }

    // Initialize Theme immediately
    initTheme();

    // ==========================================
    // 5. SLIDER & PAGE SWITCHING CONTROLLER
    // ==========================================
    function goToLevel(lvl) {
        const target = Math.max(1, Math.min(5, parseInt(lvl, 10) || 1));
        currentLevel = target;

        // 1. Physically slide the pages viewport track ("Changes page within pages")
        if (pagesSliderTrack) {
            const shiftPercent = (currentLevel - 1) * 20; // each page is 20% of 500%
            pagesSliderTrack.style.transform = `translateX(-${shiftPercent}%)`;
        }





        // 4. Highlight navigation pills
        levelPills.forEach(pill => {
            const pLevel = parseInt(pill.getAttribute('data-level'), 10);
            pill.classList.toggle('active', pLevel === currentLevel);
        });

        // 5. Update URL hash cleanly without page reload
        history.replaceState(null, '', `#/l${currentLevel}`);

        // 7. Refresh canvases for the target slide
        refreshCurrentPageCanvases();
    }

    function refreshCurrentPageCanvases() {
        setTimeout(() => {
            if (currentLevel === 1) {
                updateBaseInspector(lastResults[1] || '512');
                renderPemdasTree(inputs[1] || levelMeta[1].defaultExpr);
            } else if (currentLevel === 2) {
                renderUnitCircle();
                renderQuadraticParabola();
                renderArgandPlane();
            } else if (currentLevel === 3) {
                grapher.resize();
                grapher.render();
                renderRiemannCanvas();
            } else if (currentLevel === 4) {
                renderTransformationCanvas();
                renderEigenCanvas();
                evaluateMatrixWorkbench();
            } else if (currentLevel === 5) {
                bloch.resize();
                bloch.render();
                schrodinger.resize();
            }
        }, 100);
    }





    // Connect level pills
    levelPills.forEach(pill => {
        pill.addEventListener('click', () => {
            goToLevel(pill.getAttribute('data-level'));
        });
    });



    // Keyboard Arrow navigation (when not typing)
    window.addEventListener('keydown', (e) => {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
            return;
        }
        if (e.key === 'ArrowLeft') {
            goToLevel(currentLevel - 1);
        } else if (e.key === 'ArrowRight') {
            goToLevel(currentLevel + 1);
        }
    });

    // Hash listener
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#/l', '').trim();
        const parsed = parseInt(hash, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 5 && parsed !== currentLevel) {
            goToLevel(parsed);
        }
    });

    // Sub-tab switching inside right deck on each slide
    document.querySelectorAll('.studio-page-slide').forEach(slide => {
        const tabs = slide.querySelectorAll('.deck-tab-btn');
        const views = slide.querySelectorAll('.deck-view');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const viewTarget = tab.getAttribute('data-view');
                tabs.forEach(t => t.classList.toggle('active', t === tab));
                views.forEach(v => v.classList.toggle('active', v.id === `view-${viewTarget}`));

                setTimeout(() => {
                    if (viewTarget === 'l2-circle') renderUnitCircle();
                    else if (viewTarget === 'l2-quad') renderQuadraticParabola();
                    else if (viewTarget === 'l2-complex') renderArgandPlane();
                    else if (viewTarget === 'l3-grapher') { grapher.resize(); grapher.render(); }
                    else if (viewTarget === 'l3-riemann') renderRiemannCanvas();
                    else if (viewTarget === 'l4-transform') renderTransformationCanvas();
                    else if (viewTarget === 'l4-eigen') renderEigenCanvas();
                    else if (viewTarget === 'l5-bloch') { bloch.resize(); bloch.render(); }
                    else if (viewTarget === 'l5-wave') { schrodinger.resize(); }
                }, 40);
            });
        });
    });

    // ==========================================
    // 6. CALCULATOR DEVICES PER SLIDE
    // ==========================================
    const inputs = {
        1: levelMeta[1].defaultExpr,
        2: levelMeta[2].defaultExpr,
        3: levelMeta[3].defaultExpr,
        4: levelMeta[4].defaultExpr,
        5: levelMeta[5].defaultExpr
    };

    const lastResults = {
        1: "512",
        2: "1.4142",
        3: "8.000000",
        4: "-2",
        5: "UNNORMALIZED"
    };

    function renderKatex(mathStr, container) {
        if (!container) return;
        let mathTeX = mathStr ? mathStr.trim() : '0';
        if (!mathTeX) mathTeX = '0';

        mathTeX = mathTeX.replace(/\*/g, ' \\times ');
        mathTeX = mathTeX.replace(/\//g, ' \\div ');
        mathTeX = mathTeX.replace(/\bpi\b/g, '\\pi');
        mathTeX = mathTeX.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
        mathTeX = mathTeX.replace(/\^(\d+)/g, '^{$1}');
        mathTeX = mathTeX.replace(/\|0>/g, '|0\\rangle');
        mathTeX = mathTeX.replace(/\|1>/g, '|1\\rangle');

        if (typeof katex !== 'undefined') {
            try {
                katex.render(mathTeX, container, { throwOnError: false, displayMode: false });
            } catch (e) {
                container.textContent = mathStr || '0';
            }
        } else {
            container.textContent = mathStr || '0';
        }
    }

    function updateSlideDisplay(lvl, resultVal) {
        const slide = document.getElementById(`slide-l${lvl}`);
        if (!slide) return;

        const inputEl = slide.querySelector('.page-input');
        const resEl = slide.querySelector('.page-result');
        const katexEl = slide.querySelector('.page-katex');

        if (inputEl) inputEl.value = inputs[lvl];
        if (resultVal !== undefined && resEl) {
            resEl.textContent = resultVal;
            lastResults[lvl] = String(resultVal);
            if (resultVal !== 'Error') {
                addToHistory(inputs[lvl], resultVal);
            }
        }

        renderKatex(inputs[lvl], katexEl);

        if (lvl === 1) {
            updateBaseInspector(lastResults[1]);
            renderPemdasTree(inputs[1]);
        }
    }

    // Wire up device inputs & keypads for each slide (1 to 5)
    [1, 2, 3, 4, 5].forEach(lvl => {
        const slide = document.getElementById(`slide-l${lvl}`);
        if (!slide) return;

        const inputEl = slide.querySelector('.page-input');
        const evalBtn = slide.querySelector('.page-eval-btn');

        // Presets
        const presetsContainer = slide.querySelector('.page-presets');
        if (presetsContainer) {
            levelMeta[lvl].presets.forEach(p => {
                const chip = document.createElement('button');
                chip.className = 'preset-chip-neo';
                chip.textContent = p.label;
                chip.addEventListener('click', () => {
                    inputs[lvl] = p.expr;
                    updateSlideDisplay(lvl);
                    evaluateExpression(p.expr, lvl);
                });
                presetsContainer.appendChild(chip);
            });
        }

        // Direct input typing
        inputEl?.addEventListener('input', () => {
            inputs[lvl] = inputEl.value;
            renderKatex(inputs[lvl], slide.querySelector('.page-katex'));
            if (lvl === 1) renderPemdasTree(inputs[1]);
        });

        inputEl?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                evaluateExpression(inputs[lvl], lvl);
            }
        });

        evalBtn?.addEventListener('click', () => {
            evaluateExpression(inputs[lvl], lvl);
        });

        // Keypad insert keys
        slide.querySelectorAll('.neo-key[data-insert]').forEach(btn => {
            btn.addEventListener('click', () => {
                const ins = btn.getAttribute('data-insert');
                inputs[lvl] = (inputs[lvl] || "") + ins;
                updateSlideDisplay(lvl);
                if (inputEl) inputEl.focus();
            });
        });

        slide.querySelector('.page-key-c')?.addEventListener('click', () => {
            inputs[lvl] = "";
            updateSlideDisplay(lvl, "0");
        });

        slide.querySelector('.page-key-ce')?.addEventListener('click', () => {
            inputs[lvl] = "";
            updateSlideDisplay(lvl, "0");
        });

        slide.querySelector('.page-key-back')?.addEventListener('click', () => {
            if (inputs[lvl].length > 0) {
                inputs[lvl] = inputs[lvl].slice(0, -1);
                updateSlideDisplay(lvl);
            }
        });

        slide.querySelector('.page-key-equals')?.addEventListener('click', () => {
            evaluateExpression(inputs[lvl], lvl);
        });

        // Copy Derivation
        slide.querySelector(`[data-copy-deriv="${lvl}"]`)?.addEventListener('click', () => {
            const list = slide.querySelector('.page-deriv-list');
            if (list) {
                navigator.clipboard.writeText(list.innerText).then(() => alert(`Page ${lvl} derivation copied!`));
            }
        });
    });

    // ==========================================
    // 7. EVALUATION ENGINE & DERIVATION
    // ==========================================
    function evaluateExpression(exprStr, lvl) {
        if (!exprStr || !exprStr.trim()) return;
        const expr = exprStr.trim();
        const slide = document.getElementById(`slide-l${lvl}`);
        const derivList = slide?.querySelector('.page-deriv-list');

        function renderSteps(steps) {
            if (!derivList) return;
            derivList.innerHTML = '';
            steps.forEach((step, idx) => {
                const item = document.createElement('div');
                item.className = 'derivation-item';
                item.innerHTML = `
                    <span class="step-badge">${idx + 1}</span>
                    <div class="step-text">
                        <strong>${escapeHtml(step.desc || '')}:</strong> 
                        ${escapeHtml(step.msg || step.expr || (step.result !== undefined ? String(step.result) : ''))}
                    </div>
                `;
                derivList.appendChild(item);
            });
        }

        // Quantum State Debug
        if (expr.startsWith('q_debug_state:')) {
            const raw = expr.replace('q_debug_state:', '').trim();
            runStateDiagnostics(raw, lvl, renderSteps);
            return;
        }

        // Quantum Operator Debug
        if (expr.startsWith('q_debug_op:')) {
            const raw = expr.replace('q_debug_op:', '').trim();
            runOperatorDiagnostics(raw, lvl, renderSteps);
            return;
        }

        // Pauli Commutator
        if (expr.startsWith('q_comm:')) {
            const parts = expr.replace('q_comm:', '').split(',');
            runCommutatorDiagnostics(parts[0]?.trim(), parts[1]?.trim(), lvl, renderSteps);
            return;
        }

        // Bell state
        if (expr === 'q_bell') {
            runBellStateDemo(lvl, renderSteps);
            return;
        }

        // Quadratic Solver
        if (expr.startsWith('quad:')) {
            const parts = expr.replace('quad:', '').split(',').map(Number);
            const res = math.solveQuadratic(parts[0], parts[1], parts[2]);
            renderSteps(res.steps);
            updateSlideDisplay(lvl, res.roots.map(r => r.toString()).join(', '));
            return;
        }

        // Calculus Derivative
        if (expr.startsWith('diff:')) {
            const parts = expr.replace('diff:', '').split(',');
            const res = math.differentiate(parts[0], parseFloat(parts[1]));
            if (res.success) {
                renderSteps(res.steps);
                updateSlideDisplay(lvl, res.derivative.toFixed(6));
                grapher.setFunction(parts[0]);
                grapher.setTangent(parseFloat(parts[1]));
            } else {
                updateSlideDisplay(lvl, 'Error');
            }
            return;
        }

        // Calculus Integral
        if (expr.startsWith('integ:')) {
            const parts = expr.replace('integ:', '').split(',');
            const res = math.integrate(parts[0], parseFloat(parts[1]), parseFloat(parts[2]));
            if (res.success) {
                renderSteps(res.steps);
                updateSlideDisplay(lvl, res.integral.toFixed(6));
                grapher.setFunction(parts[0]);
                grapher.setIntegral(parseFloat(parts[1]), parseFloat(parts[2]));
            } else {
                updateSlideDisplay(lvl, 'Error');
            }
            return;
        }

        // Calculus Limit
        if (expr.startsWith('lim:')) {
            const parts = expr.replace('lim:', '').split(',');
            const res = math.limit(parts[0], parseFloat(parts[1]));
            if (res.success) {
                renderSteps(res.steps);
                updateSlideDisplay(lvl, res.twoSidedLimit !== null ? res.twoSidedLimit.toFixed(6) : "DNE");
            } else {
                updateSlideDisplay(lvl, 'Error');
            }
            return;
        }

        // Matrix Determinant
        if (expr.startsWith('mat_det:')) {
            const raw = expr.replace('mat_det:', '').trim();
            try {
                const arr = JSON.parse(raw);
                const res = math.determinant(arr);
                renderSteps(res.steps);
                updateSlideDisplay(lvl, res.det.toString());
            } catch (e) {
                updateSlideDisplay(lvl, 'Error');
            }
            return;
        }

        // Standard Arithmetic Evaluation
        const evalRes = math.evaluateArithmetic(expr);
        if (evalRes.success) {
            renderSteps(evalRes.steps);
            updateSlideDisplay(lvl, evalRes.result);
        } else {
            renderSteps([{ desc: "Syntax Error", error: evalRes.error }]);
            updateSlideDisplay(lvl, 'Error');
        }
    }

    function runStateDiagnostics(rawVectorStr, lvl, renderSteps) {
        try {
            let vecArr;
            if (rawVectorStr.startsWith('[')) {
                vecArr = JSON.parse(rawVectorStr).map(v => Complex.from(v));
            } else {
                vecArr = [new Complex(1, 0), new Complex(2, 0)];
            }
            currentKet = vecArr;

            const diag = qd.diagnoseState(vecArr);
            renderDiagnosticBadges(diag);

            if (diag.passed) {
                bloch.setStateFromAlphaBeta(vecArr[0], vecArr[1]);
            }

            renderSteps(diag.advice.map((a, i) => ({ desc: `Audit ${i + 1}`, msg: a })));
            updateSlideDisplay(lvl, diag.passed ? "VALID |ψ⟩" : "UNNORMALIZED");
        } catch (e) {
            updateSlideDisplay(lvl, 'Error');
        }
    }

    function runOperatorDiagnostics(opNameOrMatrix, lvl, renderSteps) {
        let op;
        if (opNameOrMatrix.toLowerCase() === 'hadamard') op = qe.hadamard();
        else if (opNameOrMatrix.startsWith('[')) op = JSON.parse(opNameOrMatrix).map(r => r.map(v => Complex.from(v)));
        else op = qe.sigmaZ();

        const diag = qd.diagnoseOperator(op);
        renderDiagnosticBadges(diag);
        renderSteps(diag.advice.map((a, i) => ({ desc: `Operator Audit ${i + 1}`, msg: a })));
        updateSlideDisplay(lvl, diag.isHermitian && diag.isUnitary ? "VALID OPERATOR" : "ANOMALY");
    }

    function runCommutatorDiagnostics(opA, opB, lvl, renderSteps) {
        const A = opA === 'sigmaX' ? qe.sigmaX() : qe.sigmaZ();
        const B = opB === 'sigmaY' ? qe.sigmaY() : qe.sigmaX();
        const diag = qd.diagnoseCommutator(A, B);
        renderDiagnosticBadges(diag);
        renderSteps(diag.advice.map((a, i) => ({ desc: `Commutation Step ${i + 1}`, msg: a })));
        updateSlideDisplay(lvl, diag.commutes ? "[A,B] = 0" : "[A,B] ≠ 0");
    }

    function runBellStateDemo(lvl, renderSteps) {
        const bell = qe.bellState();
        currentKet = bell;
        const diag = qd.diagnoseState(bell);
        renderDiagnosticBadges(diag);
        renderSteps([
            { desc: "Bell Maximally Entangled State", msg: "(|00⟩ + |11⟩) / √2" },
            { desc: "EPR Paradox Verified" }
        ]);
        updateSlideDisplay(lvl, "BELL ENTANGLED");
    }

    function renderDiagnosticBadges(diag) {
        const masterDebugBadge = document.getElementById('master-debug-badge');
        const badgeNorm = document.getElementById('badge-norm');
        const msgNorm = document.getElementById('msg-norm');
        const btnAutofix = document.getElementById('btn-autofix-norm');
        const badgeHerm = document.getElementById('badge-herm');
        const msgHerm = document.getElementById('msg-herm');
        const badgeUnit = document.getElementById('badge-unit');
        const msgUnit = document.getElementById('msg-unit');
        const diagDetailsList = document.getElementById('diag-details-list');

        if (masterDebugBadge) {
            masterDebugBadge.textContent = diag.passed ? "ALL CHECKS PASS" : "ANOMALIES DETECTED";
            masterDebugBadge.className = `status-badge-neo ${diag.passed ? 'pass' : 'fail'}`;
        }
        if (badgeNorm && msgNorm) {
            badgeNorm.textContent = diag.isNormalized ? "PASS" : "FAIL";
            badgeNorm.className = `diag-badge-pill ${diag.isNormalized ? 'pass' : 'fail'}`;
            msgNorm.textContent = diag.isNormalized ? "Total norm |||ψ⟩|| = 1.0000. Probabilities sum to 1." : "State vector is unnormalized.";
        }
        if (btnAutofix) {
            btnAutofix.style.display = diag.isNormalized === false ? 'inline-block' : 'none';
        }
        if (badgeHerm && msgHerm) {
            badgeHerm.textContent = diag.isHermitian ? "PASS" : "FAIL";
            badgeHerm.className = `diag-badge-pill ${diag.isHermitian ? 'pass' : 'fail'}`;
        }
        if (badgeUnit && msgUnit) {
            badgeUnit.textContent = diag.isUnitary ? "PASS" : "FAIL";
            badgeUnit.className = `diag-badge-pill ${diag.isUnitary ? 'pass' : 'fail'}`;
        }
        if (diagDetailsList && diag.advice) {
            diagDetailsList.innerHTML = diag.advice.map(msg => `<div class="log-entry">${escapeHtml(msg)}</div>`).join('');
        }
    }

    // ==========================================
    // 8. TAPE LEDGER & AUDIT (L1)
    // ==========================================
    function escapeHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function addToHistory(expr, result) {
        if (!expr || result === 'Error') return;
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        historyTape.unshift({ expr, result, time: timeStr });
        if (historyTape.length > 60) historyTape.pop();
        renderLedgerTable();
    }

    function renderLedgerTable() {
        const tbody = document.getElementById('l1-ledger-tbody');
        const countEl = document.getElementById('l1-stat-count');
        const sumEl = document.getElementById('l1-stat-sum');
        const avgEl = document.getElementById('l1-stat-avg');

        if (countEl) countEl.textContent = historyTape.length;

        let totalSum = 0, numCount = 0;
        historyTape.forEach(item => {
            const num = parseFloat(item.result);
            if (!isNaN(num)) { totalSum += num; numCount++; }
        });

        if (sumEl) sumEl.textContent = totalSum.toFixed(2);
        if (avgEl) avgEl.textContent = numCount > 0 ? (totalSum / numCount).toFixed(2) : '0';

        if (!tbody) return;
        if (historyTape.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; opacity:0.6; padding:1rem;">No calculations recorded yet.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        historyTape.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-family:var(--font-mono); font-size:0.75rem;">${item.time}</td>
                <td style="font-family:var(--font-mono);">${escapeHtml(item.expr)}</td>
                <td style="font-weight:800; color:var(--key-coral);">${escapeHtml(String(item.result))}</td>
                <td><button class="action-sm-btn">Load</button></td>
            `;
            tr.querySelector('button')?.addEventListener('click', () => {
                inputs[1] = item.expr;
                updateSlideDisplay(1, item.result);
            });
            tbody.appendChild(tr);
        });
    }

    document.getElementById('btn-copy-ledger')?.addEventListener('click', () => {
        if (historyTape.length === 0) return alert('Ledger is empty.');
        const text = historyTape.map(i => `[${i.time}] ${i.expr} = ${i.result}`).join('\n');
        navigator.clipboard.writeText(text).then(() => alert('Tape Ledger copied!'));
    });

    document.getElementById('btn-clear-ledger')?.addEventListener('click', () => {
        historyTape.length = 0;
        renderLedgerTable();
    });

    // ==========================================
    // 9. PEMDAS TREE & NUMBER BASE (L1)
    // ==========================================
    function renderPemdasTree(exprStr) {
        const container = document.getElementById('pemdas-tree-container');
        if (!container) return;

        let clean = (exprStr || "").trim();
        if (!clean) clean = "125 * 4 + sqrt(144)";

        const steps = [];
        if (clean.includes('(')) steps.push({ type: 'p', label: 'Parentheses Grouping', detail: 'Evaluates inner sub-expressions first' });
        if (clean.includes('^') || clean.includes('sqrt') || clean.includes('!')) steps.push({ type: 'e', label: 'Exponents & Roots', detail: 'xʸ powers, square roots, and factorials n!' });
        if (clean.includes('*') || clean.includes('/') || clean.includes('%')) steps.push({ type: 'md', label: 'Multiplication & Division', detail: 'Calculated left-to-right with equal precedence' });
        if (clean.includes('+') || clean.includes('-')) steps.push({ type: 'as', label: 'Addition & Subtraction', detail: 'Final additive combination left-to-right' });

        if (steps.length === 0) steps.push({ type: 'as', label: 'Atomic Literal Value', detail: clean });

        container.innerHTML = '';
        steps.forEach((step, idx) => {
            const row = document.createElement('div');
            row.className = 'tree-level-row';
            row.innerHTML = `
                <div class="tree-step-pill">STEP ${idx + 1}</div>
                <div class="tree-step-card">
                    <div><strong>${step.label}</strong><div style="font-size:0.75rem; opacity:0.75; margin-top:0.2rem;">${step.detail}</div></div>
                    <span class="legend-badge ${step.type}">${step.type.toUpperCase()}</span>
                </div>
            `;
            container.appendChild(row);
        });
    }

    function updateBaseInspector(valStr) {
        const decEl = document.getElementById('l1-base-dec');
        const hexEl = document.getElementById('l1-base-hex');
        const binEl = document.getElementById('l1-base-bin');
        const octEl = document.getElementById('l1-base-oct');
        const primeBadge = document.getElementById('l1-prime-badge');
        const factorsEl = document.getElementById('l1-factors-content');

        const num = Math.floor(Math.abs(parseFloat(valStr)));
        if (isNaN(num)) return;

        if (decEl) decEl.textContent = num.toString(10);
        if (hexEl) hexEl.textContent = '0x' + num.toString(16).toUpperCase();
        if (binEl) binEl.textContent = '0b' + num.toString(2);
        if (octEl) octEl.textContent = '0o' + num.toString(8);

        const isPrime = checkPrime(num);
        if (primeBadge) {
            primeBadge.textContent = isPrime ? 'PRIME NUMBER' : (num <= 1 ? 'UNIT / ZERO' : 'COMPOSITE NUMBER');
            primeBadge.className = `status-badge-neo ${isPrime ? 'pass' : 'info'}`;
        }

        if (factorsEl) {
            const factors = getPrimeFactors(num);
            if (factors.length === 0) {
                factorsEl.textContent = `${num} has no prime factors.`;
            } else {
                const grouped = {};
                factors.forEach(f => { grouped[f] = (grouped[f] || 0) + 1; });
                const factorExpr = Object.entries(grouped).map(([p, e]) => e > 1 ? `${p}^${e}` : p).join(' × ');
                factorsEl.innerHTML = `<strong>${num}</strong> = ${factorExpr} &nbsp;•&nbsp; Prime factors: ${factors.length}`;
            }
        }
    }

    function checkPrime(n) {
        if (n <= 1) return false;
        if (n <= 3) return true;
        if (n % 2 === 0 || n % 3 === 0) return false;
        for (let i = 5; i * i <= n; i += 6) {
            if (n % i === 0 || n % (i + 2) === 0) return false;
        }
        return true;
    }

    function getPrimeFactors(n) {
        if (n <= 1) return [];
        const factors = [];
        let d = 2;
        while (n % d === 0) { factors.push(d); n /= d; }
        d = 3;
        while (d * d <= n) {
            while (n % d === 0) { factors.push(d); n /= d; }
            d += 2;
        }
        if (n > 1) factors.push(n);
        return factors;
    }

    document.getElementById('btn-simplify-frac')?.addEventListener('click', () => {
        const num = parseInt(document.getElementById('frac-num')?.value || '1', 10);
        const den = parseInt(document.getElementById('frac-den')?.value || '1', 10);
        const resText = document.getElementById('frac-res-text');
        if (den === 0) {
            if (resText) resText.textContent = "Undefined (÷0)";
            return;
        }
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const g = Math.abs(gcd(num, den));
        if (resText) resText.textContent = `= ${num / g} / ${den / g}`;
    });

    // ==========================================
    // 10. UNIT CIRCLE & TRIG STUDIO (L2)
    // ==========================================
    let unitCircleAngleDeg = 45;

    function renderUnitCircle() {
        const canvas = document.getElementById('unit-circle-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * (window.devicePixelRatio || 1) || 500;
        canvas.height = rect.height * (window.devicePixelRatio || 1) || 310;

        const w = canvas.width, h = canvas.height;
        const cx = w / 2, cy = h / 2;
        const R = Math.min(w, h) * 0.38;
        const isDark = bodyEl.classList.contains('dark-theme');

        ctx.clearRect(0, 0, w, h);

        // Axes
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, cy); ctx.lineTo(w, cy);
        ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
        ctx.stroke();

        // Circle
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(30, 34, 41, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, 2 * Math.PI);
        ctx.stroke();

        // Angle vector
        const rad = (unitCircleAngleDeg * Math.PI) / 180;
        const px = cx + R * Math.cos(rad);
        const py = cy - R * Math.sin(rad);

        // Cosine line (Cyan)
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy); ctx.lineTo(px, cy);
        ctx.stroke();

        // Sine line (Pink)
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px, cy); ctx.lineTo(px, py);
        ctx.stroke();

        // Hypotenuse
        ctx.strokeStyle = isDark ? '#ffffff' : '#1e2229';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy); ctx.lineTo(px, py);
        ctx.stroke();

        // Marker point
        ctx.fillStyle = '#fb923c';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, 2 * Math.PI);
        ctx.fill();

        // Readouts
        const degEl = document.getElementById('trig-deg-val');
        const radEl = document.getElementById('trig-rad-val');
        const cosEl = document.getElementById('val-cos');
        const sinEl = document.getElementById('val-sin');
        const tanEl = document.getElementById('val-tan');
        const coordEl = document.getElementById('val-coords');

        if (degEl) degEl.textContent = `${unitCircleAngleDeg.toFixed(0)}°`;
        if (radEl) radEl.textContent = `${(rad / Math.PI).toFixed(3)}π rad`;
        if (cosEl) cosEl.textContent = Math.cos(rad).toFixed(4);
        if (sinEl) sinEl.textContent = Math.sin(rad).toFixed(4);
        if (tanEl) {
            const t = Math.tan(rad);
            tanEl.textContent = Math.abs(t) > 100 ? '±∞' : t.toFixed(4);
        }
        if (coordEl) coordEl.textContent = `(${Math.cos(rad).toFixed(2)}, ${Math.sin(rad).toFixed(2)})`;
    }

    const unitSlider = document.getElementById('unit-circle-slider');
    unitSlider?.addEventListener('input', (e) => {
        unitCircleAngleDeg = parseFloat(e.target.value);
        renderUnitCircle();
    });

    document.querySelectorAll('.quick-angle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            unitCircleAngleDeg = parseFloat(btn.getAttribute('data-deg'));
            if (unitSlider) unitSlider.value = unitCircleAngleDeg;
            renderUnitCircle();
        });
    });

    // Quadratic Solver
    function solveAndPlotQuadratic() {
        const a = parseFloat(document.getElementById('quad-a')?.value || '1');
        const b = parseFloat(document.getElementById('quad-b')?.value || '-5');
        const c = parseFloat(document.getElementById('quad-c')?.value || '6');

        const delta = b * b - 4 * a * c;
        const discEl = document.getElementById('quad-disc-val');
        const rootsEl = document.getElementById('quad-roots-val');
        const vertexEl = document.getElementById('quad-vertex-val');
        const badge = document.getElementById('quad-root-badge');

        if (discEl) discEl.textContent = `Δ = ${delta.toFixed(4)}`;
        if (Math.abs(a) < 1e-9) return;

        const h = -b / (2 * a);
        const k = a * h * h + b * h + c;
        if (vertexEl) vertexEl.textContent = `(${h.toFixed(2)}, ${k.toFixed(2)})`;

        if (delta > 0) {
            const r1 = (-b + Math.sqrt(delta)) / (2 * a);
            const r2 = (-b - Math.sqrt(delta)) / (2 * a);
            if (rootsEl) rootsEl.textContent = `x₁ = ${r1.toFixed(3)}, x₂ = ${r2.toFixed(3)}`;
            if (badge) { badge.textContent = "2 REAL ROOTS"; badge.className = "status-badge-neo pass"; }
        } else if (Math.abs(delta) < 1e-9) {
            const r = -b / (2 * a);
            if (rootsEl) rootsEl.textContent = `Double Root: x = ${r.toFixed(3)}`;
            if (badge) { badge.textContent = "1 DOUBLE ROOT"; badge.className = "status-badge-neo info"; }
        } else {
            const re = -b / (2 * a);
            const im = Math.sqrt(-delta) / (2 * a);
            if (rootsEl) rootsEl.textContent = `x = ${re.toFixed(2)} ± ${im.toFixed(2)}i`;
            if (badge) { badge.textContent = "COMPLEX ROOTS"; badge.className = "status-badge-neo fail"; }
        }
        renderQuadraticParabola();
    }

    function renderQuadraticParabola() {
        const canvas = document.getElementById('quad-parabola-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * (window.devicePixelRatio || 1) || 400;
        canvas.height = rect.height * (window.devicePixelRatio || 1) || 180;

        const a = parseFloat(document.getElementById('quad-a')?.value || '1');
        const b = parseFloat(document.getElementById('quad-b')?.value || '-5');
        const c = parseFloat(document.getElementById('quad-c')?.value || '6');

        const w = canvas.width, h = canvas.height;
        const isDark = bodyEl.classList.contains('dark-theme');
        ctx.clearRect(0, 0, w, h);

        const xMin = -2, xMax = 6, yMin = -4, yMax = 8;
        const toX = x => ((x - xMin) / (xMax - xMin)) * w;
        const toY = y => h - ((y - yMin) / (yMax - yMin)) * h;

        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(0, toY(0)); ctx.lineTo(w, toY(0));
        ctx.moveTo(toX(0), 0); ctx.lineTo(toX(0), h);
        ctx.stroke();

        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let px = 0; px <= w; px += 2) {
            const x = xMin + (px / w) * (xMax - xMin);
            const y = a * x * x + b * x + c;
            if (px === 0) ctx.moveTo(px, toY(y));
            else ctx.lineTo(px, toY(y));
        }
        ctx.stroke();
    }

    document.getElementById('btn-solve-quad')?.addEventListener('click', solveAndPlotQuadratic);

    // Argand Plane
    function renderArgandPlane() {
        const canvas = document.getElementById('argand-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * (window.devicePixelRatio || 1) || 500;
        canvas.height = rect.height * (window.devicePixelRatio || 1) || 310;

        const re = parseFloat(document.getElementById('complex-re')?.value || '3');
        const im = parseFloat(document.getElementById('complex-im')?.value || '4');

        const w = canvas.width, h = canvas.height;
        const cx = w / 2, cy = h / 2;
        const scale = Math.min(w, h) * 0.08;
        const isDark = bodyEl.classList.contains('dark-theme');

        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, cy); ctx.lineTo(w, cy);
        ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
        ctx.stroke();

        const px = cx + re * scale;
        const py = cy - im * scale;

        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy); ctx.lineTo(px, py);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, 2 * Math.PI);
        ctx.fill();

        const mod = Math.sqrt(re * re + im * im);
        const argRad = Math.atan2(im, re);
        const argDeg = (argRad * 180) / Math.PI;

        const modEl = document.getElementById('val-complex-mod');
        const argEl = document.getElementById('val-complex-arg');
        const polarEl = document.getElementById('val-complex-polar');
        const conjEl = document.getElementById('val-complex-conj');

        if (modEl) modEl.textContent = mod.toFixed(4);
        if (argEl) argEl.textContent = `${argDeg.toFixed(2)}°`;
        if (polarEl) polarEl.textContent = `${mod.toFixed(2)} e^(i ${argRad.toFixed(2)})`;
        if (conjEl) conjEl.textContent = `${re} ${-im >= 0 ? '+' : '−'} ${Math.abs(im)}i`;
    }

    document.getElementById('btn-update-complex')?.addEventListener('click', renderArgandPlane);

    // ==========================================
    // 11. CALCULUS & RIEMANN SUMS (L3)
    // ==========================================
    let riemannN = 10;
    let riemannMethod = 'midpoint';

    function renderRiemannCanvas() {
        const canvas = document.getElementById('riemann-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * (window.devicePixelRatio || 1) || 500;
        canvas.height = rect.height * (window.devicePixelRatio || 1) || 310;

        const w = canvas.width, h = canvas.height;
        const isDark = bodyEl.classList.contains('dark-theme');
        ctx.clearRect(0, 0, w, h);

        const a = 0, b = 2;
        const f = x => x * x;
        const xMin = -0.5, xMax = 2.5, yMin = -0.5, yMax = 4.5;
        const toX = x => ((x - xMin) / (xMax - xMin)) * w;
        const toY = y => h - ((y - yMin) / (yMax - yMin)) * h;

        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(0, toY(0)); ctx.lineTo(w, toY(0));
        ctx.moveTo(toX(0), 0); ctx.lineTo(toX(0), h);
        ctx.stroke();

        const dx = (b - a) / riemannN;
        let sum = 0;

        ctx.fillStyle = isDark ? 'rgba(0, 242, 254, 0.25)' : 'rgba(56, 189, 248, 0.35)';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1;

        for (let i = 0; i < riemannN; i++) {
            const xLeft = a + i * dx;
            const xRight = xLeft + dx;
            let sampleX = (xLeft + xRight) / 2;
            if (riemannMethod === 'left') sampleX = xLeft;
            if (riemannMethod === 'right') sampleX = xRight;

            const sampleY = f(sampleX);
            sum += sampleY * dx;

            const rx = toX(xLeft);
            const ry = toY(sampleY);
            const rw = toX(xRight) - rx;
            const rh = toY(0) - ry;

            ctx.fillRect(rx, ry, rw, rh);
            ctx.strokeRect(rx, ry, rw, rh);
        }

        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let px = 0; px <= w; px += 2) {
            const x = xMin + (px / w) * (xMax - xMin);
            const y = f(x);
            if (px === 0) ctx.moveTo(px, toY(y));
            else ctx.lineTo(px, toY(y));
        }
        ctx.stroke();

        const areaEl = document.getElementById('riemann-area-val');
        if (areaEl) areaEl.textContent = sum.toFixed(4);
    }

    const riemannSlider = document.getElementById('riemann-n-slider');
    riemannSlider?.addEventListener('input', (e) => {
        riemannN = parseInt(e.target.value, 10);
        const badge = document.getElementById('riemann-n-display');
        if (badge) badge.textContent = `N = ${riemannN}`;
        renderRiemannCanvas();
    });

    ['mid', 'left', 'right'].forEach(m => {
        document.getElementById(`btn-riemann-${m}`)?.addEventListener('click', (e) => {
            document.querySelectorAll('.riemann-method-group .neo-pill-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            riemannMethod = m === 'mid' ? 'midpoint' : m;
            renderRiemannCanvas();
        });
    });

    document.getElementById('btn-plot-func')?.addEventListener('click', () => {
        const expr = document.getElementById('grapher-func-input')?.value || 'x^2 - 4';
        grapher.setFunction(expr);
        const badge = document.getElementById('grapher-info-badge');
        if (badge) badge.textContent = `f(x) = ${expr}`;
    });

    document.getElementById('btn-tangent-toggle')?.addEventListener('click', () => {
        if (grapher.tangentPoint !== null) grapher.clearTangent();
        else grapher.setTangent(1);
    });

    document.getElementById('btn-integral-toggle')?.addEventListener('click', () => {
        if (grapher.integralArea) grapher.clearIntegral();
        else grapher.setIntegral(0, 2);
    });

    document.getElementById('btn-graph-reset')?.addEventListener('click', () => {
        grapher.resetView();
    });

    // ==========================================
    // 12. MATRIX WORKBENCH & TRANSFORMS (L4)
    // ==========================================
    function getMatrixA() {
        return [
            [parseFloat(document.getElementById('mat-a-00')?.value || '1'), parseFloat(document.getElementById('mat-a-01')?.value || '2')],
            [parseFloat(document.getElementById('mat-a-10')?.value || '3'), parseFloat(document.getElementById('mat-a-11')?.value || '4')]
        ];
    }

    function getMatrixB() {
        return [
            [parseFloat(document.getElementById('mat-b-00')?.value || '2'), parseFloat(document.getElementById('mat-b-01')?.value || '0')],
            [parseFloat(document.getElementById('mat-b-10')?.value || '1'), parseFloat(document.getElementById('mat-b-11')?.value || '2')]
        ];
    }

    function evaluateMatrixWorkbench() {
        const A = getMatrixA();
        const B = getMatrixB();

        const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
        const tr = A[0][0] + A[1][1];

        const detEl = document.getElementById('val-mat-det');
        const trEl = document.getElementById('val-mat-tr');
        const invEl = document.getElementById('val-mat-inv');
        const prodEl = document.getElementById('val-mat-prod');
        const badge = document.getElementById('mat-invertible-badge');

        if (detEl) detEl.textContent = det.toFixed(4);
        if (trEl) trEl.textContent = tr.toFixed(4);

        if (Math.abs(det) < 1e-9) {
            if (invEl) invEl.textContent = "Singular (No Inverse)";
            if (badge) { badge.textContent = "SINGULAR (det=0)"; badge.className = "status-badge-neo fail"; }
        } else {
            const inv = [
                [(A[1][1] / det).toFixed(2), (-A[0][1] / det).toFixed(2)],
                [(-A[1][0] / det).toFixed(2), (A[0][0] / det).toFixed(2)]
            ];
            if (invEl) invEl.textContent = `[[${inv[0][0]}, ${inv[0][1]}], [${inv[1][0]}, ${inv[1][1]}]]`;
            if (badge) { badge.textContent = "INVERTIBLE"; badge.className = "status-badge-neo pass"; }
        }

        const C = [
            [(A[0][0] * B[0][0] + A[0][1] * B[1][0]).toFixed(1), (A[0][0] * B[0][1] + A[0][1] * B[1][1]).toFixed(1)],
            [(A[1][0] * B[0][0] + A[1][0] * B[1][0]).toFixed(1), (A[1][0] * B[0][1] + A[1][1] * B[1][1]).toFixed(1)]
        ];
        if (prodEl) prodEl.textContent = `[[${C[0][0]}, ${C[0][1]}], [${C[1][0]}, ${C[1][1]}]]`;

        renderTransformationCanvas();
        renderEigenCanvas();
    }

    document.getElementById('btn-mat-calc-all')?.addEventListener('click', evaluateMatrixWorkbench);
    document.querySelectorAll('.matrix-cell').forEach(inp => inp.addEventListener('input', evaluateMatrixWorkbench));

    document.querySelectorAll('.matrix-preset-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const p = chip.getAttribute('data-preset');
            if (p === 'id') setMatA(1, 0, 0, 1);
            else if (p === 'rot45') setMatA(0.707, -0.707, 0.707, 0.707);
            else if (p === 'shear') setMatA(1, 1.5, 0, 1);
            else if (p === 'refl') setMatA(1, 0, 0, -1);
            evaluateMatrixWorkbench();
        });
    });

    function setMatA(a00, a01, a10, a11) {
        document.getElementById('mat-a-00').value = a00;
        document.getElementById('mat-a-01').value = a01;
        document.getElementById('mat-a-10').value = a10;
        document.getElementById('mat-a-11').value = a11;
    }

    function renderTransformationCanvas() {
        const canvas = document.getElementById('transform-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * (window.devicePixelRatio || 1) || 500;
        canvas.height = rect.height * (window.devicePixelRatio || 1) || 310;

        const A = getMatrixA();
        const w = canvas.width, h = canvas.height;
        const cx = w / 2, cy = h / 2;
        const scale = 36;
        const isDark = bodyEl.classList.contains('dark-theme');

        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
        for (let x = -6; x <= 6; x++) {
            ctx.beginPath();
            ctx.moveTo(cx + x * scale, 0); ctx.lineTo(cx + x * scale, h);
            ctx.moveTo(0, cy + x * scale); ctx.lineTo(w, cy + x * scale);
            ctx.stroke();
        }

        ctx.strokeStyle = isDark ? 'rgba(0, 242, 254, 0.18)' : 'rgba(2, 132, 199, 0.22)';
        for (let u = -4; u <= 4; u++) {
            const p1x = cx + (u * A[0][0] - 4 * A[0][1]) * scale;
            const p1y = cy - (u * A[1][0] - 4 * A[1][1]) * scale;
            const p2x = cx + (u * A[0][0] + 4 * A[0][1]) * scale;
            const p2y = cy - (u * A[1][0] + 4 * A[1][1]) * scale;
            ctx.beginPath(); ctx.moveTo(p1x, p1y); ctx.lineTo(p2x, p2y); ctx.stroke();
        }

        // î' (Cyan)
        const iPrimeX = cx + A[0][0] * scale;
        const iPrimeY = cy - A[1][0] * scale;
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(iPrimeX, iPrimeY); ctx.stroke();

        // ĵ' (Coral)
        const jPrimeX = cx + A[0][1] * scale;
        const jPrimeY = cy - A[1][1] * scale;
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(jPrimeX, jPrimeY); ctx.stroke();

        const iVal = document.getElementById('trans-i-val');
        const jVal = document.getElementById('trans-j-val');
        const areaVal = document.getElementById('trans-area-val');
        const det = Math.abs(A[0][0] * A[1][1] - A[0][1] * A[1][0]);

        if (iVal) iVal.textContent = `[${A[0][0]}, ${A[1][0]}]`;
        if (jVal) jVal.textContent = `[${A[0][1]}, ${A[1][1]}]`;
        if (areaVal) areaVal.textContent = `|det| = ${det.toFixed(2)}`;
    }

    function renderEigenCanvas() {
        const canvas = document.getElementById('eigen-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * (window.devicePixelRatio || 1) || 400;
        canvas.height = rect.height * (window.devicePixelRatio || 1) || 180;

        const A = getMatrixA();
        const tr = A[0][0] + A[1][1];
        const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
        const disc = tr * tr - 4 * det;

        const polyEl = document.getElementById('val-char-poly');
        const eigenEl = document.getElementById('val-eigenvalues');

        if (polyEl) polyEl.textContent = `λ² − ${tr.toFixed(2)}λ + ${det.toFixed(2)} = 0`;

        if (disc >= 0) {
            const l1 = (tr + Math.sqrt(disc)) / 2;
            const l2 = (tr - Math.sqrt(disc)) / 2;
            if (eigenEl) eigenEl.textContent = `λ₁ = ${l1.toFixed(4)}, λ₂ = ${l2.toFixed(4)}`;
        } else {
            const re = tr / 2;
            const im = Math.sqrt(-disc) / 2;
            if (eigenEl) eigenEl.textContent = `λ = ${re.toFixed(2)} ± ${im.toFixed(2)}i`;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // ==========================================
    // 13. QUANTUM GATES & BLOCH (L5)
    // ==========================================
    document.querySelectorAll('.neo-gate-btn[data-gate]').forEach(btn => {
        btn.addEventListener('click', () => {
            const gate = btn.getAttribute('data-gate');
            bloch.applyGate(gate);
            setTimeout(() => {
                const thetaText = document.getElementById('bloch-theta-text');
                const phiText = document.getElementById('bloch-phi-text');
                if (thetaText) thetaText.textContent = `${((bloch.theta * 180) / Math.PI).toFixed(0)}°`;
                if (phiText) phiText.textContent = `${((bloch.phi * 180) / Math.PI).toFixed(0)}°`;
            }, 100);
        });
    });

    document.getElementById('bloch-measure-trigger')?.addEventListener('click', () => {
        const result = bloch.measure();
        alert(`💥 Wavefunction Collapse!\nOutcome: |${result.outcome}⟩\nProbability was: ${(result.outcome === 0 ? result.prob0 * 100 : result.prob1 * 100).toFixed(1)}%`);
    });

    document.querySelectorAll('.wave-sim-controls .neo-pill-btn[data-preset]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.wave-sim-controls .neo-pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            schrodinger.setPotential(btn.getAttribute('data-preset'));
        });
    });

    const wavePauseBtn = document.getElementById('wave-pause-trigger');
    wavePauseBtn?.addEventListener('click', () => {
        schrodinger.togglePause();
        wavePauseBtn.textContent = schrodinger.paused ? 'RESUME' : 'PAUSE';
    });

    document.getElementById('btn-autofix-norm')?.addEventListener('click', () => {
        if (!currentKet) return;
        const norm = qe.stateNorm(currentKet);
        if (norm === 0) return;
        const fixedKet = currentKet.map(amp => amp.div(new Complex(norm, 0)));
        currentKet = fixedKet;
        const normStr = `[${fixedKet.map(a => a.toString()).join(', ')}]`;
        inputs[5] = `q_debug_state:${normStr}`;
        updateSlideDisplay(5);
        evaluateExpression(inputs[5], 5);
    });

    // ==========================================
    // 14. INITIALIZE BOOT SEQUENCE
    // ==========================================
    // Initialize all 5 slide displays
    [1, 2, 3, 4, 5].forEach(lvl => {
        updateSlideDisplay(lvl);
        evaluateExpression(inputs[lvl], lvl);
    });

    // Check initial URL hash
    const initialHash = window.location.hash.replace('#/l', '').trim();
    const initialLvl = parseInt(initialHash, 10);
    goToLevel(initialLvl >= 1 && initialLvl <= 5 ? initialLvl : 1);
});
