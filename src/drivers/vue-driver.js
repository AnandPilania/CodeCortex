import JavaScriptDriver from "./javascript-driver.js";

export default class VueDriver extends JavaScriptDriver {
    constructor() {
        super();
        this.name = 'Vue';
        this.extensions = ['.vue'];
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
            reactive: /\breactive\(/g,
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
            exports: 0,
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
            reactive: 0,
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
                reactive: (scriptContent.match(this.vuePatterns.reactive) || []).length,
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
            files: 1,
        };
    }

    formatMetrics(metrics) {
        const sections = super.formatMetrics(metrics);

        sections['Vue Components'] = {
            'Total Components': metrics.components || 0,
            'With Template': metrics.hasTemplate ? metrics.components : 0,
            'With Script': metrics.hasScript ? metrics.components : 0,
            'With Style': metrics.hasStyle ? metrics.components : 0,
            'Script Setup': metrics.scriptSetup ? metrics.components : 0,
        };

        sections['Vue Options API'] = {
            'Data': metrics.data || 0,
            'Methods': metrics.methods || 0,
            'Computed': metrics.computed || 0,
            'Props': metrics.props || 0,
            'Watch': metrics.watch || 0,
        };

        sections['Vue Composition API'] = {
            'ref()': metrics.ref || 0,
            'reactive()': metrics.reactive || 0,
        };

        sections['Vue Directives'] = {
            'Directive Usage': metrics.vDirectives || 0,
        };

        return sections;
    }
}
