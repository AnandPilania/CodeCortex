import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '..', 'src');
const distDir = path.join(__dirname, '..', 'dist');

console.log('📦 Building server files...\n');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Bundle CLI with all dependencies
async function buildCLI() {
    try {
        await build({
            entryPoints: [path.join(srcDir, 'cli.js')],
            bundle: true,
            platform: 'node',
            target: 'node18',
            format: 'esm',
            outfile: path.join(distDir, 'cli.js'),
            external: ['express', 'cors'], // Don't bundle server dependencies
            banner: {
                // js: '#!/usr/bin/env node\n'
            },
            minify: false,
            sourcemap: false
        });
        console.log('✅ Built cli.js (bundled with all analyzer code)');

        // Make CLI executable
        fs.chmodSync(path.join(distDir, 'cli.js'), '755');
        console.log('✅ Made cli.js executable');
    } catch (error) {
        console.error('❌ Failed to build CLI:', error);
        process.exit(1);
    }
}

// Bundle server - but don't bundle problematic dependencies
async function buildServer() {
    try {
        await build({
            entryPoints: [path.join(srcDir, 'server.js')],
            bundle: true,
            platform: 'node',
            target: 'node18',
            format: 'esm',
            outfile: path.join(distDir, 'server.js'),
            // Externalize problematic packages that use dynamic requires
            external: [
                'express',
                'cors',
                'path',
                'fs',
                'url',
                'http',
                'https',
                'stream',
                'util',
                'zlib',
                'net',
                'tls',
                'crypto',
                'dns',
                'child_process',
                'os',
                'events',
                'buffer',
                'string_decoder',
                'querystring'
            ],
            minify: false,
            sourcemap: false
        });
        console.log('✅ Built server.js');
    } catch (error) {
        console.error('❌ Failed to build server:', error);
        process.exit(1);
    }
}

// Copy package.json to dist
function copyPackageJson() {
    try {
        const packagePath = path.join(__dirname, '..', 'package.json');
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

        // Create minimal package.json for dist
        const distPackage = {
            name: packageData.name,
            version: packageData.version,
            type: "module",
            bin: {
                "codecortex": "./cli.js"
            },
            dependencies: {
                "express": packageData.dependencies?.express || "^4.18.2",
                "cors": packageData.dependencies?.cors || "^2.8.5"
            }
        };

        fs.writeFileSync(
            path.join(distDir, 'package.json'),
            JSON.stringify(distPackage, null, 2)
        );
        console.log('✅ Created dist/package.json');
    } catch (error) {
        console.error('❌ Failed to copy package.json:', error);
    }
}

// Run builds
async function buildAll() {
    await buildCLI();
    await buildServer();
    copyPackageJson();
    console.log('\n✨ Server build complete!');
    console.log('\n📦 To use the standalone server:');
    console.log('   1. cd dist');
    console.log('   2. npm install');
    console.log('   3. node server.js');
    console.log('\n🚀 To use the CLI:');
    console.log('   node cli.js --help');
}

buildAll();
