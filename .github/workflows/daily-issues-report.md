---
name: "Daily Issues Report"
description: "Generates a daily summary of open issues and recent activity as a GitHub issue"
tools:
  github:
    toolsets: [repos, issues]
    min-integrity: unapproved
on:
  schedule: daily on weekdays
permissions:
  contents: read
  issues: read
safe-outputs:
  create-issue:
    title-prefix: "[daily-report] "
    labels: [report]
source: github/awesome-copilot/workflows/daily-issues-report.md@ab7544d03d4c49fdd07f5958e1888ad39c4118e2
---

# Daily Issues Report

Create a daily summary of open issues for the team.

## What to Include

- New issues opened in the last 24 hours
- Issues closed or resolved
- Stale issues that need attention
