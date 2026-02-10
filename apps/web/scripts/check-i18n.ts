#!/usr/bin/env node
/**
 * 检查项目中未翻译的硬编码文本
 *
 * 使用方法:
 * bun run scripts/check-i18n.ts
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const SRC_DIR = "./src";
const EXTENSIONS = [".tsx", ".ts"];
const EXCLUDE_DIRS = ["node_modules", ".next", "dist", "build"];

// 需要检查的模式
const PATTERNS = [
  // 1. JSX 属性中的硬编码字符串
  {
    name: "JSX Props (label, title, placeholder, etc.)",
    regex:
      /(label|title|placeholder|description|alt|aria-label)=["']([A-Z][^"']{2,})["']/g,
    extract: (match: RegExpExecArray) => match[2],
  },
  // 2. JSX 子元素中的文本
  {
    name: "JSX Text Content",
    regex: />([A-Z][a-zA-Z\s]{3,})</g,
    extract: (match: RegExpExecArray) => match[1].trim(),
  },
  // 3. Button 组件的文本
  {
    name: "Button Text",
    regex: /<Button[^>]*>([A-Z][^<]{2,})</g,
    extract: (match: RegExpExecArray) => match[1].trim(),
  },
  // 4. message/notification 调用
  {
    name: "Notification Messages",
    regex:
      /(message|notification)\.(success|error|warning|info)\(["']([^"']+)["']/g,
    extract: (match: RegExpExecArray) => match[3],
  },
];

interface Finding {
  file: string;
  line: number;
  pattern: string;
  text: string;
  context: string;
}

function shouldSkipDir(dir: string): boolean {
  return EXCLUDE_DIRS.some((excluded) => dir.includes(excluded));
}

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = join(dir, file);

    if (shouldSkipDir(filePath)) {
      return;
    }

    if (statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (EXTENSIONS.some((ext) => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function checkFile(filePath: string): Finding[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const findings: Finding[] = [];

  // 跳过已经使用翻译的行
  const skipPatterns = [
    /useTranslations/,
    /translate\(/,
    /\bt\(/,
    /\bt\./,
    /import.*from.*i18n/,
  ];

  PATTERNS.forEach((pattern) => {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);

    while ((match = regex.exec(content)) !== null) {
      const text = pattern.extract(match);

      // 跳过太短的文本
      if (text.length < 3) continue;

      // 跳过纯数字或特殊字符
      if (/^[\d\s\-_]+$/.test(text)) continue;

      // 跳过常见的非翻译文本
      if (["ID", "Email", "OK", "URL"].includes(text)) continue;

      // 找到所在行号
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split("\n").length;
      const line = lines[lineNumber - 1];

      // 检查该行是否已使用翻译
      if (skipPatterns.some((p) => p.test(line))) {
        continue;
      }

      findings.push({
        file: filePath,
        line: lineNumber,
        pattern: pattern.name,
        text,
        context: line.trim(),
      });
    }
  });

  return findings;
}

function main() {
  console.log("🔍 检查项目中未翻译的硬编码文本...\n");

  const files = getAllFiles(SRC_DIR);
  const allFindings: Finding[] = [];

  files.forEach((file) => {
    const findings = checkFile(file);
    allFindings.push(...findings);
  });

  if (allFindings.length === 0) {
    console.log("✅ 未发现硬编码文本！");
    return;
  }

  // 按文件分组
  const byFile = allFindings.reduce(
    (acc, finding) => {
      if (!acc[finding.file]) {
        acc[finding.file] = [];
      }
      acc[finding.file].push(finding);
      return acc;
    },
    {} as Record<string, Finding[]>,
  );

  console.log(`⚠️  发现 ${allFindings.length} 处可能需要翻译的硬编码文本:\n`);

  Object.entries(byFile).forEach(([file, findings]) => {
    console.log(`\n📄 ${file}`);
    findings.forEach((finding) => {
      console.log(
        `  Line ${finding.line} [${finding.pattern}]: "${finding.text}"`,
      );
      console.log(`    ${finding.context}`);
    });
  });

  console.log(`\n\n📊 统计:`);
  console.log(`  总计: ${allFindings.length} 处`);
  console.log(`  涉及文件: ${Object.keys(byFile).length} 个`);

  // 按模式分组统计
  const byPattern = allFindings.reduce(
    (acc, finding) => {
      acc[finding.pattern] = (acc[finding.pattern] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log(`\n  按类型:`);
  Object.entries(byPattern).forEach(([pattern, count]) => {
    console.log(`    ${pattern}: ${count}`);
  });

  console.log("\n💡 建议:");
  console.log(
    "  1. 将这些文本添加到翻译文件 (messages/zh-CN.json, messages/en.json)",
  );
  console.log("  2. 使用 useTranslations() hook 替换硬编码文本");
  console.log('  3. 运行应用并检查控制台的 "Missing translation key" 警告');
}

main();
