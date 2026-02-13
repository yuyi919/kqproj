#!/usr/bin/env bun
/**
 * Maintenance Helper Script
 *
 * Provides common maintenance operations for the Witch Trial project.
 * Usage: bun scripts/maintenance.ts <command>
 *
 * Commands:
 *   test        - Run game engine tests
 *   build       - Build game engine
 *   check       - Full verification (build + test)
 *   db:gen      - Generate Prisma client
 *   lint        - Run linter
 *   status      - Check project status
 */

import { execSync } from "child_process";
import { existsSync } from "fs";

const GAME_ENGINE = "packages/bgio-engine";
const WEB_APP = "apps/web";

function runCommand(cmd: string, cwd?: string) {
  try {
    const result = execSync(cmd, {
      cwd: cwd ?? process.cwd(),
      encoding: "utf-8",
      stdio: "pipe",
    });
    return { success: true, output: result };
  } catch (error: any) {
    return { success: false, output: error.message };
  }
}

function printStatus(label: string, status: boolean) {
  const icon = status ? "✅" : "❌";
  console.log(`${icon} ${label}`);
  return status;
}

async function commandStatus() {
  console.log("📊 Project Status\n");

  const checks = [
    ["Game Engine Build", runCommand("pnpm build", GAME_ENGINE).success],
    ["Game Engine Tests", runCommand("bun test", GAME_ENGINE).success],
    ["Web App Build", runCommand("pnpm build", WEB_APP).success],
    ["Prisma Generated", existsSync(`${WEB_APP}/src/generated`)],
  ] as const;

  let allPass = true;
  for (const [name, passed] of checks) {
    allPass = printStatus(name, passed) && allPass;
  }

  console.log(`\n${allPass ? "✅ All checks passed" : "❌ Some checks failed"}`);
  return allPass;
}

async function commandTest(file?: string) {
  const testPath = file
    ? `${GAME_ENGINE}/src/__tests__/${file}`
    : `${GAME_ENGINE}/src/`;

  console.log(`🧪 Running tests: ${testPath}\n`);

  const result = runCommand(`bun test ${testPath}`);
  console.log(result.output);

  if (!result.success) {
    console.log("\n❌ Tests failed");
    process.exit(1);
  }
}

async function commandBuild() {
  console.log("🔨 Building game engine...\n");

  const result = runCommand("pnpm build", GAME_ENGINE);
  console.log(result.output);

  if (!result.success) {
    console.log("\n❌ Build failed");
    process.exit(1);
  }

  console.log("\n✅ Build successful");
}

async function commandCheck() {
  console.log("🔍 Full verification...\n");

  // Build first (catches type errors)
  const build = runCommand("pnpm build", GAME_ENGINE);
  printStatus("Type Check", build.success);
  if (!build.success) {
    console.log(build.output);
    return;
  }

  // Then test
  const test = runCommand("bun test", GAME_ENGINE);
  printStatus("Tests", test.success);
  console.log(test.output);
}

async function commandDbGen() {
  console.log("🗄️  Generating Prisma client...\n");

  const result = runCommand("pnpm db:gen", WEB_APP);
  console.log(result.output);

  if (!result.success) {
    console.log("\n❌ Generation failed");
    process.exit(1);
  }

  console.log("\n✅ Prisma client generated");
}

async function commandLint() {
  console.log("🧹 Running linter...\n");

  const gameResult = runCommand("pnpm lint", GAME_ENGINE);
  const webResult = runCommand("pnpm lint", WEB_APP);

  printStatus("Game Engine", gameResult.success);
  printStatus("Web App", webResult.success);

  if (!gameResult.success) console.log(gameResult.output);
  if (!webResult.success) console.log(webResult.output);
}

// Main entry point
const command = Bun.argv[2];

switch (command) {
  case "status":
    commandStatus();
    break;

  case "test":
    commandTest(Bun.argv[3]);
    break;

  case "build":
    commandBuild();
    break;

  case "check":
    commandCheck();
    break;

  case "db:gen":
    commandDbGen();
    break;

  case "lint":
    commandLint();
    break;

  default:
    console.log(`
🔧 Witch Trial Maintenance

Usage: bun scripts/maintenance.ts <command>

Commands:
  status      Check project status
  test [file] Run tests (optionally specific file)
  build       Build game engine
  check       Full verification (build + test)
  db:gen      Generate Prisma client
  lint        Run linter on all packages

Examples:
  bun scripts/maintenance.ts status
  bun scripts/maintenance.ts test game.test.ts
  bun scripts/maintenance.ts check
`);
    process.exit(0);
}
