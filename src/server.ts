import http from "node:http";
import app from "./app.js";
import prisma from "./config/database.js";
import { env } from "./config/env.js";

const server = http.createServer(app);

server.listen(env.PORT, () => {
  console.log(
    `🚀 GearUp server running on port ${env.PORT} in ${env.NODE_ENV} mode`,
  );
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  server.close(async (err) => {
    if (err) {
      console.error("❌ Error closing HTTP server:", err);
      process.exit(1);
    }

    console.log("🔌 HTTP server closed successfully.");

    try {
      await prisma.$disconnect();
      console.log("💾 Database connection closed successfully.");
      process.exit(0);
    } catch (dbErr) {
      console.error("❌ Error disconnecting database:", dbErr);
      process.exit(1);
    }
  });

  // Force shutdown if cleanup takes too long
  setTimeout(() => {
    console.error("⚠️ Graceful shutdown timed out. Forcing termination.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
  gracefulShutdown("unhandledRejection");
});
