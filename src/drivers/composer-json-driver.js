import JsonDriver from "./json-driver.js";
import path from 'node:path';
import fs from 'node:fs';

export default class ComposerJsonDriver extends JsonDriver {
    constructor() {
        super();
        this.name = 'composer.json';
        this.extensions = [];
        this.includePatterns = [/composer\.json$/];
        this.excludePatterns = [];
        this.priority = 25;
    }

    parse(content, filePath) {
        const baseMetrics = super.parse(content, filePath);

        try {
            const composer = JSON.parse(content);

            const require = composer.require || {};
            const requireDev = composer['require-dev'] || {};
            const allDeps = { ...require, ...requireDev };

            const phpVersion = require.php || 'unknown';

            const hasLaravel = !!allDeps['laravel/framework'];
            const laravelVersion = allDeps['laravel/framework'] || null;

            const frameworks = {
                laravel: hasLaravel,
                symfony: !!allDeps['symfony/symfony'],
                lumen: !!allDeps['laravel/lumen-framework'],
                cakephp: !!allDeps['cakephp/cakephp'],
                codeigniter: !!allDeps['codeigniter4/framework'],
            };

            const laravelPackages = {
                sanctum: !!allDeps['laravel/sanctum'],
                passport: !!allDeps['laravel/passport'],
                horizon: !!allDeps['laravel/horizon'],
                telescope: !!allDeps['laravel/telescope'],
                breeze: !!allDeps['laravel/breeze'],
                jetstream: !!allDeps['laravel/jetstream'],
                livewire: !!allDeps['livewire/livewire'],
                inertia: !!allDeps['inertiajs/inertia-laravel'],
            };

            const frontendIntegration = {
                inertia: !!allDeps['inertiajs/inertia-laravel'],
                livewire: !!allDeps['livewire/livewire'],
            };

            let hasViteSetup = false;
            const dir = path.dirname(filePath);
            const packageJsonPath = path.join(dir, 'package.json');
            let viteWithFramework = null;

            if (fs.existsSync(packageJsonPath)) {
                try {
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                    const pkgDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

                    if (pkgDeps['vite']) {
                        hasViteSetup = true;
                        if (pkgDeps['react']) viteWithFramework = 'React';
                        else if (pkgDeps['vue']) viteWithFramework = 'Vue';
                    }
                } catch (err) {
                    // Ignore
                }
            }

            return {
                ...baseMetrics,
                projectName: composer.name || 'unknown',
                projectDescription: composer.description || '',
                phpVersion,
                totalDependencies: Object.keys(require).length,
                totalDevDependencies: Object.keys(requireDev).length,
                frameworks,
                hasLaravel,
                laravelVersion,
                laravelPackages,
                frontendIntegration,
                hasViteSetup,
                viteWithFramework,
                autoloadPsr4: Object.keys(composer.autoload?.['psr-4'] || {}).length,
                autoloadFiles: (composer.autoload?.files || []).length,
            };
        } catch (err) {
            return baseMetrics;
        }
    }

    formatMetrics(metrics) {
        if (metrics.parseError) return {};

        const sections = {};

        sections['Project Info'] = {
            'Name': metrics.projectName,
            'Description': metrics.projectDescription || 'N/A',
            'PHP Version': metrics.phpVersion,
        };

        sections['Dependencies'] = {
            'Production Dependencies': metrics.totalDependencies || 0,
            'Dev Dependencies': metrics.totalDevDependencies || 0,
            'Total': (metrics.totalDependencies || 0) + (metrics.totalDevDependencies || 0),
        };

        const detectedFrameworks = [];
        if (metrics.frameworks) {
            Object.entries(metrics.frameworks).forEach(([name, exists]) => {
                if (exists) detectedFrameworks.push(name);
            });
        }

        if (detectedFrameworks.length > 0) {
            sections['PHP Frameworks'] = {
                'Frameworks': detectedFrameworks.join(', '),
            };

            if (metrics.hasLaravel) {
                sections['Laravel Info'] = {
                    'Version': metrics.laravelVersion || 'unknown',
                };
            }
        }

        const detectedLaravelPkgs = [];
        if (metrics.laravelPackages) {
            Object.entries(metrics.laravelPackages).forEach(([name, exists]) => {
                if (exists) detectedLaravelPkgs.push(name);
            });
        }

        if (detectedLaravelPkgs.length > 0) {
            sections['Laravel Packages'] = {
                'Packages': detectedLaravelPkgs.join(', '),
            };
        }

        if (metrics.hasViteSetup) {
            sections['Frontend Setup'] = {
                'Build Tool': 'Vite',
                'Framework': metrics.viteWithFramework || 'None',
            };
        }

        const frontendStacks = [];
        if (metrics.frontendIntegration) {
            if (metrics.frontendIntegration.inertia) frontendStacks.push('Inertia.js');
            if (metrics.frontendIntegration.livewire) frontendStacks.push('Livewire');
        }

        if (frontendStacks.length > 0) {
            if (!sections['Frontend Setup']) sections['Frontend Setup'] = {};
            sections['Frontend Setup']['Stack'] = frontendStacks.join(', ');
        }

        if (metrics.autoloadPsr4 > 0 || metrics.autoloadFiles > 0) {
            sections['Autoloading'] = {
                'PSR-4 Namespaces': metrics.autoloadPsr4 || 0,
                'Autoload Files': metrics.autoloadFiles || 0,
            };
        }

        return sections;
    }
}
