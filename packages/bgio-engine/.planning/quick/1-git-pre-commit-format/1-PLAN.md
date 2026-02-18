---
phase: quick
plan: 1
type: quick
autonomous: true
---

<objective>
配置简单的.git pre-commit，在提交前执行format命令
</objective>

<tasks>

1. **创建 Git Pre-commit Hook**
   - action: "Create .git/hooks/pre-commit at monorepo root, run pnpm format"
   - files: [".git/hooks/pre-commit"]
   - verify: "Hook is executable and runs on pre-commit"
   - done: true

</tasks>
