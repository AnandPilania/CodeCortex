# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-02-03

### Added
- ✨ Initial release of Project Analyzer
- 🔍 Multi-language code analysis support
- 🏗️ Hierarchical driver-based architecture
- 📊 Support for PHP, JavaScript, TypeScript, React, Vue, and Blade
- 🚀 General project analyzer
- 🎯 Laravel-specific enhanced analyzer
- 🧹 Dead code detection (unused classes, methods, imports)
- 🔁 Duplicate code detection across files
- 📈 Code quality scoring (0-100)
- ⚡ Frontend stack detection (React, Vue, Inertia, Tailwind, etc.)
- 🎨 Laravel version detection
- 💡 Automated recommendations for code improvements
- 📋 Comprehensive metrics reporting (LOC, CLOC, NCLOC, LLOC)
- 🔢 Cyclomatic complexity analysis
- 🎛️ CLI with multiple options and commands
- 📚 Complete documentation and README
- 🤝 Contributing guidelines
- 📄 MIT License

### Features
- **Base Drivers**
  - PHP Driver with class, method, and function analysis
  - JavaScript Driver with ES6+ support
  - JSON configuration file analysis

- **Extended Drivers**
  - Blade Driver (extends PHP)
  - TypeScript Driver (extends JavaScript)
  - React/JSX Driver (extends JavaScript)
  - React TypeScript Driver (extends TypeScript)
  - Vue Driver (extends JavaScript)

- **Analyzers**
  - ProjectAnalyzer: General-purpose multi-language analyzer
  - LaravelAnalyzer: Enhanced Laravel project analysis

- **Code Quality Tools**
  - Dead code detection
  - Duplicate code detection
  - Security issue flagging (Laravel)
  - Performance recommendations

### CLI Commands
- `codecortex <path>` - Analyze a project
- `codecortex --analyzer <type>` - Use specific analyzer
- `codecortex --list-analyzers` - List available analyzers
- `codecortex --list-drivers` - List language drivers
- `codecortex --show-hierarchy` - Show driver inheritance
- `codecortex --help` - Show help message

### Documentation
- Comprehensive README with usage examples
- Publishing guide for npm
- Contributing guidelines
- Changelog

## [Unreleased]

### Planned Features
- 🧪 Automated test suite
- 🐍 Python language support
- ☕ Java language support
- 🦀 Rust language support
- 🎨 Custom driver API
- 📊 HTML report generation
- 💾 JSON/CSV export
- 🔌 Plugin system
- ⚙️ Configuration file support (.analyzerrc)
- 🎯 Git integration (analyze changed files only)
- 📈 Trend analysis over time
- 🚨 CI/CD integration examples
- 📱 Watch mode for continuous analysis

---

## Version History

### How to Read Versions

Given a version number MAJOR.MINOR.PATCH, increment the:

1. **MAJOR** version when you make incompatible API changes
2. **MINOR** version when you add functionality in a backward compatible manner
3. **PATCH** version when you make backward compatible bug fixes

### Release Types

- **🎉 Major Release** (x.0.0): Breaking changes, major new features
- **✨ Minor Release** (0.x.0): New features, backward compatible
- **🐛 Patch Release** (0.0.x): Bug fixes, minor improvements

---

## Links

- [npm Package](https://www.npmjs.com/package/codecortex)
- [GitHub Repository](https://github.com/AnandPilania/CodeCortex)
- [Issue Tracker](https://github.com/AnandPilania/CodeCortex/issues)
