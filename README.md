# CodeCortex 🚀

[![npm version](https://img.shields.io/npm/v/codecortex.svg)](https://www.npmjs.com/package/codecortex)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful, modular multi-language code analyzer with **beautiful web dashboard** for PHP, JavaScript, TypeScript, React, Vue, Blade, and Laravel projects.

## ✨ Features

### Core Analysis
- 🔍 **Multi-Language Support**: Analyzes PHP, JavaScript, TypeScript, React, Vue, and Blade
- 🏗️ **Hierarchical Architecture**: Smart driver inheritance (Blade extends PHP, TypeScript extends JavaScript)
- 🚀 **Laravel-Specific Analysis**: Enhanced analyzer for Laravel projects with code quality metrics
- 📊 **Dead Code Detection**: Finds unused classes, methods, and imports
- 🔁 **Duplicate Code Detection**: Identifies similar code blocks across files
- 📈 **Code Quality Scoring**: Automated quality assessment with actionable recommendations

### New: Web Dashboard 🎨
- 📊 **Interactive Visualizations**: Beautiful charts and graphs
- 🌐 **Real-time Dashboard**: View analysis results in your browser
- 🎯 **RESTful API**: Express.js server with API endpoints
- ⚡ **Modern Stack**: Built with Vue.js 3, Vite, and Tailwind CSS
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- 🔄 **Auto-refresh**: Dashboard updates automatically

## 🎯 Quick Preview

### Command Line Output
```bash
codecortex .
```
```
CodeCortex v0.0.4

Files                    234
  Analyzed               198
  Skipped                36

Files by Language
  PHP                    89 (44.95%)
  JavaScript             67 (33.84%)
  Blade                  42 (21.21%)

Code Quality Score: 87/100 ✅
```

### Web Dashboard
```bash
codecortex . --ui
```
Opens a beautiful dashboard at `http://localhost:3000` with:
- 📊 Interactive pie charts for language distribution
- 📈 Bar charts for code metrics
- 🎯 Code quality scores and recommendations
- 📋 Detailed file breakdowns
- 🧹 Dead code and duplicate code analysis

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

## 🚀 Usage

### CLI Mode (Terminal Output)

```bash
# Analyze current directory
codecortex .

# Analyze specific directory
codecortex ./src

# Use Laravel analyzer
codecortex . --analyzer laravel

# Export to JSON
codecortex . --json report.json
```

### Web UI Mode (Dashboard)

```bash
# Method 1: One-shot analysis with auto-open browser
codecortex . --ui

# Method 2: Start server, then analyze
# Terminal 1:
codecortex --server

# Terminal 2:
codecortex . --ui

# Custom port
codecortex --server --port 8080
codecortex . --ui --port 8080
```

### Available Commands

```bash
# Help
codecortex --help

# List available analyzers
codecortex --list-analyzers

# List supported languages/drivers
codecortex --list-drivers

# Show driver hierarchy
codecortex --show-hierarchy

# Start web server only
codecortex --server

# Analyze with UI
codecortex <path> --ui

# Export to JSON
codecortex <path> --json output.json
```

## 🎨 Web Dashboard Features

### Overview Section
- 📊 Total files analyzed
- 📈 Total lines of code
- 📁 Number of directories
- ⭐ Code quality score (Laravel projects)

### Interactive Charts
- **Language Distribution**: Doughnut chart showing file distribution
- **Code Metrics**: Bar chart for LOC, CLOC, NCLOC, LLOC
- **Real-time Updates**: Auto-refresh every 30 seconds

### Laravel Enhanced View
- 🧹 **Dead Code**: Unused classes, methods, imports
- 🔁 **Duplicate Code**: Similar code blocks detection
- 📊 **Quality Score**: 0-100 score with breakdown
- ℹ️ **Project Info**: Laravel version, frontend stack
- 💡 **Recommendations**: Actionable improvement suggestions

### File Breakdown Table
- Detailed language/framework breakdown
- File counts and percentages
- Lines of code metrics
- Visual progress indicators

## 🎯 Supported Languages & Frameworks

### Base Drivers
- **PHP** (.php files) - Classes, methods, functions, complexity
- **JavaScript** (.js, .mjs, .cjs) - Functions, classes, ES6+ features

### Extended Drivers
- **Blade** (.blade.php) - Extends PHP + Blade directives
- **TypeScript** (.ts) - Extends JavaScript + types
- **React (JSX)** (.jsx) - Extends JavaScript + components
- **React TypeScript** (.tsx) - Extends TypeScript + React
- **Vue** (.vue) - Extends JavaScript + Vue components

### Configuration Files
- **JSON** (.json)
- **package.json** - Node.js dependencies
- **composer.json** - PHP dependencies

## 📊 Analyzers

### 1. General Project Analyzer (Default)

```bash
codecortex ./src --analyzer project
```

Features:
- Multi-language support
- File type distribution
- LOC metrics (LOC, CLOC, NCLOC, LLOC)
- Cyclomatic complexity
- Directory structure analysis

### 2. Laravel Analyzer

```bash
codecortex . --analyzer laravel
```

Additional features:
- Laravel version detection
- Frontend stack detection (Vue, React, Inertia, etc.)
- Dead code analysis
- Duplicate code detection
- Code quality scoring
- Security issue detection
- Performance recommendations
- Blade template analysis

## 🛠️ Development

### Setup for Development

```bash
# Clone repository
git clone https://github.com/AnandPilania/codecortex.git
cd codecortex

# Install dependencies
npm install

# Build project
npm run build

# Run in development mode
npm run dev          # UI dev server (Vite)
npm run server:dev   # API server
```

### Available Scripts

```json
{
  "dev": "vite",                         // Vite dev server (port 5173)
  "build": "vite build && npm run build:cli",  // Build everything
  "build:cli": "node scripts/build-cli.js",    // Build CLI only
  "preview": "vite preview",             // Preview production build
  "server": "node dist/server.js",       // Production server
  "server:dev": "node src/server.js",    // Development server
  "analyze": "node src/cli.js .",        // Analyze current dir
  "analyze:ui": "node src/cli.js . --ui" // Analyze with UI
}
```

## 🏗️ Architecture

### Hierarchical Driver System

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
- Code reuse through inheritance
- Easy to extend with new languages
- Automatic feature propagation
- Priority-based file matching

### Tech Stack

**CLI:**
- Node.js 18+
- ES Modules

**Web UI:**
- Vue.js 3
- Vite 5
- Tailwind CSS 3
- Chart.js 4
- Express.js 4

## 📈 Metrics Explained

### Size Metrics
- **LOC** (Lines of Code): Total lines including blank and comments
- **CLOC** (Comment Lines): Lines with comments
- **NCLOC** (Non-Comment Lines): Code lines excluding comments
- **LLOC** (Logical Lines): Actual logical statements

### Complexity Metrics
- **Cyclomatic Complexity**: Measures code complexity (decision points)
- **Average Complexity**: Per function/method complexity

### Quality Score (0-100)
- Deductions for dead code (-2 per class, -1 per method)
- Deductions for duplicates (-3 per block)
- Deductions for security issues (-2 to -10)

## 🌐 API Documentation

The web server exposes these endpoints:

### GET /api/health
Health check endpoint
```json
{
  "status": "ok",
  "timestamp": "2024-02-03T10:30:00.000Z"
}
```

### GET /api/analysis
Get latest analysis results
```json
{
  "globalStats": { ... },
  "driverMetrics": { ... },
  "aggregateMetrics": { ... },
  "enhancedMetrics": { ... },
  "timestamp": "2024-02-03T10:30:00.000Z"
}
```

### POST /api/analysis
Submit analysis results (used by CLI)

### DELETE /api/analysis
Clear stored analysis data

## 🎨 Customization

### UI Theming

Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#0ea5e9'  // Your brand color
      }
    }
  }
}
```

### Chart Customization

Edit chart components in `ui/src/components/`:
- `LanguageChart.vue`
- `MetricsChart.vue`

## 📝 Example Workflows

### Analyze Laravel Project

```bash
cd my-laravel-app
codecortex . --analyzer laravel --ui
# Opens dashboard showing Laravel-specific insights
```

### Export Report

```bash
codecortex . --json report.json
# Creates detailed JSON report
```

### CI/CD Integration

```bash
# .github/workflows/analyze.yml
- name: Analyze Code
  run: |
    npm install -g codecortex
    codecortex . --json analysis.json
```

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Adding New Language Support

1. Create driver in `src/drivers/`
2. Extend `BaseDriver` or existing driver
3. Implement `parse()` method
4. Register in analyzer
5. Update documentation

## 📄 License

MIT © [Anand Pilania](https://github.com/AnandPilania)

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/CodeCortex)
- [GitHub Repository](https://github.com/AnandPilania/CodeCortex)
- [Issue Tracker](https://github.com/AnandPilania/CodeCortex/issues)
- [Documentation](https://github.com/AnandPilania/CodeCortex#readme)

## 🙏 Acknowledgments

Built with:
- Vue.js for reactive UI
- Vite for lightning-fast builds
- Chart.js for beautiful visualizations
- Tailwind CSS for modern styling
- Express.js for robust API

## 📸 Screenshots

### Dashboard Overview
![Dashboard](https://placehold.co/800x400?text=Dashboard+Screenshot)

### Laravel Analysis
![Laravel](https://placehold.co/800x400?text=Laravel+Analysis)

### Charts
![Charts](https://placehold.co/800x400?text=Interactive+Charts)

---

Made with ❤️ by [Anand Pilania](https://github.com/AnandPilania)

**Star ⭐ this project if you find it useful!**
