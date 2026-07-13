import { spawn } from "node:child_process";
import { resolvePortSync } from "../src/lib/config";

/**
 * Launches `next dev` / `next start` on the port from ~/.config/cc-dash/config.json.
 * npm scripts are static strings, so the port has to be resolved here before Next boots.
 */
const mode = process.argv[2];
if (mode !== "dev" && mode !== "start") {
  throw new Error(
    `run-next expects "dev" or "start" as its first argument, got ${JSON.stringify(mode)}`,
  );
}

const passthroughArgs = process.argv.slice(3);
const port = resolvePortSync();

const child = spawn("next", [mode, "-p", String(port), ...passthroughArgs], {
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
