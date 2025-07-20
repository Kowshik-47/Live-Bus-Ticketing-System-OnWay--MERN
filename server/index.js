import path from "path";
import { createServer } from "./routes.js";
import express from "express";
import { env } from '../environment.js'

const app = createServer();
const port = process.env.PORT || env.PORT;

// In production, serve the built SPA files
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

// Serve static files
app.use(express.static(distPath));

app.listen(port, () => {
  console.log(`🚀 On the Way server running on port ${port}`);
  console.log(`📱 Server Base Url: http://localhost:${port}`);
  console.log(`🔧 API Url: http://localhost:${port}/api`);
});