# Contributing to MINDX Nexus

Thank you for considering contributing to **MINDX Nexus**! We welcome community contributions to help make this AI workspace even better.

## Code of Conduct
Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions.

## How to Contribute
1. **Fork the Repository**: Create a personal fork on GitHub.
2. **Clone & Setup**:
   ```bash
   git clone https://github.com/SHASHANKKUMARRAJP/MINDX.git
   cd MINDX
   ```
3. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Make Changes & Add Tests**:
   - Ensure all backend unit tests pass: `pytest`
   - Ensure all frontend tests pass: `npm test`
   - Adhere to Black code style for Python and Prettier for JS/JSX.
5. **Commit & Push**:
   ```bash
   git commit -m "Add amazing feature"
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**: Submit a PR targeting the `main` branch.

## Code Quality Requirements
- All Python functions must include type annotations (`typing.Dict`, `typing.List`, etc.) and Google-style docstrings.
- Zero unhandled exceptions or bare `except` blocks.
- Full WCAG 2.1 AA accessibility compliance for UI components.
