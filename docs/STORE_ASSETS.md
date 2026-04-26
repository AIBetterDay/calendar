# Store Assets and Chat Cards

This repository keeps store presentation assets and chat response cards separate from maintainer documentation.

## Store Product Images

Put App Store-style product screenshots, short demos, and hero images in:

```text
assets/store/
```

Use these files from `README.md` and `README.zh-CN.md` after real images are added. Prefer product screenshots that show the connector's actual interface and user value. Do not use architecture diagrams as the primary store image.

## Chat Response Cards

Put interactive chat card components, styles, and helpers in:

```text
ui/src/cards/
```

Cards should make Better chat results actionable: lists, summaries, confirmations, previews, or domain-specific controls. Avoid returning raw JSON or long plain text when the connector can render a clearer card.

## Current Status

Real screenshots and card implementations will be added in a follow-up pass. The folders are present now so product assets can land without changing the store/documentation contract.
