# Theme Authoring

Themes are declarative packages. They may include metadata, tokens, CSS, component variants, assets, and fonts with license metadata. Themes must not execute code.

## Required Files

- `theme.json`
- `theme.css`

## Required Metadata

- `id`
- `version`
- `name`
- `description`
- `license`
- `cssPath`
- `preview.thumbnailPath`
- `preview.sampleText`

## Font Licensing

Every bundled font entry must include complete license metadata: `license.name`, `license.spdxId`, and `license.url`.

## Component Variants

The MVP supports these component keys and variants:

- `chapterTitle`: `classic`, `ornamented`, `minimal`, `rule`
- `sceneBreak`: `asterism`, `ornament`, `rule`, `space`
- `quote`: `indented`, `left-rule`, `boxed-light`
- `epigraph`: `centered`, `indented`, `ornamented`
- `letterBlock`: `classic`, `bordered`, `shaded`
- `emailBlock`: `headered`, `compact`, `boxed`
- `messageBlock`: `threaded`, `bubble`, `plain`
- `image`: `captioned`, `full-width`, `framed`
- `titlePage`: `classic`, `minimal`, `stacked`
- `copyrightPage`: `standard`, `compact`, `publisher`
- `dedicationPage`: `centered`, `minimal`, `ornamented`
- `alsoByPage`: `list`, `grouped`, `compact`
- `aboutAuthorPage`: `bio`, `portrait`, `compact`
- `newsletterPage`: `signup`, `letter`, `minimal`
