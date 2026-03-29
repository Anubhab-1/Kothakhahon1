import fs from "node:fs";
import path from "node:path";
import { spawnSync, spawn } from "node:child_process";

const projectRoot = process.cwd();
const localDbPort = process.env.POSTGRES_PORT ?? "54329";

function readEnvFile(fileName) {
  const filePath = path.join(projectRoot, fileName);
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const entries = {};
  const contents = fs.readFileSync(filePath, "utf8");

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    entries[key] = value;
  }

  return entries;
}

function resolveDatabaseUrl() {
  return (
    process.env.DATABASE_URL ??
    readEnvFile(".env.local").DATABASE_URL ??
    readEnvFile(".env").DATABASE_URL ??
    ""
  );
}

function shouldStartLocalDatabase() {
  const databaseUrl = resolveDatabaseUrl();
  return databaseUrl.includes(`localhost:${localDbPort}`) || databaseUrl.includes(`127.0.0.1:${localDbPort}`);
}

if (shouldStartLocalDatabase()) {
  const startDb = spawnSync("node", ["scripts/postgres-dev.mjs", "start"], {
    cwd: projectRoot,
    stdio: "inherit",
    shell: false,
  });

  if (startDb.status !== 0) {
    process.exit(startDb.status ?? 1);
  }
}

const nextDev = spawn("next", ["dev", "--webpack"], {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true,
});

nextDev.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
