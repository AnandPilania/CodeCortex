# Contributing to CodeCortex

Thank you for your interest in contributing to CodeCortex! 🎉

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/codecortex.git
   cd codecortex
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Link for local testing**
   ```bash
   npm link
   ```

5. **Test the CLI**
   ```bash
   codecortex --help
   codecortex ./test-project
   ```

## Development Workflow

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic

3. **Test your changes**
   ```bash
   # Test with different project types
   codecortex ./sample-laravel-project --analyzer laravel
   codecortex ./sample-node-project --analyzer project

   # Test all commands
   codecortex --list-drivers
   codecortex --show-hierarchy
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

### Commit Message Guidelines

Follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add Python driver support
fix: resolve duplicate code detection bug
docs: update README with new examples
```

## Adding New Language Support

### Step 1: Create a New Driver

Create a new file in `src/drivers/`, e.g., `python-driver.js`:

```javascript
import { BaseDriver } from './base-driver.js';

export default class PythonDriver extends BaseDriver {
    constructor() {
        super('Python', 80); // name, priority
        this.extensions = ['.py'];
    }

    parse(content, filePath) {
        const metrics = this.getInitialMetrics();

        // Add your parsing logic here
        metrics.files = 1;
        metrics.loc = content.split('\n').length;

        // ... more analysis

        return metrics;
    }

    getInitialMetrics() {
        return {
            files: 0,
            loc: 0,
            cloc: 0,
            ncloc: 0,
            classes: 0,
            functions: 0,
            // ... other metrics
        };
    }

    formatMetrics(metrics) {
        return {
            'Size': {
                'Files': metrics.files,
                'Lines of Code': metrics.loc,
                // ...
            },
            'Structure': {
                'Classes': metrics.classes,
                'Functions': metrics.functions,
                // ...
            }
        };
    }
}
```

### Step 2: Register the Driver

In `src/codecortex.js`, add your driver:

```javascript
import PythonDriver from './drivers/python-driver.js';

export default class ProjectAnalyzer {
    constructor() {
        this.drivers = [
            // ... existing drivers
            new PythonDriver(),
        ];

        this.drivers.sort((a, b) => b.priority - a.priority);
    }
}
```

### Step 3: Export from index

In `src/drivers/index.js`:

```javascript
export { default as PythonDriver } from './python-driver.js';
```

### Step 4: Update Documentation

Update README.md with the new language support.

## Code Style Guidelines

### JavaScript/ES6+ Style

- Use ES6+ features (const/let, arrow functions, destructuring)
- Use meaningful variable names
- Keep functions small and focused
- Use JSDoc comments for complex functions

Example:
```javascript
/**
 * Analyzes a file for dead code
 * @param {string} filePath - Path to the file
 * @param {boolean} includeRelated - Include related files in analysis
 * @returns {Object} Dead code analysis results
 */
analyzeFile(filePath, includeRelated = true) {
    // Implementation
}
```

### File Organization

```
src/
├── cli.js                  # Entry point
├── codecortex.js     # Base analyzer
├── laravel-analyzer.js     # Laravel-specific
├── code-quality.js         # Code quality tools
└── drivers/
    ├── index.js            # Driver exports
    ├── base-driver.js      # Abstract base
    ├── php-driver.js       # PHP implementation
    └── ...
```

## Testing

### Manual Testing

1. **Test with different project types**
   ```bash
   # Laravel project
   codecortex ./laravel-app --analyzer laravel

   # Node.js project
   codecortex ./node-app --analyzer project

   # Mixed project
   codecortex ./mixed-app
   ```

2. **Test all CLI options**
   ```bash
   codecortex --help
   codecortex --list-drivers
   codecortex --list-analyzers
   codecortex --show-hierarchy
   ```

3. **Test edge cases**
   - Empty directories
   - Large projects (>10k files)
   - Projects with special characters in names
   - Symlinked directories

### Future: Automated Tests

We plan to add automated tests. Contributions welcome!

## Submitting Changes

### Pull Request Process

1. **Update documentation**
   - Update README.md if needed
   - Add JSDoc comments
   - Update CHANGELOG.md

2. **Ensure code quality**
   - No console errors
   - All features working
   - Clean code style

3. **Create pull request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Provide clear description of changes
   - Reference any related issues

4. **PR Description Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Code refactoring

   ## Testing
   - [ ] Tested manually
   - [ ] Added/updated tests (if applicable)

   ## Checklist
   - [ ] Code follows project style
   - [ ] Documentation updated
   - [ ] No breaking changes (or documented)
   ```

### Review Process

1. Maintainer will review your PR
2. May request changes or improvements
3. Once approved, will be merged
4. Your contribution will be credited!

## Feature Requests & Bug Reports

### Reporting Bugs

Use GitHub Issues with template:

```markdown
**Bug Description**
Clear description of the bug

**To Reproduce**
1. Run command '...'
2. See error

**Expected Behavior**
What should happen

**Environment**
- OS: [e.g., macOS, Windows, Linux]
- Node version: [e.g., 18.0.0]
- Package version: [e.g., 1.0.0]

**Additional Context**
Any other relevant information
```

### Suggesting Features

Use GitHub Discussions or Issues:

```markdown
**Feature Description**
What feature would you like?

**Use Case**
Why is this feature needed?

**Proposed Solution**
How could this be implemented?

**Alternatives**
Any alternative solutions considered?
```

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information

## Questions?

- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bugs and feature requests
- **Email**: pilaniaanand@gmail.com

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Mentioned in documentation (for significant contributions)

Thank you for contributing! 🙏

---

*Happy Coding!* 🚀
