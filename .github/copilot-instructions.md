# Copilot Workspace Safety Rules

## Secrets and Environment Files (Hard Block)

- Never read, open, or print any `.env` file content.
- Never use tools to access any path matching:
  - `**/.env`
  - `**/.env.*`
  - `**/fe/.env`
  - `**/be/.env`
  - `**/fe/.env.*`
  - `**/be/.env.*`
- If a task requests env values, ask the user to provide only the exact key/value needed, and avoid exposing unrelated secrets.
- Do not copy, summarize, transform, or log secret values from environment files.
- Prefer placeholders like `YOUR_VALUE_HERE` when editing docs or examples.

## Safe Alternative Flow

- For configuration debugging, inspect source code that references env keys, not the env files themselves.
- Validate only presence/format via user-provided values.
