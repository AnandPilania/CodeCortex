import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Get port from environment or command line args
let PORT = process.env.PORT || 3000;

// Check for --port argument
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
if (portIndex !== -1 && args[portIndex + 1]) {
    PORT = parseInt(args[portIndex + 1], 10);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Store analysis results in memory
let latestAnalysis = null;

// Determine if we're in production (running from dist) or development (running from src)
const isProduction = __dirname.includes('/dist');
const publicPath = isProduction
    ? path.join(__dirname, 'ui')
    : path.join(__dirname, '..', 'dist', 'ui');

// Serve static files
if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    console.log(`📁 Serving UI from: ${publicPath}`);
} else {
    console.log(`⚠️  UI not found at: ${publicPath}`);
    console.log('   Run "npm run build" to build the UI first.');
}

// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Get latest analysis results
app.get('/api/analysis', (req, res) => {
    if (!latestAnalysis) {
        return res.status(404).json({
            error: 'No analysis data available',
            message: 'Run the analyzer with --ui flag to generate data'
        });
    }
    res.json(latestAnalysis);
});

// Receive analysis results from CLI
app.post('/api/analysis', (req, res) => {
    latestAnalysis = {
        ...req.body,
        timestamp: new Date().toISOString()
    };
    console.log('✅ Analysis data received');
    res.json({ success: true, message: 'Analysis data stored' });
});

// Clear analysis data
app.delete('/api/analysis', (req, res) => {
    latestAnalysis = null;
    res.json({ success: true, message: 'Analysis data cleared' });
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');

    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({
            error: 'UI not built',
            message: 'Run "npm run build" to build the UI',
            uiPath: publicPath
        });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║   🚀 Project Analyzer Server                      ║
╟───────────────────────────────────────────────────╢
║   Local:   http://localhost:${PORT.toString().padEnd(27)}║
║   Status:  Running                                ║
╚═══════════════════════════════════════════════════╝

📊 Open your browser to view the dashboard
💡 Run analyzer with --ui flag to send data here
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default app;
