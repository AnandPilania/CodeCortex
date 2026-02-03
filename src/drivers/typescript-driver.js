import JavaScriptDriver from "./javascript-driver.js";

export default class TypeScriptDriver extends JavaScriptDriver {
    constructor() {
        super();
        this.name = 'TypeScript';
        this.extensions = ['.ts'];
        this.priority = 15;

        this.tsPatterns = {
            interface: /\binterface\s+(\w+)/g,
            type: /\btype\s+(\w+)\s*=/g,
            enum: /\benum\s+(\w+)/g,
            decorator: /@\w+/g,
            generic: /<[^>]+>/g,
        };
    }

    parse(content, filePath) {
        const jsMetrics = super.parse(content, filePath);

        const cleanContent = this.removeComments(content, [
            this.patterns.multiLineComment,
            this.patterns.singleLineComment,
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
            generics,
        };
    }

    formatMetrics(metrics) {
        const sections = super.formatMetrics(metrics);

        sections['TypeScript Features'] = {
            'Interfaces': metrics.interfaces || 0,
            'Type Aliases': metrics.types || 0,
            'Enums': metrics.enums || 0,
            'Decorators': metrics.decorators || 0,
            'Generic Usage': metrics.generics || 0,
        };

        return sections;
    }
}
