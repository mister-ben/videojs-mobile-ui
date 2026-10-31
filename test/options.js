/* eslint-disable no-console */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {spawnSync} = require('child_process');
const {parseJSDoc, updateTypesContent} = require('../scripts/readme-options');
const {remove} = require('../scripts/files');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/plugin.js'), 'utf8');
const types = fs.readFileSync(path.join(root, 'plugin.d.ts'), 'utf8');
const properties = parseJSDoc(source);
const generated = updateTypesContent(types, properties.filter(prop => !prop.isInternal));

assert.strictEqual(generated, types);
assert.ok(!generated.includes('forceForTesting'));
assert.ok(generated.includes('Default `10`.'));
assert.ok(generated.includes('fullscreen?: {'));
assert.ok(generated.includes('seekSeconds?: number;'));
const required = parseJSDoc(source.replace('[touchControls.seekSeconds]', 'touchControls.seekSeconds'));

assert.ok(updateTypesContent(types, required.filter(prop => !prop.isInternal)).includes('seekSeconds: number;'));
for (const invalid of [
  source.replace('@typedef {Object} MobileUiOptions', '@typedef {Object} OtherOptions'),
  source.replace('{number} [touchControls.seekSeconds]', '{string} [touchControls.seekSeconds]'),
  source.replace('[touchControls.seekSeconds]', '[touchControls.seekSeconds=10]'),
  source.replace('@property {number} [touchControls.seekSeconds]', '@property broken'),
  source.replace('[touchControls.seekSeconds]', '[missing.seekSeconds]'),
  source.replace('[touchControls.tapTimeout]', '[touchControls.seekSeconds]')
]) {
  assert.throws(() => parseJSDoc(invalid));
}
assert.throws(() => updateTypesContent('no markers', properties), /markers/);

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-ui-options-'));
const run = (...args) => spawnSync(
  process.execPath,
  [path.join(root, 'scripts/readme-options.js'), ...args], {cwd: fixture, encoding: 'utf8'}
);
const writeSource = text => fs.writeFileSync(path.join(fixture, 'src/plugin.js'), text);

try {
  fs.mkdirSync(path.join(fixture, 'src'));
  writeSource(source);
  for (const file of ['README.md', 'plugin.d.ts']) {
    fs.copyFileSync(path.join(root, file), path.join(fixture, file));
  }
  assert.strictEqual(run('--check').status, 0);
  for (const file of ['README.md', 'plugin.d.ts']) {
    const target = path.join(fixture, file);
    const original = fs.readFileSync(target, 'utf8');
    const stale = original.replace(
      file === 'README.md' ? 'Increment to seek in seconds.' : 'seekSeconds?: number;',
      file === 'README.md' ? 'Stale description.' : 'seekSeconds?: boolean;'
    );

    assert.notStrictEqual(stale, original);
    fs.writeFileSync(target, stale);
    assert.notStrictEqual(run('--check').status, 0);
    assert.strictEqual(fs.readFileSync(target, 'utf8'), stale, 'Check mode must not rewrite stale files');
    assert.strictEqual(run().status, 0);
    assert.strictEqual(fs.readFileSync(target, 'utf8'), original);
  }
  // A new public property must appear in both outputs, including its optionality and description.
  writeSource(source.replace(
    ' * @internal',
    ' * @property {boolean} [fullscreen.newOption]\n *  A new option.\n * @internal'
  )
    .replace('    enterOnRotate: true,', '    newOption: false,\n    enterOnRotate: true,'));
  assert.notStrictEqual(run('--check').status, 0);
  assert.strictEqual(run().status, 0);
  assert.ok(fs.readFileSync(path.join(fixture, 'plugin.d.ts'), 'utf8').includes('newOption?: boolean;'));
  assert.ok(fs.readFileSync(path.join(fixture, 'README.md'), 'utf8').includes('fullscreen.newOption'));
  assert.strictEqual(run('--check').status, 0);
  for (const invalid of [
    source.replace('const defaults =', 'const missingDefaults ='),
    source.replace('seekSeconds: 10', 'seekSeconds: 20'),
    source.replace('seekSeconds: 10', "seekSeconds: '10'"),
    source.replace('seekSeconds: 10,', ''),
    source.replace('seekSeconds: 10,', 'undocumented: 10,')
  ]) {
    writeSource(invalid);
    assert.notStrictEqual(run().status, 0, 'Invalid defaults must fail generation');
  }
  console.log('Options generation checks passed: freshness, optionality, descriptions, internal options and invalid input.');
} finally {
  remove(fixture);
}
