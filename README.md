## robboscratch3_I10n

RobboScratch3 I10n is a fork of the official Scratch localization repository:
- upstream project: https://github.com/LLK/scratch-l10n
- license: BSD 3-Clause (see `LICENSE` in this directory)

### Reference locale (source of truth)

**The only reference for keys and default texts is `editor/interface/en.json`** (and the corresponding `en.json` in `editor/extensions`, `editor/paint-editor`, `editor/blocks`). No locale may contain keys that are not present in the English files. All new interface strings (including Robbo GUI and DCA) must be added first to the English locale; only then may translations be added to other languages.

### Building locales

From this directory run:

```bash
npm run build:data
```

This generates `locales/editor-msgs.js`, `locales/blocks-msgs.js`, etc. from the JSON files in `editor/interface`, `editor/extensions`, `editor/paint-editor`, and `editor/blocks`. Every locale listed in `src/supported-locales.js` must have a file in each of these components, or the build will fail with "missing locales".

### Adding a new string

1. Add the key and **English** value to `editor/interface/en.json` (and to `editor/extensions/en.json` or other component if the string belongs there).
2. Optionally add translations to partner locales (see below).
3. Run `npm run build:data` to regenerate the locale outputs.

Never add a key only to a non-English locale; the reference is always English.

### Partner languages (full localization)

Partner languages are fully aligned with the English key set and have translations for interface and Robbo strings where available: **en**, **ru**, **ro**, **de**, **ar**, **es**, **zh-cn**, **ja**, **fi**, and when added: **uz**, **hy**, **ka**, **kk**. Other locales in the menu keep their existing key set; missing keys fall back to English at runtime.

### Audit script

To check that all interface locales conform to the English reference (no extra keys, report missing keys):

```bash
node scripts/audit-locales.js
```

Use `node scripts/audit-locales.js --json` for machine-readable output. The script exits with code 1 if any locale has keys not present in `editor/interface/en.json`.

