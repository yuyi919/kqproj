#!/usr/bin/env bun
/**
 * Development Helper Script
 *
 * Usage: bun scripts/develop.ts <command> [options]
 *
 * Commands:
 *   new:move <name>     - Generate new move template
 *   new:test <name>     - Generate test file template
 *   test:file <name>   - Run specific test file
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";

const GAME_ENGINE = `${process.cwd()}/packages/bgio-engine`;

// ANSI colors
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const blue = (s: string) => `\x1b[34m${s}\x1b[0m`;

function log(msg: string) {
  console.log(msg);
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelToKebab(str: string) {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

// Move template
const MOVE_TEMPLATE = `/**
 * {Description}
 *
 * Rules:
 * 1. Rule one
 *
 * @param G - Game state
 * @param playerID - Actor ID
 */
{MOVE_NAME}: wrapMove(({ G, ctx, playerID }: MoveContext) => {
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
      state.phase = GamePhase.DEEP_NIGHT;

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
      state.phase = GamePhase.MORNING;

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

// Main entry point
const command = Bun.argv[2];
const arg = Bun.argv[3];

switch (command) {
  case "new:move": {
    const name = arg;
    if (!name) {
      console.log("Usage: bun scripts/develop.ts new:move <name>");
      break;
    }

    const moveName = capitalize(name);
    log(`${blue(`Creating new move: ${moveName}`)}\n`);

    const template = MOVE_TEMPLATE.replace(/{MOVE_NAME}/g, moveName)
      .replace(/{moveName}/g, name.toLowerCase())
      .replace(/{Description}/g, "Move description");

    console.log(`${green("Add this to moves.ts:")}\n`);
    console.log(template);
    break;
  }

  case "new:test": {
    const name = arg;
    if (!name) {
      console.log("Usage: bun scripts/develop.ts new:test <name>");
      break;
    }

    const testName = capitalize(name);
    const fileName = camelToKebab(name);
    log(`${blue(`Creating test for: ${testName}`)}\n`);

    const template = TEST_TEMPLATE.replace(/{TEST_NAME}/g, testName)
      .replace(/{MOVE_NAME}/g, testName);

    console.log(`${green(`Create file: ${GAME_ENGINE}/src/__tests__/${fileName}.test.ts`)}\n`);
    console.log(template);
    break;
  }

  case "test:file": {
    const name = arg;
    if (!name) {
      console.log("Usage: bun scripts/develop.ts test:file <name>");
      break;
    }

    const fileName = name.endsWith(".test.ts") ? name : `${name}.test.ts`;
    const testPath = `${GAME_ENGINE}/src/__tests__/${fileName}`;

    log(`${blue(`Running test: ${fileName}`)}\n`);

    if (!existsSync(testPath)) {
      log(`File not found: ${testPath}`);
      break;
    }

    const result = execSync(`bun test ${testPath}`, { encoding: "utf-8" });
    console.log(result);
    break;
  }

  default:
    console.log(`
${blue("🔧 Witch Trial Development")}

Usage: bun scripts/develop.ts <command> [options]

Commands:
  new:move <name>    Create move template
  new:test <name>    Create test template
  test:file <name>  Run specific test file

Examples:
  bun scripts/develop.ts new:move trade
  bun scripts/develop.ts new:test vote
  bun scripts/develop.ts test:file game.test.ts
`);
}
