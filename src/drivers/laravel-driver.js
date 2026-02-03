import PhpDriver from "./php-driver.js";
import CodeQualityAnalyzer from "../code-quality.js";
import fs from 'node:fs';
import path from 'node:path';

export default class LaravelDriver extends PhpDriver {
    constructor() {
        super();
        this.name = 'Laravel';
        this.priority = 30;
        this.isLaravelProject = false;
        this.codeQualityAnalyzer = new CodeQualityAnalyzer();

        this.laravelPatterns = {
            model: /class\s+(\w+)\s+extends\s+(Model|Authenticatable)/g,
            controller: /class\s+(\w+)\s+extends\s+(Controller|BaseController)/g,
            middleware: /class\s+(\w+)\s+implements\s+Middleware|class\s+(\w+)\s+extends\s+Middleware/g,
            migration: /class\s+(\w+)\s+extends\s+Migration/g,
            seeder: /class\s+(\w+)\s+extends\s+Seeder/g,
            factory: /class\s+(\w+)\s+extends\s+Factory/g,
            job: /class\s+(\w+)\s+implements\s+ShouldQueue/g,
            event: /class\s+(\w+)/g,
            listener: /class\s+(\w+)/g,
            command: /class\s+(\w+)\s+extends\s+Command/g,
            request: /class\s+(\w+)\s+extends\s+(FormRequest|Request)/g,
            resource: /class\s+(\w+)\s+extends\s+JsonResource/g,
            policy: /class\s+(\w+)/g,
            provider: /class\s+(\w+)\s+extends\s+ServiceProvider/g,
            facade: /class\s+(\w+)\s+extends\s+Facade/g,

            eloquentMethod: /(find|findOrFail|where|orWhere|first|get|all|create|update|delete|save)\s*\(/g,
            routeDefinition: /Route::(get|post|put|patch|delete|resource|group)\s*\(/g,
            validation: /validate\s*\(|\$this->validate\s*\(/g,

            sqlInjection: /DB::raw\s*\(|->raw\s*\(/g,
            xssVulnerable: /\{\{\{.*?\}\}\}|\{!!.*?!!\}/g,

            nPlusOne: /foreach.*?->.*?->/g,
            eagerLoading: /->with\s*\(/g,
        };
    }

    canHandle(filePath) {
        const projectRoot = this.findProjectRoot(filePath);
        if (projectRoot && !this.isLaravelProject) {
            this.isLaravelProject = this.detectLaravelProject(projectRoot);
        }

        return this.isLaravelProject && super.canHandle(filePath);
    }

    findProjectRoot(filePath) {
        let dir = path.dirname(filePath);
        while (dir !== path.dirname(dir)) {
            if (fs.existsSync(path.join(dir, 'composer.json'))) {
                return dir;
            }
            dir = path.dirname(dir);
        }
        return null;
    }

    detectLaravelProject(projectRoot) {
        try {
            const composerPath = path.join(projectRoot, 'composer.json');
            if (fs.existsSync(composerPath)) {
                const composer = JSON.parse(fs.readFileSync(composerPath, 'utf8'));
                return !!(composer.require && composer.require['laravel/framework']);
            }
        } catch (error) {
            // Ignore errors
        }
        return false;
    }

    parse(content, filePath) {
        const phpMetrics = super.parse(content, filePath);

        const componentType = this.detectComponentType(filePath, content);
        const projectRoot = this.findProjectRoot(filePath);

        const laravelMetrics = this.analyzeLaravelFeatures(content, filePath);
        const securityIssues = this.analyzeSecurityIssues(content);
        const performanceIssues = this.analyzePerformanceIssues(content);
        const codeQuality = this.analyzeCodeQuality(content, filePath, projectRoot);

        return {
            ...phpMetrics,
            componentType,
            ...laravelMetrics,
            securityIssues,
            performanceIssues,
            codeQuality,
        };
    }

    detectComponentType(filePath, content) {
        const fileName = path.basename(filePath);
        const dirName = path.basename(path.dirname(filePath));

        if (filePath.includes('/Models/') || this.laravelPatterns.model.test(content)) {
            return 'model';
        }
        if (filePath.includes('/Controllers/') || this.laravelPatterns.controller.test(content)) {
            return 'controller';
        }
        if (filePath.includes('/Middleware/') || this.laravelPatterns.middleware.test(content)) {
            return 'middleware';
        }
        if (filePath.includes('/database/migrations/') || this.laravelPatterns.migration.test(content)) {
            return 'migration';
        }
        if (filePath.includes('/database/seeders/') || this.laravelPatterns.seeder.test(content)) {
            return 'seeder';
        }
        if (filePath.includes('/database/factories/') || this.laravelPatterns.factory.test(content)) {
            return 'factory';
        }
        if (filePath.includes('/Jobs/') || this.laravelPatterns.job.test(content)) {
            return 'job';
        }
        if (filePath.includes('/Events/') || this.laravelPatterns.event.test(content)) {
            return 'event';
        }
        if (filePath.includes('/Listeners/') || this.laravelPatterns.listener.test(content)) {
            return 'listener';
        }
        if (filePath.includes('/Console/Commands/') || this.laravelPatterns.command.test(content)) {
            return 'command';
        }
        if (filePath.includes('/Requests/') || this.laravelPatterns.request.test(content)) {
            return 'request';
        }
        if (filePath.includes('/Resources/') || this.laravelPatterns.resource.test(content)) {
            return 'resource';
        }
        if (filePath.includes('/Policies/') || this.laravelPatterns.policy.test(content)) {
            return 'policy';
        }
        if (filePath.includes('/Providers/') || this.laravelPatterns.provider.test(content)) {
            return 'provider';
        }
        if (filePath.includes('/Facades/') || this.laravelPatterns.facade.test(content)) {
            return 'facade';
        }

        return 'php';
    }

    analyzeLaravelFeatures(content, filePath) {
        const models = (content.match(this.laravelPatterns.model) || []).length;
        const controllers = (content.match(this.laravelPatterns.controller) || []).length;
        const middleware = (content.match(this.laravelPatterns.middleware) || []).length;
        const migrations = (content.match(this.laravelPatterns.migration) || []).length;
        const seeders = (content.match(this.laravelPatterns.seeder) || []).length;
        const factories = (content.match(this.laravelPatterns.factory) || []).length;
        const jobs = (content.match(this.laravelPatterns.job) || []).length;
        const events = (content.match(this.laravelPatterns.event) || []).length;
        const listeners = (content.match(this.laravelPatterns.listener) || []).length;
        const commands = (content.match(this.laravelPatterns.command) || []).length;
        const requests = (content.match(this.laravelPatterns.request) || []).length;
        const resources = (content.match(this.laravelPatterns.resource) || []).length;
        const policies = (content.match(this.laravelPatterns.policy) || []).length;
        const providers = (content.match(this.laravelPatterns.provider) || []).length;
        const facades = (content.match(this.laravelPatterns.facade) || []).length;

        const eloquentMethods = (content.match(this.laravelPatterns.eloquentMethod) || []).length;
        const routeDefinitions = (content.match(this.laravelPatterns.routeDefinition) || []).length;
        const validations = (content.match(this.laravelPatterns.validation) || []).length;

        return {
            models,
            controllers,
            middleware,
            migrations,
            seeders,
            factories,
            jobs,
            events,
            listeners,
            commands,
            requests,
            resources,
            policies,
            providers,
            facades,
            eloquentMethods,
            routeDefinitions,
            validations,
        };
    }

    analyzeSecurityIssues(content) {
        const issues = [];

        const sqlRawUsage = content.match(this.laravelPatterns.sqlInjection) || [];
        if (sqlRawUsage.length > 0) {
            issues.push({
                type: 'sql_injection_risk',
                count: sqlRawUsage.length,
                severity: 'high',
                description: 'Potential SQL injection vulnerability with DB::raw() usage'
            });
        }

        const xssVulnerable = content.match(this.laravelPatterns.xssVulnerable) || [];
        if (xssVulnerable.length > 0) {
            issues.push({
                type: 'xss_vulnerability',
                count: xssVulnerable.length,
                severity: 'medium',
                description: 'Unescaped output that may be vulnerable to XSS'
            });
        }

        return issues;
    }

    analyzePerformanceIssues(content) {
        const issues = [];

        const nPlusOnePatterns = content.match(this.laravelPatterns.nPlusOne) || [];
        const eagerLoadingUsage = content.match(this.laravelPatterns.eagerLoading) || [];

        if (nPlusOnePatterns.length > 0 && eagerLoadingUsage.length === 0) {
            issues.push({
                type: 'n_plus_one_query',
                count: nPlusOnePatterns.length,
                severity: 'medium',
                description: 'Potential N+1 query problem - consider using eager loading'
            });
        }

        return issues;
    }

    analyzeCodeQuality(content, filePath, projectRoot = null) {
        const issues = [];
        const analyzer = this.codeQualityAnalyzer;

        try {
            const analysisTarget = projectRoot || path.dirname(filePath);
            const deadCodeResults = analyzer.analyzeDeadCode(analysisTarget);

            const fileDeadCode = this.filterDeadCodeByFile(deadCodeResults, filePath);

            if (fileDeadCode.unusedClasses.length > 0) {
                issues.push({
                    type: 'unused_classes',
                    count: fileDeadCode.unusedClasses.length,
                    severity: 'medium',
                    description: 'Unused classes found',
                    details: fileDeadCode.unusedClasses
                });
            }

            if (fileDeadCode.unusedMethods.length > 0) {
                issues.push({
                    type: 'unused_methods',
                    count: fileDeadCode.unusedMethods.length,
                    severity: 'medium',
                    description: 'Unused methods found',
                    details: fileDeadCode.unusedMethods
                });
            }

            if (fileDeadCode.unusedImports.length > 0) {
                issues.push({
                    type: 'unused_imports',
                    count: fileDeadCode.unusedImports.length,
                    severity: 'low',
                    description: 'Unused imports found',
                    details: fileDeadCode.unusedImports
                });
            }

            if (projectRoot) {
                const duplicateResults = analyzer.analyzeDuplicateCode(projectRoot);
                const fileDuplicates = this.filterDuplicatesByFile(duplicateResults, filePath);

                if (fileDuplicates.length > 0) {
                    issues.push({
                        type: 'duplicate_code',
                        count: fileDuplicates.length,
                        severity: 'medium',
                        description: 'Duplicate code blocks found',
                        details: fileDuplicates
                    });
                }
            }

            issues.push(...this.analyzeLaravelCodeQuality(content, filePath));

        } catch (error) {
            console.warn(`Code quality analysis failed for ${filePath}:`, error.message);
        }

        return issues;
    }

    filterDeadCodeByFile(deadCodeResults, filePath) {
        const filtered = {
            unusedClasses: [],
            unusedMethods: [],
            unusedVariables: [],
            unusedImports: []
        };

        Object.keys(deadCodeResults).forEach(key => {
            filtered[key] = deadCodeResults[key].filter(item =>
                item.file === filePath
            );
        });

        return filtered;
    }

    filterDuplicatesByFile(duplicateResults, filePath) {
        return duplicateResults.filter(duplicate =>
            duplicate.file1 === filePath || duplicate.file2 === filePath
        );
    }

    analyzeLaravelCodeQuality(content, filePath) {
        const issues = [];
        const componentType = this.detectComponentType(filePath, content);

        switch (componentType) {
            case 'model':
                issues.push(...this.analyzeModelQuality(content, filePath));
                break;
            case 'controller':
                issues.push(...this.analyzeControllerQuality(content, filePath));
                break;
            case 'middleware':
                issues.push(...this.analyzeMiddlewareQuality(content, filePath));
                break;
            case 'migration':
                issues.push(...this.analyzeMigrationQuality(content, filePath));
                break;
        }

        issues.push(...this.analyzeGeneralLaravelQuality(content, filePath));

        return issues;
    }

    analyzeModelQuality(content, filePath) {
        const issues = [];

        const fillableMatches = content.match(/protected\s+\$fillable\s*=\s*\[/g);
        const guardedMatches = content.match(/protected\s+\$guarded\s*=\s*\[/g);

        if (!fillableMatches && !guardedMatches) {
            issues.push({
                type: 'mass_assignment_risk',
                severity: 'high',
                description: 'Model missing $fillable or $guarded property - mass assignment vulnerability'
            });
        }

        const hasRelationships = /belongsTo|hasOne|hasMany|belongsToMany|morphTo|morphMany/.test(content);
        const hasTableDefinition = /protected\s+\$table/.test(content);

        if (hasTableDefinition && !hasRelationships) {
            issues.push({
                type: 'potential_missing_relationships',
                severity: 'low',
                description: 'Model has table definition but no defined relationships'
            });
        }

        return issues;
    }

    analyzeControllerQuality(content, filePath) {
        const issues = [];

        const methodCount = (content.match(/public\s+function\s+\w+/g) || []).length;
        if (methodCount > 10) {
            issues.push({
                type: 'fat_controller',
                count: methodCount,
                severity: 'medium',
                description: 'Controller has too many methods - consider refactoring'
            });
        }

        const dbCalls = (content.match(/DB::|\\DB::/g) || []).length;
        if (dbCalls > 0) {
            issues.push({
                type: 'direct_db_access',
                count: dbCalls,
                severity: 'medium',
                description: 'Direct database calls in controller - consider using repositories or services'
            });
        }

        const validationCalls = (content.match(/validate\s*\(|\$this->validate\s*\(|\$request->validate\s*\(/g) || []).length;
        const requestInjection = (content.match(/Request\s+\$\w+/g) || []).length;

        if (requestInjection > 0 && validationCalls === 0) {
            issues.push({
                type: 'missing_validation',
                severity: 'medium',
                description: 'Controller uses Request but no validation found'
            });
        }

        return issues;
    }

    analyzeMiddlewareQuality(content, filePath) {
        const issues = [];

        const handleMethod = content.match(/public\s+function\s+handle\s*\(/);
        if (!handleMethod) {
            issues.push({
                type: 'missing_handle_method',
                severity: 'high',
                description: 'Middleware missing handle() method'
            });
        }

        return issues;
    }

    analyzeMigrationQuality(content, filePath) {
        const issues = [];

        const upMethod = content.match(/public\s+function\s+up\s*\(/);
        const downMethod = content.match(/public\s+function\s+down\s*\(/);

        if (upMethod && !downMethod) {
            issues.push({
                type: 'missing_down_method',
                severity: 'medium',
                description: 'Migration missing down() method - cannot rollback'
            });
        }

        return issues;
    }

    analyzeGeneralLaravelQuality(content, filePath) {
        const issues = [];

        const longChains = (content.match(/->\w+\([^)]*\)->\w+\([^)]*\)->\w+\([^)]*\)->/g) || []).length;
        if (longChains > 0) {
            issues.push({
                type: 'long_method_chains',
                count: longChains,
                severity: 'low',
                description: 'Long method chains detected - consider breaking into smaller steps'
            });
        }

        const chunkUsage = content.match(/chunk\s*\(|cursor\s*\(/g);
        const largeOperations = content.match(/all\s*\(\s*\)\s*->/g);

        if (largeOperations && !chunkUsage) {
            issues.push({
                type: 'potential_memory_leak',
                severity: 'medium',
                description: 'Large dataset operations without chunking - potential memory issue'
            });
        }

        return issues;
    }

    formatMetrics(metrics) {
        const sections = super.formatMetrics(metrics);

        sections['Laravel Components'] = {
            'Models': metrics.models || 0,
            'Controllers': metrics.controllers || 0,
            'Middleware': metrics.middleware || 0,
            'Migrations': metrics.migrations || 0,
            'Seeders': metrics.seeders || 0,
            'Factories': metrics.factories || 0,
            'Jobs': metrics.jobs || 0,
            'Events': metrics.events || 0,
            'Listeners': metrics.listeners || 0,
            'Commands': metrics.commands || 0,
            'Form Requests': metrics.requests || 0,
            'API Resources': metrics.resources || 0,
            'Policies': metrics.policies || 0,
            'Service Providers': metrics.providers || 0,
            'Facades': metrics.facades || 0,
        };

        sections['Laravel Features'] = {
            'Eloquent Method Calls': metrics.eloquentMethods || 0,
            'Route Definitions': metrics.routeDefinitions || 0,
            'Validation Calls': metrics.validations || 0,
        };

        if (metrics.securityIssues && metrics.securityIssues.length > 0) {
            sections['Security Issues'] = {};
            metrics.securityIssues.forEach(issue => {
                sections['Security Issues'][issue.description] = `${issue.count} (${issue.severity})`;
            });
        }

        if (metrics.performanceIssues && metrics.performanceIssues.length > 0) {
            sections['Performance Issues'] = {};
            metrics.performanceIssues.forEach(issue => {
                sections['Performance Issues'][issue.description] = `${issue.count} (${issue.severity})`;
            });
        }

        if (metrics.codeQuality && metrics.codeQuality.length > 0) {
            sections['Code Quality Issues'] = {};
            metrics.codeQuality.forEach(issue => {
                const key = `${issue.type} (${issue.severity})`;
                const value = issue.count ? `${issue.count} occurrences` : issue.description;
                sections['Code Quality Issues'][key] = value;

                if (issue.details && issue.details.length > 0) {
                    issue.details.forEach((detail, index) => {
                        const detailKey = `  ${index + 1}. ${this.formatDetail(detail)}`;
                        sections['Code Quality Issues'][detailKey] = '';
                    });
                }
            });
        }

        return sections;
    }

    formatDetail(detail) {
        if (detail.className) {
            return `Class: ${detail.className} at line ${detail.line}`;
        }
        if (detail.methodName) {
            return `Method: ${detail.methodName} at line ${detail.line}`;
        }
        if (detail.import) {
            return `Import: ${detail.import} at line ${detail.line}`;
        }
        if (detail.similarity) {
            return `Similarity: ${(detail.similarity * 100).toFixed(1)}%`;
        }
        return JSON.stringify(detail);
    }
}
