import BaseDriver from "./base-driver.js";

export default class PhpDriver extends BaseDriver {
    constructor() {
        super();
        this.name = 'PHP';
        this.extensions = ['.php'];
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
            constant: /const\s+(\w+)/g,
        };
    }

    parse(content, filePath) {
        const cleanContent = this.removeComments(content, [
            this.patterns.singleLineComment,
            this.patterns.multiLineComment,
        ]);

        const lineMetrics = this.countLines(content, cleanContent);

        const classes = [];
        let match;
        const classPattern = this.patterns.class;
        classPattern.lastIndex = 0;
        while ((match = classPattern.exec(cleanContent)) !== null) {
            classes.push({
                name: match[2],
                abstract: !!match[1],
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

        const namespaces = new Set();
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
                visibility: match[1] || 'public',
                static: !!match[2],
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
            abstractClasses: classes.filter(c => c.abstract).length,
            concreteClasses: classes.filter(c => !c.abstract).length,
            interfaces: interfaces.length,
            traits: traits.length,
            namespaces,
            methods: methods.length,
            publicMethods: methods.filter(m => m.visibility === 'public').length,
            protectedMethods: methods.filter(m => m.visibility === 'protected').length,
            privateMethods: methods.filter(m => m.visibility === 'private').length,
            staticMethods: methods.filter(m => m.static).length,
            nonStaticMethods: methods.filter(m => !m.static).length,
            functions: functions.length,
            useStatements,
            constants,
            complexity: this.calculateComplexity(cleanContent),
            files: 1,
        };
    }

    formatMetrics(metrics) {
        const sections = {};

        sections['Structure'] = {
            'Namespaces': metrics.namespaces ? metrics.namespaces.size : 0,
            'Interfaces': metrics.interfaces || 0,
            'Traits': metrics.traits || 0,
            'Classes': metrics.classes || 0,
            '  Abstract Classes': {
                value: metrics.abstractClasses || 0,
                percentage: metrics.classes > 0 ? (metrics.abstractClasses / metrics.classes * 100) : 0,
            },
            '  Concrete Classes': {
                value: metrics.concreteClasses || 0,
                percentage: metrics.classes > 0 ? (metrics.concreteClasses / metrics.classes * 100) : 0,
            },
        };

        if (metrics.methods > 0) {
            sections['Methods'] = {
                'Total Methods': metrics.methods,
                '  Public Methods': {
                    value: metrics.publicMethods || 0,
                    percentage: (metrics.publicMethods / metrics.methods * 100),
                },
                '  Protected Methods': {
                    value: metrics.protectedMethods || 0,
                    percentage: (metrics.protectedMethods / metrics.methods * 100),
                },
                '  Private Methods': {
                    value: metrics.privateMethods || 0,
                    percentage: (metrics.privateMethods / metrics.methods * 100),
                },
                '  Static Methods': {
                    value: metrics.staticMethods || 0,
                    percentage: (metrics.staticMethods / metrics.methods * 100),
                },
            };
        }

        if (metrics.functions > 0) {
            sections['Functions'] = {
                'Total Functions': metrics.functions,
            };
        }

        return sections;
    }
}
