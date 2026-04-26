# Todos Development

This document is for connector maintainers. The root README is reserved for the Better connector store product page.

## Repository

- GitHub: https://github.com/AIBetterDay/todos
- Connector type: first-party AIBetterDay connector

## Runtime Shape

- UI entry: ui/dist/index.html
- Skills entry: skills/dist/main.js
- Agent skills: list, get, create, update, bulk_update, delete
- Data: local Better connector storage for todo items

## Build and Pack

Use the Better connector toolchain from this repository root:

```sh
better-connector build
better-connector pack
```

The release asset should be a prebuilt `.bcx` package. End users install from the GitHub Release through Better's connector store and should not need to build from source.

## Release

```sh
gh release create v<version> <package>.bcx
```

Keep product-facing copy in `README.md` and `README.zh-CN.md`. Keep implementation notes here or in sibling docs under `docs/`.
