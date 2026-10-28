/* eslint-disable no-console */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {execFile} = require('child_process');
const {promisify} = require('util');
const {rollup} = require('rollup');
const {remove} = require('./files');

const execute = promisify(execFile);

// Inspect npm's actual tarball contents rather than files in the checkout.
const checkContents = (pkg, packed, languages) => {
  assert.strictEqual(packed.name, pkg.name, 'Packed package name');
  assert.strictEqual(packed.version, pkg.version, 'Packed package version');
  const files = new Map(packed.files.map(file => [file.path, file.size]));
  const required = ['package.json', 'README.md', 'LICENSE',
    `dist/${pkg.name}.min.js`, `dist/${pkg.name}.css`,
    ...languages.map(language => `dist/lang/${language}.js`)];

  for (const field of ['main', 'module', 'browser']) {
    assert.strictEqual(typeof pkg[field], 'string', `Missing ${field} entry point`);
    required.push(pkg[field]);
  }
  required.forEach(file => assert.ok(files.get(file) > 0, `Missing or empty packed file: ${file}`));
  assert.ok(
    !packed.files.some(file => /^(test\/dist|docs\/api)\//.test(file.path)),
    'Generated test or API documentation must not be published'
  );
};

const verifyPackage = async root => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const languages = fs.readdirSync(path.join(root, 'lang'))
    .filter(file => file.endsWith('.json')).map(file => path.basename(file, '.json'));
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-ui-package-'));
  const npmCli = process.env.npm_execpath;

  try {
    assert.ok(npmCli, 'Run this check with npm run verify-package');
    const npm = async (args, cwd) => {
      const result = await execute(process.execPath, [npmCli, ...args], {
        cwd, timeout: 180000, maxBuffer: 4 * 1024 * 1024
      });

      return result.stdout;
    };
    const packed = JSON.parse(await npm([
      'pack', '--json', '--ignore-scripts', '--pack-destination', temporary
    ], root))[0];

    checkContents(pkg, packed, languages);
    console.log('Packed entry points, stylesheet, languages and release files are present.');
    const consumer = path.join(temporary, 'consumer');

    fs.mkdirSync(consumer);
    fs.writeFileSync(path.join(consumer, 'package.json'), JSON.stringify({
      name: 'mobile-ui-package-check', version: '1.0.0', private: true,
      dependencies: {
        [pkg.name]: `file:${path.join(temporary, packed.filename)}`,
        'video.js': pkg.peerDependencies['video.js']
      }
    }));
    await npm(['install', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund',
      '--package-lock=false', '--prefer-offline'], consumer);
    const installed = path.join(consumer, 'node_modules', pkg.name);
    const bundle = await rollup({
      input: path.join(installed, pkg.module),
      external: id => id === 'video.js' || id === 'global' || id.startsWith('global/')
    });

    try {
      await bundle.write({file: path.join(installed, 'module-smoke.cjs'), format: 'cjs', exports: 'auto'});
    } finally {
      await bundle.close();
    }
    for (const entry of ['main', 'module', 'browser', 'minified']) {
      await execute(process.execPath, [path.join(__dirname, 'check-installed.js'), consumer, entry], {
        timeout: 30000, maxBuffer: 1024 * 1024
      });
      console.log(`Installed ${entry} entry registers mobileUi and exposes version ${pkg.version}.`);
    }
  } finally {
    remove(temporary);
  }
};

module.exports = {checkContents, verifyPackage};

if (require.main === module) {
  require('./process')().main(() => verifyPackage(path.resolve(__dirname, '..')));
}
