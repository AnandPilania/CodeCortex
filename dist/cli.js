#!/usr/bin/env node


// src/drivers/base-driver.js
import path from "node:path";
var BaseDriver = class {
    constructor() {
        this.name = "base";
        this.extensions = [];
        this.excludePatterns = [];
        this.includePatterns = [];
        this.priority = 0;
    }
    canHandle(filePath) {
        const ext = path.extname(filePath);
        const fileName = path.basename(filePath);
        if (this.excludePatterns.some((pattern) => fileName.match(pattern))) {
            return false;
        }
        if (this.includePatterns.length > 0) {
            return this.includePatterns.some((pattern) => fileName.match(pattern));
        }
        return this.extensions.includes(ext);
    }
    parse(content, filePath) {
        throw new Error("parse() must be implemented by driver");
    }
    getInitialMetrics() {
        return {
            files: 0,
            loc: 0,
            cloc: 0,
            ncloc: 0,
            lloc: 0
        };
    }
    mergeMetrics(aggregate, fileMetrics) {
        Object.keys(fileMetrics).forEach((key) => {
            if (typeof fileMetrics[key] === "number") {
                aggregate[key] = (aggregate[key] || 0) + fileMetrics[key];
            } else if (Array.isArray(fileMetrics[key])) {
                aggregate[key] = (aggregate[key] || []).concat(fileMetrics[key]);
            } else if (fileMetrics[key] instanceof Set) {
                aggregate[key] = aggregate[key] || /* @__PURE__ */ new Set();
                fileMetrics[key].forEach((item) => aggregate[key].add(item));
            } else if (typeof fileMetrics[key] === "object" && fileMetrics[key] !== null) {
                aggregate[key] = aggregate[key] || {};
                Object.assign(aggregate[key], fileMetrics[key]);
            } else if (typeof fileMetrics[key] === "string") {
                if (!aggregate[key] || aggregate[key] === "unknown" || aggregate[key] === "") {
                    aggregate[key] = fileMetrics[key];
                }
            } else {
                if (aggregate[key] === void 0) {
                    aggregate[key] = fileMetrics[key];
                }
            }
        });
    }
    formatMetrics(metrics) {
        return {};
    }
    removeComments(content, commentPatterns) {
        let clean = content;
        commentPatterns.forEach((pattern) => {
            clean = clean.replace(pattern, "");
        });
        return clean;
    }
    countLines(content, cleanContent) {
        const lines = content.split("\n");
        const cleanLines = cleanContent.split("\n");
        const codeLines = cleanLines.filter((l) => l.trim().length > 0);
        return {
            loc: lines.length,
            cloc: lines.length - codeLines.length,
            ncloc: codeLines.length
        };
    }
    countLogicalLines(content) {
        const semicolons = (content.match(/;/g) || []).length;
        const braces = (content.match(/\{/g) || []).length;
        const keywords = (content.match(/\b(if|for|while|switch|function|class|return)\b/g) || []).length;
        return semicolons + braces + keywords;
    }
    calculateComplexity(content) {
        const patterns = [
            /\bif\b/g,
            /\bfor\b/g,
            /\bwhile\b/g,
            /\bcase\b/g,
            /\bcatch\b/g,
            /&&/g,
            /\|\|/g,
            /\?[^:]/g
        ];
        let complexity = 1;
        patterns.forEach((pattern) => {
            complexity += (content.match(pattern) || []).length;
        });
        return complexity;
    }
};

// src/drivers/php-driver.js
var PhpDriver = class extends BaseDriver {
    constructor() {
        super();
        this.name = "PHP";
        this.extensions = [".php"];
        this.excludePatterns = [/\.blade\.php$/];
        this.priority = 10;
        this.patterns = {
            singleLineComment: /\/\/.*$|#.*$/gm,
            multiLineComment: /\/\*[\s\S]*?\*\//g,
            class: /\b(abstract\s+)?class\s+(\w+)/g,
            interface: /\binterface\s+(\w+)/g,
            trait: /\btrait\s+(\w+)/g,
            namespace: /namespace\s+([\w\\]+)/g,
            method: /(public|private|protected)?\s*(static)?\s*function\s+(\w+)/g,
            function: /^function\s+(\w+)\s*\(/gm,
            useStatement: /^use\s+/gm,
            constant: /const\s+(\w+)/g
        };
    }
    parse(content, filePath) {
        const cleanContent = this.removeComments(content, [
            this.patterns.singleLineComment,
            this.patterns.multiLineComment
        ]);
        const lineMetrics = this.countLines(content, cleanContent);
        const classes = [];
        let match;
        const classPattern = this.patterns.class;
        classPattern.lastIndex = 0;
        while ((match = classPattern.exec(cleanContent)) !== null) {
            classes.push({
                name: match[2],
                abstract: !!match[1]
            });
        }
        const interfaces = [];
        const interfacePattern = this.patterns.interface;
        interfacePattern.lastIndex = 0;
        while ((match = interfacePattern.exec(cleanContent)) !== null) {
            interfaces.push(match[1]);
        }
        const traits = [];
        const traitPattern = this.patterns.trait;
        traitPattern.lastIndex = 0;
        while ((match = traitPattern.exec(cleanContent)) !== null) {
            traits.push(match[1]);
        }
        const namespaces = /* @__PURE__ */ new Set();
        const namespacePattern = this.patterns.namespace;
        namespacePattern.lastIndex = 0;
        while ((match = namespacePattern.exec(cleanContent)) !== null) {
            namespaces.add(match[1]);
        }
        const methods = [];
        const methodPattern = this.patterns.method;
        methodPattern.lastIndex = 0;
        while ((match = methodPattern.exec(cleanContent)) !== null) {
            methods.push({
                name: match[3],
                visibility: match[1] || "public",
                static: !!match[2]
            });
        }
        const functions = [];
        const functionPattern = this.patterns.function;
        functionPattern.lastIndex = 0;
        while ((match = functionPattern.exec(cleanContent)) !== null) {
            functions.push(match[1]);
        }
        const useStatements = (cleanContent.match(this.patterns.useStatement) || []).length;
        const constants = (cleanContent.match(this.patterns.constant) || []).length;
        return {
            ...lineMetrics,
            lloc: this.countLogicalLines(cleanContent),
            classes: classes.length,
            abstractClasses: classes.filter((c) => c.abstract).length,
            concreteClasses: classes.filter((c) => !c.abstract).length,
            interfaces: interfaces.length,
            traits: traits.length,
            namespaces,
            methods: methods.length,
            publicMethods: methods.filter((m) => m.visibility === "public").length,
            protectedMethods: methods.filter((m) => m.visibility === "protected").length,
            privateMethods: methods.filter((m) => m.visibility === "private").length,
            staticMethods: methods.filter((m) => m.static).length,
            nonStaticMethods: methods.filter((m) => !m.static).length,
            functions: functions.length,
            useStatements,
            constants,
            complexity: this.calculateComplexity(cleanContent),
            files: 1
        };
    }
    formatMetrics(metrics) {
        const sections = {};
        sections["Structure"] = {
            "Namespaces": metrics.namespaces ? metrics.namespaces.size : 0,
            "Interfaces": metrics.interfaces || 0,
            "Traits": metrics.traits || 0,
            "Classes": metrics.classes || 0,
            "  Abstract Classes": {
                value: metrics.abstractClasses || 0,
                percentage: metrics.classes > 0 ? metrics.abstractClasses / metrics.classes * 100 : 0
            },
            "  Concrete Classes": {
                value: metrics.concreteClasses || 0,
                percentage: metrics.classes > 0 ? metrics.concreteClasses / metrics.classes * 100 : 0
            }
        };
        if (metrics.methods > 0) {
            sections["Methods"] = {
                "Total Methods": metrics.methods,
                "  Public Methods": {
                    value: metrics.publicMethods || 0,
                    percentage: metrics.publicMethods / metrics.methods * 100
                },
                "  Protected Methods": {
                    value: metrics.protectedMethods || 0,
                    percentage: metrics.protectedMethods / metrics.methods * 100
                },
                "  Private Methods": {
                    value: metrics.privateMethods || 0,
                    percentage: metrics.privateMethods / metrics.methods * 100
                },
                "  Static Methods": {
                    value: metrics.staticMethods || 0,
                    percentage: metrics.staticMethods / metrics.methods * 100
                }
            };
        }
        if (metrics.functions > 0) {
            sections["Functions"] = {
                "Total Functions": metrics.functions
            };
        }
        return sections;
    }
};

// src/drivers/blade-driver.js
var BladeDriver = class extends PhpDriver {
    constructor() {
        super();
        this.name = "Blade";
        this.extensions = [];
        this.includePatterns = [/\.blade\.php$/];
        this.excludePatterns = [];
        this.priority = 20;
        this.bladePatterns = {
            directive: /@(if|elseif|else|endif|foreach|endforeach|for|endfor|while|endwhile|unless|endunless|isset|empty|auth|guest|can|cannot|include|extends|section|endsection|yield|component|slot|push|stack|props|php|endphp)/g,
            echo: /\{\{.*?\}\}/g,
            rawEcho: /\{!!.*?!!\}/g,
            comment: /\{\{--[\s\S]*?--\}\}/g
        };
    }
    parse(content, filePath) {
        const phpMetrics = super.parse(content, filePath);
        const directives = (content.match(this.bladePatterns.directive) || []).length;
        const echos = (content.match(this.bladePatterns.echo) || []).length;
        const rawEchos = (content.match(this.bladePatterns.rawEcho) || []).length;
        const comments = (content.match(this.bladePatterns.comment) || []).length;
        return {
            ...phpMetrics,
            bladeDirectives: directives,
            bladeEchos: echos,
            bladeRawEchos: rawEchos,
            bladeComments: comments
        };
    }
    formatMetrics(metrics) {
        const sections = super.formatMetrics(metrics);
        sections["Blade Features"] = {
            "Directives": metrics.bladeDirectives || 0,
            "Echo Statements": metrics.bladeEchos || 0,
            "Raw Echo Statements": metrics.bladeRawEchos || 0,
            "Blade Comments": metrics.bladeComments || 0
        };
        return sections;
    }
};

// src/drivers/json-driver.js
var JsonDriver = class extends BaseDriver {
    constructor() {
        super();
        this.name = "JSON";
        this.extensions = [".json"];
        this.excludePatterns = [
            /package-lock\.json$/,
            /composer\.lock$/,
            /yarn\.lock$/,
            /tsconfig\.json$/
        ];
        this.priority = 5;
    }
    parse(content, filePath) {
        try {
            const data = JSON.parse(content);
            const lineMetrics = this.countLines(content, content);
            return {
                ...lineMetrics,
                lloc: Object.keys(data).length,
                jsonObjects: 1,
                topLevelKeys: Object.keys(data).length,
                files: 1
            };
        } catch (err) {
            return {
                loc: 0,
                cloc: 0,
                ncloc: 0,
                lloc: 0,
                files: 0,
                parseError: true
            };
        }
    }
    formatMetrics(metrics) {
        if (metrics.parseError)
            return {};
        return {
            "JSON Files": {
                "Valid Files": metrics.jsonObjects || 0,
                "Top Level Keys": metrics.topLevelKeys || 0
            }
        };
    }
};

// src/drivers/composer-json-driver.js
import path2 from "node:path";
import fs from "node:fs";
var ComposerJsonDriver = class extends JsonDriver {
    constructor() {
        super();
        this.name = "composer.json";
        this.extensions = [];
        this.includePatterns = [/composer\.json$/];
        this.excludePatterns = [];
        this.priority = 25;
    }
    parse(content, filePath) {
        const baseMetrics = super.parse(content, filePath);
        try {
            const composer = JSON.parse(content);
            const require2 = composer.require || {};
            const requireDev = composer["require-dev"] || {};
            const allDeps = { ...require2, ...requireDev };
            const phpVersion = require2.php || "unknown";
            const hasLaravel = !!allDeps["laravel/framework"];
            const laravelVersion = allDeps["laravel/framework"] || null;
            const frameworks = {
                laravel: hasLaravel,
                symfony: !!allDeps["symfony/symfony"],
                lumen: !!allDeps["laravel/lumen-framework"],
                cakephp: !!allDeps["cakephp/cakephp"],
                codeigniter: !!allDeps["codeigniter4/framework"]
            };
            const laravelPackages = {
                sanctum: !!allDeps["laravel/sanctum"],
                passport: !!allDeps["laravel/passport"],
                horizon: !!allDeps["laravel/horizon"],
                telescope: !!allDeps["laravel/telescope"],
                breeze: !!allDeps["laravel/breeze"],
                jetstream: !!allDeps["laravel/jetstream"],
                livewire: !!allDeps["livewire/livewire"],
                inertia: !!allDeps["inertiajs/inertia-laravel"]
            };
            const frontendIntegration = {
                inertia: !!allDeps["inertiajs/inertia-laravel"],
                livewire: !!allDeps["livewire/livewire"]
            };
            let hasViteSetup = false;
            const dir = path2.dirname(filePath);
            const packageJsonPath = path2.join(dir, "package.json");
            let viteWithFramework = null;
            if (fs.existsSync(packageJsonPath)) {
                try {
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
                    const pkgDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                    if (pkgDeps["vite"]) {
                        hasViteSetup = true;
                        if (pkgDeps["react"])
                            viteWithFramework = "React";
                        else if (pkgDeps["vue"])
                            viteWithFramework = "Vue";
                    }
                } catch (err) {
                }
            }
            return {
                ...baseMetrics,
                projectName: composer.name || "unknown",
                projectDescription: composer.description || "",
                phpVersion,
                totalDependencies: Object.keys(require2).length,
                totalDevDependencies: Object.keys(requireDev).length,
                frameworks,
                hasLaravel,
                laravelVersion,
                laravelPackages,
                frontendIntegration,
                hasViteSetup,
                viteWithFramework,
                autoloadPsr4: Object.keys(composer.autoload?.["psr-4"] || {}).length,
                autoloadFiles: (composer.autoload?.files || []).length
            };
        } catch (err) {
            return baseMetrics;
        }
    }
    formatMetrics(metrics) {
        if (metrics.parseError)
            return {};
        const sections = {};
        sections["Project Info"] = {
            "Name": metrics.projectName,
            "Description": metrics.projectDescription || "N/A",
            "PHP Version": metrics.phpVersion
        };
        sections["Dependencies"] = {
            "Production Dependencies": metrics.totalDependencies || 0,
            "Dev Dependencies": metrics.totalDevDependencies || 0,
            "Total": (metrics.totalDependencies || 0) + (metrics.totalDevDependencies || 0)
        };
        const detectedFrameworks = [];
        if (metrics.frameworks) {
            Object.entries(metrics.frameworks).forEach(([name, exists]) => {
                if (exists)
                    detectedFrameworks.push(name);
            });
        }
        if (detectedFrameworks.length > 0) {
            sections["PHP Frameworks"] = {
                "Frameworks": detectedFrameworks.join(", ")
            };
            if (metrics.hasLaravel) {
                sections["Laravel Info"] = {
                    "Version": metrics.laravelVersion || "unknown"
                };
            }
        }
        const detectedLaravelPkgs = [];
        if (metrics.laravelPackages) {
            Object.entries(metrics.laravelPackages).forEach(([name, exists]) => {
                if (exists)
                    detectedLaravelPkgs.push(name);
            });
        }
        if (detectedLaravelPkgs.length > 0) {
            sections["Laravel Packages"] = {
                "Packages": detectedLaravelPkgs.join(", ")
            };
        }
        if (metrics.hasViteSetup) {
            sections["Frontend Setup"] = {
                "Build Tool": "Vite",
                "Framework": metrics.viteWithFramework || "None"
            };
        }
        const frontendStacks = [];
        if (metrics.frontendIntegration) {
            if (metrics.frontendIntegration.inertia)
                frontendStacks.push("Inertia.js");
            if (metrics.frontendIntegration.livewire)
                frontendStacks.push("Livewire");
        }
        if (frontendStacks.length > 0) {
            if (!sections["Frontend Setup"])
                sections["Frontend Setup"] = {};
            sections["Frontend Setup"]["Stack"] = frontendStacks.join(", ");
        }
        if (metrics.autoloadPsr4 > 0 || metrics.autoloadFiles > 0) {
            sections["Autoloading"] = {
                "PSR-4 Namespaces": metrics.autoloadPsr4 || 0,
                "Autoload Files": metrics.autoloadFiles || 0
            };
        }
        return sections;
    }
};

// src/drivers/javascript-driver.js
var JavaScriptDriver = class extends BaseDriver {
    constructor() {
        super();
        this.name = "JavaScript";
        this.extensions = [".js", ".mjs", ".cjs"];
        this.priority = 10;
        this.patterns = {
            singleLineComment: /\/\/.*$/gm,
            multiLineComment: /\/\*[\s\S]*?\*\//g,
            class: /\bclass\s+(\w+)/g,
            function: /\bfunction\s+(\w+)\s*\(/g,
            arrowFunction: /(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[\w$]+)\s*=>/g,
            method: /(\w+)\s*\([^)]*\)\s*\{/g,
            import: /\bimport\s+.*?\bfrom\b/g,
            export: /\bexport\s+(default|const|let|var|function|class|{)/g,
            asyncFunction: /\basync\s+(function|\(|[\w$]+\s*=>)/g
        };
    }
    parse(content, filePath) {
        const cleanContent = this.removeComments(content, [
            this.patterns.multiLineComment,
            this.patterns.singleLineComment
        ]);
        const lineMetrics = this.countLines(content, cleanContent);
        const classes = (cleanContent.match(this.patterns.class) || []).length;
        const functions = (cleanContent.match(this.patterns.function) || []).length;
        const arrowFunctions = (cleanContent.match(this.patterns.arrowFunction) || []).length;
        const methods = (cleanContent.match(this.patterns.method) || []).length;
        const imports = (cleanContent.match(this.patterns.import) || []).length;
        const exports = (cleanContent.match(this.patterns.export) || []).length;
        const asyncFunctions = (cleanContent.match(this.patterns.asyncFunction) || []).length;
        return {
            ...lineMetrics,
            lloc: this.countLogicalLines(cleanContent),
            classes,
            functions: functions + arrowFunctions,
            namedFunctions: functions,
            arrowFunctions,
            methods,
            imports,
            exports,
            asyncFunctions,
            complexity: this.calculateComplexity(cleanContent),
            files: 1
        };
    }
    formatMetrics(metrics) {
        const sections = {};
        sections["Structure"] = {
            "Classes": metrics.classes || 0,
            "Functions": metrics.functions || 0,
            "  Named Functions": metrics.namedFunctions || 0,
            "  Arrow Functions": metrics.arrowFunctions || 0,
            "  Async Functions": metrics.asyncFunctions || 0,
            "Methods": metrics.methods || 0
        };
        sections["Dependencies"] = {
            "Imports": metrics.imports || 0,
            "Exports": metrics.exports || 0
        };
        return sections;
    }
};

// src/drivers/package-json-driver.js
import path3 from "node:path";
import fs2 from "node:fs";
var PackageJsonDriver = class extends JsonDriver {
    constructor() {
        super();
        this.name = "package.json";
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
                react: !!allDeps["react"],
                vue: !!allDeps["vue"],
                angular: !!allDeps["@angular/core"],
                svelte: !!allDeps["svelte"],
                nextjs: !!allDeps["next"],
                nuxt: !!allDeps["nuxt"],
                express: !!allDeps["express"],
                nestjs: !!allDeps["@nestjs/core"],
                gatsby: !!allDeps["gatsby"]
            };
            const buildTools = {
                webpack: !!allDeps["webpack"],
                vite: !!allDeps["vite"],
                rollup: !!allDeps["rollup"],
                parcel: !!allDeps["parcel"],
                esbuild: !!allDeps["esbuild"],
                turbopack: !!allDeps["turbopack"]
            };
            const testingFrameworks = {
                jest: !!allDeps["jest"],
                vitest: !!allDeps["vitest"],
                mocha: !!allDeps["mocha"],
                jasmine: !!allDeps["jasmine"],
                cypress: !!allDeps["cypress"],
                playwright: !!allDeps["playwright"]
            };
            const hasTypeScript = !!allDeps["typescript"];
            const uiLibraries = {
                tailwind: !!allDeps["tailwindcss"],
                bootstrap: !!allDeps["bootstrap"],
                materialui: !!allDeps["@mui/material"],
                antd: !!allDeps["antd"],
                chakra: !!allDeps["@chakra-ui/react"]
            };
            return {
                ...baseMetrics,
                projectName: pkg.name || "unknown",
                projectVersion: pkg.version || "unknown",
                packageManager: this.detectPackageManager(filePath),
                totalDependencies: Object.keys(dependencies).length,
                totalDevDependencies: Object.keys(devDependencies).length,
                totalPeerDependencies: Object.keys(peerDependencies).length,
                frameworks,
                buildTools,
                testingFrameworks,
                hasTypeScript,
                uiLibraries,
                scripts: Object.keys(pkg.scripts || {}).length
            };
        } catch (err) {
            return baseMetrics;
        }
    }
    detectPackageManager(filePath) {
        const dir = path3.dirname(filePath);
        if (fs2.existsSync(path3.join(dir, "yarn.lock")))
            return "yarn";
        if (fs2.existsSync(path3.join(dir, "pnpm-lock.yaml")))
            return "pnpm";
        if (fs2.existsSync(path3.join(dir, "package-lock.json")))
            return "npm";
        return "unknown";
    }
    formatMetrics(metrics) {
        if (metrics.parseError)
            return {};
        const sections = {};
        sections["Project Info"] = {
            "Name": metrics.projectName,
            "Version": metrics.projectVersion,
            "Package Manager": metrics.packageManager,
            "Scripts": metrics.scripts || 0
        };
        sections["Dependencies"] = {
            "Production Dependencies": metrics.totalDependencies || 0,
            "Dev Dependencies": metrics.totalDevDependencies || 0,
            "Peer Dependencies": metrics.totalPeerDependencies || 0,
            "Total": (metrics.totalDependencies || 0) + (metrics.totalDevDependencies || 0) + (metrics.totalPeerDependencies || 0)
        };
        const detectedFrameworks = [];
        if (metrics.frameworks) {
            Object.entries(metrics.frameworks).forEach(([name, exists]) => {
                if (exists)
                    detectedFrameworks.push(name);
            });
        }
        if (detectedFrameworks.length > 0) {
            sections["Detected Frameworks"] = {
                "Frameworks": detectedFrameworks.join(", "),
                "TypeScript": metrics.hasTypeScript ? "Yes" : "No"
            };
        }
        const detectedBuildTools = [];
        if (metrics.buildTools) {
            Object.entries(metrics.buildTools).forEach(([name, exists]) => {
                if (exists)
                    detectedBuildTools.push(name);
            });
        }
        if (detectedBuildTools.length > 0) {
            sections["Build Tools"] = {
                "Tools": detectedBuildTools.join(", ")
            };
        }
        const detectedTesting = [];
        if (metrics.testingFrameworks) {
            Object.entries(metrics.testingFrameworks).forEach(([name, exists]) => {
                if (exists)
                    detectedTesting.push(name);
            });
        }
        if (detectedTesting.length > 0) {
            sections["Testing"] = {
                "Frameworks": detectedTesting.join(", ")
            };
        }
        const detectedUI = [];
        if (metrics.uiLibraries) {
            Object.entries(metrics.uiLibraries).forEach(([name, exists]) => {
                if (exists)
                    detectedUI.push(name);
            });
        }
        if (detectedUI.length > 0) {
            sections["UI Libraries"] = {
                "Libraries": detectedUI.join(", ")
            };
        }
        return sections;
    }
};

// src/drivers/react-driver.js
var ReactDriver = class extends JavaScriptDriver {
    constructor() {
        super();
        this.name = "React";
        this.extensions = [".jsx"];
        this.priority = 20;
        this.reactPatterns = {
            component: /(?:class\s+(\w+)\s+extends\s+(?:React\.)?(?:Component|PureComponent)|(?:function|const|let|var)\s+([A-Z]\w+)\s*=)/g,
            hook: /\buse[A-Z]\w*/g,
            useState: /useState/g,
            useEffect: /useEffect/g,
            useContext: /useContext/g,
            useMemo: /useMemo/g,
            useCallback: /useCallback/g,
            useRef: /useRef/g,
            jsxElement: /<[A-Z]\w+/g,
            props: /\bprops\./g,
            propsDestructure: /\{\s*[\w\s,]+\s*\}\s*=\s*props/g
        };
    }
    parse(content, filePath) {
        const jsMetrics = super.parse(content, filePath);
        const cleanContent = this.removeComments(content, [
            this.patterns.multiLineComment,
            this.patterns.singleLineComment
        ]);
        const components = (cleanContent.match(this.reactPatterns.component) || []).length;
        const hooks = new Set(cleanContent.match(this.reactPatterns.hook) || []).size;
        const useState = (cleanContent.match(this.reactPatterns.useState) || []).length;
        const useEffect = (cleanContent.match(this.reactPatterns.useEffect) || []).length;
        const useContext = (cleanContent.match(this.reactPatterns.useContext) || []).length;
        const useMemo = (cleanContent.match(this.reactPatterns.useMemo) || []).length;
        const useCallback = (cleanContent.match(this.reactPatterns.useCallback) || []).length;
        const useRef = (cleanContent.match(this.reactPatterns.useRef) || []).length;
        const jsxElements = (cleanContent.match(this.reactPatterns.jsxElement) || []).length;
        const propsUsage = (cleanContent.match(this.reactPatterns.props) || []).length;
        return {
            ...jsMetrics,
            components,
            hooks,
            useState,
            useEffect,
            useContext,
            useMemo,
            useCallback,
            useRef,
            jsxElements,
            propsUsage
        };
    }
    formatMetrics(metrics) {
        const sections = super.formatMetrics(metrics);
        sections["React Structure"] = {
            "Components": metrics.components || 0,
            "JSX Elements": metrics.jsxElements || 0,
            "Props Usage": metrics.propsUsage || 0
        };
        sections["React Hooks"] = {
            "Unique Hooks": metrics.hooks || 0,
            "useState": metrics.useState || 0,
            "useEffect": metrics.useEffect || 0,
            "useContext": metrics.useContext || 0,
            "useMemo": metrics.useMemo || 0,
            "useCallback": metrics.useCallback || 0,
            "useRef": metrics.useRef || 0
        };
        return sections;
    }
};

// src/drivers/typescript-driver.js
var TypeScriptDriver = class extends JavaScriptDriver {
    constructor() {
        super();
        this.name = "TypeScript";
        this.extensions = [".ts"];
        this.priority = 15;
        this.tsPatterns = {
            interface: /\binterface\s+(\w+)/g,
            type: /\btype\s+(\w+)\s*=/g,
            enum: /\benum\s+(\w+)/g,
            decorator: /@\w+/g,
            generic: /<[^>]+>/g
        };
    }
    parse(content, filePath) {
        const jsMetrics = super.parse(content, filePath);
        const cleanContent = this.removeComments(content, [
            this.patterns.multiLineComment,
            this.patterns.singleLineComment
        ]);
        const interfaces = (cleanContent.match(this.tsPatterns.interface) || []).length;
        const types = (cleanContent.match(this.tsPatterns.type) || []).length;
        const enums = (cleanContent.match(this.tsPatterns.enum) || []).length;
        const decorators = (cleanContent.match(this.tsPatterns.decorator) || []).length;
        const generics = (cleanContent.match(this.tsPatterns.generic) || []).length;
        return {
            ...jsMetrics,
            interfaces,
            types,
            enums,
            decorators,
            generics
        };
    }
    formatMetrics(metrics) {
        const sections = super.formatMetrics(metrics);
        sections["TypeScript Features"] = {
            "Interfaces": metrics.interfaces || 0,
            "Type Aliases": metrics.types || 0,
            "Enums": metrics.enums || 0,
            "Decorators": metrics.decorators || 0,
            "Generic Usage": metrics.generics || 0
        };
        return sections;
    }
};

// src/drivers/react-typescript-driver.js
var ReactTypeScriptDriver = class extends TypeScriptDriver {
    constructor() {
        super();
        this.name = "React TypeScript";
        this.extensions = [".tsx"];
        this.priority = 25;
        const reactDriver = new ReactDriver();
        this.reactPatterns = reactDriver.reactPatterns;
    }
    parse(content, filePath) {
        const tsMetrics = super.parse(content, filePath);
        const cleanContent = this.removeComments(content, [
            this.patterns.multiLineComment,
            this.patterns.singleLineComment
        ]);
        const components = (cleanContent.match(this.reactPatterns.component) || []).length;
        const hooks = new Set(cleanContent.match(this.reactPatterns.hook) || []).size;
        const useState = (cleanContent.match(this.reactPatterns.useState) || []).length;
        const useEffect = (cleanContent.match(this.reactPatterns.useEffect) || []).length;
        const jsxElements = (cleanContent.match(this.reactPatterns.jsxElement) || []).length;
        const propsUsage = (cleanContent.match(this.reactPatterns.props) || []).length;
        return {
            ...tsMetrics,
            components,
            hooks,
            useState,
            useEffect,
            jsxElements,
            propsUsage
        };
    }
    formatMetrics(metrics) {
        const sections = super.formatMetrics(metrics);
        sections["React Structure"] = {
            "Components": metrics.components || 0,
            "JSX Elements": metrics.jsxElements || 0,
            "Props Usage": metrics.propsUsage || 0
        };
        sections["React Hooks"] = {
            "Unique Hooks": metrics.hooks || 0,
            "useState": metrics.useState || 0,
            "useEffect": metrics.useEffect || 0
        };
        return sections;
    }
};

// src/drivers/vue-driver.js
var VueDriver = class extends JavaScriptDriver {
    constructor() {
        super();
        this.name = "Vue";
        this.extensions = [".vue"];
        this.priority = 20;
        this.vuePatterns = {
            template: /<template>([\s\S]*?)<\/template>/,
            script: /<script.*?>([\s\S]*?)<\/script>/,
            style: /<style.*?>([\s\S]*?)<\/style>/,
            scriptSetup: /<script\s+setup/,
            data: /\bdata\s*\(\s*\)\s*\{/g,
            methods: /\bmethods\s*:\s*\{/g,
            computed: /\bcomputed\s*:\s*\{/g,
            props: /\bprops\s*:\s*\{/g,
            watch: /\bwatch\s*:\s*\{/g,
            vDirective: /\bv-\w+/g,
            ref: /\bref\(/g,
            reactive: /\breactive\(/g
        };
    }
    parse(content, filePath) {
        const lineMetrics = this.countLines(content, content);
        const templateMatch = content.match(this.vuePatterns.template);
        const scriptMatch = content.match(this.vuePatterns.script);
        const styleMatch = content.match(this.vuePatterns.style);
        const scriptSetup = this.vuePatterns.scriptSetup.test(content);
        let jsMetrics = {
            functions: 0,
            imports: 0,
            exports: 0
        };
        if (scriptMatch) {
            const scriptContent = scriptMatch[1];
            jsMetrics = super.parse(scriptContent, filePath);
        }
        let vueMetrics = {
            data: 0,
            methods: 0,
            computed: 0,
            props: 0,
            watch: 0,
            ref: 0,
            reactive: 0
        };
        if (scriptMatch) {
            const scriptContent = scriptMatch[1];
            vueMetrics = {
                data: (scriptContent.match(this.vuePatterns.data) || []).length,
                methods: (scriptContent.match(this.vuePatterns.methods) || []).length,
                computed: (scriptContent.match(this.vuePatterns.computed) || []).length,
                props: (scriptContent.match(this.vuePatterns.props) || []).length,
                watch: (scriptContent.match(this.vuePatterns.watch) || []).length,
                ref: (scriptContent.match(this.vuePatterns.ref) || []).length,
                reactive: (scriptContent.match(this.vuePatterns.reactive) || []).length
            };
        }
        const vDirectives = (content.match(this.vuePatterns.vDirective) || []).length;
        return {
            ...lineMetrics,
            ...jsMetrics,
            lloc: this.countLogicalLines(content),
            components: 1,
            hasTemplate: !!templateMatch,
            hasScript: !!scriptMatch,
            hasStyle: !!styleMatch,
            scriptSetup,
            ...vueMetrics,
            vDirectives,
            files: 1
        };
    }
    formatMetrics(metrics) {
        const sections = super.formatMetrics(metrics);
        sections["Vue Components"] = {
            "Total Components": metrics.components || 0,
            "With Template": metrics.hasTemplate ? metrics.components : 0,
            "With Script": metrics.hasScript ? metrics.components : 0,
            "With Style": metrics.hasStyle ? metrics.components : 0,
            "Script Setup": metrics.scriptSetup ? metrics.components : 0
        };
        sections["Vue Options API"] = {
            "Data": metrics.data || 0,
            "Methods": metrics.methods || 0,
            "Computed": metrics.computed || 0,
            "Props": metrics.props || 0,
            "Watch": metrics.watch || 0
        };
        sections["Vue Composition API"] = {
            "ref()": metrics.ref || 0,
            "reactive()": metrics.reactive || 0
        };
        sections["Vue Directives"] = {
            "Directive Usage": metrics.vDirectives || 0
        };
        return sections;
    }
};

// src/code-quality.js
import fs3 from "node:fs";
import path4 from "node:path";
import crypto from "node:crypto";
var CodeQualityAnalyzer = class {
    constructor() {
        this.deadCodePatterns = {
            unusedImports: /^use\s+([^;]+);/gm,
            unusedVariables: /\$(\w+)\s*=/g,
            unusedMethods: /(?:public|private|protected)\s+function\s+(\w+)/g,
            unusedClasses: /class\s+(\w+)/g
        };
        this.duplicateThreshold = 0.8;
        this.minDuplicateLines = 5;
    }
    analyzeDeadCode(projectPath) {
        const results = {
            unusedClasses: [],
            unusedMethods: [],
            unusedVariables: [],
            unusedImports: []
        };
        const phpFiles = this.isDirectory(projectPath) ? this.findPhpFiles(projectPath) : [projectPath];
        const allCode = this.readAllFiles(phpFiles);
        const analysisContext = this.isDirectory(projectPath) ? allCode : this.getExtendedContext(projectPath, allCode);
        results.unusedClasses = this.findUnusedClasses(analysisContext, phpFiles);
        results.unusedMethods = this.findUnusedMethods(analysisContext, phpFiles);
        results.unusedImports = this.findUnusedImports(analysisContext, phpFiles);
        return results;
    }
    analyzeDuplicateCode(projectPath) {
        const phpFiles = this.isDirectory(projectPath) ? this.findPhpFiles(projectPath) : [projectPath];
        const duplicates = [];
        if (!this.isDirectory(projectPath)) {
            return this.findInternalDuplicates(phpFiles[0]);
        }
        for (let i = 0; i < phpFiles.length; i++) {
            for (let j = i + 1; j < phpFiles.length; j++) {
                const file1Content = fs3.readFileSync(phpFiles[i], "utf8");
                const file2Content = fs3.readFileSync(phpFiles[j], "utf8");
                const similarities = this.findSimilarBlocks(file1Content, file2Content);
                if (similarities.length > 0) {
                    duplicates.push({
                        file1: phpFiles[i],
                        file2: phpFiles[j],
                        similarities
                    });
                }
            }
        }
        return duplicates;
    }
    isDirectory(path9) {
        try {
            return fs3.statSync(path9).isDirectory();
        } catch (error) {
            return false;
        }
    }
    findPhpFiles(dir) {
        const files = [];
        if (!this.isDirectory(dir)) {
            return dir.endsWith(".php") ? [dir] : [];
        }
        const items = fs3.readdirSync(dir);
        for (const item of items) {
            const fullPath = path4.join(dir, item);
            const stat = fs3.statSync(fullPath);
            if (this.shouldIgnore(item))
                continue;
            if (stat.isDirectory()) {
                files.push(...this.findPhpFiles(fullPath));
            } else if (item.endsWith(".php")) {
                files.push(fullPath);
            }
        }
        return files;
    }
    shouldIgnore(name) {
        const ignoreList = ["vendor", "node_modules", ".git", "storage", "bootstrap/cache"];
        return ignoreList.includes(name) || name.startsWith(".");
    }
    readAllFiles(files) {
        const allCode = /* @__PURE__ */ new Map();
        files.forEach((file) => {
            try {
                if (!fs3.existsSync(file)) {
                    console.warn(`File does not exist: ${file}`);
                    return;
                }
                const content = fs3.readFileSync(file, "utf8");
                allCode.set(file, content);
            } catch (error) {
                console.warn(`Could not read file: ${file}`, error.message);
            }
        });
        return allCode;
    }
    getExtendedContext(filePath, allCode) {
        const extendedContext = new Map(allCode);
        const dir = path4.dirname(filePath);
        if (this.isDirectory(dir)) {
            const relatedFiles = this.findPhpFiles(dir);
            relatedFiles.forEach((relatedFile) => {
                if (!extendedContext.has(relatedFile)) {
                    try {
                        const content = fs3.readFileSync(relatedFile, "utf8");
                        extendedContext.set(relatedFile, content);
                    } catch (error) {
                    }
                }
            });
        }
        return extendedContext;
    }
    findInternalDuplicates(filePath) {
        const duplicates = [];
        const content = fs3.readFileSync(filePath, "utf8");
        const lines = content.split("\n");
        for (let i = 0; i < lines.length - this.minDuplicateLines; i++) {
            for (let j = i + this.minDuplicateLines; j < lines.length - this.minDuplicateLines; j++) {
                const block1 = lines.slice(i, i + this.minDuplicateLines).join("\n");
                const block2 = lines.slice(j, j + this.minDuplicateLines).join("\n");
                const similarity = this.calculateSimilarity(block1, block2);
                if (similarity >= this.duplicateThreshold) {
                    duplicates.push({
                        similarity,
                        block1: {
                            startLine: i + 1,
                            endLine: i + this.minDuplicateLines,
                            content: block1
                        },
                        block2: {
                            startLine: j + 1,
                            endLine: j + this.minDuplicateLines,
                            content: block2
                        }
                    });
                }
            }
        }
        return [{
            file1: filePath,
            file2: filePath,
            similarities: duplicates
        }];
    }
    findUnusedClasses(allCode, files) {
        const unusedClasses = [];
        const allContent = Array.from(allCode.values()).join("\n");
        allCode.forEach((content, filePath) => {
            const classMatches = content.match(/class\s+(\w+)/g) || [];
            classMatches.forEach((match) => {
                const className = match.replace("class ", "");
                const regex = new RegExp(`\\b${className}\\b`, "g");
                const occurrences = (allContent.match(regex) || []).length;
                if (occurrences <= 1) {
                    unusedClasses.push({
                        className,
                        file: filePath,
                        line: this.getLineNumber(content, match)
                    });
                }
            });
        });
        return unusedClasses;
    }
    findUnusedMethods(allCode, files) {
        const unusedMethods = [];
        const allContent = Array.from(allCode.values()).join("\n");
        allCode.forEach((content, filePath) => {
            const methodMatches = content.match(/(?:public|private|protected)\s+function\s+(\w+)/g) || [];
            methodMatches.forEach((match) => {
                const methodName = match.match(/function\s+(\w+)/)[1];
                if (this.isSpecialMethod(methodName))
                    return;
                const callRegex = new RegExp(`->${methodName}\\s*\\(|${methodName}\\s*\\(`, "g");
                const calls = (allContent.match(callRegex) || []).length;
                if (calls <= 1) {
                    unusedMethods.push({
                        methodName,
                        file: filePath,
                        line: this.getLineNumber(content, match)
                    });
                }
            });
        });
        return unusedMethods;
    }
    findUnusedImports(allCode, files) {
        const unusedImports = [];
        allCode.forEach((content, filePath) => {
            const importMatches = content.match(/^use\s+([^;]+);/gm) || [];
            importMatches.forEach((match) => {
                const importPath = match.replace(/^use\s+/, "").replace(";", "");
                const className = importPath.split("\\").pop();
                const classUsageRegex = new RegExp(`\\b${className}\\b`, "g");
                const usages = (content.match(classUsageRegex) || []).length;
                if (usages <= 1) {
                    unusedImports.push({
                        import: importPath,
                        file: filePath,
                        line: this.getLineNumber(content, match)
                    });
                }
            });
        });
        return unusedImports;
    }
    findSimilarBlocks(content1, content2) {
        const lines1 = content1.split("\n");
        const lines2 = content2.split("\n");
        const similarities = [];
        for (let i = 0; i < lines1.length - this.minDuplicateLines; i++) {
            for (let j = 0; j < lines2.length - this.minDuplicateLines; j++) {
                const block1 = lines1.slice(i, i + this.minDuplicateLines).join("\n");
                const block2 = lines2.slice(j, j + this.minDuplicateLines).join("\n");
                const similarity = this.calculateSimilarity(block1, block2);
                if (similarity >= this.duplicateThreshold) {
                    similarities.push({
                        similarity,
                        block1: {
                            startLine: i + 1,
                            endLine: i + this.minDuplicateLines,
                            content: block1
                        },
                        block2: {
                            startLine: j + 1,
                            endLine: j + this.minDuplicateLines,
                            content: block2
                        }
                    });
                }
            }
        }
        return similarities;
    }
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0)
            return 1;
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
    isSpecialMethod(methodName) {
        const specialMethods = [
            "__construct",
            "__destruct",
            "__call",
            "__callStatic",
            "__get",
            "__set",
            "__isset",
            "__unset",
            "__sleep",
            "__wakeup",
            "__toString",
            "__invoke",
            "__set_state",
            "__clone",
            "__debugInfo",
            "index",
            "create",
            "store",
            "show",
            "edit",
            "update",
            "destroy",
            "handle",
            "boot",
            "register",
            "up",
            "down",
            "run"
        ];
        return specialMethods.includes(methodName);
    }
    getLineNumber(content, searchString) {
        const lines = content.substring(0, content.indexOf(searchString)).split("\n");
        return lines.length;
    }
    generateHash(content) {
        return crypto.createHash("md5").update(content).digest("hex");
    }
    analyzeFile(filePath, includeRelatedFiles = true) {
        if (!fs3.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        if (!filePath.endsWith(".php")) {
            throw new Error(`File is not a PHP file: ${filePath}`);
        }
        const deadCodeResults = this.analyzeDeadCode(filePath);
        const duplicateResults = this.analyzeDuplicateCode(filePath);
        return {
            file: filePath,
            deadCode: deadCodeResults,
            duplicates: duplicateResults
        };
    }
    analyzeDirectory(dirPath) {
        if (!this.isDirectory(dirPath)) {
            throw new Error(`Path is not a directory: ${dirPath}`);
        }
        const deadCodeResults = this.analyzeDeadCode(dirPath);
        const duplicateResults = this.analyzeDuplicateCode(dirPath);
        return {
            directory: dirPath,
            deadCode: deadCodeResults,
            duplicates: duplicateResults
        };
    }
};

// src/drivers/laravel-driver.js
import fs4 from "node:fs";
import path5 from "node:path";
var LaravelDriver = class extends PhpDriver {
    constructor() {
        super();
        this.name = "Laravel";
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
            eagerLoading: /->with\s*\(/g
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
        let dir = path5.dirname(filePath);
        while (dir !== path5.dirname(dir)) {
            if (fs4.existsSync(path5.join(dir, "composer.json"))) {
                return dir;
            }
            dir = path5.dirname(dir);
        }
        return null;
    }
    detectLaravelProject(projectRoot) {
        try {
            const composerPath = path5.join(projectRoot, "composer.json");
            if (fs4.existsSync(composerPath)) {
                const composer = JSON.parse(fs4.readFileSync(composerPath, "utf8"));
                return !!(composer.require && composer.require["laravel/framework"]);
            }
        } catch (error) {
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
            codeQuality
        };
    }
    detectComponentType(filePath, content) {
        const fileName = path5.basename(filePath);
        const dirName = path5.basename(path5.dirname(filePath));
        if (filePath.includes("/Models/") || this.laravelPatterns.model.test(content)) {
            return "model";
        }
        if (filePath.includes("/Controllers/") || this.laravelPatterns.controller.test(content)) {
            return "controller";
        }
        if (filePath.includes("/Middleware/") || this.laravelPatterns.middleware.test(content)) {
            return "middleware";
        }
        if (filePath.includes("/database/migrations/") || this.laravelPatterns.migration.test(content)) {
            return "migration";
        }
        if (filePath.includes("/database/seeders/") || this.laravelPatterns.seeder.test(content)) {
            return "seeder";
        }
        if (filePath.includes("/database/factories/") || this.laravelPatterns.factory.test(content)) {
            return "factory";
        }
        if (filePath.includes("/Jobs/") || this.laravelPatterns.job.test(content)) {
            return "job";
        }
        if (filePath.includes("/Events/") || this.laravelPatterns.event.test(content)) {
            return "event";
        }
        if (filePath.includes("/Listeners/") || this.laravelPatterns.listener.test(content)) {
            return "listener";
        }
        if (filePath.includes("/Console/Commands/") || this.laravelPatterns.command.test(content)) {
            return "command";
        }
        if (filePath.includes("/Requests/") || this.laravelPatterns.request.test(content)) {
            return "request";
        }
        if (filePath.includes("/Resources/") || this.laravelPatterns.resource.test(content)) {
            return "resource";
        }
        if (filePath.includes("/Policies/") || this.laravelPatterns.policy.test(content)) {
            return "policy";
        }
        if (filePath.includes("/Providers/") || this.laravelPatterns.provider.test(content)) {
            return "provider";
        }
        if (filePath.includes("/Facades/") || this.laravelPatterns.facade.test(content)) {
            return "facade";
        }
        return "php";
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
            validations
        };
    }
    analyzeSecurityIssues(content) {
        const issues = [];
        const sqlRawUsage = content.match(this.laravelPatterns.sqlInjection) || [];
        if (sqlRawUsage.length > 0) {
            issues.push({
                type: "sql_injection_risk",
                count: sqlRawUsage.length,
                severity: "high",
                description: "Potential SQL injection vulnerability with DB::raw() usage"
            });
        }
        const xssVulnerable = content.match(this.laravelPatterns.xssVulnerable) || [];
        if (xssVulnerable.length > 0) {
            issues.push({
                type: "xss_vulnerability",
                count: xssVulnerable.length,
                severity: "medium",
                description: "Unescaped output that may be vulnerable to XSS"
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
                type: "n_plus_one_query",
                count: nPlusOnePatterns.length,
                severity: "medium",
                description: "Potential N+1 query problem - consider using eager loading"
            });
        }
        return issues;
    }
    analyzeCodeQuality(content, filePath, projectRoot = null) {
        const issues = [];
        const analyzer = this.codeQualityAnalyzer;
        try {
            const analysisTarget = projectRoot || path5.dirname(filePath);
            const deadCodeResults = analyzer.analyzeDeadCode(analysisTarget);
            const fileDeadCode = this.filterDeadCodeByFile(deadCodeResults, filePath);
            if (fileDeadCode.unusedClasses.length > 0) {
                issues.push({
                    type: "unused_classes",
                    count: fileDeadCode.unusedClasses.length,
                    severity: "medium",
                    description: "Unused classes found",
                    details: fileDeadCode.unusedClasses
                });
            }
            if (fileDeadCode.unusedMethods.length > 0) {
                issues.push({
                    type: "unused_methods",
                    count: fileDeadCode.unusedMethods.length,
                    severity: "medium",
                    description: "Unused methods found",
                    details: fileDeadCode.unusedMethods
                });
            }
            if (fileDeadCode.unusedImports.length > 0) {
                issues.push({
                    type: "unused_imports",
                    count: fileDeadCode.unusedImports.length,
                    severity: "low",
                    description: "Unused imports found",
                    details: fileDeadCode.unusedImports
                });
            }
            if (projectRoot) {
                const duplicateResults = analyzer.analyzeDuplicateCode(projectRoot);
                const fileDuplicates = this.filterDuplicatesByFile(duplicateResults, filePath);
                if (fileDuplicates.length > 0) {
                    issues.push({
                        type: "duplicate_code",
                        count: fileDuplicates.length,
                        severity: "medium",
                        description: "Duplicate code blocks found",
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
        Object.keys(deadCodeResults).forEach((key) => {
            filtered[key] = deadCodeResults[key].filter(
                (item) => item.file === filePath
            );
        });
        return filtered;
    }
    filterDuplicatesByFile(duplicateResults, filePath) {
        return duplicateResults.filter(
            (duplicate) => duplicate.file1 === filePath || duplicate.file2 === filePath
        );
    }
    analyzeLaravelCodeQuality(content, filePath) {
        const issues = [];
        const componentType = this.detectComponentType(filePath, content);
        switch (componentType) {
            case "model":
                issues.push(...this.analyzeModelQuality(content, filePath));
                break;
            case "controller":
                issues.push(...this.analyzeControllerQuality(content, filePath));
                break;
            case "middleware":
                issues.push(...this.analyzeMiddlewareQuality(content, filePath));
                break;
            case "migration":
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
                type: "mass_assignment_risk",
                severity: "high",
                description: "Model missing $fillable or $guarded property - mass assignment vulnerability"
            });
        }
        const hasRelationships = /belongsTo|hasOne|hasMany|belongsToMany|morphTo|morphMany/.test(content);
        const hasTableDefinition = /protected\s+\$table/.test(content);
        if (hasTableDefinition && !hasRelationships) {
            issues.push({
                type: "potential_missing_relationships",
                severity: "low",
                description: "Model has table definition but no defined relationships"
            });
        }
        return issues;
    }
    analyzeControllerQuality(content, filePath) {
        const issues = [];
        const methodCount = (content.match(/public\s+function\s+\w+/g) || []).length;
        if (methodCount > 10) {
            issues.push({
                type: "fat_controller",
                count: methodCount,
                severity: "medium",
                description: "Controller has too many methods - consider refactoring"
            });
        }
        const dbCalls = (content.match(/DB::|\\DB::/g) || []).length;
        if (dbCalls > 0) {
            issues.push({
                type: "direct_db_access",
                count: dbCalls,
                severity: "medium",
                description: "Direct database calls in controller - consider using repositories or services"
            });
        }
        const validationCalls = (content.match(/validate\s*\(|\$this->validate\s*\(|\$request->validate\s*\(/g) || []).length;
        const requestInjection = (content.match(/Request\s+\$\w+/g) || []).length;
        if (requestInjection > 0 && validationCalls === 0) {
            issues.push({
                type: "missing_validation",
                severity: "medium",
                description: "Controller uses Request but no validation found"
            });
        }
        return issues;
    }
    analyzeMiddlewareQuality(content, filePath) {
        const issues = [];
        const handleMethod = content.match(/public\s+function\s+handle\s*\(/);
        if (!handleMethod) {
            issues.push({
                type: "missing_handle_method",
                severity: "high",
                description: "Middleware missing handle() method"
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
                type: "missing_down_method",
                severity: "medium",
                description: "Migration missing down() method - cannot rollback"
            });
        }
        return issues;
    }
    analyzeGeneralLaravelQuality(content, filePath) {
        const issues = [];
        const longChains = (content.match(/->\w+\([^)]*\)->\w+\([^)]*\)->\w+\([^)]*\)->/g) || []).length;
        if (longChains > 0) {
            issues.push({
                type: "long_method_chains",
                count: longChains,
                severity: "low",
                description: "Long method chains detected - consider breaking into smaller steps"
            });
        }
        const chunkUsage = content.match(/chunk\s*\(|cursor\s*\(/g);
        const largeOperations = content.match(/all\s*\(\s*\)\s*->/g);
        if (largeOperations && !chunkUsage) {
            issues.push({
                type: "potential_memory_leak",
                severity: "medium",
                description: "Large dataset operations without chunking - potential memory issue"
            });
        }
        return issues;
    }
    formatMetrics(metrics) {
        const sections = super.formatMetrics(metrics);
        sections["Laravel Components"] = {
            "Models": metrics.models || 0,
            "Controllers": metrics.controllers || 0,
            "Middleware": metrics.middleware || 0,
            "Migrations": metrics.migrations || 0,
            "Seeders": metrics.seeders || 0,
            "Factories": metrics.factories || 0,
            "Jobs": metrics.jobs || 0,
            "Events": metrics.events || 0,
            "Listeners": metrics.listeners || 0,
            "Commands": metrics.commands || 0,
            "Form Requests": metrics.requests || 0,
            "API Resources": metrics.resources || 0,
            "Policies": metrics.policies || 0,
            "Service Providers": metrics.providers || 0,
            "Facades": metrics.facades || 0
        };
        sections["Laravel Features"] = {
            "Eloquent Method Calls": metrics.eloquentMethods || 0,
            "Route Definitions": metrics.routeDefinitions || 0,
            "Validation Calls": metrics.validations || 0
        };
        if (metrics.securityIssues && metrics.securityIssues.length > 0) {
            sections["Security Issues"] = {};
            metrics.securityIssues.forEach((issue) => {
                sections["Security Issues"][issue.description] = `${issue.count} (${issue.severity})`;
            });
        }
        if (metrics.performanceIssues && metrics.performanceIssues.length > 0) {
            sections["Performance Issues"] = {};
            metrics.performanceIssues.forEach((issue) => {
                sections["Performance Issues"][issue.description] = `${issue.count} (${issue.severity})`;
            });
        }
        if (metrics.codeQuality && metrics.codeQuality.length > 0) {
            sections["Code Quality Issues"] = {};
            metrics.codeQuality.forEach((issue) => {
                const key = `${issue.type} (${issue.severity})`;
                const value = issue.count ? `${issue.count} occurrences` : issue.description;
                sections["Code Quality Issues"][key] = value;
                if (issue.details && issue.details.length > 0) {
                    issue.details.forEach((detail, index) => {
                        const detailKey = `  ${index + 1}. ${this.formatDetail(detail)}`;
                        sections["Code Quality Issues"][detailKey] = "";
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
};

// src/code-cortex.js
import fs5 from "node:fs";
import path6 from "node:path";
var CodeCortex = class {
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
            new VueDriver()
        ];
        this.drivers.sort((a, b) => b.priority - a.priority);
        this.globalStats = {
            directories: /* @__PURE__ */ new Set(),
            totalFiles: 0,
            analyzedFiles: 0,
            skippedFiles: 0,
            startTime: null,
            endTime: null
        };
        this.driverMetrics = /* @__PURE__ */ new Map();
        this.aggregateMetrics = {};
        this.projectType = null;
        this.ignoreList = [
            "node_modules",
            "vendor",
            ".git",
            ".svn",
            "dist",
            "build",
            "coverage",
            ".next",
            ".nuxt",
            "out",
            "public/build",
            "storage",
            "bootstrap/cache",
            ".idea",
            ".vscode"
        ];
    }
    registerDriver(driver) {
        if (!(driver instanceof BaseDriver)) {
            throw new Error("Driver must extend BaseDriver");
        }
        this.drivers.push(driver);
        this.drivers.sort((a, b) => b.priority - a.priority);
    }
    analyze(targetPath) {
        this.globalStats.startTime = Date.now();
        if (!fs5.existsSync(targetPath)) {
            console.error(`Error: Path "${targetPath}" does not exist.`);
            process.exit(1);
        }
        console.log("CodeCortex v0.0.4 (Hierarchical Driver Architecture)\n");
        this.scanDirectory(targetPath);
        this.globalStats.endTime = Date.now();
        this.printReport();
    }
    scanDirectory(dirPath) {
        const items = fs5.readdirSync(dirPath);
        for (const item of items) {
            const fullPath = path6.join(dirPath, item);
            try {
                const stat = fs5.statSync(fullPath);
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
                console.log(`   \u26A0\uFE0F ERROR: ${item} - ${err.message}`);
            }
        }
    }
    shouldIgnore(name) {
        return this.ignoreList.includes(name) || name.startsWith(".");
    }
    analyzeFile(filePath) {
        this.globalStats.totalFiles++;
        const driver = this.drivers.find((d) => {
            const canHandle = d.canHandle(filePath);
            return canHandle;
        });
        if (!driver) {
            this.globalStats.skippedFiles++;
            return;
        }
        try {
            const content = fs5.readFileSync(filePath, "utf8");
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
        const duration = ((this.globalStats.endTime - this.globalStats.startTime) / 1e3).toFixed(2);
        console.log("Directories".padEnd(50), this.globalStats.directories.size);
        console.log("Files".padEnd(50), this.globalStats.totalFiles);
        console.log("  Analyzed".padEnd(50), this.globalStats.analyzedFiles);
        console.log("  Skipped".padEnd(50), this.globalStats.skippedFiles);
        console.log("\nFiles by Language/Framework");
        this.driverMetrics.forEach((metrics, driverName) => {
            if (metrics.files > 0) {
                const percentage = (metrics.files / this.globalStats.analyzedFiles * 100).toFixed(2);
                console.log(`  ${driverName}`.padEnd(50), `${metrics.files} (${percentage}%)`);
            }
        });
        this.printAggregateMetrics();
        this.drivers.forEach((driver) => {
            const metrics = this.driverMetrics.get(driver.name);
            if (metrics && metrics.files > 0) {
                this.printDriverMetrics(driver, metrics);
            }
        });
        console.log(`
Analysis completed in ${duration}s`);
    }
    printAggregateMetrics() {
        const m = this.aggregateMetrics;
        console.log("\nSize (Aggregate)");
        console.log("  Lines of Code (LOC)".padEnd(50), m.loc || 0);
        if (m.loc > 0) {
            const clocPct = (m.cloc / m.loc * 100).toFixed(2);
            const nclocPct = (m.ncloc / m.loc * 100).toFixed(2);
            const llocPct = (m.lloc / m.loc * 100).toFixed(2);
            console.log("  Comment Lines of Code (CLOC)".padEnd(50), `${m.cloc || 0} (${clocPct}%)`);
            console.log("  Non-Comment Lines of Code (NCLOC)".padEnd(50), `${m.ncloc || 0} (${nclocPct}%)`);
            console.log("  Logical Lines of Code (LLOC)".padEnd(50), `${m.lloc || 0} (${llocPct}%)`);
        }
        if (m.complexity) {
            console.log("\nCyclomatic Complexity (Aggregate)");
            console.log("  Total Complexity".padEnd(50), m.complexity);
            const numUnits = (m.functions || 0) + (m.methods || 0);
            if (numUnits > 0) {
                const avgComplexity = (m.complexity / numUnits).toFixed(2);
                console.log("  Average Complexity".padEnd(50), avgComplexity);
            }
        }
    }
    printDriverMetrics(driver, metrics) {
        const formatted = driver.formatMetrics(metrics);
        if (Object.keys(formatted).length === 0)
            return;
        console.log(`
${"=".repeat(60)}`);
        console.log(`${driver.name} Metrics`);
        console.log("=".repeat(60));
        Object.entries(formatted).forEach(([sectionName, sectionData]) => {
            console.log(`
${sectionName}`);
            Object.entries(sectionData).forEach(([key, value]) => {
                if (typeof value === "object" && value.value !== void 0) {
                    const pct = value.percentage ? ` (${value.percentage.toFixed(2)}%)` : "";
                    console.log(`  ${key}`.padEnd(50), `${value.value}${pct}`);
                } else {
                    console.log(`  ${key}`.padEnd(50), value);
                }
            });
        });
    }
};

// src/laravel-analyzer.js
import fs6 from "node:fs";
import path7 from "node:path";
var LaravelAnalyzer = class extends CodeCortex {
    constructor() {
        super();
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
            codeQualityScore: 0
        };
        this.ignoreList = [
            "node_modules",
            "vendor",
            ".git",
            ".svn",
            "dist",
            "build",
            "coverage",
            ".next",
            ".nuxt",
            "out",
            "public/build",
            "bootstrap/cache",
            ".idea",
            ".vscode"
            // Note: removed 'storage' and name.startsWith('.') check
        ];
    }
    analyze(targetPath) {
        console.log("\u{1F680} Laravel Project Analyzer v1.0.0\n");
        this.detectProjectStructure(targetPath);
        if (!this.enhancedMetrics.projectType) {
            console.log("\u274C This does not appear to be a Laravel project.");
            console.log("   No composer.json with laravel/framework dependency found.");
            console.log("   Falling back to general project analysis...\n");
        }
        super.analyze(targetPath);
        if (this.enhancedMetrics.projectType === "Laravel") {
            this.runEnhancedAnalysis(targetPath);
            this.printEnhancedReport();
        }
    }
    shouldIgnore(name) {
        return this.ignoreList.includes(name);
    }
    detectProjectStructure(projectPath) {
        try {
            const composerPath = path7.join(projectPath, "composer.json");
            if (fs6.existsSync(composerPath)) {
                const composer = JSON.parse(fs6.readFileSync(composerPath, "utf8"));
                if (composer.require && composer.require["laravel/framework"]) {
                    this.enhancedMetrics.projectType = "Laravel";
                    this.enhancedMetrics.laravelVersion = composer.require["laravel/framework"];
                    console.log(`\u2705 Detected Laravel project: ${this.enhancedMetrics.laravelVersion}`);
                } else {
                    console.log("\u274C composer.json found but no laravel/framework dependency");
                }
            } else {
                console.log("\u274C No composer.json found in project root");
            }
            this.detectFrontendStack(projectPath);
        } catch (error) {
            console.warn("Could not detect project structure:", error.message);
        }
    }
    detectFrontendStack(projectPath) {
        const frontendStack = [];
        const packageJsonPath = path7.join(projectPath, "package.json");
        if (fs6.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs6.readFileSync(packageJsonPath, "utf8"));
                const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
                if (dependencies.react)
                    frontendStack.push(`React ${dependencies.react}`);
                if (dependencies.vue)
                    frontendStack.push(`Vue ${dependencies.vue}`);
                if (dependencies["@inertiajs/inertia"])
                    frontendStack.push("Inertia.js");
                if (dependencies.livewire)
                    frontendStack.push("Livewire");
                if (dependencies.tailwindcss)
                    frontendStack.push("Tailwind CSS");
                if (dependencies.bootstrap)
                    frontendStack.push("Bootstrap");
                if (dependencies.sass)
                    frontendStack.push("Sass");
                if (dependencies.typescript)
                    frontendStack.push("TypeScript");
                if (frontendStack.length > 0) {
                    console.log(`\u{1F4E6} Frontend stack: ${frontendStack.join(", ")}`);
                }
            } catch (error) {
                console.warn("Could not parse package.json");
            }
        }
        const resourcesPath = path7.join(projectPath, "resources", "views");
        if (fs6.existsSync(resourcesPath)) {
            const bladeFiles = this.findFilesByExtension(resourcesPath, ".blade.php");
            if (bladeFiles.length > 0) {
                frontendStack.push(`Blade Templates (${bladeFiles.length} files)`);
            }
        }
        this.enhancedMetrics.frontendStack = frontendStack;
    }
    findFilesByExtension(dir, extension) {
        const files = [];
        try {
            const items = fs6.readdirSync(dir);
            for (const item of items) {
                const fullPath = path7.join(dir, item);
                const stat = fs6.statSync(fullPath);
                if (stat.isDirectory() && !this.shouldIgnore(item)) {
                    files.push(...this.findFilesByExtension(fullPath, extension));
                } else if (item.endsWith(extension)) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
        }
        return files;
    }
    runEnhancedAnalysis(projectPath) {
        console.log("\n\u{1F50D} Running Laravel analysis...");
        try {
            console.log("  - Analyzing dead code...");
            this.enhancedMetrics.deadCode = this.codeQualityAnalyzer.analyzeDeadCode(projectPath);
            console.log("  - Analyzing duplicate code...");
            this.enhancedMetrics.duplicateCode = this.codeQualityAnalyzer.analyzeDuplicateCode(projectPath);
            this.calculateCodeQualityScore();
            console.log("\u2705 Analysis completed.\n");
        } catch (error) {
            console.log("\u274C Analysis failed:", error.message);
        }
    }
    calculateCodeQualityScore() {
        let score = 100;
        const deadCode = this.enhancedMetrics.deadCode;
        if (deadCode) {
            score -= deadCode.unusedClasses.length * 2;
            score -= deadCode.unusedMethods.length * 1;
            score -= deadCode.unusedImports.length * 0.5;
        }
        const duplicateCode = this.enhancedMetrics.duplicateCode;
        if (duplicateCode) {
            score -= duplicateCode.length * 3;
        }
        this.driverMetrics.forEach((metrics, driverName) => {
            if (driverName === "Laravel" && metrics.securityIssues) {
                metrics.securityIssues.forEach((issue) => {
                    switch (issue.severity) {
                        case "high":
                            score -= 10;
                            break;
                        case "medium":
                            score -= 5;
                            break;
                        case "low":
                            score -= 2;
                            break;
                    }
                });
            }
        });
        this.enhancedMetrics.codeQualityScore = Math.max(0, Math.round(score));
    }
    printEnhancedReport() {
        if (this.enhancedMetrics.projectType !== "Laravel") {
            return;
        }
        console.log("\n" + "=".repeat(60));
        console.log("\u{1F680} LARAVEL ANALYSIS REPORT");
        console.log("=".repeat(60));
        console.log("\n\u{1F4CB} Project Information");
        console.log("  Type".padEnd(25), this.enhancedMetrics.projectType);
        if (this.enhancedMetrics.laravelVersion) {
            console.log("  Laravel Version".padEnd(25), this.enhancedMetrics.laravelVersion);
        }
        if (this.enhancedMetrics.frontendStack.length > 0) {
            console.log("\n\u{1F3A8} Frontend Stack");
            this.enhancedMetrics.frontendStack.forEach((tech) => {
                console.log("  -", tech);
            });
        }
        console.log("\n\u{1F4CA} Code Quality Score");
        const score = this.enhancedMetrics.codeQualityScore;
        const scoreColor = score >= 80 ? "\u2705" : score >= 60 ? "\u26A0\uFE0F" : "\u274C";
        console.log(`  Overall Score: ${score}/100 ${scoreColor}`);
        const deadCode = this.enhancedMetrics.deadCode;
        if (deadCode) {
            console.log("\n\u{1F9F9} Dead Code Analysis");
            console.log("  Unused Classes".padEnd(25), deadCode.unusedClasses.length);
            console.log("  Unused Methods".padEnd(25), deadCode.unusedMethods.length);
            console.log("  Unused Imports".padEnd(25), deadCode.unusedImports.length);
            if (deadCode.unusedClasses.length > 0) {
                console.log("\n  Unused Classes Details:");
                deadCode.unusedClasses.slice(0, 5).forEach((item) => {
                    console.log(`    - ${item.className} (${path7.basename(item.file)}:${item.line})`);
                });
                if (deadCode.unusedClasses.length > 5) {
                    console.log(`    ... and ${deadCode.unusedClasses.length - 5} more`);
                }
            }
        }
        const duplicateCode = this.enhancedMetrics.duplicateCode;
        if (duplicateCode && duplicateCode.length > 0) {
            console.log("\n\u{1F501} Duplicate Code Analysis");
            console.log("  Duplicate Blocks Found".padEnd(25), duplicateCode.length);
            console.log("\n  Top Duplicates:");
            duplicateCode.slice(0, 3).forEach((duplicate, index) => {
                console.log(`    ${index + 1}. ${path7.basename(duplicate.file1)} \u2194 ${path7.basename(duplicate.file2)}`);
                if (duplicate.similarities && duplicate.similarities[0]) {
                    console.log(`       Similarity: ${(duplicate.similarities[0]?.similarity * 100).toFixed(1)}%`);
                }
            });
        }
        this.printRecommendations();
    }
    printRecommendations() {
        console.log("\n\u{1F4A1} Recommendations");
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
            recommendations.push("Consider implementing automated code quality checks in your CI/CD pipeline");
        }
        if (recommendations.length === 0) {
            console.log("  \u2705 Great job! No major issues found.");
        } else {
            recommendations.forEach((rec, index) => {
                console.log(`  ${index + 1}. ${rec}`);
            });
        }
    }
};

// src/cli.js
import path8 from "node:path";
import fs7 from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path8.dirname(__filename);
var args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
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
if (args.includes("--server")) {
    startServerOnly();
} else {
    main().catch((error) => {
        console.error("Analysis failed:", error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    });
}
async function startServerOnly() {
    const port = getPort();
    const serverPath = path8.join(__dirname, "server.js");
    if (!fs7.existsSync(serverPath)) {
        console.error("\u274C Server file not found:", serverPath);
        console.error("   Make sure you have run: npm run build");
        process.exit(1);
    }
    console.log(`\u{1F680} Starting web server on port ${port}...`);
    const serverProcess = spawn("node", [serverPath, "--port", port.toString()], {
        stdio: "inherit"
    });
    serverProcess.on("error", (err) => {
        console.error("\u274C Failed to start server:", err.message);
        process.exit(1);
    });
    process.on("SIGINT", () => {
        serverProcess.kill("SIGINT");
        process.exit(0);
    });
    process.on("SIGTERM", () => {
        serverProcess.kill("SIGTERM");
        process.exit(0);
    });
}
async function main() {
    if (args.includes("--list-analyzers")) {
        console.log("\nAvailable Analyzers:\n");
        console.log("1. project");
        console.log("   - General purpose project analyzer");
        console.log("   - Supports multiple languages and frameworks\n");
        console.log("2. laravel");
        console.log("   - Enhanced Laravel-specific analyzer");
        console.log("   - Advanced code quality analysis\n");
        console.log("Usage: codecortex <path> --analyzer <analyzer-type>");
        process.exit(0);
    }
    if (args.includes("--list-drivers")) {
        console.log("\nAvailable Drivers (sorted by priority):\n");
        const analyzer2 = new CodeCortex();
        analyzer2.drivers.forEach((driver, index) => {
            const baseClass = Object.getPrototypeOf(driver.constructor).name;
            const extendsInfo = baseClass !== "BaseDriver" ? ` (extends ${baseClass})` : "";
            console.log(`${index + 1}. ${driver.name}${extendsInfo}`);
            console.log(`   Priority: ${driver.priority}`);
            console.log(`   Extensions: ${driver.extensions.join(", ") || "N/A"}`);
            console.log();
        });
        process.exit(0);
    }
    if (args.includes("--show-hierarchy")) {
        console.log("\nDriver Inheritance Hierarchy:\n");
        console.log("BaseDriver (abstract)");
        console.log("\u251C\u2500\u2500 PhpDriver");
        console.log("\u2502   \u2514\u2500\u2500 BladeDriver");
        console.log("\u2514\u2500\u2500 JavaScriptDriver");
        console.log("    \u251C\u2500\u2500 TypeScriptDriver");
        console.log("    \u2502   \u2514\u2500\u2500 ReactTypeScriptDriver");
        console.log("    \u251C\u2500\u2500 ReactDriver");
        console.log("    \u2514\u2500\u2500 VueDriver");
        console.log();
        process.exit(0);
    }
    const targetPath = getTargetPath();
    const analyzerType = getAnalyzerType();
    const useUI = args.includes("--ui");
    const port = getPort();
    const jsonOutput = getJsonOutput();
    if (!fs7.existsSync(targetPath)) {
        console.error(`Error: Path "${targetPath}" does not exist.`);
        process.exit(1);
    }
    let analyzer;
    switch (analyzerType) {
        case "laravel":
            console.log("\u{1F680} Using Laravel Analyzer");
            analyzer = new LaravelAnalyzer();
            break;
        case "project":
            console.log("\u{1F50D} Using General Project Analyzer");
            analyzer = new CodeCortex();
            break;
        default:
            console.log(`\u26A0\uFE0F  Unknown analyzer "${analyzerType}", using auto-detection`);
            const detectedType = autoDetectAnalyzer(targetPath);
            console.log(`\u{1F50D} Auto-detected: ${detectedType} project`);
            if (detectedType === "laravel") {
                analyzer = new LaravelAnalyzer();
            } else {
                analyzer = new CodeCortex();
            }
    }
    console.log("");
    analyzer.analyze(targetPath);
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
    const analyzerIndex = args.indexOf("--analyzer");
    if (analyzerIndex !== -1 && args[analyzerIndex + 1]) {
        return args[analyzerIndex + 1];
    }
    return "project";
}
function getPort() {
    const portIndex = args.indexOf("--port");
    if (portIndex !== -1 && args[portIndex + 1]) {
        return parseInt(args[portIndex + 1], 10);
    }
    return 3e3;
}
function getJsonOutput() {
    const jsonIndex = args.indexOf("--json");
    if (jsonIndex !== -1 && args[jsonIndex + 1]) {
        return args[jsonIndex + 1];
    }
    return null;
}
function autoDetectAnalyzer(targetPath) {
    try {
        const composerPath = path8.join(targetPath, "composer.json");
        if (fs7.existsSync(composerPath)) {
            const composer = JSON.parse(fs7.readFileSync(composerPath, "utf8"));
            if (composer.require && composer.require["laravel/framework"]) {
                return "laravel";
            }
        }
        const packageJsonPath = path8.join(targetPath, "package.json");
        if (fs7.existsSync(packageJsonPath)) {
            return "project";
        }
        const phpFiles = findFilesByExtension(targetPath, ".php");
        if (phpFiles.length > 0) {
            const hasLaravelStructure = fs7.existsSync(path8.join(targetPath, "app")) && fs7.existsSync(path8.join(targetPath, "resources")) && fs7.existsSync(path8.join(targetPath, "database"));
            if (hasLaravelStructure) {
                return "laravel";
            }
        }
    } catch (error) {
        console.warn("Auto-detection failed, using default analyzer:", error.message);
    }
    return "project";
}
function findFilesByExtension(dir, extension, maxDepth = 3) {
    const files = [];
    function scan(currentDir, depth) {
        if (depth > maxDepth)
            return;
        try {
            const items = fs7.readdirSync(currentDir);
            for (const item of items) {
                if (item === "node_modules" || item === "vendor" || item.startsWith(".")) {
                    continue;
                }
                const fullPath = path8.join(currentDir, item);
                try {
                    const stat = fs7.statSync(fullPath);
                    if (stat.isDirectory()) {
                        scan(fullPath, depth + 1);
                    } else if (item.endsWith(extension)) {
                        files.push(fullPath);
                    }
                } catch (err) {
                }
            }
        } catch (err) {
        }
    }
    scan(dir, 0);
    return files;
}
function getTargetPath() {
    const nonOptionArgs = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith("-")) {
            if (["--analyzer", "--port", "--json"].includes(args[i]) && args[i + 1]) {
                i++;
            }
            continue;
        }
        nonOptionArgs.push(args[i]);
    }
    return nonOptionArgs.length > 0 ? path8.resolve(nonOptionArgs[0]) : path8.resolve(".");
}
async function sendToUI(results, port) {
    try {
        const response = await fetch(`http://localhost:${port}/api/analysis`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(results)
        });
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
        console.log("\n\u2705 Results sent to web UI");
        console.log(`\u{1F310} Open http://localhost:${port} in your browser
`);
        try {
            const { exec } = await import("node:child_process");
            const url = `http://localhost:${port}`;
            const platform = process.platform;
            let command;
            if (platform === "darwin") {
                command = `open ${url}`;
            } else if (platform === "win32") {
                command = `start ${url}`;
            } else {
                command = `xdg-open ${url}`;
            }
            exec(command, (err) => {
                if (err) {
                    console.log("\u{1F4A1} Could not auto-open browser. Please open the URL manually.");
                }
            });
        } catch (err) {
        }
    } catch (error) {
        console.error("\n\u274C Failed to send results to UI:", error.message);
        console.log(`\u{1F4A1} Make sure the server is running: codecortex --server --port ${port}
`);
    }
}
function exportToJson(results, filePath) {
    try {
        fs7.writeFileSync(filePath, JSON.stringify(results, null, 2), "utf8");
        console.log(`
\u2705 Results exported to: ${filePath}
`);
    } catch (error) {
        console.error(`
\u274C Failed to export JSON: ${error.message}
`);
    }
}
