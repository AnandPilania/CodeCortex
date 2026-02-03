#!/usr/bin/env node

import CodeCortex from './code-cortex.js';
import LaravelAnalyzer from './laravel-analyzer.js';
import path from 'node:path';
import fs from 'node:fs';

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
CodeCortex - Modular Multi-Language Code Analysis Tool

Usage: codecortex <directory> [options]

Options:
  -h, --help              Show this help message
  --list-drivers          List all available drivers
  --show-hierarchy        Show driver inheritance hierarchy
  --analyzer <type>       Use specific analyzer (project, laravel)
  --list-analyzers        List all available analyzers

Analyzers:
  project                 General project analyzer (default)
  laravel                 Laravel-specific analyzer

Supported Languages (via hierarchical drivers):
  Base Drivers:
    - PHP                   (.php files)
    - JavaScript            (.js, .mjs, .cjs files)

  Extended Drivers:
    - Blade                 (.blade.php) - extends PHP
    - TypeScript            (.ts) - extends JavaScript
    - React (JSX)           (.jsx) - extends JavaScript
    - React TypeScript      (.tsx) - extends TypeScript
    - Vue                   (.vue) - extends JavaScript

Examples:
  codecortex ./src
  codecortex . --analyzer project
  codecortex ./app --analyzer laravel
  codecortex --list-analyzers
  codecortex --list-drivers

Architecture:
  The analyzer uses a hierarchical driver-based architecture where:
  - Blade extends PHP (gets all PHP features + Blade features)
  - TypeScript extends JavaScript (gets all JS features + TS features)
  - React extends JavaScript (gets all JS features + React features)
  - Vue extends JavaScript (gets all JS features + Vue features)

  Higher priority drivers are matched first (e.g., .blade.php matches
  Blade driver, not PHP driver; .tsx matches React TS, not TypeScript).
  `);
    process.exit(0);
}

if (args.includes('--list-analyzers')) {
    console.log('\nAvailable Analyzers:\n');
    console.log('1. project');
    console.log('   - General purpose project analyzer');
    console.log('   - Supports multiple languages and frameworks');
    console.log('   - Hierarchical driver architecture');
    console.log('   - Best for: mixed projects, unknown frameworks\n');

    console.log('2. laravel');
    console.log('   - Laravel-specific analyzer');
    console.log('   - Advanced code quality analysis');
    console.log('   - Dead code and duplicate detection');
    console.log('   - Security and performance insights');
    console.log('   - Best for: Laravel PHP projects\n');

    console.log('Usage: codecortex <path> --analyzer <analyzer-type>');
    process.exit(0);
}

if (args.includes('--list-drivers')) {
    console.log('\nAvailable Drivers (sorted by priority):\n');
    const analyzer = new CodeCortex();
    analyzer.drivers.forEach((driver, index) => {
        const baseClass = Object.getPrototypeOf(driver.constructor).name;
        const extendsInfo = baseClass !== 'BaseDriver' ? ` (extends ${baseClass})` : '';

        console.log(`${index + 1}. ${driver.name}${extendsInfo}`);
        console.log(`   Priority: ${driver.priority}`);
        console.log(`   Extensions: ${driver.extensions.join(', ') || 'N/A'}`);
        if (driver.includePatterns.length > 0) {
            console.log(`   Patterns: ${driver.includePatterns.map(p => p.toString()).join(', ')}`);
        }
        console.log();
    });
    process.exit(0);
}

if (args.includes('--show-hierarchy')) {
    console.log('\nDriver Inheritance Hierarchy:\n');
    console.log('BaseDriver (abstract)');
    console.log('├── PhpDriver');
    console.log('│   └── BladeDriver');
    console.log('└── JavaScriptDriver');
    console.log('    ├── TypeScriptDriver');
    console.log('    │   └── ReactTypeScriptDriver');
    console.log('    ├── ReactDriver');
    console.log('    └── VueDriver');
    console.log('\nHow it works:');
    console.log('- Blade inherits all PHP parsing + adds Blade directives');
    console.log('- TypeScript inherits all JS parsing + adds interfaces, types, enums');
    console.log('- React inherits all JS parsing + adds components, hooks, JSX');
    console.log('- Vue inherits all JS parsing + adds components, directives');
    console.log('- React TS inherits TypeScript + adds React features');
    console.log();
    process.exit(0);
}

// Get analyzer type from command line
function getAnalyzerType() {
    const analyzerIndex = args.indexOf('--analyzer');
    if (analyzerIndex !== -1 && args[analyzerIndex + 1]) {
        return args[analyzerIndex + 1];
    }

    return 'project'; // Default analyzer
}

// Auto-detect project type
function autoDetectAnalyzer(targetPath) {
    try {
        // Check for Laravel project
        const composerPath = path.join(targetPath, 'composer.json');
        if (fs.existsSync(composerPath)) {
            const composer = JSON.parse(fs.readFileSync(composerPath, 'utf8'));
            if (composer.require && composer.require['laravel/framework']) {
                return 'laravel';
            }
        }

        // Check for package.json (Node.js project)
        const packageJsonPath = path.join(targetPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            return 'project'; // Use general project analyzer for Node.js projects
        }

        // Check for PHP files
        const phpFiles = findFilesByExtension(targetPath, '.php');
        if (phpFiles.length > 0) {
            // Check if it might be a Laravel project without composer.json in root
            const hasLaravelStructure =
                fs.existsSync(path.join(targetPath, 'app')) &&
                fs.existsSync(path.join(targetPath, 'resources')) &&
                fs.existsSync(path.join(targetPath, 'database'));

            if (hasLaravelStructure) {
                return 'laravel';
            }
        }

    } catch (error) {
        console.warn('Auto-detection failed, using default analyzer:', error.message);
    }

    return 'project'; // Fallback to general analyzer
}

function findFilesByExtension(dir, extension, maxDepth = 3) {
    const files = [];

    function scan(currentDir, depth) {
        if (depth > maxDepth) return;

        try {
            const items = fs.readdirSync(currentDir);

            for (const item of items) {
                if (item === 'node_modules' || item === 'vendor' || item.startsWith('.')) {
                    continue;
                }

                const fullPath = path.join(currentDir, item);
                try {
                    const stat = fs.statSync(fullPath);

                    if (stat.isDirectory()) {
                        scan(fullPath, depth + 1);
                    } else if (item.endsWith(extension)) {
                        files.push(fullPath);
                    }
                } catch (err) {
                    // Skip files we can't access
                }
            }
        } catch (err) {
            // Skip directories we can't access
        }
    }

    scan(dir, 0);
    return files;
}

// Get target path (first non-option argument)
function getTargetPath() {
    // Filter out options and their values
    const nonOptionArgs = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('-')) {
            // Skip option values (like 'laravel' after '--analyzer')
            if (args[i] === '--analyzer' && args[i + 1]) {
                i++; // Skip the next argument too
            }
            continue;
        }
        nonOptionArgs.push(args[i]);
    }

    // Use first non-option argument as path, or current directory
    return nonOptionArgs.length > 0 ? path.resolve(nonOptionArgs[0]) : path.resolve('.');
}

try {
    const targetPath = getTargetPath();
    const analyzerType = getAnalyzerType();

    // Validate target path exists
    if (!fs.existsSync(targetPath)) {
        console.error(`Error: Path "${targetPath}" does not exist.`);
        process.exit(1);
    }

    let analyzer;

    switch (analyzerType) {
        case 'laravel':
            console.log('🚀 Using Laravel Analyzer');
            analyzer = new LaravelAnalyzer();
            break;
        case 'project':
            console.log('🔍 Using General Project Analyzer');
            analyzer = new CodeCortex();
            break;
        default:
            console.log(`⚠️  Unknown analyzer "${analyzerType}", using auto-detection`);
            const detectedType = autoDetectAnalyzer(targetPath);
            console.log(`🔍 Auto-detected: ${detectedType} project`);

            if (detectedType === 'laravel') {
                analyzer = new LaravelAnalyzer();
            } else {
                analyzer = new CodeCortex();
            }
    }

    // Add some visual separation
    console.log('');

    // Run the analysis
    analyzer.analyze(targetPath);

} catch (error) {
    console.error('Analysis failed:', error.message);
    process.exit(1);
}
