# ⚛️ Quantum Calculator

An educational web-based quantum computing playground and calculator designed to simulate qubit operations, gate transformations, and basic quantum circuits directly in the browser.

---

## 📌 Overview

Understanding quantum computing often requires bridging abstract linear algebra with practical computation. This project serves as an interactive simulator to help visualize and calculate quantum states, single- and multi-qubit gate operations, and quantum probabilities from first principles.

---

## ✨ Features

- **Qubit State Representation**: Visualize single and multi-qubit systems in Dirac (bra-ket) notation ($\vert{}\psi\rangle = \alpha\vert{}0\rangle + \beta\vert{}1\rangle$).
- **Quantum Logic Gates**: Apply fundamental quantum gates:
  - **Pauli Gates**: $X$ (NOT), $Y$, $Z$ (Phase Flip)
  - **Hadamard ($H$)**: Create superpositions
  - **Phase Gates**: $S$, $T$
  - **Controlled Operations**: CNOT (Controlled-NOT)
- **Measurement & Probabilities**: Calculate collapse probabilities ($\vert{}\alpha\vert{}^2$, $\vert{}\beta\vert{}^2$) and simulate measurement outcomes.
- **Interactive Web Interface**: Clean front-end interface built with vanilla JavaScript, HTML5, and modern CSS.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend / Server**: Node.js (`server.js`)

---

## 📂 Project Structure

```text
quantum-calculator/
├── js/               # Quantum math, gate logic, and UI scripts
├── index.html        # Main web interface
├── server.js         # Local Node.js server
├── style.css         # UI styling
└── README.md         # Project documentation
