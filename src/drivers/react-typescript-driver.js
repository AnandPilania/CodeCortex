import TypeScriptDriver from "./typescript-driver.js";
import ReactDriver from "./react-driver.js";

export default class ReactTypeScriptDriver extends TypeScriptDriver {
    constructor() {
        super();
        this.name = 'React TypeScript';
        this.extensions = ['.tsx'];
        this.priority = 25;

        const reactDriver = new ReactDriver();
        this.reactPatterns = reactDriver.reactPatterns;
    }

    parse(content, filePath) {
        const tsMetrics = super.parse(content, filePath);

        const cleanContent = this.removeComments(content, [
            this.patterns.multiLineComment,
            this.patterns.singleLineComment,
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
            propsUsage,
        };
    }

    formatMetrics(metrics) {
        const sections = super.formatMetrics(metrics);

        sections['React Structure'] = {
            'Components': metrics.components || 0,
            'JSX Elements': metrics.jsxElements || 0,
            'Props Usage': metrics.propsUsage || 0,
        };

        sections['React Hooks'] = {
            'Unique Hooks': metrics.hooks || 0,
            'useState': metrics.useState || 0,
            'useEffect': metrics.useEffect || 0,
        };

        return sections;
    }
}
