# Project Analyzer

[![npm version](https://img.shields.io/npm/v/CodeCortex.svg)](https://www.npmjs.com/packageCodeCortex)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful, modular multi-language code analyzer with hierarchical driver architecture for PHP, JavaScript, TypeScript, React, Vue, Blade, and Laravel projects.

## ✨ Features

- 🔍 **Multi-Language Support**: Analyzes PHP, JavaScript, TypeScript, React, Vue, and Blade templates
- 🏗️ **Hierarchical Architecture**: Smart driver inheritance (e.g., Blade extends PHP, TypeScript extends JavaScript)
- 🚀 **Laravel-Specific Analysis**: Enhanced analyzer for Laravel projects with code quality metrics
- 📊 **Dead Code Detection**: Finds unused classes, methods, and imports
- 🔁 **Duplicate Code Detection**: Identifies similar code blocks across files
- 📈 **Code Quality Scoring**: Automated quality assessment with actionable recommendations
- ⚡ **Fast & Efficient**: Optimized scanning with intelligent file filtering
- 🎯 **Auto-Detection**: Automatically detects project type (Laravel, Node.js, etc.)

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g codecortex
```

After global installation, you can use the `codecortex` command anywhere:

```bash
codecortex ./my-project
```

### Local Installation

```bash
npm install --save-dev codecortex
```

Then run via npx:

```bash
npx codecortex ./my-project
```

Or add to your `package.json` scripts:

```json
{
  "scripts": {
    "analyze": "codecortex ."
  }
}
```

## 🚀 Quick Start

### Analyze any project

```bash
codecortex .
```

### Analyze with specific analyzer

```bash
# Use Laravel analyzer
codecortex ./app --analyzer laravel

# Use general project analyzer
codecortex ./src --analyzer project
```

### List available features

```bash
# Show all available analyzers
codecortex --list-analyzers

# Show all language drivers
codecortex --list-drivers

# Show driver inheritance hierarchy
codecortex --show-hierarchy
```

## 📖 Usage Examples

### Basic Project Analysis

```bash
# Analyze current directory
codecortex .

# Analyze specific directory
codecortex ./src

# Auto-detect and analyze
codecortex /path/to/project
```

### Laravel Project Analysis

```bash
# Analyze Laravel project with enhanced features
codecortex . --analyzer laravel

# Analyze Laravel app directory
codecortex ./app --analyzer laravel
```

### Using in npm Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "analyze": "codecortex .",
    "analyze:laravel": "codecortex . --analyzer laravel",
    "analyze:quality": "codecortex ./app --analyzer laravel"
  }
}
```

Then run:

```bash
npm run analyze
npm run analyze:laravel
```

## 🎯 Supported Languages & Frameworks

### Base Drivers
- **PHP** (.php files) - Classes, methods, functions, complexity analysis
- **JavaScript** (.js, .mjs, .cjs files) - Functions, classes, ES6+ features

### Extended Drivers
- **Blade** (.blade.php) - Extends PHP with Blade directives and components
- **TypeScript** (.ts) - Extends JavaScript with interfaces, types, and enums
- **React (JSX)** (.jsx) - Extends JavaScript with components and hooks
- **React TypeScript** (.tsx) - Extends TypeScript with React features
- **Vue** (.vue) - Extends JavaScript with Vue components and directives

### Configuration Files
- **JSON** (.json) - General JSON file analysis
- **package.json** - Node.js dependency analysis
- **composer.json** - PHP dependency analysis

## 📊 Analyzers

### 1. General Project Analyzer

The default analyzer for any project type.

**Features:**
- Multi-language support
- File type distribution
- Lines of code metrics (LOC, CLOC, NCLOC, LLOC)
- Cyclomatic complexity
- Directory structure analysis

**Usage:**
```bash
codecortex ./src --analyzer project
```

### 2. Laravel Analyzer

Enhanced analyzer specifically for Laravel projects.

**Additional Features:**
- Laravel version detection
- Frontend stack detection (Vue, React, Inertia, Livewire, Tailwind)
- Dead code analysis (unused classes, methods, imports)
- Duplicate code detection
- Code quality scoring (0-100)
- Security issue detection
- Performance recommendations
- Blade template analysis

**Usage:**
```bash
codecortex . --analyzer laravel
```

**Sample Output:**
```
🚀 ENHANCED LARAVEL ANALYSIS REPORT
============================================================

📋 Project Information
  Type                      Laravel
  Laravel Version           ^10.0

🎨 Frontend Stack
  - Vue 3.2.47
  - Inertia.js
  - Tailwind CSS

📊 Code Quality Score
  Overall Score: 87/100 ✅

🧹 Dead Code Analysis
  Unused Classes            3
  Unused Methods            12
  Unused Imports            8

🔁 Duplicate Code Analysis
  Duplicate Blocks Found    5

💡 Recommendations
  1. Remove 3 unused classes to reduce codebase size
  2. Remove 12 unused methods to improve maintainability
  3. Refactor 5 duplicate code blocks into reusable functions
```

## 🏗️ Architecture

### Hierarchical Driver System

The analyzer uses a smart inheritance-based driver architecture:

```
BaseDriver (abstract)
├── PhpDriver
│   └── BladeDriver
└── JavaScriptDriver
    ├── TypeScriptDriver
    │   └── ReactTypeScriptDriver
    ├── ReactDriver
    └── VueDriver
```

**Benefits:**
- **Code Reuse**: Child drivers inherit all parent functionality
- **Extensibility**: Easy to add new languages/frameworks
- **Maintainability**: Changes to base drivers propagate automatically
- **Priority Matching**: More specific drivers match first (.blade.php → Blade, not PHP)

### Adding Custom Drivers

```javascript
import { BaseDriver } from 'codecortex';

class MyCustomDriver extends BaseDriver {
  constructor() {
    super('MyLanguage', 100); // name, priority
    this.extensions = ['.custom'];
  }

  parse(content, filePath) {
    // Your parsing logic
    return {
      loc: content.split('\n').length,
      // ... other metrics
    };
  }
}
```

## 📈 Metrics Explained

### Size Metrics
- **LOC** (Lines of Code): Total lines including blank and comments
- **CLOC** (Comment Lines): Lines with comments
- **NCLOC** (Non-Comment Lines): Code lines excluding comments
- **LLOC** (Logical Lines): Actual logical statements

### Complexity Metrics
- **Cyclomatic Complexity**: Measures code complexity (decision points)
- **Average Complexity**: Per function/method complexity

### Laravel-Specific Metrics
- **Code Quality Score**: 0-100 score based on:
  - Dead code penalties (-2 per unused class, -1 per method)
  - Duplicate code penalties (-3 per duplicate block)
  - Security issue penalties (-2 to -10 based on severity)

## 🔧 Configuration

### Ignored Directories

By default, the analyzer ignores:
- `node_modules`
- `vendor`
- `.git`
- `dist`, `build`
- `coverage`
- `.next`, `.nuxt`
- `storage` (general analyzer only)
- `.idea`, `.vscode`

### Custom Ignore List

Extend the analyzer to customize ignored directories:

```javascript
import CodeCortex from 'code-cortex';

const analyzer = new CodeCortex();
analyzer.ignoreList.push('my-custom-dir');
analyzer.analyze('./my-project');
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/AnandPilania/CodeCortex.git

# Install dependencies
cd codecortex
npm install

# Run locally
node src/cli.js ./test-project

# Test global installation
npm link
codecortex ./test-project
```

### Adding New Language Support

1. Create a new driver in `src/drivers/`
2. Extend `BaseDriver` or an existing driver
3. Implement `parse()` method
4. Register in `CodeCortex` constructor
5. Add tests and documentation

## 📝 Changelog

### Version 0.0.1 (Initial Release)
- Multi-language support (PHP, JS, TS, React, Vue, Blade)
- Hierarchical driver architecture
- General project analyzer
- Laravel-specific analyzer
- Dead code detection
- Duplicate code detection
- Code quality scoring

## 📄 License

MIT © [Anand Pilania](https://github.com/AnandPilania)

## 🙏 Acknowledgments

- Inspired by PHPMetrics, ESLint, and other code quality tools
- Built with Node.js and modern ES modules

## 🐛 Issues & Support

- **Bug Reports**: [GitHub Issues](https://github.com/AnandPilania/CodeCortex/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/AnandPilania/CodeCortex/discussions)
- **Email**: pilaniaanand@gmail.com

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/CodeCortex)
- [GitHub Repository](https://github.com/AnandPilania/CodeCortex)
- [Documentation](https://github.com/AnandPilania/CodeCortex#readme)

---

Made with ❤️ by [Anand Pilania](https://github.com/AnandPilania)
