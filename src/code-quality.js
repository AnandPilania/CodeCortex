import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export default class CodeQualityAnalyzer {
    constructor() {
        this.deadCodePatterns = {
            unusedImports: /^use\s+([^;]+);/gm,
            unusedVariables: /\$(\w+)\s*=/g,
            unusedMethods: /(?:public|private|protected)\s+function\s+(\w+)/g,
            unusedClasses: /class\s+(\w+)/g,
        };

        this.duplicateThreshold = 0.8;
        this.minDuplicateLines = 5;
    }

    analyzeDeadCode(projectPath) {
        const results = {
            unusedClasses: [],
            unusedMethods: [],
            unusedVariables: [],
            unusedImports: [],
        };

        const phpFiles = this.isDirectory(projectPath)
            ? this.findPhpFiles(projectPath)
            : [projectPath];

        const allCode = this.readAllFiles(phpFiles);

        const analysisContext = this.isDirectory(projectPath)
            ? allCode
            : this.getExtendedContext(projectPath, allCode);

        results.unusedClasses = this.findUnusedClasses(analysisContext, phpFiles);
        results.unusedMethods = this.findUnusedMethods(analysisContext, phpFiles);
        results.unusedImports = this.findUnusedImports(analysisContext, phpFiles);

        return results;
    }

    analyzeDuplicateCode(projectPath) {
        const phpFiles = this.isDirectory(projectPath)
            ? this.findPhpFiles(projectPath)
            : [projectPath];

        const duplicates = [];

        if (!this.isDirectory(projectPath)) {
            return this.findInternalDuplicates(phpFiles[0]);
        }

        for (let i = 0; i < phpFiles.length; i++) {
            for (let j = i + 1; j < phpFiles.length; j++) {
                const file1Content = fs.readFileSync(phpFiles[i], 'utf8');
                const file2Content = fs.readFileSync(phpFiles[j], 'utf8');

                const similarities = this.findSimilarBlocks(file1Content, file2Content);

                if (similarities.length > 0) {
                    duplicates.push({
                        file1: phpFiles[i],
                        file2: phpFiles[j],
                        similarities: similarities,
                    });
                }
            }
        }

        return duplicates;
    }

    isDirectory(path) {
        try {
            return fs.statSync(path).isDirectory();
        } catch (error) {
            return false;
        }
    }

    findPhpFiles(dir) {
        const files = [];

        if (!this.isDirectory(dir)) {
            return dir.endsWith('.php') ? [dir] : [];
        }

        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (this.shouldIgnore(item)) continue;

            if (stat.isDirectory()) {
                files.push(...this.findPhpFiles(fullPath));
            } else if (item.endsWith('.php')) {
                files.push(fullPath);
            }
        }

        return files;
    }

    shouldIgnore(name) {
        const ignoreList = ['vendor', 'node_modules', '.git', 'storage', 'bootstrap/cache'];
        return ignoreList.includes(name) || name.startsWith('.');
    }

    readAllFiles(files) {
        const allCode = new Map();

        files.forEach(file => {
            try {
                // Check if file exists and is readable
                if (!fs.existsSync(file)) {
                    console.warn(`File does not exist: ${file}`);
                    return;
                }

                const content = fs.readFileSync(file, 'utf8');
                allCode.set(file, content);
            } catch (error) {
                console.warn(`Could not read file: ${file}`, error.message);
            }
        });

        return allCode;
    }

    getExtendedContext(filePath, allCode) {
        const extendedContext = new Map(allCode);
        const dir = path.dirname(filePath);

        if (this.isDirectory(dir)) {
            const relatedFiles = this.findPhpFiles(dir);
            relatedFiles.forEach(relatedFile => {
                if (!extendedContext.has(relatedFile)) {
                    try {
                        const content = fs.readFileSync(relatedFile, 'utf8');
                        extendedContext.set(relatedFile, content);
                    } catch (error) {
                        // Ignore files we can't read
                    }
                }
            });
        }

        return extendedContext;
    }

    findInternalDuplicates(filePath) {
        const duplicates = [];
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length - this.minDuplicateLines; i++) {
            for (let j = i + this.minDuplicateLines; j < lines.length - this.minDuplicateLines; j++) {
                const block1 = lines.slice(i, i + this.minDuplicateLines).join('\n');
                const block2 = lines.slice(j, j + this.minDuplicateLines).join('\n');

                const similarity = this.calculateSimilarity(block1, block2);

                if (similarity >= this.duplicateThreshold) {
                    duplicates.push({
                        similarity: similarity,
                        block1: {
                            startLine: i + 1,
                            endLine: i + this.minDuplicateLines,
                            content: block1,
                        },
                        block2: {
                            startLine: j + 1,
                            endLine: j + this.minDuplicateLines,
                            content: block2,
                        },
                    });
                }
            }
        }

        return [{
            file1: filePath,
            file2: filePath,
            similarities: duplicates,
        }];
    }

    findUnusedClasses(allCode, files) {
        const unusedClasses = [];
        const allContent = Array.from(allCode.values()).join('\n');

        allCode.forEach((content, filePath) => {
            const classMatches = content.match(/class\s+(\w+)/g) || [];

            classMatches.forEach(match => {
                const className = match.replace('class ', '');

                const regex = new RegExp(`\\b${className}\\b`, 'g');
                const occurrences = (allContent.match(regex) || []).length;

                if (occurrences <= 1) {
                    unusedClasses.push({
                        className,
                        file: filePath,
                        line: this.getLineNumber(content, match),
                    });
                }
            });
        });

        return unusedClasses;
    }

    findUnusedMethods(allCode, files) {
        const unusedMethods = [];
        const allContent = Array.from(allCode.values()).join('\n');

        allCode.forEach((content, filePath) => {
            const methodMatches = content.match(/(?:public|private|protected)\s+function\s+(\w+)/g) || [];

            methodMatches.forEach(match => {
                const methodName = match.match(/function\s+(\w+)/)[1];

                if (this.isSpecialMethod(methodName)) return;

                const callRegex = new RegExp(`->${methodName}\\s*\\(|${methodName}\\s*\\(`, 'g');
                const calls = (allContent.match(callRegex) || []).length;

                if (calls <= 1) {
                    unusedMethods.push({
                        methodName,
                        file: filePath,
                        line: this.getLineNumber(content, match),
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

            importMatches.forEach(match => {
                const importPath = match.replace(/^use\s+/, '').replace(';', '');
                const className = importPath.split('\\').pop();

                const classUsageRegex = new RegExp(`\\b${className}\\b`, 'g');
                const usages = (content.match(classUsageRegex) || []).length;

                if (usages <= 1) {
                    unusedImports.push({
                        import: importPath,
                        file: filePath,
                        line: this.getLineNumber(content, match),
                    });
                }
            });
        });

        return unusedImports;
    }

    findSimilarBlocks(content1, content2) {
        const lines1 = content1.split('\n');
        const lines2 = content2.split('\n');
        const similarities = [];

        for (let i = 0; i < lines1.length - this.minDuplicateLines; i++) {
            for (let j = 0; j < lines2.length - this.minDuplicateLines; j++) {
                const block1 = lines1.slice(i, i + this.minDuplicateLines).join('\n');
                const block2 = lines2.slice(j, j + this.minDuplicateLines).join('\n');

                const similarity = this.calculateSimilarity(block1, block2);

                if (similarity >= this.duplicateThreshold) {
                    similarities.push({
                        similarity: similarity,
                        block1: {
                            startLine: i + 1,
                            endLine: i + this.minDuplicateLines,
                            content: block1,
                        },
                        block2: {
                            startLine: j + 1,
                            endLine: j + this.minDuplicateLines,
                            content: block2,
                        },
                    });
                }
            }
        }

        return similarities;
    }

    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

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
            '__construct', '__destruct', '__call', '__callStatic',
            '__get', '__set', '__isset', '__unset', '__sleep',
            '__wakeup', '__toString', '__invoke', '__set_state',
            '__clone', '__debugInfo',
            'index', 'create', 'store', 'show', 'edit', 'update', 'destroy',
            'handle', 'boot', 'register', 'up', 'down', 'run'
        ];

        return specialMethods.includes(methodName);
    }

    getLineNumber(content, searchString) {
        const lines = content.substring(0, content.indexOf(searchString)).split('\n');
        return lines.length;
    }

    generateHash(content) {
        return crypto.createHash('md5').update(content).digest('hex');
    }

    analyzeFile(filePath, includeRelatedFiles = true) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        if (!filePath.endsWith('.php')) {
            throw new Error(`File is not a PHP file: ${filePath}`);
        }

        const deadCodeResults = this.analyzeDeadCode(filePath);
        const duplicateResults = this.analyzeDuplicateCode(filePath);

        return {
            file: filePath,
            deadCode: deadCodeResults,
            duplicates: duplicateResults,
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
            duplicates: duplicateResults,
        };
    }
}
