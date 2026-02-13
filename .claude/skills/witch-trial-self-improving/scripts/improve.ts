#!/usr/bin/env bun
/**
 * Documentation Improvement Script
 *
 * Usage: bun scripts/improve.ts <command> [options]
 *
 * Commands:
 *   update      - Update documentation with new content
 *   index       - Index a new document
 *   sync        - Sync all indexes
 *   capture     - Capture user guidance
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { execSync } from "child_process";

const PROJECT_ROOT = process.cwd();
const DOCS_ROOT = `${PROJECT_ROOT}/docs`;
const CLAUDE = `${PROJECT_ROOT}/CLAUDE.md`;
const AGENTS = `${PROJECT_ROOT}/AGENTS.md`;

// ANSI colors
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const blue = (s: string) => `\x1b[34m${s}\x1b[0m`;

function log(msg: string) {
  console.log(msg);
}

function readFile(path: string): string {
  if (!existsSync(path)) {
    throw new Error(`File not found: ${path}`);
  }
  return readFileSync(path, "utf-8");
}

function writeFile(path: string, content: string) {
  mkdirSync(path.split("/").slice(0, -1).join("/"), { recursive: true });
  writeFileSync(path, content, "utf-8");
}

function gitAdd(path: string) {
  try {
    execSync(`git add "${path}"`, { cwd: PROJECT_ROOT });
  } catch {
    // Ignore errors
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
const args = parseArgs(Bun.argv.slice(3));

switch (command) {
  case "index": {
    const file = args.file;
    const title = args.title;
    const description = args.description || "";
    const type = (args.type as "journal" | "pattern" | "guide") || "journal";
    const translate = args.translate === "true";

    if (!file || !title) {
      console.log(`
${blue("Index a document")}

Usage: bun scripts/improve.ts index --file <path> --title <name> [--description <text>] [--type <journal|pattern|guide>] [--translate <true|false>]

Example:
  bun scripts/improve.ts index --file docs/refactoring/JOURNAL.md --title "Refactoring Journal"
  bun scripts/improve.ts index --file docs/refactoring/JOURNAL.md --title "Refactoring Journal" --translate true
`);
      process.exit(0);
    }

    if (!existsSync(file)) {
      log(`${yellow(`File not found: ${file}`)}`);
      process.exit(0);
    }

    const journalDate = args.date || new Date().toISOString().split("T")[0];
    const entry = `| [\`${title}\`](${file}) | ${description || type} | ${journalDate} |`;

    // Update CLAUDE.md
    const claudeContent = readFile(CLAUDE);

    let newClaueContent = claudeContent;

    if (!claudeContent.includes("## Journals\n")) {
      const relatedPattern = /(\n##\s*Resources\n)/;
      newClaueContent = claudeContent.replace(
        relatedPattern,
        `\n## Journals\n\n| Document | Description | Date |\n|----------|-------------|------|\n${entry}\n$1`
      );
    } else {
      const journalsPattern = /(\| \[.*\]\(.*\) \| .* \| \d{4}-\d{2}-\d{2} \|)(\n##\s)/;
      newClaueContent = claudeContent.replace(journalsPattern, `\n${entry}\n$2`);
    }

    if (newClaueContent !== claudeContent) {
      writeFile(CLAUDE, newClaueContent);
      gitAdd(CLAUDE);
      log(`${green(`Indexed in CLAUDE.md: ${title}`)}`);
    }

    // Update AGENTS.md
    if (existsSync(AGENTS)) {
      const agentsContent = readFile(AGENTS);
      if (!agentsContent.includes(`- \`${file}\``)) {
        const newAgentsContent = agentsContent + `\n- \`${file}\` - ${title}`;
        writeFile(AGENTS, newAgentsContent);
        gitAdd(AGENTS);
        log(`${green(`Indexed in AGENTS.md: ${title}`)}`);
      }
    }

    log(`${green(`Indexed: ${title}`)}`);

    // Auto-trigger translation if requested
    if (translate) {
      log(`\n${blue("Triggering translation...")}`);
      // Check if Chinese version already exists
      const zhFile = file.replace(/\.md$/, "_ZH.md");
      const zhTitle = title.includes("(中文)") ? title : `${title} (中文)`;

      if (!existsSync(zhFile)) {
        try {
          execSync(`bun .claude/skills/witch-trial-translation/scripts/translate.ts translate --source=${file} --target=${zhFile}`, { cwd: PROJECT_ROOT });
          log(`${green(`Translated: ${zhFile}`)}`);
        } catch {
          log(`${yellow(`Translation failed for ${zhFile}`)}`);
        }
      }

      // Index the translated document
      try {
        execSync(`bun .claude/skills/witch-trial-translation/scripts/translate.ts index --file=${zhFile} --title=${zhTitle}`, { cwd: PROJECT_ROOT });
      } catch {
        log(`${yellow(`Failed to index translated document`)}`);
      }
    }
    break;
  }

  case "sync": {
    log(`${blue("Syncing all documentation indexes...")}\n`);

    // Check docs/refactoring
    const refactoringDir = `${DOCS_ROOT}/refactoring`;
    if (existsSync(refactoringDir)) {
      try {
        const files = execSync(`ls -1 "${refactoringDir}"`, { cwd: PROJECT_ROOT, encoding: "utf-8" });
        for (const line of files.trim().split("\n")) {
          if (line && line.endsWith(".md") && !line.includes("INDEX")) {
            const title = line.replace(".md", "").replace(/_/g, " ");
            const file = `${refactoringDir}/${line}`;
            execSync(`bun .claude/skills/witch-trial-self-improving/scripts/improve.ts index --file ${file} --title "${title}"`, { cwd: PROJECT_ROOT });
          }
        }
      } catch {
        // Directory might be empty
      }
    }

    log(`\n${green("Sync complete!")}`);
    break;
  }

  case "capture": {
    const guidance = args.guidance;
    const context = args.context || "";
    const files = args.files?.split(",");

    if (!guidance) {
      console.log(`
${blue("Capture user guidance")}

Usage: bun scripts/improve.ts capture --guidance <text> [--context <text>] [--files <file1,file2>]

Example:
  bun scripts/improve.ts capture --guidance "Use enum values, not types" --context "During enum refactoring" --files "types/core.ts,game/moves.ts"
`);
      process.exit(0);
    }

    const entry = `

---

## User Guidance

**Date:** ${new Date().toISOString().split("T")[0]}

${context ? `**Context:** ${context}\n` : ""}

**Guidance:**
> ${guidance}

${files ? `**Affected Files:**
${files.map((f) => `- \`${f}\``).join("\n")}` : ""}`;

    const journalFile = `${DOCS_ROOT}/refactoring/JOURNAL.md`;
    const journalContent = existsSync(journalFile) ? readFile(journalFile) : "# Refactoring Journal\n";
    writeFile(journalFile, journalContent + entry);
    gitAdd(journalFile);

    log(`${green("Captured user guidance")}`);
    log(`File: ${journalFile}`);
    break;
  }

  case "update": {
    const file = args.file;
    const section = args.section;
    const content = args.content?.replace(/\\n/g, "\n") || "";
    const after = args.after;

    if (!file || !section || !content) {
      console.log(`
${blue("Update documentation")}

Usage: bun scripts/improve.ts update --file <path> --section <name> --content <text> [--after <section>]

Example:
  bun scripts/improve.ts update --file CLAUDE.md --section "New Pattern" --content "Description..." --after "Existing Section"
`);
      process.exit(0);
    }

    if (!existsSync(file)) {
      log(`${yellow(`File not found: ${file}`)}`);
      process.exit(0);
    }

    const fileContent = readFile(file);
    const sectionPattern = new RegExp(`##\\s*${section}\\s*\n([\\s\\S]*?)(\n##\\s|\\z)`, "i");
    const match = fileContent.match(sectionPattern);

    if (match) {
      log(`${yellow(`Section "${section}" already exists in ${file}`)}`);
    } else {
      let newContent: string;
      if (after) {
        const afterPattern = new RegExp(`(\n##\\s*${after}\\s*\n([\\s\\S]*?)(\n##\\s|\\z))`);
        newContent = fileContent.replace(afterPattern, `$1\n\n## ${section}\n\n${content}`);
      } else {
        newContent = fileContent + `\n## ${section}\n\n${content}`;
      }
      writeFile(file, newContent);
      gitAdd(file);
      log(`${green(`Updated ${file} with section: ${section}`)}`);
    }
    break;
  }

  default:
    console.log(`
${blue("📝 Documentation Improvement Tool")}

Usage: bun scripts/improve.ts <command> [options]

Commands:
  index   - Index a new journal/pattern document
  sync    - Sync all documentation indexes
  capture - Capture user guidance as journal entry
  update  - Update documentation with new section

Examples:
  bun scripts/improve.ts index --file docs/refactoring/JOURNAL.md --title "Refactoring Journal"
  bun scripts/improve.ts sync
  bun scripts/improve.ts capture --guidance "Important guidance" --context "Context here"
`);
}
