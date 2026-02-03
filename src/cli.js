#!/usr/bin/env node

import CodeCortex from './code-cortex.js';
import LaravelAnalyzer from './laravel-analyzer.js';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  --ui                    Open web UI after analysis
  --server                Start web server only (no analysis)
  --port <number>         Server port (default: 3000)
  --json <file>           Export results to JSON file

Analyzers:
  project                 General project analyzer (default)
  laravel                 Enhanced Laravel-specific analyzer

Web UI:
  --ui                    Analyze and open results in browser
  --server                Start dashboard server
  --port 3000             Custom port for web server

Examples:
  codecortex ./src
  codecortex . --analyzer laravel
  codecortex ./app --ui
  codecortex --server --port 8080
  codecortex . --ui --port 8080
  codecortex . --json output.json

Supported Languages:
  PHP, JavaScript, TypeScript, React, Vue, Blade
  `);
    process.exit(0);
}

// Check for server-only mode
if (args.includes('--server')) {
    startServerOnly();
    // Don't call process.exit() - let server run until user interrupts
    // The function will spawn a child process that runs indefinitely
} else {
    // Run the normal analysis flow
    main().catch(error => {
        console.error('Analysis failed:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    });
}

async function startServerOnly() {
    const port = getPort();

    // Find server.js in the same directory as CLI
    const serverPath = path.join(__dirname, 'server.js');

    if (!fs.existsSync(serverPath)) {
        console.error('❌ Server file not found:', serverPath);
        console.error('   Make sure you have run: npm run build');
        process.exit(1);
    }

    console.log(`🚀 Starting web server on port ${port}...`);

    // Start server as a child process with port argument
    const serverProcess = spawn('node', [serverPath, '--port', port.toString()], {
        stdio: 'inherit'
    });

    serverProcess.on('error', (err) => {
        console.error('❌ Failed to start server:', err.message);
        process.exit(1);
    });

    // Handle process termination
    process.on('SIGINT', () => {
        serverProcess.kill('SIGINT');
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        serverProcess.kill('SIGTERM');
        process.exit(0);
    });
}

async function main() {
    if (args.includes('--list-analyzers')) {
        console.log('\nAvailable Analyzers:\n');
        console.log('1. project');
        console.log('   - General purpose project analyzer');
        console.log('   - Supports multiple languages and frameworks\n');

        console.log('2. laravel');
        console.log('   - Enhanced Laravel-specific analyzer');
        console.log('   - Advanced code quality analysis\n');

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
        console.log();
        process.exit(0);
    }

    const targetPath = getTargetPath();
    const analyzerType = getAnalyzerType();
    const useUI = args.includes('--ui');
    const port = getPort();
    const jsonOutput = getJsonOutput();

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

    console.log('');

    // Run the analysis
    analyzer.analyze(targetPath);

    // Get results for UI/JSON export
    if (useUI || jsonOutput) {
        const results = {
            globalStats: {
                ...analyzer.globalStats,
                directories: { size: analyzer.globalStats.directories.size }
            },
            driverMetrics: Object.fromEntries(analyzer.driverMetrics),
            aggregateMetrics: analyzer.aggregateMetrics,
            enhancedMetrics: analyzer.enhancedMetrics || {}
        };

        if (useUI) {
            await sendToUI(results, port);
        }

        if (jsonOutput) {
            exportToJson(results, jsonOutput);
        }
    }
}

function getAnalyzerType() {
    const analyzerIndex = args.indexOf('--analyzer');
    if (analyzerIndex !== -1 && args[analyzerIndex + 1]) {
        return args[analyzerIndex + 1];
    }
    return 'project';
}

function getPort() {
    const portIndex = args.indexOf('--port');
    if (portIndex !== -1 && args[portIndex + 1]) {
        return parseInt(args[portIndex + 1], 10);
    }
    return 3000;
}

function getJsonOutput() {
    const jsonIndex = args.indexOf('--json');
    if (jsonIndex !== -1 && args[jsonIndex + 1]) {
        return args[jsonIndex + 1];
    }
    return null;
}

function autoDetectAnalyzer(targetPath) {
    try {
        const composerPath = path.join(targetPath, 'composer.json');
        if (fs.existsSync(composerPath)) {
            const composer = JSON.parse(fs.readFileSync(composerPath, 'utf8'));
            if (composer.require && composer.require['laravel/framework']) {
                return 'laravel';
            }
        }

        const packageJsonPath = path.join(targetPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            return 'project';
        }

        const phpFiles = findFilesByExtension(targetPath, '.php');
        if (phpFiles.length > 0) {
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
    return 'project';
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

function getTargetPath() {
    const nonOptionArgs = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('-')) {
            if (['--analyzer', '--port', '--json'].includes(args[i]) && args[i + 1]) {
                i++;
            }
            continue;
        }
        nonOptionArgs.push(args[i]);
    }
    return nonOptionArgs.length > 0 ? path.resolve(nonOptionArgs[0]) : path.resolve('.');
}

// Send results to UI server
async function sendToUI(results, port) {
    try {
        const response = await fetch(`http://localhost:${port}/api/analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(results)
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        console.log('\n✅ Results sent to web UI');
        console.log(`🌐 Open http://localhost:${port} in your browser\n`);

        // Try to open browser (platform-specific)
        try {
            const { exec } = await import('node:child_process');
            const url = `http://localhost:${port}`;

            const platform = process.platform;
            let command;

            if (platform === 'darwin') {
                command = `open ${url}`;
            } else if (platform === 'win32') {
                command = `start ${url}`;
            } else {
                command = `xdg-open ${url}`;
            }

            exec(command, (err) => {
                if (err) {
                    console.log('💡 Could not auto-open browser. Please open the URL manually.');
                }
            });
        } catch (err) {
            // Silently fail if can't open browser
        }
    } catch (error) {
        console.error('\n❌ Failed to send results to UI:', error.message);
        console.log(`💡 Make sure the server is running: codecortex --server --port ${port}\n`);
    }
}

function exportToJson(results, filePath) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(results, null, 2), 'utf8');
        console.log(`\n✅ Results exported to: ${filePath}\n`);
    } catch (error) {
        console.error(`\n❌ Failed to export JSON: ${error.message}\n`);
    }
}
