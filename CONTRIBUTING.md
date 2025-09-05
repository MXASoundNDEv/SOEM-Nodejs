# Contributing to SOEM-Nodejs

🎉 Thank you for your interest in contributing to SOEM-Nodejs! 

## 🚀 Quick Start

1. **Fork** the repository
2. **Clone** your fork locally
3. **Install** dependencies: `npm install`
4. **Build** the project: `npm run build`
5. **Run tests**: `npm test`

## 🔧 Development Setup

### Prerequisites
- Node.js >= 18
- CMake >= 3.18
- C++ Compiler (GCC/Clang/MSVC)
- Platform-specific libraries:
  - **Windows**: WinPcap or Npcap
  - **Linux/macOS**: libpcap-dev

### Local Development
```bash
# Clone your fork
git clone https://github.com/MXASoundNDEv/SOEM-Nodejs.git
cd SOEM-Nodejs

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Check code quality
npm run lint:check
npm run production-check
```

## 📋 Guidelines

### Code Style
- Use **TypeScript** for new code
- Follow **ESLint** configuration
- Use **Prettier** for formatting
- Add **JSDoc comments** for public APIs

### Testing
- Write **unit tests** for new features
- Ensure **100% test coverage** for critical paths
- Test on **multiple platforms** when possible
- Mock external dependencies appropriately

### Commits
Use [Conventional Commits](https://conventionalcommits.org/):
```
type(scope): description

feat(interface): add automatic interface detection
fix(build): resolve Windows .node file generation
docs(readme): update installation instructions
test(unit): add tests for SDO operations
```

### Pull Requests
1. Create a **feature branch** from `main`
2. Make your changes with **clear commits**
3. **Update tests** and documentation
4. Ensure **CI passes**
5. Request review

## 🧪 Testing

### Running Tests
```bash
# Basic tests
npm test

# All tests (including integration)
npm run test:all

# With coverage
npm run test:ci

# Watch mode
npm run test:watch
```

### Test Categories
- **Unit Tests**: Test individual functions/classes
- **Integration Tests**: Test complete workflows
- **Platform Tests**: Test cross-platform compatibility

## 🔍 Code Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainers
3. **Testing** on multiple platforms
4. **Documentation** review
5. **Merge** when approved

## 🐛 Bug Reports

Use the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md) with:
- Clear description
- Reproduction steps
- Environment details
- Error messages
- Code samples

## ✨ Feature Requests

Use the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md) with:
- Problem description
- Proposed solution
- Use cases
- Implementation ideas

## 📚 Documentation

- **API docs** in TypeScript definitions
- **Examples** in `/examples` directory
- **README** for usage instructions
- **CHANGELOG** for release notes

## 🔒 Security

Report security vulnerabilities privately to the maintainers.

## 📄 License

By contributing, you agree that your contributions will be licensed under the same GPL-2.0-or-later license.

## 🙋‍♂️ Questions?

- Open a [Discussion](https://github.com/MXASoundNDEv/SOEM-Nodejs/discussions)
- Check existing [Issues](https://github.com/MXASoundNDEv/SOEM-Nodejs/issues)
- Read the [Documentation](README.md)

Thank you for contributing! 🎉
