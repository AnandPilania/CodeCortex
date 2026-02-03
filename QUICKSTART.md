# Quick Start Guide

Get started with CodeCortex in under 5 minutes!

## 🚀 Installation

### Option 1: Global Installation (Recommended)

```bash
npm install -g codecortex
```

### Option 2: Local Installation

```bash
npm install --save-dev codecortex
```

## ✅ Verify Installation

```bash
# Check if installed
codecortex --help

# Should show:
# Project Analyzer - Modular Multi-Language Code Analysis Tool
# Usage: codecortex <directory> [options]
# ...
```

## 🎯 Basic Usage

### Analyze Current Directory

```bash
codecortex .
```

### Analyze Specific Directory

```bash
codecortex ./src
codecortex /path/to/your/project
```

### Analyze Laravel Project

```bash
cd your-laravel-project
codecortex . --analyzer laravel
```

## 📊 Understanding the Output

### General Project Analysis

```
Project Analyzer v2.0.0 (Hierarchical Driver Architecture)

Directories                                        45
Files                                              234
  Analyzed                                         198
  Skipped                                          36

Files by Language/Framework
  PHP                                              89 (44.95%)
  JavaScript                                       67 (33.84%)
  Blade                                            42 (21.21%)

Size (Aggregate)
  Lines of Code (LOC)                              15,432
  Comment Lines of Code (CLOC)                     2,156 (13.97%)
  Non-Comment Lines of Code (NCLOC)               13,276 (86.03%)
  Logical Lines of Code (LLOC)                     8,901 (57.69%)

Cyclomatic Complexity (Aggregate)
  Total Complexity                                 456
  Average Complexity                               3.42
```

### Laravel Project Analysis

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

💡 Recommendations
  1. Remove 3 unused classes to reduce codebase size
  2. Remove 12 unused methods to improve maintainability
```

## 🛠️ Common Commands

### List All Features

```bash
# Show available analyzers
codecortex --list-analyzers

# Show supported languages/drivers
codecortex --list-drivers

# Show driver inheritance hierarchy
codecortex --show-hierarchy
```

### Use Specific Analyzer

```bash
# General project analyzer (default)
codecortex ./src --analyzer project

# Laravel-specific analyzer
codecortex ./app --analyzer laravel
```

## 📁 Use in npm Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "analyze": "codecortex .",
    "analyze:laravel": "codecortex . --analyzer laravel",
    "analyze:src": "codecortex ./src"
  }
}
```

Then run:

```bash
npm run analyze
npm run analyze:laravel
```

## 🎨 Language Support Examples

### PHP Project

```bash
codecortex ./php-project
# Analyzes: .php files
# Reports: Classes, methods, functions, complexity
```

### JavaScript/Node.js Project

```bash
codecortex ./node-app
# Analyzes: .js, .mjs, .cjs files
# Reports: Functions, classes, modules
```

### React Project

```bash
codecortex ./react-app
# Analyzes: .jsx, .tsx files
# Reports: Components, hooks, props
```

### Vue Project

```bash
codecortex ./vue-app
# Analyzes: .vue files
# Reports: Components, directives, computed properties
```

### Laravel Project

```bash
codecortex ./laravel-app --analyzer laravel
# Analyzes: .php, .blade.php, and more
# Reports: Models, controllers, routes, views, dead code, duplicates
```

## 💡 Pro Tips

### 1. Focus on Specific Directories

```bash
# Analyze only app directory
codecortex ./app

# Analyze only source files
codecortex ./src
```

### 2. Use Auto-Detection

```bash
# Just run in project root - it auto-detects Laravel, Node.js, etc.
codecortex .
```

### 3. Combine with Other Tools

```bash
# Run analysis before committing
codecortex . && git commit -m "code cleanup"
```

### 4. Set Up Pre-Commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
codecortex . --analyzer laravel
if [ $? -ne 0 ]; then
    echo "Code analysis failed!"
    exit 1
fi
```

## 🔧 Troubleshooting

### Command Not Found

**Problem**: `codecortex: command not found`

**Solution**:
```bash
# If installed globally, check installation
npm list -g codecortex

# Reinstall if needed
npm install -g codecortex

# Or use npx
npx codecortex .
```

### Permission Denied

**Problem**: `Permission denied` on Unix/Mac/Linux

**Solution**:
```bash
# Make sure cli.js is executable
chmod +x $(npm root -g)/codecortex/src/cli.js
```

### No Files Analyzed

**Problem**: `Analyzed: 0`

**Solution**:
- Check if you're in the right directory
- Ensure supported file types exist (.php, .js, .ts, etc.)
- Check if files are not in ignored directories (node_modules, vendor)

## 📚 Next Steps

1. **Read the full README**: [README.md](./README.md)
2. **Learn about drivers**: `codecortex --show-hierarchy`
3. **Contribute**: [CONTRIBUTING.md](./CONTRIBUTING.md)
4. **Report issues**: [GitHub Issues](https://github.com/AnandPilania/CodeCortex/issues)

## 🆘 Get Help

```bash
# Show help
codecortex --help

# Check version
npm list -g codecortex
```

## 🎉 You're Ready!

Start analyzing your projects:

```bash
cd your-project
codecortex .
```

---

**Happy Analyzing!** 🚀
