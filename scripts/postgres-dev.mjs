import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, ".postgres-dev");
const logFile = path.join(projectRoot, ".postgres-dev.log");
const port = process.env.POSTGRES_PORT ?? "54329";
const databaseName = process.env.POSTGRES_DB ?? "kothakhahon_dev";

function getDefaultPostgresBin() {
  if (process.env.POSTGRES_BIN) {
    return process.env.POSTGRES_BIN;
  }

  if (process.platform === "win32") {
    return "C:\\Program Files\\PostgreSQL\\18\\bin";
  }

  return "";
}

function getBinary(binaryName) {
  const postgresBin = getDefaultPostgresBin();
  if (!postgresBin) {
    return binaryName;
  }

  return path.join(postgresBin, process.platform === "win32" ? `${binaryName}.exe` : binaryName);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    shell: false,
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function isClusterRunning() {
  if (!fs.existsSync(dataDir)) {
    return false;
  }

  const result = spawnSync(getBinary("pg_ctl"), ["-D", dataDir, "status"], {
    cwd: projectRoot,
    stdio: "ignore",
    shell: false,
  });

  return result.status === 0;
}

function ensureCluster() {
  if (fs.existsSync(dataDir)) {
    return;
  }

  run(getBinary("initdb"), ["-D", dataDir, "-U", "postgres", "-A", "trust"]);
}

function ensureDatabase() {
  const checkResult = spawnSync(
    getBinary("psql"),
    ["-p", port, "-U", "postgres", "-d", "postgres", "-tAc", `SELECT 1 FROM pg_database WHERE datname='${databaseName}'`],
    {
      cwd: projectRoot,
      encoding: "utf8",
    },
  );

  if (checkResult.status === 0 && checkResult.stdout.trim() === "1") {
    return;
  }

  run(getBinary("createdb"), ["-p", port, "-U", "postgres", databaseName]);
}

function startCluster() {
  ensureCluster();
  if (isClusterRunning()) {
    ensureDatabase();
    return;
  }
  run(getBinary("pg_ctl"), ["-D", dataDir, "-l", logFile, "-o", `-p ${port}`, "start"]);
  ensureDatabase();
}

function stopCluster() {
  if (!fs.existsSync(dataDir)) {
    return;
  }

  run(getBinary("pg_ctl"), ["-D", dataDir, "stop"]);
}

function setupCluster() {
  startCluster();
  console.log(`Local Postgres ready on port ${port}. Database: ${databaseName}`);
  console.log(`DATABASE_URL=postgresql://postgres@localhost:${port}/${databaseName}?schema=public`);
}

const action = process.argv[2] ?? "setup";

if (action === "setup") {
  setupCluster();
} else if (action === "start") {
  startCluster();
} else if (action === "stop") {
  stopCluster();
} else {
  console.error("Unknown action. Use setup, start, or stop.");
  process.exit(1);
}
