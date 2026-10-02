/**
 * GearUp Performance & Load Testing Tool
 * Simulates concurrent virtual users and calculates p50, p95, p99 latency metrics and throughput.
 *
 * Usage:
 *   pnpm test:load
 *   pnpm test:load -- --concurrency 50 --requests 300
 */

import { performance } from "node:perf_hooks";

const getArg = (name: string, fallback: number): number => {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) {
    return Number(process.argv[idx + 1]) || fallback;
  }
  return fallback;
};

const CONCURRENCY = getArg("concurrency", 25);
const TOTAL_REQUESTS = getArg("requests", 200);
const TARGET_URL = process.env.APP_BASE_URL || "http://localhost:5000";

interface RequestResult {
  status: number;
  durationMs: number;
  ok: boolean;
}

const runWorker = async (
  requestsPerWorker: number,
): Promise<RequestResult[]> => {
  const results: RequestResult[] = [];

  for (let i = 0; i < requestsPerWorker; i++) {
    const start = performance.now();
    try {
      const res = await fetch(`${TARGET_URL}/health`);
      const duration = performance.now() - start;
      results.push({
        status: res.status,
        durationMs: duration,
        ok: res.ok,
      });
    } catch {
      const duration = performance.now() - start;
      results.push({
        status: 0,
        durationMs: duration,
        ok: false,
      });
    }
  }

  return results;
};

const calculatePercentile = (sorted: number[], percentile: number): number => {
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] ?? 0;
};

const runLoadTest = async () => {
  console.log("\n========================================================");
  console.log("🚀 GearUp API — Performance & Load Benchmark");
  console.log("========================================================");
  console.log(`Target URL        : ${TARGET_URL}`);
  console.log(`Concurrent Users  : ${CONCURRENCY}`);
  console.log(`Total Requests    : ${TOTAL_REQUESTS}`);
  console.log("Executing benchmark...\n");

  // Health check first
  try {
    const health = await fetch(`${TARGET_URL}/health`);
    if (!health.ok) {
      console.error(`⚠️ Server responded with HTTP ${health.status}`);
    }
  } catch (err) {
    console.error(`❌ Could not connect to ${TARGET_URL}. Is the server running?`);
    console.error("   Run 'pnpm dev' or 'pnpm start' in another terminal first.\n");
    process.exit(1);
  }

  const requestsPerWorker = Math.floor(TOTAL_REQUESTS / CONCURRENCY);
  const startTime = performance.now();

  const workerPromises = Array.from({ length: CONCURRENCY }, () =>
    runWorker(requestsPerWorker),
  );

  const workerResults = await Promise.all(workerPromises);
  const totalDurationSeconds = (performance.now() - startTime) / 1000;

  const allResults = workerResults.flat();
  const successful = allResults.filter((r) => r.ok).length;
  const failed = allResults.length - successful;

  const latencies = allResults.map((r) => r.durationMs).sort((a, b) => a - b);
  const minLatency = latencies[0] ?? 0;
  const maxLatency = latencies[latencies.length - 1] ?? 0;
  const avgLatency =
    latencies.reduce((acc, l) => acc + l, 0) / (latencies.length || 1);

  const p50 = calculatePercentile(latencies, 50);
  const p90 = calculatePercentile(latencies, 90);
  const p95 = calculatePercentile(latencies, 95);
  const p99 = calculatePercentile(latencies, 99);
  const throughput = Math.round(allResults.length / totalDurationSeconds);

  console.log("---------------- Benchmark Summary ------------------");
  console.log(`Total Completed   : ${allResults.length}`);
  console.log(`Successful (2xx)  : ${successful}`);
  console.log(`Failed (non-2xx)  : ${failed}`);
  console.log(`Total Time        : ${totalDurationSeconds.toFixed(2)}s`);
  console.log(`Throughput (RPS)  : ${throughput} requests/sec`);
  console.log("---------------- Latency Percentiles ----------------");
  console.log(`Min Latency       : ${minLatency.toFixed(2)} ms`);
  console.log(`Average Latency   : ${avgLatency.toFixed(2)} ms`);
  console.log(`p50 (Median)      : ${p50.toFixed(2)} ms`);
  console.log(`p90               : ${p90.toFixed(2)} ms`);
  console.log(`p95               : ${p95.toFixed(2)} ms`);
  console.log(`p99               : ${p99.toFixed(2)} ms`);
  console.log(`Max Latency       : ${maxLatency.toFixed(2)} ms`);
  console.log("========================================================\n");
};

runLoadTest();
