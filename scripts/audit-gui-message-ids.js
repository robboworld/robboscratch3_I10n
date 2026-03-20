#!/usr/bin/env node
/**
 * Ensures every message id declared in robboscratch3_gui/src/l10n/message-ids.js
 * exists in editor/interface/en.json (single source of truth for keys).
 *
 * Run from robboscratch3_I10n: npm run audit:gui-ids
 * Or: node scripts/audit-gui-message-ids.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EN_PATH = path.join(ROOT, 'editor', 'interface', 'en.json');
const IDS_PATH = path.resolve(ROOT, '..', 'robboscratch3_gui', 'src', 'l10n', 'message-ids.js');

function collectIdsFromRegistryFile (source) {
    const ids = new Set();
    const re = /['"]((gui\.RobboGui|gui\.dca|gui\.SearchPanel)\.[^'"]+)['"]/g;
    let m;
    while ((m = re.exec(source)) !== null) {
        ids.add(m[1]);
    }
    return [...ids].sort();
}

function main () {
    if (!fs.existsSync(IDS_PATH)) {
        console.error('Registry not found:', IDS_PATH);
        process.exit(1);
    }
    if (!fs.existsSync(EN_PATH)) {
        console.error('en.json not found:', EN_PATH);
        process.exit(1);
    }
    const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
    const registrySrc = fs.readFileSync(IDS_PATH, 'utf8');
    const ids = collectIdsFromRegistryFile(registrySrc);

    if (ids.length === 0) {
        console.warn('No gui.RobboGui / gui.dca / gui.SearchPanel ids found in message-ids.js');
    }

    const missing = ids.filter((id) => !Object.prototype.hasOwnProperty.call(en, id));
    if (missing.length > 0) {
        console.error('=== audit-gui-message-ids: FAIL ===');
        console.error('These registry ids are missing from editor/interface/en.json:');
        missing.forEach((id) => console.error('  -', id));
        process.exit(1);
    }
    console.log('=== audit-gui-message-ids: OK ===');
    console.log('Checked', ids.length, 'id(s) against en.json');
}

main();
