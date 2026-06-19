# Validation

Validation runs in two layers.

## Continuous Checks

Current accessibility validation reports missing language metadata, image blocks that reference missing assets, missing image asset alt text, and body sections that are omitted from the table of contents.

Import-review state, unsupported DOCX annotation checks, and theme font license gap checks are planned future validation work.

## Export Reports

EPUB package export reports currently include accessibility issues and export profile issues. The CLI export command reports file count, asset file count, issue count, and selected profile.

## Profiles

- `portable-epub3`: accepted profile ID for broad EPUB 3 compatibility; no profile-specific warnings are currently added.
- `kdp-safe`: accepted profile ID that currently adds Kindle/KDP-conscious warnings for CSS that may be ignored.
- `apple-books-enhanced`: accepted profile ID for richer Apple Books-oriented exports; no profile-specific warnings are currently added.
