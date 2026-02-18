---
phase: quick
plan: 2
type: quick
autonomous: true
---

<objective>
撤销上一个任务，用配置lint-staged代替
</objective>

<tasks>

1. **配置 lint-staged**
   - action: "Remove manual pre-commit, add lint-staged to package.json with config, update pre-commit hook to run lint-staged"
   - files: ["package.json", ".git/hooks/pre-commit"]
   - verify: "lint-staged installed and configured"
   - done: true

</tasks>
