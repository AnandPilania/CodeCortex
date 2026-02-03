import { BaseDriver, JsonDriver, PackageJsonDriver, ComposerJsonDriver, PhpDriver, BladeDriver, JavaScriptDriver, TypeScriptDriver, ReactDriver, ReactTypeScriptDriver, VueDriver } from './drivers/index.js';
import fs from 'node:fs';
import path from 'node:path';

export default class CodeCortex {
    constructor() {
        this.drivers = [
            new JsonDriver(),
            new PackageJsonDriver(),
            new ComposerJsonDriver(),

            new PhpDriver(),
            new BladeDriver(),

            new JavaScriptDriver(),
            new TypeScriptDriver(),
            new ReactDriver(),
            new ReactTypeScriptDriver(),
            new VueDriver(),
        ];

        this.drivers.sort((a, b) => b.priority - a.priority);

        this.globalStats = {
            directories: new Set(),
            totalFiles: 0,
            analyzedFiles: 0,
            skippedFiles: 0,
            startTime: null,
            endTime: null,
        };

        this.driverMetrics = new Map();
        this.aggregateMetrics = {};
        this.projectType = null;

        this.ignoreList = [
            'node_modules',
            'vendor',
            '.git',
            '.svn',
            'dist',
            'build',
            'coverage',
            '.next',
            '.nuxt',
            'out',
            'public/build',
            'storage',
            'bootstrap/cache',
            '.idea',
            '.vscode',
        ];
    }

    registerDriver(driver) {
        if (!(driver instanceof BaseDriver)) {
            throw new Error('Driver must extend BaseDriver');
        }
        this.drivers.push(driver);
        this.drivers.sort((a, b) => b.priority - a.priority);
    }

    analyze(targetPath) {
        this.globalStats.startTime = Date.now();

        if (!fs.existsSync(targetPath)) {
            console.error(`Error: Path "${targetPath}" does not exist.`);
            process.exit(1);
        }

        console.log('CodeCortex v0.0.1 (Hierarchical Driver Architecture)\n');

        this.scanDirectory(targetPath);
        this.globalStats.endTime = Date.now();

        this.printReport();
    }

    scanDirectory(dirPath) {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
            const fullPath = path.join(dirPath, item);

            try {
                const stat = fs.statSync(fullPath);

                if (this.shouldIgnore(item)) {
                    continue;
                }

                if (stat.isDirectory()) {
                    this.globalStats.directories.add(fullPath);
                    this.scanDirectory(fullPath);
                } else if (stat.isFile()) {
                    this.analyzeFile(fullPath);
                }
            } catch (err) {
                console.log(`   ⚠️ ERROR: ${item} - ${err.message}`);
            }
        }
    }

    shouldIgnore(name) {
        return this.ignoreList.includes(name) || name.startsWith('.');
    }

    analyzeFile(filePath) {
        this.globalStats.totalFiles++;

        const driver = this.drivers.find(d => {
            const canHandle = d.canHandle(filePath);
            return canHandle;
        });

        if (!driver) {
            //console.log(`No driver found for ${filePath}`);
            this.globalStats.skippedFiles++;
            return;
        }

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const metrics = driver.parse(content, filePath);

            if (!this.driverMetrics.has(driver.name)) {
                this.driverMetrics.set(driver.name, driver.getInitialMetrics());
            }

            const driverAggregate = this.driverMetrics.get(driver.name);
            driver.mergeMetrics(driverAggregate, metrics);
            driver.mergeMetrics(this.aggregateMetrics, metrics);

            this.globalStats.analyzedFiles++;
        } catch (err) {
            console.log(`Error parsing ${filePath}:`, err.message);
            this.globalStats.skippedFiles++;
        }
    }

    printReport() {
        const duration = ((this.globalStats.endTime - this.globalStats.startTime) / 1000).toFixed(2);

        console.log('Directories'.padEnd(50), this.globalStats.directories.size);
        console.log('Files'.padEnd(50), this.globalStats.totalFiles);
        console.log('  Analyzed'.padEnd(50), this.globalStats.analyzedFiles);
        console.log('  Skipped'.padEnd(50), this.globalStats.skippedFiles);

        console.log('\nFiles by Language/Framework');
        this.driverMetrics.forEach((metrics, driverName) => {
            if (metrics.files > 0) {
                const percentage = ((metrics.files / this.globalStats.analyzedFiles) * 100).toFixed(2);
                console.log(`  ${driverName}`.padEnd(50), `${metrics.files} (${percentage}%)`);
            }
        });

        this.printAggregateMetrics();

        this.drivers.forEach(driver => {
            const metrics = this.driverMetrics.get(driver.name);
            if (metrics && metrics.files > 0) {
                this.printDriverMetrics(driver, metrics);
            }
        });

        console.log(`\nAnalysis completed in ${duration}s`);
    }

    printAggregateMetrics() {
        const m = this.aggregateMetrics;

        console.log('\nSize (Aggregate)');
        console.log('  Lines of Code (LOC)'.padEnd(50), m.loc || 0);

        if (m.loc > 0) {
            const clocPct = ((m.cloc / m.loc) * 100).toFixed(2);
            const nclocPct = ((m.ncloc / m.loc) * 100).toFixed(2);
            const llocPct = ((m.lloc / m.loc) * 100).toFixed(2);

            console.log('  Comment Lines of Code (CLOC)'.padEnd(50), `${m.cloc || 0} (${clocPct}%)`);
            console.log('  Non-Comment Lines of Code (NCLOC)'.padEnd(50), `${m.ncloc || 0} (${nclocPct}%)`);
            console.log('  Logical Lines of Code (LLOC)'.padEnd(50), `${m.lloc || 0} (${llocPct}%)`);
        }

        if (m.complexity) {
            console.log('\nCyclomatic Complexity (Aggregate)');
            console.log('  Total Complexity'.padEnd(50), m.complexity);

            const numUnits = (m.functions || 0) + (m.methods || 0);
            if (numUnits > 0) {
                const avgComplexity = (m.complexity / numUnits).toFixed(2);
                console.log('  Average Complexity'.padEnd(50), avgComplexity);
            }
        }
    }

    printDriverMetrics(driver, metrics) {
        const formatted = driver.formatMetrics(metrics);

        if (Object.keys(formatted).length === 0) return;

        console.log(`\n${'='.repeat(60)}`);
        console.log(`${driver.name} Metrics`);
        console.log('='.repeat(60));

        Object.entries(formatted).forEach(([sectionName, sectionData]) => {
            console.log(`\n${sectionName}`);

            Object.entries(sectionData).forEach(([key, value]) => {
                if (typeof value === 'object' && value.value !== undefined) {
                    const pct = value.percentage ? ` (${value.percentage.toFixed(2)}%)` : '';
                    console.log(`  ${key}`.padEnd(50), `${value.value}${pct}`);
                } else {
                    console.log(`  ${key}`.padEnd(50), value);
                }
            });
        });
    }
}
