import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";
import { app } from "./app";

const PORT = 3000;

// Serve the frontend: Vite middleware in development, static dist in production.
// The API routes are already registered on `app` (see app.ts); this wiring is
// added afterwards so it only catches non-API requests.
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.use("*", (req, res, next) => {
      // Pass-through to Vite for index.html etc.
      next();
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to host 0.0.0.0 and port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running in ${process.env.NODE_ENV || "development"} mode on http://0.0.0.0:${PORT}`);
  });
}

start();
