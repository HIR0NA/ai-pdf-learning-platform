const http = require('node:http');
const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const args = process.argv.slice(2);
let port = process.env.PORT || '3000';
const nextArgs = [];

for (let index = 0; index < args.length; index += 1) {
  const value = args[index];
  if ((value === '--port' || value === '-p') && args[index + 1]) {
    port = args[index + 1];
    index += 1;
  } else {
    nextArgs.push(value);
  }
}

function requestExistingServer() {
  return new Promise((resolve) => {
    const request = http.get({ host: '127.0.0.1', port, path: '/', timeout: 1000 }, (response) => {
      response.resume();
      resolve({ kind: 'http', statusCode: response.statusCode });
    });
    request.on('timeout', () => request.destroy());
    request.on('error', () => resolve({ kind: 'unavailable' }));
  });
}

function isPortOccupied() {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => resolve(false));
  });
}

function removeStaleNextLock() {
  const lockPath = path.join(process.cwd(), '.next', 'dev', 'lock');
  if (!fs.existsSync(lockPath)) return;

  try {
    // An exclusive write open fails on Windows while a live Next.js process owns it.
    const descriptor = fs.openSync(lockPath, 'r+');
    fs.closeSync(descriptor);
    fs.rmSync(lockPath);
    console.log('Removed a stale .next/dev/lock from a previous dev-server session.');
  } catch {
    throw new Error('A Next.js dev lock is still in use. Stop the existing dev server before starting another one.');
  }
}

async function main() {
  const existing = await requestExistingServer();
  if (existing.kind === 'http') {
    console.log(`Next.js dev server is already running at http://localhost:${port} (HTTP ${existing.statusCode}).`);
    console.log('Reusing the existing server; no duplicate process was started.');
    return;
  }

  if (await isPortOccupied()) {
    throw new Error(`Port ${port} is already occupied by a process that is not responding as this project.`);
  }

  removeStaleNextLock();

  const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  const child = spawn(process.execPath, [nextBin, 'dev', '--port', String(port), ...nextArgs], {
    stdio: 'inherit',
    windowsHide: false,
  });

  let stopping = false;
  const stop = (signal) => {
    if (stopping) return;
    stopping = true;
    if (process.platform === 'win32' && child.pid) {
      const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'inherit', windowsHide: true });
      killer.once('exit', () => process.exit(0));
      killer.once('error', () => process.exit(1));
      return;
    }
    child.kill(signal);
  };
  process.on('SIGINT', () => stop('SIGINT'));
  process.on('SIGTERM', () => stop('SIGTERM'));

  child.on('error', (error) => {
    console.error(`Unable to start Next.js: ${error.message}`);
    process.exitCode = 1;
  });
  child.on('exit', (code, signal) => {
    if (signal) process.exitCode = 0;
    else process.exitCode = code ?? 1;
  });
}

main().catch((error) => {
  console.error(`dev server error: ${error.message}`);
  process.exitCode = 1;
});
