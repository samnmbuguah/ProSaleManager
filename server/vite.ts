import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// All Vite setup code commented out for build
// export async function setupVite(app: Express, server: Server) {
//   try {
//     const vite = await createViteServer({
//       ...viteConfig,
//       configFile: false,
//       server: {
//         middlewareMode: true,
//         hmr: { server },
//       },
//       appType: "custom",
//     });
//     app.use(vite.middlewares);
//     app.use("*", async (req, res, next) => {
//       const url = req.originalUrl;
//       try {
//         const clientTemplate = path.resolve(
//           __dirname,
//           "..",
//           "client",
//           "index.html",
//         );
//         // always reload the index.html file from disk incase it changes
//         const template = await fs.promises.readFile(clientTemplate, "utf-8");
//         const page = await vite.transformIndexHtml(url, template);
//         res.status(200).set({ "Content-Type": "text/html" }).end(page);
//       } catch (e) {
//         vite.ssrFixStacktrace(e as Error);
//         next(e);
//       }
//     });
//   } catch (e) {
//     console.error("Failed to setup Vite:", e);
//     process.exit(1);
//   }
// }

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
