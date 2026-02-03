import JavaScriptDriver from "./javascript-driver.js";

export default class ReactDriver extends JavaScriptDriver {
    constructor() {
        super();
        this.name = 'React';
        this.extensions = ['.jsx'];
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
            propsDestructure: /\{\s*[\w\s,]+\s*\}\s*=\s*props/g,
        };
    }

    parse(content, filePath) {
        // Get base JavaScript metrics
        const jsMetrics = super.parse(content, filePath);

        const cleanContent = this.removeComments(content, [
            this.patterns.multiLineComment,
            this.patterns.singleLineComment,
        ]);

        // Add React-specific metrics
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
            'useContext': metrics.useContext || 0,
            'useMemo': metrics.useMemo || 0,
            'useCallback': metrics.useCallback || 0,
            'useRef': metrics.useRef || 0,
        };

        return sections;
    }
}
