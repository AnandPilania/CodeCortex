import BaseDriver from "./base-driver.js";

export default class JavaScriptDriver extends BaseDriver {
    constructor() {
        super();
        this.name = 'JavaScript';
        this.extensions = ['.js', '.mjs', '.cjs'];
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
            asyncFunction: /\basync\s+(function|\(|[\w$]+\s*=>)/g,
        };
    }

    parse(content, filePath) {
        const cleanContent = this.removeComments(content, [
            this.patterns.multiLineComment,
            this.patterns.singleLineComment,
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
            files: 1,
        };
    }

    formatMetrics(metrics) {
        const sections = {};

        sections['Structure'] = {
            'Classes': metrics.classes || 0,
            'Functions': metrics.functions || 0,
            '  Named Functions': metrics.namedFunctions || 0,
            '  Arrow Functions': metrics.arrowFunctions || 0,
            '  Async Functions': metrics.asyncFunctions || 0,
            'Methods': metrics.methods || 0,
        };

        sections['Dependencies'] = {
            'Imports': metrics.imports || 0,
            'Exports': metrics.exports || 0,
        };

        return sections;
    }
}
