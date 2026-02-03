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
                js: '#!/usr/bin/env node\n'
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

// Bundle server
async function buildServer() {
    try {
        await build({
            entryPoints: [path.join(srcDir, 'server.js')],
            bundle: true,
            platform: 'node',
            target: 'node18',
            format: 'esm',
            outfile: path.join(distDir, 'server.js'),
            external: [], // Bundle everything for server
            minify: false,
            sourcemap: false
        });
        console.log('✅ Built server.js (standalone)');
    } catch (error) {
        console.error('❌ Failed to build server:', error);
        process.exit(1);
    }
}

// Run builds
async function buildAll() {
    await buildCLI();
    await buildServer();
    console.log('\n✨ Server build complete!\n');
}

buildAll();
