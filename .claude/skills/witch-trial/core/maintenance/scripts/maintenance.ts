#!/usr/bin/env bun
/**
 * Maintenance Helper Script
 *
 * Usage: bun scripts/maintenance.ts <command>
 *
 * Commands:
 *   status    - Check project status
 *   test      - Run tests
 *   build     - Type check
 *   check     - Full verification
 *   db:gen    - Generate Prisma client
 *   lint      - Lint all
 */

import { execSync } from "child_process";
import { existsSync } from "fs";

const PROJECT_ROOT = process.cwd();
const GAME_ENGINE = `${PROJECT_ROOT}/packages/bgio-engine`;

// ANSI colors
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const blue = (s: string) => `\x1b[34m${s}\x1b[0m`;

function log(msg: string) {
  console.log(msg);
}

function runCommand(cmd: string, cwd?: string) {
  try {
    const result = execSync(cmd, {
      cwd: cwd ?? PROJECT_ROOT,
      encoding: "utf-8",
      stdio: "pipe",
    });
    return { success: true, output: result };
  } catch (error: any) {
    return { success: false, output: error.message };
  }
}

// Main entry point
const command = Bun.argv[2];
const arg = Bun.argv[3];

switch (command) {
  case "status": {
    log(`${blue("Project Status")}\n`);

    log(`Platform: Windows 11`);
    log(`Shell: PowerShell`);
    log(`Package Manager: pnpm`);
    log(`Runtime: Bun\n`);

    log("Directories:");
    log(`- apps/web: ${existsSync(`${PROJECT_ROOT}/apps/web`) ? "exists" : "missing"}`);
    log(`- packages/bgio-engine: ${existsSync(GAME_ENGINE) ? "exists" : "missing"}`);
    break;
  }

  case "test": {
    const testFile = arg;

    if (testFile) {
      log(`${blue(`Running test: ${testFile}`)}\n`);
      const result = runCommand(`bun test ${GAME_ENGINE}/src/__tests__/${testFile}`);
      console.log(result.output);
    } else {
      log(`${blue("Running all tests...")}\n`);
      const result = runCommand("bun test", GAME_ENGINE);
      console.log(result.output);
    }
    break;
  }

  case "build": {
    log(`${blue("Running type check...")}\n`);
    const result = runCommand("pnpm build", GAME_ENGINE);
    console.log(result.output);
    break;
  }

  case "check": {
    log(`${blue("Running full verification...")}\n`);

    const checks = [
      ["Type check", "pnpm build", GAME_ENGINE],
      ["Tests", "bun test", GAME_ENGINE],
    ];

    let allPassed = true;
    for (const [name, cmd, cwd] of checks) {
      log(`${blue(`Running ${name}...`)}`);
      const result = runCommand(cmd, cwd);
      if (result.success) {
        log(`${green(`✓ ${name} passed`)}\n`);
      } else {
        log(`${yellow(`✗ ${name} failed`)}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      log(`${green("✓ All checks passed!")}`);
    }
    break;
  }

  case "db:gen": {
    log(`${blue("Generating Prisma client...")}\n`);
    const result = runCommand("pnpm db:gen", `${PROJECT_ROOT}/apps/web`);
    console.log(result.output);
    break;
  }

  case "lint": {
    log(`${blue("Running lint...")}\n`);
    const result = runCommand("pnpm lint", `${PROJECT_ROOT}/apps/web`);
    console.log(result.output);
    break;
  }

  default:
    console.log(`
${blue("🔧 Witch Trial Maintenance")}

Usage: bun scripts/maintenance.ts <command> [options]

Commands:
  status          Check project status
  test [file]     Run tests (optional: specific file)
  build           Type check and build
  check           Full verification (tests + build)
  db:gen          Generate Prisma client
  lint            Lint all

Examples:
  bun scripts/maintenance.ts status
  bun scripts/maintenance.ts test
  bun scripts/maintenance.ts test game.test.ts
  bun scripts/maintenance.ts check
  bun scripts/maintenance.ts db:gen
  bun scripts/maintenance.ts lint
`);
}
