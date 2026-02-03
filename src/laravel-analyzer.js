import CodeCortex from './code-cortex.js';
import LaravelDriver from './drivers/laravel-driver.js';
import CodeQualityAnalyzer from './code-quality.js';
import fs from 'node:fs';
import path from 'node:path';

export default class LaravelAnalyzer extends CodeCortex {
    constructor() {
        super();

        // Register LaravelDriver BEFORE parent constructor processes drivers
        this.registerDriver(new LaravelDriver());

        this.codeQualityAnalyzer = new CodeQualityAnalyzer();

        this.enhancedMetrics = {
            projectType: null,
            laravelVersion: null,
            frontendStack: [],
            deadCode: null,
            duplicateCode: null,
            securityIssues: [],
            performanceIssues: [],
            codeQualityScore: 0,
        };

        // Fix: Don't ignore dot-prefixed directories for Laravel projects
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
            'bootstrap/cache',
            '.idea',
            '.vscode',
            // Note: removed 'storage' and name.startsWith('.') check
        ];
    }

    analyze(targetPath) {
        console.log('🚀 Laravel Project Analyzer v1.0.0\n');

        // First detect project structure
        this.detectProjectStructure(targetPath);

        // Check if this is actually a Laravel project
        if (!this.enhancedMetrics.projectType) {
            console.log('❌ This does not appear to be a Laravel project.');
            console.log('   No composer.json with laravel/framework dependency found.');
            console.log('   Falling back to general project analysis...\n');
        }

        // Then run parent analysis
        super.analyze(targetPath);

        // Only run analysis if it's a Laravel project
        if (this.enhancedMetrics.projectType === 'Laravel') {
            this.runEnhancedAnalysis(targetPath);
            this.printEnhancedReport();
        }
    }

    shouldIgnore(name) {
        // Override parent: don't ignore dot-prefixed directories
        return this.ignoreList.includes(name);
    }

    detectProjectStructure(projectPath) {
        try {
            const composerPath = path.join(projectPath, 'composer.json');
            if (fs.existsSync(composerPath)) {
                const composer = JSON.parse(fs.readFileSync(composerPath, 'utf8'));

                if (composer.require && composer.require['laravel/framework']) {
                    this.enhancedMetrics.projectType = 'Laravel';
                    this.enhancedMetrics.laravelVersion = composer.require['laravel/framework'];
                    console.log(`✅ Detected Laravel project: ${this.enhancedMetrics.laravelVersion}`);
                } else {
                    console.log('❌ composer.json found but no laravel/framework dependency');
                }
            } else {
                console.log('❌ No composer.json found in project root');
            }

            this.detectFrontendStack(projectPath);

        } catch (error) {
            console.warn('Could not detect project structure:', error.message);
        }
    }

    detectFrontendStack(projectPath) {
        const frontendStack = [];

        const packageJsonPath = path.join(projectPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

                if (dependencies.react) frontendStack.push(`React ${dependencies.react}`);
                if (dependencies.vue) frontendStack.push(`Vue ${dependencies.vue}`);
                if (dependencies['@inertiajs/inertia']) frontendStack.push('Inertia.js');
                if (dependencies.livewire) frontendStack.push('Livewire');
                if (dependencies.tailwindcss) frontendStack.push('Tailwind CSS');
                if (dependencies.bootstrap) frontendStack.push('Bootstrap');
                if (dependencies.sass) frontendStack.push('Sass');
                if (dependencies.typescript) frontendStack.push('TypeScript');

                if (frontendStack.length > 0) {
                    console.log(`📦 Frontend stack: ${frontendStack.join(', ')}`);
                }
            } catch (error) {
                console.warn('Could not parse package.json');
            }
        }

        const resourcesPath = path.join(projectPath, 'resources', 'views');
        if (fs.existsSync(resourcesPath)) {
            const bladeFiles = this.findFilesByExtension(resourcesPath, '.blade.php');
            if (bladeFiles.length > 0) {
                frontendStack.push(`Blade Templates (${bladeFiles.length} files)`);
            }
        }

        this.enhancedMetrics.frontendStack = frontendStack;
    }

    findFilesByExtension(dir, extension) {
        const files = [];

        try {
            const items = fs.readdirSync(dir);

            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !this.shouldIgnore(item)) {
                    files.push(...this.findFilesByExtension(fullPath, extension));
                } else if (item.endsWith(extension)) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Directory might not exist or be accessible
        }

        return files;
    }

    runEnhancedAnalysis(projectPath) {
        console.log('\n🔍 Running Laravel analysis...');

        try {
            console.log('  - Analyzing dead code...');
            this.enhancedMetrics.deadCode = this.codeQualityAnalyzer.analyzeDeadCode(projectPath);

            console.log('  - Analyzing duplicate code...');
            this.enhancedMetrics.duplicateCode = this.codeQualityAnalyzer.analyzeDuplicateCode(projectPath);

            this.calculateCodeQualityScore();

            console.log('✅ Analysis completed.\n');
        } catch (error) {
            console.log('❌ Analysis failed:', error.message);
        }
    }

    calculateCodeQualityScore() {
        let score = 100;

        const deadCode = this.enhancedMetrics.deadCode;
        if (deadCode) {
            score -= (deadCode.unusedClasses.length * 2);
            score -= (deadCode.unusedMethods.length * 1);
            score -= (deadCode.unusedImports.length * 0.5);
        }

        const duplicateCode = this.enhancedMetrics.duplicateCode;
        if (duplicateCode) {
            score -= (duplicateCode.length * 3);
        }

        // Check security issues from LaravelDriver metrics
        this.driverMetrics.forEach((metrics, driverName) => {
            if (driverName === 'Laravel' && metrics.securityIssues) {
                metrics.securityIssues.forEach(issue => {
                    switch (issue.severity) {
                        case 'high': score -= 10; break;
                        case 'medium': score -= 5; break;
                        case 'low': score -= 2; break;
                    }
                });
            }
        });

        this.enhancedMetrics.codeQualityScore = Math.max(0, Math.round(score));
    }

    printEnhancedReport() {
        if (this.enhancedMetrics.projectType !== 'Laravel') {
            return;
        }

        console.log('\n' + '='.repeat(60));
        console.log('🚀 LARAVEL ANALYSIS REPORT');
        console.log('='.repeat(60));

        console.log('\n📋 Project Information');
        console.log('  Type'.padEnd(25), this.enhancedMetrics.projectType);
        if (this.enhancedMetrics.laravelVersion) {
            console.log('  Laravel Version'.padEnd(25), this.enhancedMetrics.laravelVersion);
        }

        if (this.enhancedMetrics.frontendStack.length > 0) {
            console.log('\n🎨 Frontend Stack');
            this.enhancedMetrics.frontendStack.forEach(tech => {
                console.log('  -', tech);
            });
        }

        console.log('\n📊 Code Quality Score');
        const score = this.enhancedMetrics.codeQualityScore;
        const scoreColor = score >= 80 ? '✅' : score >= 60 ? '⚠️' : '❌';
        console.log(`  Overall Score: ${score}/100 ${scoreColor}`);

        // Dead Code Analysis
        const deadCode = this.enhancedMetrics.deadCode;
        if (deadCode) {
            console.log('\n🧹 Dead Code Analysis');
            console.log('  Unused Classes'.padEnd(25), deadCode.unusedClasses.length);
            console.log('  Unused Methods'.padEnd(25), deadCode.unusedMethods.length);
            console.log('  Unused Imports'.padEnd(25), deadCode.unusedImports.length);

            if (deadCode.unusedClasses.length > 0) {
                console.log('\n  Unused Classes Details:');
                deadCode.unusedClasses.slice(0, 5).forEach(item => {
                    console.log(`    - ${item.className} (${path.basename(item.file)}:${item.line})`);
                });
                if (deadCode.unusedClasses.length > 5) {
                    console.log(`    ... and ${deadCode.unusedClasses.length - 5} more`);
                }
            }
        }

        // Duplicate Code Analysis
        const duplicateCode = this.enhancedMetrics.duplicateCode;
        if (duplicateCode && duplicateCode.length > 0) {
            console.log('\n🔁 Duplicate Code Analysis');
            console.log('  Duplicate Blocks Found'.padEnd(25), duplicateCode.length);

            console.log('\n  Top Duplicates:');
            duplicateCode.slice(0, 3).forEach((duplicate, index) => {
                console.log(`    ${index + 1}. ${path.basename(duplicate.file1)} ↔ ${path.basename(duplicate.file2)}`);
                if (duplicate.similarities && duplicate.similarities[0]) {
                    console.log(`       Similarity: ${(duplicate.similarities[0]?.similarity * 100).toFixed(1)}%`);
                }
            });
        }

        this.printRecommendations();
    }

    printRecommendations() {
        console.log('\n💡 Recommendations');
        const recommendations = [];

        const deadCode = this.enhancedMetrics.deadCode;
        if (deadCode && deadCode.unusedClasses.length > 0) {
            recommendations.push(`Remove ${deadCode.unusedClasses.length} unused classes to reduce codebase size`);
        }

        if (deadCode && deadCode.unusedMethods.length > 0) {
            recommendations.push(`Remove ${deadCode.unusedMethods.length} unused methods to improve maintainability`);
        }

        if (deadCode && deadCode.unusedImports.length > 0) {
            recommendations.push(`Clean up ${deadCode.unusedImports.length} unused imports`);
        }

        const duplicateCode = this.enhancedMetrics.duplicateCode;
        if (duplicateCode && duplicateCode.length > 0) {
            recommendations.push(`Refactor ${duplicateCode.length} duplicate code blocks into reusable functions`);
        }

        if (this.enhancedMetrics.codeQualityScore < 80) {
            recommendations.push('Consider implementing automated code quality checks in your CI/CD pipeline');
        }

        if (recommendations.length === 0) {
            console.log('  ✅ Great job! No major issues found.');
        } else {
            recommendations.forEach((rec, index) => {
                console.log(`  ${index + 1}. ${rec}`);
            });
        }
    }
}
