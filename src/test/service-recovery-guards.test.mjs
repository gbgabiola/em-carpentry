import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  localContainerConfig,
  scopedContainerName,
} from "./recovery/docker-proxy.mjs";
import {
  validateServiceManifest,
  validateServiceUrl,
} from "./recovery/services.mjs";
const root = "/synthetic-workspace";
function manifest() {
  const nonce = "abcd1234";
  const network = `em-carpentry-recovery-${nonce}`;
  const base = `${root}/.verification/service-recovery/${nonce}`;
  return {
    nonce,
    network,
    base,
    stacks: ["source", "target"].map((name, index) => ({
      name,
      projectId: `${network}-${name}`,
      workdir: `${base}/${name}`,
      port: index === 0 ? 56521 : 56621,
    })),
  };
}
test("local service manifests cannot select a hosted project, shared working directory or unrelated ports", () => {
  assert.equal(validateServiceManifest(manifest(), root).stacks.length, 2);
  for (const change of [
    (value) => {
      value.stacks[0].projectId = "em-carpentry";
    },
    (value) => {
      value.stacks[1].workdir = root;
    },
    (value) => {
      value.stacks[0].port = 54321;
    },
    (value) => {
      value.base = "/outside";
    },
    (value) => {
      value.nonce = "../outside";
    },
  ]) {
    const value = manifest();
    change(value);
    assert.throws(() => validateServiceManifest(value, root));
  }
});
test("service URLs must match the expected loopback port with no credentials or extra path", () => {
  assert.equal(
    validateServiceUrl("http://127.0.0.1:56521", 56521),
    "http://127.0.0.1:56521",
  );
  for (const value of [
    "https://example.test",
    "http://localhost:56521",
    "http://127.0.0.1:54321",
    "http://user:secret@127.0.0.1:56521",
    "http://127.0.0.1:56521/path",
    "http://127.0.0.1:56521?remote=true",
  ])
    assert.throws(() => validateServiceUrl(value, 56521));
});
test("container guard forces published ports to loopback without changing existing environment or the input", () => {
  const project = manifest().stacks[0].projectId;
  const body = {
    Env: ["SYNTHETIC_SETTING=fixture"],
    HostConfig: {
      NetworkMode: "bridge",
      PortBindings: {
        "8000/tcp": [
          { HostIp: "0.0.0.0", HostPort: "56521" },
          { HostIp: "::", HostPort: "56521" },
        ],
      },
    },
  };
  const original = structuredClone(body);
  const guarded = localContainerConfig(
    body,
    `supabase_kong_${project}`,
    project,
  );
  assert.deepEqual(body, original);
  assert.deepEqual(guarded.Env, body.Env);
  assert.deepEqual(guarded.HostConfig.PortBindings["8000/tcp"], [
    { HostIp: "127.0.0.1", HostPort: "56521" },
  ]);
});
test("container guard rejects unrelated projects and host or container-shared networking", () => {
  const project = manifest().stacks[0].projectId;
  assert.throws(() => localContainerConfig({}, "backend-db-1", project));
  for (const mode of ["host", "container:backend-db-1"])
    assert.throws(() =>
      localContainerConfig(
        { HostConfig: { NetworkMode: mode } },
        `supabase_db_${project}`,
        project,
      ),
    );
});
test("real-service CLI rejects user backup paths and connection strings before importing the runner", () => {
  const path = fileURLToPath(
    new URL("../../scripts/rehearse-services.mjs", import.meta.url),
  );
  const result = spawnSync(
    process.execPath,
    [path, "PRIVATE-BACKUP.json", "postgres://PRIVATE-CONNECTION"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.doesNotMatch(result.stderr, /PRIVATE-BACKUP|PRIVATE-CONNECTION/);
});

test("anonymous CLI bootstrap helpers receive owned names only with matching labels and no published ports", () => {
  const project = manifest().stacks[0].projectId;
  const body = {
    Image: "public.ecr.aws/supabase/realtime:synthetic",
    Labels: { "com.supabase.cli.project": project },
    HostConfig: {},
  };
  assert.ok(scopedContainerName(body, "", project).endsWith(`_${project}`));
  for (const change of [
    { Labels: {} },
    { Image: "unrelated-image" },
    { HostConfig: { PortBindings: { "80/tcp": [{ HostPort: "12345" }] } } },
    { HostConfig: { PublishAllPorts: true } },
  ])
    assert.throws(() =>
      scopedContainerName({ ...body, ...change }, "", project),
    );
});
import http from "node:http";
import { mkdtemp, mkdir, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localDockerProxy } from "./recovery/docker-proxy.mjs";

test("Docker wait response headers are forwarded before its body so clients can start the container", async () => {
  const root = await mkdtemp(join(tmpdir(), "em-proxy-"));
  const directory = join(root, ".verification");
  await mkdir(directory);
  const enginePath = join(directory, "engine.sock");
  const proxyPath = join(directory, "proxy.sock");
  let waiting;
  const engine = http.createServer((request, response) => {
    if (request.url === "/wait") {
      waiting = response;
      response.writeHead(200, { "Content-Type": "application/json" });
      response.flushHeaders();
    } else if (request.url === "/start") {
      response.writeHead(204);
      response.end();
      waiting.end(JSON.stringify({ StatusCode: 0 }));
    } else {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise((done) => engine.listen(enginePath, done));
  const proxy = await localDockerProxy(
    proxyPath,
    manifest().stacks[0].projectId,
    enginePath,
  );
  const connections = [];
  try {
    const wait = await new Promise((done, reject) => {
      const request = http.request(
        { socketPath: proxyPath, path: "/wait", method: "POST", agent: false },
        done,
      );
      connections.push(request);
      request.setTimeout(1500, () =>
        request.destroy(new Error("Wait headers were buffered.")),
      );
      request.on("error", reject);
      request.end();
    });
    assert.equal(wait.statusCode, 200);
    const body = new Promise((done, reject) => {
      let value = "";
      wait.on("data", (chunk) => (value += chunk));
      wait.on("end", () => done(value));
      wait.on("error", reject);
    });
    await new Promise((done, reject) => {
      const request = http.request(
        { socketPath: proxyPath, path: "/start", method: "POST", agent: false },
        (response) => {
          response.resume();
          response.on("end", done);
        },
      );
      connections.push(request);
      request.on("error", reject);
      request.end();
    });
    assert.deepEqual(JSON.parse(await body), { StatusCode: 0 });
  } finally {
    for (const connection of connections) connection.destroy();
    await proxy.close();
    engine.closeAllConnections();
    await new Promise((done) => engine.close(done));
    await rmdir(directory);
    await rmdir(root);
  }
});
