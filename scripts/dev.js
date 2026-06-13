import { spawn } from "node:child_process";

const commands = [
  { name: "api", command: "node", args: ["server/index.js"] },
  { name: "vite", command: "npx", args: ["vite"] },
];

const children = commands.map(({ name, command, args }) => {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    shell: true,
    stdio: ["inherit", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(`[${name}] ${data}`);
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
      children.forEach((running) => {
        if (running !== child && !running.killed) running.kill();
      });
    }
  });

  return child;
});

const shutdown = () => {
  children.forEach((child) => {
    if (!child.killed) child.kill();
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
