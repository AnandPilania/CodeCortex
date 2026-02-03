import PhpDriver from "./php-driver.js";

export default class BladeDriver extends PhpDriver {
    constructor() {
        super();
        this.name = 'Blade';
        this.extensions = [];
        this.includePatterns = [/\.blade\.php$/];
        this.excludePatterns = [];
        this.priority = 20;

        this.bladePatterns = {
            directive: /@(if|elseif|else|endif|foreach|endforeach|for|endfor|while|endwhile|unless|endunless|isset|empty|auth|guest|can|cannot|include|extends|section|endsection|yield|component|slot|push|stack|props|php|endphp)/g,
            echo: /\{\{.*?\}\}/g,
            rawEcho: /\{!!.*?!!\}/g,
            comment: /\{\{--[\s\S]*?--\}\}/g,
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
            bladeComments: comments,
        };
    }

    formatMetrics(metrics) {
        const sections = super.formatMetrics(metrics);

        sections['Blade Features'] = {
            'Directives': metrics.bladeDirectives || 0,
            'Echo Statements': metrics.bladeEchos || 0,
            'Raw Echo Statements': metrics.bladeRawEchos || 0,
            'Blade Comments': metrics.bladeComments || 0,
        };

        return sections;
    }
}
