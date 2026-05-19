// server.js — BMW Showcase API
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const CARS_FILE = path.join(__dirname, "cars.json");

// MIME types for static file serving
const MIME = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
};

function setCORSHeaders(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJSON(res, statusCode, data) {
    setCORSHeaders(res);
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
    sendJSON(res, statusCode, { error: message });
}

function loadCars() {
    try {
        const raw = fs.readFileSync(CARS_FILE, "utf8");
        return JSON.parse(raw);
    } catch (e) {
        console.error("Failed to load cars.json:", e.message);
        return [];
    }
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    // Handle preflight
    if (req.method === "OPTIONS") {
        setCORSHeaders(res);
        res.writeHead(204);
        res.end();
        return;
    }

    // ── API Routes ──────────────────────────────────────────────────────────────

    // GET /api/cars — all cars
    if (req.method === "GET" && pathname === "/api/cars") {
        const cars = loadCars();
        return sendJSON(res, 200, { success: true, count: cars.length, data: cars });
    }

    // GET /api/cars/:id — single car
    const carMatch = pathname.match(/^\/api\/cars\/(\d+)$/);
    if (req.method === "GET" && carMatch) {
        const id = parseInt(carMatch[1], 10);
        const cars = loadCars();
        const car = cars.find((c) => c.id === id);
        if (!car) return sendError(res, 404, `Car with id ${id} not found`);
        return sendJSON(res, 200, { success: true, data: car });
    }

    // ── Static File Serving ─────────────────────────────────────────────────────

    let filePath = pathname === "/" ? "/index.html" : pathname;
    filePath = path.join(__dirname, filePath);
    const ext = path.extname(filePath);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === "ENOENT") {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("404 Not Found");
            } else {
                res.writeHead(500);
                res.end("Server Error");
            }
            return;
        }
        res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log("╔══════════════════════════════════════╗");
    console.log("║   🚗  BMW Showcase Server Running     ║");
    console.log(`║   👉  http://localhost:${PORT}           ║`);
    console.log("║   📡  API: /api/cars & /api/cars/:id  ║");
    console.log("╚══════════════════════════════════════╝");
});