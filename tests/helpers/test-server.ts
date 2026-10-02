import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import app from "../../src/app.js";

export interface TestClient {
  server: Server;
  baseUrl: string;
  close: () => Promise<void>;
  get: (path: string, headers?: Record<string, string>) => Promise<Response>;
  post: (
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ) => Promise<Response>;
  patch: (
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ) => Promise<Response>;
  delete: (path: string, headers?: Record<string, string>) => Promise<Response>;
}

export const startTestServer = async (): Promise<TestClient> => {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const address = server.address() as AddressInfo;
      const baseUrl = `http://127.0.0.1:${address.port}`;

      const client: TestClient = {
        server,
        baseUrl,
        close: async () => {
          return new Promise<void>((res, rej) => {
            server.close((err) => (err ? rej(err) : res()));
          });
        },
        get: async (path, headers = {}) => {
          return fetch(`${baseUrl}${path}`, {
            method: "GET",
            headers: {
              ...headers,
            },
          });
        },
        post: async (path, body, headers = {}) => {
          return fetch(`${baseUrl}${path}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
          });
        },
        patch: async (path, body, headers = {}) => {
          return fetch(`${baseUrl}${path}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
          });
        },
        delete: async (path, headers = {}) => {
          return fetch(`${baseUrl}${path}`, {
            method: "DELETE",
            headers: {
              ...headers,
            },
          });
        },
      };

      resolve(client);
    });

    server.on("error", reject);
  });
};
