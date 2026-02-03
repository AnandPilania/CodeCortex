import JsonDriver from "./json-driver.js";
import path from 'node:path';
import fs from 'node:fs';

export default class PackageJsonDriver extends JsonDriver {
    constructor() {
        super();
        this.name = 'package.json';
        this.extensions = [];
        this.includePatterns = [/package\.json$/];
        this.excludePatterns = [];
        this.priority = 25;
    }

    parse(content, filePath) {
        const baseMetrics = super.parse(content, filePath);

        try {
            const pkg = JSON.parse(content);

            const dependencies = pkg.dependencies || {};
            const devDependencies = pkg.devDependencies || {};
            const peerDependencies = pkg.peerDependencies || {};
            const allDeps = { ...dependencies, ...devDependencies, ...peerDependencies };

            const frameworks = {
                react: !!allDeps['react'],
                vue: !!allDeps['vue'],
                angular: !!allDeps['@angular/core'],
                svelte: !!allDeps['svelte'],
                nextjs: !!allDeps['next'],
                nuxt: !!allDeps['nuxt'],
                express: !!allDeps['express'],
                nestjs: !!allDeps['@nestjs/core'],
                gatsby: !!allDeps['gatsby'],
            };

            const buildTools = {
                webpack: !!allDeps['webpack'],
                vite: !!allDeps['vite'],
                rollup: !!allDeps['rollup'],
                parcel: !!allDeps['parcel'],
                esbuild: !!allDeps['esbuild'],
                turbopack: !!allDeps['turbopack'],
            };

            const testingFrameworks = {
                jest: !!allDeps['jest'],
                vitest: !!allDeps['vitest'],
                mocha: !!allDeps['mocha'],
                jasmine: !!allDeps['jasmine'],
                cypress: !!allDeps['cypress'],
                playwright: !!allDeps['playwright'],
            };

            const hasTypeScript = !!allDeps['typescript'];

            const uiLibraries = {
                tailwind: !!allDeps['tailwindcss'],
                bootstrap: !!allDeps['bootstrap'],
                materialui: !!allDeps['@mui/material'],
                antd: !!allDeps['antd'],
                chakra: !!allDeps['@chakra-ui/react'],
            };

            return {
                ...baseMetrics,
                projectName: pkg.name || 'unknown',
                projectVersion: pkg.version || 'unknown',
                packageManager: this.detectPackageManager(filePath),
                totalDependencies: Object.keys(dependencies).length,
                totalDevDependencies: Object.keys(devDependencies).length,
                totalPeerDependencies: Object.keys(peerDependencies).length,
                frameworks,
                buildTools,
                testingFrameworks,
                hasTypeScript,
                uiLibraries,
                scripts: Object.keys(pkg.scripts || {}).length,
            };
        } catch (err) {
            return baseMetrics;
        }
    }

    detectPackageManager(filePath) {
        const dir = path.dirname(filePath);
        if (fs.existsSync(path.join(dir, 'yarn.lock'))) return 'yarn';
        if (fs.existsSync(path.join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
        if (fs.existsSync(path.join(dir, 'package-lock.json'))) return 'npm';
        return 'unknown';
    }

    formatMetrics(metrics) {
        if (metrics.parseError) return {};

        const sections = {};

        sections['Project Info'] = {
            'Name': metrics.projectName,
            'Version': metrics.projectVersion,
            'Package Manager': metrics.packageManager,
            'Scripts': metrics.scripts || 0,
        };

        sections['Dependencies'] = {
            'Production Dependencies': metrics.totalDependencies || 0,
            'Dev Dependencies': metrics.totalDevDependencies || 0,
            'Peer Dependencies': metrics.totalPeerDependencies || 0,
            'Total': (metrics.totalDependencies || 0) + (metrics.totalDevDependencies || 0) + (metrics.totalPeerDependencies || 0),
        };

        // Detected frameworks
        const detectedFrameworks = [];
        if (metrics.frameworks) {
            Object.entries(metrics.frameworks).forEach(([name, exists]) => {
                if (exists) detectedFrameworks.push(name);
            });
        }

        if (detectedFrameworks.length > 0) {
            sections['Detected Frameworks'] = {
                'Frameworks': detectedFrameworks.join(', '),
                'TypeScript': metrics.hasTypeScript ? 'Yes' : 'No',
            };
        }

        // Build tools
        const detectedBuildTools = [];
        if (metrics.buildTools) {
            Object.entries(metrics.buildTools).forEach(([name, exists]) => {
                if (exists) detectedBuildTools.push(name);
            });
        }

        if (detectedBuildTools.length > 0) {
            sections['Build Tools'] = {
                'Tools': detectedBuildTools.join(', '),
            };
        }

        // Testing frameworks
        const detectedTesting = [];
        if (metrics.testingFrameworks) {
            Object.entries(metrics.testingFrameworks).forEach(([name, exists]) => {
                if (exists) detectedTesting.push(name);
            });
        }

        if (detectedTesting.length > 0) {
            sections['Testing'] = {
                'Frameworks': detectedTesting.join(', '),
            };
        }

        // UI libraries
        const detectedUI = [];
        if (metrics.uiLibraries) {
            Object.entries(metrics.uiLibraries).forEach(([name, exists]) => {
                if (exists) detectedUI.push(name);
            });
        }

        if (detectedUI.length > 0) {
            sections['UI Libraries'] = {
                'Libraries': detectedUI.join(', '),
            };
        }

        return sections;
    }
}
