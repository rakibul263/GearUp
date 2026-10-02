import { Router, type Request, type Response } from "express";
import { openApiSpec } from "./openapi.js";

const router: Router = Router();

// Serves the raw OpenAPI 3.0 specification in JSON format
router.get("/openapi.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(openApiSpec);
});

// Serves the interactive Swagger UI web interface
router.get("/", (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GearUp API — Interactive Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.11.0/favicon-32x32.png" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .topbar {
      display: none !important;
    }
    .custom-header {
      background: #0f172a;
      color: #ffffff;
      padding: 16px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #38bdf8;
    }
    .custom-header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.025em;
    }
    .custom-header a {
      color: #38bdf8;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }
    .custom-header a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="custom-header">
    <h1>GearUp API Documentation</h1>
    <a href="/api/docs/openapi.json" target="_blank">Raw OpenAPI JSON ↗</a>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/docs/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        displayRequestDuration: true,
        docExpansion: "list",
        filter: true,
      });
    };
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
});

export default router;
