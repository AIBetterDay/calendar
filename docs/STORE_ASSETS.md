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

## Current Assets

- `assets/store/overview.png`: chat-to-calendar planning flow.
- `assets/store/listview.png`: focused list view for scheduled calendar items.
- `assets/store/make_todo.png`: create/edit popover inside Calendar.
- `assets/store/week_view.png`: week planning view.
- `assets/store/month_view.png`: month planning view.

## Current Chat Cards

The Calendar UI registers these chat card renderers from `ui/src/cards/`:

- `application/x.calendar-item+json`
- `application/x.calendar-list+json`
- `application/x.calendar-schedule+json`
- `application/x.calendar-bulk-action+json`
