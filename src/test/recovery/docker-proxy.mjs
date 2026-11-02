import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import http from "node:http";
import net from "node:net";
import { chmod, lstat, unlink } from "node:fs/promises";

// Local test tooling only. Never expose this Docker socket proxy over TCP.
export function scopedContainerName(body, name, projectId) {
  if (name) return name;
  assert.equal(
    body.Labels?.["com.supabase.cli.project"],
    projectId,
    "Unlabelled helper refused.",
  );
  assert.match(body.Image ?? "", /^(public\.ecr\.aws\/supabase\/|supabase\/)/);
  assert.equal(
    Object.keys(body.HostConfig?.PortBindings ?? {}).length,
    0,
    "Helper ports refused.",
  );
  assert.ok(
    !body.HostConfig?.PublishAllPorts,
    "Helper port publishing refused.",
  );
  return `supabase_helper_${randomBytes(4).toString("hex")}_${projectId}`;
}

export function localContainerConfig(body, name, projectId) {
  assert.match(
    projectId,
    /^em-carpentry-recovery-[a-f0-9]{8}-(source|target)$/,
  );
  assert.ok(
    name.startsWith("supabase_") && name.endsWith(`_${projectId}`),
    "Unscoped container creation refused.",
  );
  const result = structuredClone(body);
  result.HostConfig ??= {};
  assert.ok(
    result.HostConfig.NetworkMode !== "host" &&
      !result.HostConfig.NetworkMode?.startsWith("container:"),
    "Host/container network mode refused.",
  );
  for (const [port, bindings] of Object.entries(
    result.HostConfig.PortBindings ?? {},
  )) {
    const seen = new Set();
    result.HostConfig.PortBindings[port] = bindings
      .map((binding) => {
        const value = { ...binding, HostIp: "127.0.0.1" };
        delete value.HostIP;
        return value;
      })
      .filter((binding) => {
        const key = binding.HostPort;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }
  return result;
}
export async function localDockerProxy(
  socketPath,
  projectId,
  upstreamSocket = "/var/run/docker.sock",
) {
  assert.ok(
    socketPath.includes("/.verification/") && socketPath.endsWith(".sock"),
  );
  assert.ok(Buffer.byteLength(socketPath) < 104);
  try {
    const previous = await lstat(socketPath);
    assert.ok(previous.isSocket(), "Refusing to replace a non-socket file.");
    await unlink(socketPath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const sockets = new Set();
  const server = http.createServer(async (request, response) => {
    try {
      let body;
      const url = new URL(request.url, "http://docker.local");
      const headers = { ...request.headers };
      if (
        request.method === "POST" &&
        /\/containers\/create$/.test(url.pathname)
      ) {
        const chunks = [];
        let size = 0;
        for await (const chunk of request) {
          size += chunk.length;
          assert.ok(size <= 4 * 1024 * 1024);
          chunks.push(chunk);
        }
        const parsed = JSON.parse(Buffer.concat(chunks));
        const name = scopedContainerName(
          parsed,
          url.searchParams.get("name") ?? "",
          projectId,
        );
        url.searchParams.set("name", name);
        request.url = url.pathname + url.search;
        body = Buffer.from(
          JSON.stringify(localContainerConfig(parsed, name, projectId)),
        );
        delete headers["transfer-encoding"];
        headers["content-length"] = String(body.length);
      }
      const upstream = http.request(
        {
          socketPath: upstreamSocket,
          path: request.url,
          method: request.method,
          headers,
        },
        (result) => {
          response.writeHead(result.statusCode, result.headers);
          // Docker's wait endpoint sends headers before its body. Clients wait for
          // those headers before starting the container that will finish the body.
          response.flushHeaders();
          result.pipe(response);
        },
      );
      upstream.on("socket", (socket) => {
        sockets.add(socket);
        socket.on("close", () => sockets.delete(socket));
      });
      upstream.on("error", () => {
        if (!response.headersSent) response.writeHead(502);
        response.end();
      });
      if (body) upstream.end(body);
      else request.pipe(upstream);
    } catch {
      response.writeHead(403, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          message: "Local rehearsal container guard rejected the request.",
        }),
      );
    }
  });
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  server.on("upgrade", (request, socket, head) => {
    socket.allowHalfOpen = true;
    const upstream = net.connect(
      { path: upstreamSocket, allowHalfOpen: true },
      () => {
        const headers = Object.entries(request.headers)
          .map(([name, value]) => `${name}: ${value}`)
          .join("\r\n");
        upstream.write(
          `${request.method} ${request.url} HTTP/${request.httpVersion}\r\n${headers}\r\n\r\n`,
        );
        if (head.length) upstream.write(head);
        socket.pipe(upstream).pipe(socket);
      },
    );
    sockets.add(upstream);
    upstream.on("error", () => socket.destroy());
    socket.on("close", () => upstream.destroy());
    upstream.on("close", () => {
      sockets.delete(upstream);
      socket.destroy();
    });
  });
  await new Promise((done, reject) => {
    server.once("error", reject);
    server.listen(socketPath, done);
  });
  await chmod(socketPath, 0o600);
  return {
    host: `unix://${socketPath}`,
    async close() {
      for (const socket of sockets) socket.destroy();
      await new Promise((done) => server.close(done));
    },
  };
}
