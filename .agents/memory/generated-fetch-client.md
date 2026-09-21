---
name: Generated fetch client compatibility
description: TypeScript library settings needed by the generated API client
---

The generated React API client uses `Headers.entries()`, so its TypeScript `lib` list must include `dom.iterable` alongside `dom`.

**Why:** Without `dom.iterable`, API code generation succeeds but the workspace library typecheck fails on the generated fetch helper.

**How to apply:** Preserve `dom.iterable` in the API client package TypeScript configuration when regenerating client code.