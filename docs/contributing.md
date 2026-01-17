# Contributing to TradePilot

Thank you for your interest in contributing to TradePilot! This guide will help you get started.

## Development Setup

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/TradePilot.git
cd TradePilot
```

### 2. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -e ".[dev]"
```

### 4. Web Platform Setup

```bash
cd web
npm install
npm run dev
```

## Code Style

### Python
- Follow PEP 8 style guide
- Use type hints for function signatures
- Write docstrings for public functions (Google style)
- Maximum line length: 100 characters

### TypeScript/JavaScript
- Use ESLint with project configuration
- Prefer functional components for React
- Use TypeScript strict mode

### CSS
- Use Tailwind CSS utility classes
- Follow BEM naming for custom classes
- Use CSS custom properties for theme values

## Testing

### Run Python Tests

```bash
pytest tests/
```

### Run Web Tests

```bash
cd web
npm run test
```

### Run E2E Tests

```bash
npm run test:e2e
```

## Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** with clear, focused commits

3. **Write tests** for new functionality

4. **Update documentation** if needed

5. **Run all tests** to ensure nothing breaks

6. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

### PR Guidelines

- Use a clear, descriptive title
- Reference any related issues
- Include screenshots for UI changes
- Keep PRs focused and reasonably sized
- Respond to review feedback promptly

## Commit Messages

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```
feat(backtest): add support for custom rebalancing schedules
fix(optimization): correct MSR calculation with constraints
docs(api): update backtesting examples
```

## Reporting Issues

### Bug Reports

Include:
- Python/Node.js version
- OS and version
- Steps to reproduce
- Expected vs actual behavior
- Error messages and stack traces

### Feature Requests

Include:
- Use case description
- Proposed solution
- Alternative approaches considered

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow project maintainer decisions

## Getting Help

- Open a GitHub issue for bugs/features
- Use discussions for questions
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
