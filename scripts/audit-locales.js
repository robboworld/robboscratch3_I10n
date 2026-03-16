#!/usr/bin/env node

/**
 * Audit interface locales against the English reference (editor/interface/en.json).
 * The only source of truth for keys is en; no locale may have keys that are not in en.
 *
 * Usage: from robboscratch3_I10n run: node scripts/audit-locales.js
 * Or: node scripts/audit-locales.js [--json] for machine-readable output.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INTERFACE_DIR = path.join(ROOT, 'editor', 'interface');

const ROBBO_KEY_PREFIXES = ['gui.RobboGui.', 'gui.dca.'];

function loadJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        return null;
    }
}

function getKeys(obj) {
    return new Set(Object.keys(obj));
}

function isRobboKey(key) {
    return ROBBO_KEY_PREFIXES.some(prefix => key.startsWith(prefix));
}

function audit() {
    const enPath = path.join(INTERFACE_DIR, 'en.json');
    const en = loadJson(enPath);
    if (!en) {
        console.error('Reference file not found or invalid: editor/interface/en.json');
        process.exit(1);
    }

    const referenceKeys = getKeys(en);
    const referenceRobboKeys = [...referenceKeys].filter(isRobboKey);
    const localeFiles = fs.readdirSync(INTERFACE_DIR)
        .filter(f => f.endsWith('.json') && f !== 'en.json')
        .map(f => f.replace(/\.json$/, ''))
        .sort();

    const report = {
        reference: 'en',
        referenceKeyCount: referenceKeys.size,
        referenceRobboKeyCount: referenceRobboKeys.length,
        locales: {}
    };

    let hasExtraKeys = false;

    for (const locale of localeFiles) {
        const localePath = path.join(INTERFACE_DIR, locale + '.json');
        const data = loadJson(localePath);
        if (!data) {
            report.locales[locale] = { error: 'Failed to load file' };
            continue;
        }

        const localeKeys = getKeys(data);
        const onlyInLocale = [...localeKeys].filter(k => !referenceKeys.has(k)).sort();
        const missingInLocale = [...referenceKeys].filter(k => !localeKeys.has(k)).sort();
        const missingRobbo = missingInLocale.filter(isRobboKey);
        const completeness = referenceKeys.size === 0
            ? 100
            : Math.round(100 * (referenceKeys.size - missingInLocale.length) / referenceKeys.size);

        if (onlyInLocale.length > 0) hasExtraKeys = true;

        report.locales[locale] = {
            keyCount: localeKeys.size,
            completenessPercent: completeness,
            onlyInLocale: onlyInLocale.length,
            onlyInLocaleKeys: onlyInLocale,
            missingCount: missingInLocale.length,
            missingKeys: missingInLocale.length <= 20 ? missingInLocale : missingInLocale.slice(0, 20),
            missingRobboCount: missingRobbo.length,
            missingRobboKeys: missingRobbo.length <= 15 ? missingRobbo : missingRobbo.slice(0, 15)
        };
    }

    return { report, hasExtraKeys };
}

function printReport({ report, hasExtraKeys }) {
    const jsonOut = process.argv.includes('--json');

    if (jsonOut) {
        console.log(JSON.stringify(report, null, 2));
        return;
    }

    console.log('=== Locale audit (reference: editor/interface/en.json) ===');
    console.log(`Reference key count: ${report.referenceKeyCount} (Robbo keys: ${report.referenceRobboKeyCount})`);
    console.log('');

    for (const [locale, data] of Object.entries(report.locales)) {
        if (data.error) {
            console.log(`[${locale}] ERROR: ${data.error}`);
            continue;
        }
        console.log(`[${locale}] keys: ${data.keyCount}, completeness: ${data.completenessPercent}%`);
        if (data.onlyInLocaleKeys.length > 0) {
            console.log(`  FORBIDDEN keys (only in this locale, not in en): ${data.onlyInLocaleKeys.length}`);
            data.onlyInLocaleKeys.forEach(k => console.log(`    - ${k}`));
        }
        if (data.missingCount > 0) {
            console.log(`  Missing keys: ${data.missingCount}`);
            if (data.missingRobboCount > 0) {
                console.log(`    Robbo-related missing: ${data.missingRobboCount}`);
            }
            if (data.missingKeys.length > 0 && data.missingKeys.length <= 20) {
                data.missingKeys.forEach(k => console.log(`    - ${k}`));
            } else if (data.missingKeys.length > 20) {
                data.missingKeys.forEach(k => console.log(`    - ${k}`));
                console.log(`    ... and ${data.missingKeys.length - 20} more`);
            }
        }
        console.log('');
    }

    if (hasExtraKeys) {
        console.log('WARNING: Some locales have keys not present in en (forbidden).');
        process.exitCode = 1;
    }
}

const result = audit();
printReport(result);
