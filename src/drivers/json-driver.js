import BaseDriver from "./base-driver.js";

export default class JsonDriver extends BaseDriver {
    constructor() {
        super();
        this.name = 'JSON';
        this.extensions = ['.json'];
        this.excludePatterns = [
            /package-lock\.json$/,
            /composer\.lock$/,
            /yarn\.lock$/,
            /tsconfig\.json$/,
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
                files: 1,
            };
        } catch (err) {
            return {
                loc: 0,
                cloc: 0,
                ncloc: 0,
                lloc: 0,
                files: 0,
                parseError: true,
            };
        }
    }

    formatMetrics(metrics) {
        if (metrics.parseError) return {};

        return {
            'JSON Files': {
                'Valid Files': metrics.jsonObjects || 0,
                'Top Level Keys': metrics.topLevelKeys || 0,
            },
        };
    }
}
