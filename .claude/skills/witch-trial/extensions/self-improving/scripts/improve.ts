#!/usr/bin/env bun
/**
 * Documentation Improvement Script
 *
 * Usage: bun scripts/improve.ts <command> [options]
 *
 * Commands:
 *   journal  - Create a new journal entry
 *   index   - Index a document
 *   sync    - Sync all indexes
 *   capture - Capture user guidance (legacy, appends to single file)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, lstatSync } from "fs";
import { execSync } from "child_process";

const PROJECT_ROOT = process.cwd();
const DOCS_ROOT = `${PROJECT_ROOT}/docs`;
const CLAUDE = `${PROJECT_ROOT}/CLAUDE.md`;
const AGENTS = `${PROJECT_ROOT}/AGENTS.md`;

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

function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

const command = Bun.argv[2];
const args = parseArgs(Bun.argv.slice(3));

switch (command) {
  case "journal": {
    // Create a new journal entry with auto Chinese translation
    const title = args.title;
    const description = args.description || "";
    const category = args.category || "refactoring";
    const content = args.content || "";

    if (!title) {
      console.log(`
${blue("Create a new journal entry")}

Usage: bun scripts/improve.ts journal --title <title> [--description <text>] [--category <category>] [--content <text>]

Examples:
  # Create a new journal (auto-creates Chinese version, saved to docs/refactoring/)
  bun scripts/improve.ts journal --title="GamePhase Refactoring" --description="Converting string literals to enum"

  # Create with different category
  bun scripts/improve.ts journal --title="API Design" --category="patterns" --content="Initial design"
`);
      process.exit(0);
    }

    const date = new Date().toISOString().split("T")[0];
    const topic = toSnakeCase(title);
    const filename = `${date}_${topic}.md`;
    const zhFilename = `${date}_${topic}_ZH.md`;
    const filepath = `${DOCS_ROOT}/${category}/${filename}`;
    const zhFilepath = `${DOCS_ROOT}/${category}/${zhFilename}`;

    // Ensure directory exists
    mkdirSync(`${DOCS_ROOT}/${category}`, { recursive: true });

    // Create English journal
    const journalContent = `# ${title}

**Date:** ${date}
**Category:** ${category}
**Description:** ${description}

---

${content || "## Summary\n\nTODO: Add summary\n\n## Details\n\nTODO: Add details\n\n## Key Decisions\n\nTODO: List key decisions\n\n## Files Modified\n\nTODO: List modified files\n\n## Verification\n\nTODO: Add verification steps"}

`;

    writeFile(filepath, journalContent);
    gitAdd(filepath);
    log(`${green(`Created: ${filepath}`)}`);

    // Create Chinese journal automatically
    const zhTitle = `${title}（中文）`;
    const zhContent = content
      ? translateToChinese(content, title)
      : `## 摘要\n\nTODO: 添加摘要\n\n## 详情\n\nTODO: 添加详情\n\n## 关键决策\n\nTODO: 列出关键决策\n\n## 修改的文件\n\nTODO: 列出修改的文件\n\n## 验证\n\nTODO: 添加验证步骤`;

    const zhJournalContent = `# ${zhTitle}

**Date:** ${date}
**Category:** ${category}
**Description:** ${description}

---

${zhContent}

`;
    writeFile(zhFilepath, zhJournalContent);
    gitAdd(zhFilepath);
    log(`${green(`Created: ${zhFilepath}`)}`);

    // Auto-index English version in CLAUDE.md
    const entry = `| [\`${title}\`](${filepath}) | ${description || category} | ${date} |`;
    const claudeContent = readFile(CLAUDE);

    let newClaueContent = claudeContent;
    if (!claudeContent.includes("## Journals")) {
      newClaueContent = claudeContent.replace(
        /(\n##\s*Resources\n)/,
        `\n## Journals\n\n| Document | Description | Date |\n|----------|-------------|------|\n${entry}\n$1`
      );
    } else {
      newClaueContent = claudeContent.replace(
        /(\| \[.*\]\(.*\) \| .* \| \d{4}-\d{2}-\d{2} \|)(\n##\s)/,
        `\n${entry}\n$2`
      );
    }

    if (newClaueContent !== claudeContent) {
      writeFile(CLAUDE, newClaueContent);
      gitAdd(CLAUDE);
      log(`${green(`Indexed in CLAUDE.md: ${title}`)}`);
    }

    // Auto-index Chinese version in AGENTS.md
    if (existsSync(AGENTS)) {
      const agentsContent = readFile(AGENTS);
      const zhEntry = `| [\`${zhTitle}\`](${zhFilepath}) | ${description || category} | ${date} |`;

      let newAgentsContent = agentsContent;
      if (!agentsContent.includes("## Journals")) {
        newAgentsContent = agentsContent.replace(
          /(\n##\s*Resources\n)/,
          `\n## Journals\n\n| Document | Description | Date |\n|----------|-------------|------|\n${zhEntry}\n$1`
        );
      } else {
        newAgentsContent = agentsContent.replace(
          /(\| \[.*\]\(.*\) \| .* \| \d{4}-\d{2}-\d{2} \|)(\n##\s)/,
          `\n${zhEntry}\n$2`
        );
      }

      if (newAgentsContent !== agentsContent) {
        writeFile(AGENTS, newAgentsContent);
        gitAdd(AGENTS);
        log(`${green(`Indexed in AGENTS.md: ${zhTitle}`)}`);
      }
    }

    log(`${green(`\n✅ Created bilingual journal: ${title} / ${title}（中文）`)}`);
    break;
  }

  /**
   * Simple Chinese translation helper for journal content
   * Maps common English terms to Chinese equivalents
   */
  function translateToChinese(content: string, title: string): string {
    const translations: Record<string, string> = {
      "Summary": "摘要",
      "Details": "详情",
      "Key Decisions": "关键决策",
      "Files Modified": "修改的文件",
      "Verification": "验证",
      "Lessons Learned": "经验教训",
      "Related": "相关文档",
      "Problem Statement": "问题陈述",
      "Solution Implemented": "实施的解决方案",
      "Key Technical Changes": "关键技术变更",
      "Before": "之前",
      "After": "之后",
      "Results": "结果",
      "Commands Tested": "测试的命令",
      "Files Changed": "修改的文件",
      "## ": "## ",
      "### ": "### ",
      "TODO: Add summary": "TODO: 添加摘要",
      "TODO: Add details": "TODO: 添加详情",
      "TODO: List key decisions": "TODO: 列出关键决策",
      "TODO: List modified files": "TODO: 列出修改的文件",
      "TODO: Add verification steps": "TODO: 添加验证步骤",
    };

    let translated = content;
    for (const [en, zh] of Object.entries(translations)) {
      translated = translated.split(en).join(zh);
    }
    return translated;
  }

  case "index": {
    const file = args.file;
    const title = args.title;
    const description = args.description || "";

    if (!file || !title) {
      console.log(`
${blue("Index a document")}

Usage: bun scripts/improve.ts index --file <path> --title <name> [--description <text>]
`);
      process.exit(0);
    }

    if (!existsSync(file)) {
      log(`${yellow(`File not found: ${file}`)}`);
      process.exit(0);
    }

    const date = new Date().toISOString().split("T")[0];
    const entry = `| [\`${title}\`](${file}) | ${description || "Document"} | ${date} |`;

    // Update CLAUDE.md
    const claudeContent = readFile(CLAUDE);
    let newClaueContent = claudeContent;

    if (!claudeContent.includes("## Journals")) {
      newClaueContent = claudeContent.replace(
        /(\n##\s*Resources\n)/,
        `\n## Journals\n\n| Document | Description | Date |\n|----------|-------------|------|\n${entry}\n$1`
      );
    } else {
      newClaueContent = claudeContent.replace(
        /(\| \[.*\]\(.*\) \| .* \| \d{4}-\d{2}-\d{2} \|)(\n##\s)/,
        `\n${entry}\n$2`
      );
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
        writeFile(AGENTS, agentsContent + `\n- \`${file}\` - ${title}`);
        gitAdd(AGENTS);
        log(`${green(`Indexed in AGENTS.md: ${title}`)}`);
      }
    }

    log(`${green(`Indexed: ${title}`)}`);
    break;
  }

  case "sync": {
    log(`${blue("Syncing documentation indexes...")}\n`);

    const categories = ["refactoring", "patterns", "guides"];
    let count = 0;

    for (const category of categories) {
      const dir = `${DOCS_ROOT}/${category}`;
      if (!existsSync(dir)) continue;

      try {
        const files = execSync(`ls -1 "${dir}"`, { cwd: PROJECT_ROOT, encoding: "utf-8" });
        for (const line of files.trim().split("\n")) {
          if (!line || !line.endsWith(".md") || line.includes("INDEX")) continue;
          if (line.includes("_ZH.md")) continue; // Skip Chinese versions (indexed separately)

          // Extract title from filename
          const title = line
            .replace(".md", "")
            .replace(/^\d{4}-\d{2}-\d{2}_/, "") // Remove date prefix
            .replace(/_/g, " ") // Replace underscores with spaces
            .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize

          const file = `${dir}/${line}`;
          try {
            execSync(`bun scripts/improve.ts index --file=${file} --title="${title}"`, { cwd: PROJECT_ROOT });
            count++;
          } catch {
            // Ignore errors
          }
        }
      } catch {
        // Directory might be empty
      }
    }

    log(`${green(`Synced ${count} documents!`)}`);
    break;
  }

  case "capture": {
    // Legacy command - appends to single file
    const guidance = args.guidance;
    const context = args.context || "";

    if (!guidance) {
      console.log(`
${blue("Capture user guidance (legacy)")}

Usage: bun scripts/improve.ts capture --guidance <text> [--context <text>]

Note: Use 'journal' command to create new journal files.
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
`;

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

    if (!file || !section || !content) {
      console.log(`
${blue("Update documentation")}

Usage: bun scripts/improve.ts update --file <path> --section <name> --content <text>
`);
      process.exit(0);
    }

    const fileContent = readFile(file);
    const sectionPattern = new RegExp(`##\\s*${section}\\s*\\n([\\s\\S]*?)(\\n##\\s|\\z)`, "i");
    const match = fileContent.match(sectionPattern);

    if (match) {
      log(`${yellow(`Section "${section}" already exists`)}`);
    } else {
      writeFile(file, fileContent + `\n## ${section}\n\n${content}`);
      log(`${green(`Updated ${file} with section: ${section}`)}`);
    }
    break;
  }

  default:
    console.log(`
${blue("📝 Documentation Improvement Tool")}

Usage: bun scripts/improve.ts <command> [options]

Commands:
  journal  - Create a new journal file (RECOMMENDED)
  index    - Index an existing document
  sync     - Sync all documentation indexes
  capture  - Capture user guidance (legacy, appends to single file)
  update   - Update documentation with new section

Examples:
  # Create new journal (RECOMMENDED)
  bun scripts/improve.ts journal --title="GamePhase Refactoring" --description="Enum conversion"

  # Index existing document
  bun scripts/improve.ts index --file=docs/refactoring/2026_02_13_gamephase.md --title="GamePhase"

  # Sync all indexes
  bun scripts/improve.ts sync

  # Legacy: append to single file
  bun scripts/improve.ts capture --guidance="Use enum values"
`);
}
