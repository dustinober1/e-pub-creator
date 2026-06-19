# Theme Authoring

Themes are declarative packages. They may include metadata, tokens, CSS, component variants, assets, and fonts with license metadata. Themes must not execute code.

## Required Package Shape

A theme package must include `theme.json` and a CSS file referenced by `cssPath`. The CSS file does not need to be named `theme.css`, but `cssPath` must be a bundle-local relative path such as `theme.css` or `styles/book.css`.

`theme.json` must use this shape:

```json
{
  "id": "classic-literary",
  "version": "0.1.0",
  "name": "Classic Literary",
  "description": "Traditional serif typography with ornamented chapter openings.",
  "license": "CC-BY-4.0",
  "cssPath": "theme.css",
  "preview": {
    "thumbnailPath": "preview.png",
    "sampleText": "Chapter One"
  },
  "tokens": {
    "bodyFont": "serif",
    "headingFont": "serif",
    "accentColor": "#7b4f2c"
  },
  "fonts": [],
  "components": {
    "chapterTitle": ["classic", "ornamented"],
    "sceneBreak": ["asterism"],
    "quote": ["indented"]
  }
}
```

## Required Fields

- `id`
- `version`
- `name`
- `description`
- `license`
- `cssPath`
- `preview.thumbnailPath`
- `preview.sampleText`
- `tokens`: an object map whose values are non-empty strings
- `fonts`: an array of bundled fonts, which may be empty
- `components`: an object mapping supported component keys to arrays of allowed variants

## Font Licensing

Every bundled font entry must include complete license metadata: `license.name`, `license.spdxId`, and `license.url`.

```json
{
  "family": "Libre Baskerville",
  "file": "fonts/LibreBaskerville-Regular.ttf",
  "license": {
    "name": "SIL Open Font License 1.1",
    "spdxId": "OFL-1.1",
    "url": "https://openfontlicense.org"
  }
}
```

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
