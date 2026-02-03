// src/server.js
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = process.env.PORT || 3e3;
var args = process.argv.slice(2);
var portIndex = args.indexOf("--port");
if (portIndex !== -1 && args[portIndex + 1]) {
  PORT = parseInt(args[portIndex + 1], 10);
}
app.use(cors());
app.use(express.json({ limit: "50mb" }));
var latestAnalysis = null;
var isProduction = __dirname.includes("/dist");
var publicPath = isProduction ? path.join(__dirname, "ui") : path.join(__dirname, "..", "dist", "ui");
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  console.log(`\u{1F4C1} Serving UI from: ${publicPath}`);
} else {
  console.log(`\u26A0\uFE0F  UI not found at: ${publicPath}`);
  console.log('   Run "npm run build" to build the UI first.');
}
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    port: PORT
  });
});
app.get("/api/analysis", (req, res) => {
  if (!latestAnalysis) {
    return res.status(404).json({
      error: "No analysis data available",
      message: "Run the analyzer with --ui flag to generate data"
    });
  }
  res.json(latestAnalysis);
});
app.post("/api/analysis", (req, res) => {
  latestAnalysis = {
    ...req.body,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  console.log("\u2705 Analysis data received");
  res.json({ success: true, message: "Analysis data stored" });
});
app.delete("/api/analysis", (req, res) => {
  latestAnalysis = null;
  res.json({ success: true, message: "Analysis data cleared" });
});
app.get("*", (req, res) => {
  const indexPath = path.join(publicPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      error: "UI not built",
      message: 'Run "npm run build" to build the UI',
      uiPath: publicPath
    });
  }
});
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message
  });
});
var server = app.listen(PORT, () => {
  console.log(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551   \u{1F680} CodeCortex Server                      \u2551
\u255F\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2562
\u2551   Local:   http://localhost:${PORT.toString().padEnd(27)}\u2551
\u2551   Status:  Running                                \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D

\u{1F4CA} Open your browser to view the dashboard
\u{1F4A1} Run analyzer with --ui flag to send data here
    `);
});
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
process.on("SIGINT", () => {
  console.log("\nSIGINT received, closing server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
var server_default = app;
export {
  server_default as default
};
