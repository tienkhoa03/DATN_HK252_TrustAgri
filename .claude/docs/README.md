# Documentation Index

This directory contains comprehensive documentation for the TrustAgri project, designed to provide context for AI-assisted development.

## Files

- **[project-structure.md](project-structure.md)** — Detailed breakdown of directory layout, folder purposes, and naming conventions. Reference this when exploring codebase or creating new files.

- **[tech-stack.md](tech-stack.md)** — Technologies, libraries, database schemas, and integration points. Use for understanding dependencies, versions, and system architecture.

- **[business-logic.md](business-logic.md)** — Core workflows and data flows: authentication, farm management, care logging, monitoring, contracts, marketplace, notifications, and traceability. Understand "why" before changing code.

## Related Documents

- **[CLAUDE.md](../../CLAUDE.md)** (project root) — Quick reference for build commands, coding conventions, and core libraries.

- **[specs/](../../specs/)** — Business requirements and design specifications:
  - `backend-api-specification/requirements.md` — API requirements and acceptance criteria
  - `frontend-ui-specification/requirements.md` — Frontend routing and integration requirements

## How to Use These Docs

1. **Onboarding:** Start with CLAUDE.md, then skim project-structure.md to understand layout.

2. **Feature Development:** Reference tech-stack.md for library patterns, business-logic.md for workflows.

3. **Bug Fixing:** Review business-logic.md to understand context; check tech-stack.md for database schema.

4. **Code Review:** Use project-structure.md to verify naming conventions and folder organization.

## Notes

- Docs focus on **facts** (what exists now) over prescriptions (what should exist).
- Database schemas in tech-stack.md are current as of phase implementation; check migrations for latest.
- API endpoints in business-logic.md are from backend spec; frontend integration status may vary.
