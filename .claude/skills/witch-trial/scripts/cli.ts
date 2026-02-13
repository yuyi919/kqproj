#!/usr/bin/env bun
/**
 * Unified CLI for Witch Trial Project
 *
 * Usage: bun cli.ts <command> [options]
 *
 * Commands:
 *   check              - Full verification
 *   maintenance       - Maintenance operations
 *   dev               - Development operations
 *   docs              - Documentation operations
 *   improve           - Self-improving operations
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { execSync } from "child_process";

const PROJECT_ROOT = process.cwd();
const SKILLS_ROOT = `${PROJECT_ROOT}/.claude/skills/witch-trial`;
const EXT_SELF_IMPROVING = `${SKILLS_ROOT}/extensions/self-improving`;

// ANSI colors
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const blue = (s: string) => `\x1b[34m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;

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

// Parse arguments: --key=value format
function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const arg of args) {
    const match = arg.match(/^--(\w+)=(.*)$/);
    if (match) {
      result[match[1]] = match[2];
    }
  }
  return result;
}

// Main execution
const command = Bun.argv[2];
const subCommand = Bun.argv[3];
const args = parseArgs(Bun.argv.slice(4));

// Unified help
function showHelp() {
  console.log(`
${blue("🧙 Witch Trial Unified CLI")}

Usage: bun .claude/skills/witch-trial/scripts/cli.ts <command> [options]

Core Commands:
  check              Full verification (tests + type check + build)
  maintenance        Maintenance operations
  dev                Development operations
  docs               Documentation operations

Extension Commands:
  improve            Self-improving operations (auto-creates bilingual journals)

Examples:
  # Full check
  bun cli.ts check

  # Maintenance
  bun cli.ts maintenance test game.test.ts
  bun cli.ts maintenance build

  # Development
  bun cli.ts dev new:move trade
  bun cli.ts dev new:test vote

  # Documentation
  bun cli.ts docs update CLAUDE.md "New Section" "Content..."

  # Self-improving (recommended)
  bun cli.ts improve journal --title="Feature Name" --description="Description"

Note: Translation has been removed (simple string replacement is not useful for real translation).
`);
}

switch (command) {
  case undefined:
  case "help":
  case "--help":
  case "-h":
    showHelp();
    break;

  case "check": {
    log(`${blue("Running full verification...")}\n`);

    const checks = [
      ["Type check", "bun test", PROJECT_ROOT],
      ["Engine tests", "bun test packages/bgio-engine", PROJECT_ROOT],
    ];

    let allPassed = true;
    for (const [name, cmd, cwd] of checks) {
      log(`${blue(`Running ${name}...`)}`);
      const result = runCommand(cmd, cwd);
      if (result.success) {
        log(`${green(`✅ ${name} passed`)}\n`);
      } else {
        log(`${red(`❌ ${name} failed`)}`);
        log(result.output);
        allPassed = false;
      }
    }

    if (allPassed) {
      log(`\n${green("✅ All checks passed!")}`);
    } else {
      log(`\n${red("❌ Some checks failed")}`);
    }
    break;
  }

  case "maintenance": {
    const operation = subCommand;
    switch (operation) {
      case "test": {
        const file = args.file || args[0];
        if (file) {
          log(`${blue(`Running test: ${file}`)}`);
          const result = runCommand(`bun test packages/bgio-engine/src/__tests__/${file}`);
          log(result.output);
        } else {
          log(`${blue("Running all tests...")}`);
          const result = runCommand("bun test", `${PROJECT_ROOT}/packages/bgio-engine`);
          log(result.output);
        }
        break;
      }
      case "build": {
        log(`${blue("Running type check...")}`);
        const result = runCommand("pnpm build", `${PROJECT_ROOT}/packages/bgio-engine`);
        log(result.output);
        break;
      }
      case "status": {
        log(`${blue("Project status:")}`);
        log(`- Platform: Windows 11`);
        log(`- Shell: PowerShell`);
        log(`- Package Manager: pnpm`);
        log(`- Runtime: Bun`);
        break;
      }
      default: {
        console.log(`
${blue("Maintenance Operations")}

Usage: bun cli.ts maintenance <operation> [options]

Operations:
  test [file]    Run tests (optional: specific file)
  build          Type check and build
  status         Show project status

Examples:
  bun cli.ts maintenance test
  bun cli.ts maintenance test game.test.ts
  bun cli.ts maintenance build
`);
      }
    }
    break;
  }

  case "dev": {
    const operation = subCommand;
    const SKILLS_DEV = `${SKILLS_ROOT}/core/development`;

    switch (operation) {
      case "new:move": {
        const name = args.name || args[0];
        if (name) {
          log(`${blue(`Creating move template: ${name}`)}`);
          execSync(`bun ${SKILLS_DEV}/scripts/develop.ts new:move ${name}`, { cwd: PROJECT_ROOT });
        } else {
          log("Usage: bun cli.ts dev new:move <name>");
        }
        break;
      }
      case "new:test": {
        const name = args.name || args[0];
        if (name) {
          log(`${blue(`Creating test template: ${name}`)}`);
          execSync(`bun ${SKILLS_DEV}/scripts/develop.ts new:test ${name}`, { cwd: PROJECT_ROOT });
        } else {
          log("Usage: bun cli.ts dev new:test <name>");
        }
        break;
      }
      default: {
        console.log(`
${blue("Development Operations")}

Usage: bun cli.ts dev <operation> [options]

Operations:
  new:move <name>    Create move template
  new:test <name>    Create test template

Examples:
  bun cli.ts dev new:move trade
  bun cli.ts dev new:test vote
`);
      }
    }
    break;
  }

  case "docs": {
    const operation = subCommand;
    switch (operation) {
      case "update": {
        const file = args.file;
        const section = args.section;
        const content = args.content;
        if (file && section && content) {
          log(`${blue(`Updating ${file} with section: ${section}`)}`);
          execSync(`bun ${EXT_SELF_IMPROVING}/scripts/improve.ts update --file=${file} --section=${section} --content=${content}`, { cwd: PROJECT_ROOT });
        } else {
          log("Usage: bun cli.ts docs update --file=<path> --section=<name> --content=<text>");
        }
        break;
      }
      default: {
        console.log(`
${blue("Documentation Operations")}

Usage: bun cli.ts docs <operation> [options]

Operations:
  update          Update documentation

Examples:
  bun cli.ts docs update --file=CLAUDE.md --section="New Section" --content="..."
`);
      }
    }
    break;
  }

  case "improve":
  case "self-improving": {
    const operation = subCommand;
    const SKILLS_IMPROVE = EXT_SELF_IMPROVING;

    switch (operation) {
      case "index": {
        const file = args.file;
        const title = args.title;
        const description = args.description || "";
        const translate = args.translate === "true";

        if (file && title) {
          log(`${blue(`Indexing: ${title}`)}`);
          execSync(`bun ${SKILLS_IMPROVE}/scripts/improve.ts index --file=${file} --title="${title}" --description="${description}" --translate=${translate}`, { cwd: PROJECT_ROOT });
        } else {
          log("Usage: bun cli.ts improve index --file=<path> --title=<name> [--translate true]");
        }
        break;
      }
      case "capture": {
        const guidance = args.guidance;
        const context = args.context || "";
        if (guidance) {
          log(`${blue("Capturing user guidance...")}`);
          execSync(`bun ${SKILLS_IMPROVE}/scripts/improve.ts capture --guidance="${guidance}" --context="${context}"`, { cwd: PROJECT_ROOT });
        } else {
          log("Usage: bun cli.ts improve capture --guidance=<text> [--context=<text>]");
        }
        break;
      }
      case "sync": {
        log(`${blue("Syncing documentation indexes...")}`);
        execSync(`bun ${SKILLS_IMPROVE}/scripts/improve.ts sync`, { cwd: PROJECT_ROOT });
        break;
      }
      default: {
        console.log(`
${blue("Self-Improving Operations")}

Usage: bun cli.ts improve <operation> [options]

Operations:
  index           Index a new document
  capture         Capture user guidance
  sync            Sync all indexes

Examples:
  bun cli.ts improve index --file=docs/refactoring/JOURNAL.md --title="Journal"
  bun cli.ts improve capture --guidance="Important guidance" --context="Context"
  bun cli.ts improve sync
`);
      }
    }
    break;
  }

  default:
    showHelp();
}
