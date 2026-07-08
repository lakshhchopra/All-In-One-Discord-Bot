import { spawn } from "child_process";

function runCmd(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`[Bootstrap] Executing: ${command} ${args.join(" ")}`);
    const proc = spawn(command, args, { stdio: "inherit", shell: true });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
  });
}

async function boot() {
  try {
    console.log("🗄️ [Bootstrap] Syncing Prisma Schema & Database...");
    await runCmd("npx", ["prisma", "generate", "--schema=./prisma/schema.prisma"]);
    await runCmd("npx", ["prisma", "db", "push", "--schema=./prisma/schema.prisma", "--accept-data-loss"]);

    console.log("🚀 [Bootstrap] Starting Discord Bot...");
    await runCmd("npx", ["tsx", "src/index.ts"]);
  } catch (error) {
    console.error("❌ [Bootstrap] Failed to boot:", error);
    process.exit(1);
  }
}

boot();
