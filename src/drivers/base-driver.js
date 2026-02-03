import path from 'node:path';

export default class BaseDriver {
    constructor() {
        this.name = 'base';
        this.extensions = [];
        this.excludePatterns = [];
        this.includePatterns = [];
        this.priority = 0;
    }

    canHandle(filePath) {
        const ext = path.extname(filePath);
        const fileName = path.basename(filePath);

        if (this.excludePatterns.some(pattern => fileName.match(pattern))) {
            return false;
        }

        if (this.includePatterns.length > 0) {
            return this.includePatterns.some(pattern => fileName.match(pattern));
        }

        return this.extensions.includes(ext);
    }

    parse(content, filePath) {
        throw new Error('parse() must be implemented by driver');
    }

    getInitialMetrics() {
        return {
            files: 0,
            loc: 0,
            cloc: 0,
            ncloc: 0,
            lloc: 0,
        };
    }

    mergeMetrics(aggregate, fileMetrics) {
        Object.keys(fileMetrics).forEach(key => {
            if (typeof fileMetrics[key] === 'number') {
                aggregate[key] = (aggregate[key] || 0) + fileMetrics[key];
            } else if (Array.isArray(fileMetrics[key])) {
                aggregate[key] = (aggregate[key] || []).concat(fileMetrics[key]);
            } else if (fileMetrics[key] instanceof Set) {
                aggregate[key] = aggregate[key] || new Set();
                fileMetrics[key].forEach(item => aggregate[key].add(item));
            } else if (typeof fileMetrics[key] === 'object' && fileMetrics[key] !== null) {
                aggregate[key] = aggregate[key] || {};
                Object.assign(aggregate[key], fileMetrics[key]);
            } else if (typeof fileMetrics[key] === 'string') {
                if (!aggregate[key] || aggregate[key] === 'unknown' || aggregate[key] === '') {
                    aggregate[key] = fileMetrics[key];
                }
            } else {
                if (aggregate[key] === undefined) {
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
        commentPatterns.forEach(pattern => {
            clean = clean.replace(pattern, '');
        });
        return clean;
    }

    countLines(content, cleanContent) {
        const lines = content.split('\n');
        const cleanLines = cleanContent.split('\n');
        const codeLines = cleanLines.filter(l => l.trim().length > 0);

        return {
            loc: lines.length,
            cloc: lines.length - codeLines.length,
            ncloc: codeLines.length,
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
            /\bif\b/g, /\bfor\b/g, /\bwhile\b/g, /\bcase\b/g,
            /\bcatch\b/g, /&&/g, /\|\|/g, /\?[^:]/g,
        ];

        let complexity = 1;
        patterns.forEach(pattern => {
            complexity += (content.match(pattern) || []).length;
        });

        return complexity;
    }
}
