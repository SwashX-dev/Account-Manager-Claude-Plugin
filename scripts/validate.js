const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const manifest = JSON.parse(fs.readFileSync('extension/manifest.json'));
assert.equal(manifest.manifest_version, 2);
assert.deepEqual(manifest.permissions, ['contextualIdentities', 'cookies', 'storage', 'https://claude.ai/*']);
for (const file of fs.readdirSync('extension')) {
  if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', `extension/${file}`]);
}
for (const path of [...manifest.background.scripts, ...manifest.content_scripts.flatMap(s => s.js), manifest.browser_action.default_popup]) assert.ok(fs.existsSync(`extension/${path}`), path);
const html = fs.readFileSync('extension/manager.html', 'utf8');
assert.ok(!/<script[^>]*src=["']https?:/i.test(html));
assert.ok(!/\son\w+=/i.test(html));
console.log('Syntax, manifest paths, permission scope, and HTML checks passed. This is not Mozilla validation.');
