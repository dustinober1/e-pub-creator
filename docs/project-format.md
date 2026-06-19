# Project Format

A project is a plain folder.

```text
BookProject/
|-- manifest.json
|-- content/
|   `-- book.json
|-- assets/
|-- themes/
`-- .snapshots/
```

`manifest.json` identifies the app, format version, project ID, content path, assets path, themes path, snapshots path, and update timestamp.

`content/book.json` stores the structured book model: metadata, front/body/back sections, semantic blocks, theme selection, and project timestamps.
