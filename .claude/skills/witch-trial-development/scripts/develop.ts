#!/usr/bin/env bun
/**
 * Development Helper Script
 *
 * Provides common development operations for the Witch Trial project.
 * Usage: bun scripts/develop.ts <command>
 *
 * Commands:
 *   new:move <name>     - Generate new move template
 *   new:test <name>     - Generate test file template
 *   new:selector <name>  - Generate selector template
 *   test:file <name>    - Run specific test file
 *   test:watch          - Run tests in watch mode
 *   build:check         - Quick type check
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";

const GAME_ENGINE = "packages/bgio-engine";
const TEMPLATES = `${GAME_ENGINE}/.templates`;

// Move template
const MOVE_TEMPLATE = `/**
 * Move Description
 *
 * Rules:
 * 1. Rule one
 *
 * @param G - Game state
 * @param playerID - Actor ID
 * @param arg1 - Description
 */
{MOVE_NAME}: wrapMove(({ G, ctx, playerID }: MoveContext, arg1: Type) => {
  // 1. Validate preconditions
  assertPhase(G, GamePhase.DEEP_NIGHT);
  assertPlayerAlive(G, playerID);

  // 2. Modify state
  console.log(\`[Move] \${playerID} performing {moveName}\`);

  // 3. Emit event
  TMessageBuilder.createSystem("{moveName} completed");
}),
`;

// Test template
const TEST_TEMPLATE = `import { describe, it, expect } from "bun:test";
import { moveFunctions } from "../game/moves";
import type { BGGameState } from "../types";
import { GamePhase } from "../types/core";
import {
  createMockRandom,
  createTestState,
  createMoveContext,
  setupPlayers,
} from "./testUtils";

describe("{TEST_NAME}", () => {
  describe("Happy Path", () => {
    it("should do expected thing", () => {
      const state = createTestState();
      setupPlayers(state, ["p1", "p2", "p3"]);
      state.status = GamePhase.DEEP_NIGHT;

      const result = callMove(
        moveFunctions.{MOVE_NAME},
        createMoveContext(state, "p1"),
        arg1
      );

      expect(result).toBeUndefined();
      expect(state.property).toBe(expectedValue);
    });
  });

  describe("Edge Cases", () => {
    it("should handle error condition", () => {
      // Setup error condition
      state.status = GamePhase.MORNING;

      const result = callMove(
        moveFunctions.{MOVE_NAME},
        createMoveContext(state, "p1"),
        arg1
      );

      expect(result).toBe("INVALID_MOVE");
    });
  });
});
`;

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

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelToKebab(str: string) {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

async function commandNewMove(name: string) {
  const moveName = capitalize(name);
  const filePath = `${GAME_ENGINE}/src/game/moves.ts`;

  console.log(`🆕 Creating new move: ${moveName}\n`);

  // Read current file
  if (!existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  const content = readFileSync(filePath, "utf-8");

  // Check if move already exists
  if (content.includes(`${name}:`) || content.includes(`${moveName}:`)) {
    console.log(`⚠️  Move "${name}" may already exist`);
  }

  // Generate template
  const template = MOVE_TEMPLATE.replace(/{MOVE_NAME}/g, moveName)
    .replace(/{moveName}/g, name.toLowerCase());

  console.log(`📝 Add this to moves.ts:\n`);
  console.log(template);
  console.log(`\n📝 Then register in phases.ts:`);
  console.log(`  ${name}: moveFunctions.${moveName},`);
}

async function commandNewTest(name: string) {
  const testName = capitalize(name);
  const fileName = camelToKebab(name);

  console.log(`🧪 Creating test for: ${testName}\n`);

  const template = TEST_TEMPLATE.replace(/{TEST_NAME}/g, testName)
    .replace(/{MOVE_NAME}/g, testName);

  console.log(`📝 Create file: ${GAME_ENGINE}/src/__tests__/${fileName}.test.ts\n`);
  console.log(template);
}

async function commandTestFile(name: string) {
  const fileName = name.endsWith(".test.ts") ? name : `${name}.test.ts`;
  const testPath = `${GAME_ENGINE}/src/__tests__/${fileName}`;

  console.log(`🧪 Running test: ${fileName}\n`);

  if (!existsSync(testPath)) {
    console.log(`❌ File not found: ${testPath}`);
    return;
  }

  const result = runCommand(`bun test ${testPath}`);
  console.log(result.output);
}

async function commandTestWatch() {
  console.log(`👀 Running tests in watch mode...\n`);
  console.log("Press 'h' for help, 'q' to quit\n");

  const result = runCommand(`bun test --watch`, GAME_ENGINE);
  console.log(result.output);
}

async function commandBuildCheck() {
  console.log(`🔍 Running type check...\n`);

  const result = runCommand("pnpm build", GAME_ENGINE);

  if (result.success) {
    console.log(`✅ Type check passed`);
  } else {
    console.log(result.output);
  }
}

async function commandGenerate() {
  console.log(`📦 Generating project...\n`);

  const commands = [
    ["pnpm build", GAME_ENGINE],
    ["pnpm db:gen", "apps/web"],
  ];

  let allSuccess = true;
  for (const [cmd, cwd] of commands) {
    const result = runCommand(cmd, cwd);
    if (!result.success) {
      console.log(`❌ ${cmd} failed`);
      allSuccess = false;
    }
  }

  if (allSuccess) {
    console.log(`✅ Generation complete`);
  }
}

// Main entry point
const command = Bun.argv[2];
const arg = Bun.argv[3];

switch (command) {
  case "new:move":
    if (!arg) {
      console.log("❌ Missing move name");
      console.log("Usage: bun scripts/develop.ts new:move <name>");
    } else {
      await commandNewMove(arg);
    }
    break;

  case "new:test":
    if (!arg) {
      console.log("❌ Missing test name");
      console.log("Usage: bun scripts/develop.ts new:test <name>");
    } else {
      await commandNewTest(arg);
    }
    break;

  case "test:file":
    if (!arg) {
      console.log("❌ Missing file name");
      console.log("Usage: bun scripts/develop.ts test:file <name>");
    } else {
      await commandTestFile(arg);
    }
    break;

  case "test:watch":
    await commandTestWatch();
    break;

  case "build:check":
    await commandBuildCheck();
    break;

  case "generate":
    await commandGenerate();
    break;

  default:
    console.log(`
🔧 Witch Trial Development

Usage: bun scripts/develop.ts <command> [args]

Commands:
  new:move <name>     Create move template
  new:test <name>     Create test template
  test:file <name>   Run specific test file
  test:watch         Watch mode for tests
  build:check        Quick type check
  generate           Generate all types

Examples:
  bun scripts/develop.ts new:move trade
  bun scripts/develop.ts new:test vote
  bun scripts/develop.ts test:file game.test.ts
  bun scripts/develop.ts build:check
`);
    process.exit(0);
}
