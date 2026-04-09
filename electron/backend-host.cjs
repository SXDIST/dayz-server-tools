"use strict";

const { EventEmitter } = require("events");
const { fork } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

class BackendHost extends EventEmitter {
  constructor() {
    super();
    this.backendProcess = null;
    this.pending = new Map();
    this.requestId = 0;
    this.stopping = false;
  }

  get isRunning() {
    return Boolean(this.backendProcess && this.backendProcess.exitCode === null);
  }

  async start() {
    if (this.isRunning) {
      return;
    }

    const { scriptPath, repoRoot } = this.resolveBackendScript();
    const child = fork(scriptPath, [], {
      cwd: repoRoot,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
      },
      silent: true,
    });

    this.backendProcess = child;
    this.stopping = false;

    const output = readline.createInterface({
      input: child.stdout,
      crlfDelay: Infinity,
    });

    output.on("line", (line) => {
      this.handleLine(line);
    });

    child.stderr?.on("data", (chunk) => {
      const text = String(chunk ?? "").trim();
      if (text) {
        this.emit("stderr", text);
      }
    });

    child.on("exit", (code, signal) => {
      this.backendProcess = null;
      const message = this.stopping
        ? "Desktop backend stopped."
        : `Desktop backend stopped unexpectedly (${code ?? "no-code"}${signal ? `, ${signal}` : ""}).`;

      for (const [id, entry] of this.pending.entries()) {
        entry.reject(new Error(message));
        this.pending.delete(id);
      }

      this.emit("exit", { code, signal, stopping: this.stopping });
    });

    child.on("error", (error) => {
      this.emit("stderr", error.message);
    });
  }

  async stop() {
    this.stopping = true;

    if (!this.backendProcess) {
      return;
    }

    this.backendProcess.kill("SIGKILL");
    this.backendProcess = null;
  }

  async invoke(method, ...args) {
    await this.start();

    const id = `req-${++this.requestId}`;
    const payload = JSON.stringify({ id, method, args });

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.backendProcess.stdin.write(`${payload}\n`, (error) => {
        if (!error) {
          return;
        }

        this.pending.delete(id);
        reject(error);
      });
    });
  }

  handleLine(line) {
    let message;

    try {
      message = JSON.parse(line);
    } catch {
      this.emit("stderr", `Failed to parse backend line: ${line}`);
      return;
    }

    if (message.event) {
      this.emit("event", {
        event: message.event,
        payload: message.payload,
      });
      return;
    }

    if (!message.id) {
      return;
    }

    const entry = this.pending.get(message.id);
    if (!entry) {
      return;
    }

    this.pending.delete(message.id);

    if (message.error) {
      entry.reject(new Error(message.error));
      return;
    }

    entry.resolve(message.result ?? null);
  }

  resolveBackendScript() {
    const repoRoot = path.resolve(__dirname, "..");
    const devPath = path.join(repoRoot, "backend", "node", "dayz-backend.cjs");
    const packagedPath = path.join(process.resourcesPath, "backend", "node", "dayz-backend.cjs");

    if (fs.existsSync(devPath)) {
      return { scriptPath: devPath, repoRoot };
    }

    if (fs.existsSync(packagedPath)) {
      return { scriptPath: packagedPath, repoRoot: process.resourcesPath };
    }

    throw new Error("Could not locate backend/node/dayz-backend.cjs.");
  }
}

module.exports = {
  BackendHost,
};
