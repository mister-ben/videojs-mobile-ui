/* eslint-disable no-console */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {execFileSync} = require('child_process');
const {checkContents} = require('../scripts/verify-package');
const {remove} = require('../scripts/files');

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-ui-pack-test-'));
const pkg = {
  name: 'videojs-mobile-ui', version: '1.2.3',
  main: 'dist/videojs-mobile-ui.cjs.js',
  module: 'dist/videojs-mobile-ui.es.js',
  browser: 'dist/videojs-mobile-ui.js',
  files: ['dist/']
};
const manifest = path.join(directory, 'package.json');
const pack = () => JSON.parse(execFileSync(process.execPath, [process.env.npm_execpath,
  'pack', '--json', '--ignore-scripts'], {cwd: directory, encoding: 'utf8', timeout: 30000}))[0];

try {
  fs.mkdirSync(path.join(directory, 'dist/lang'), {recursive: true});
  fs.writeFileSync(manifest, JSON.stringify(pkg));
  ['README.md', 'LICENSE', pkg.main, pkg.module, pkg.browser,
    'dist/videojs-mobile-ui.min.js', 'dist/videojs-mobile-ui.css', 'dist/lang/en.js']
    .forEach(file => fs.writeFileSync(path.join(directory, file), 'release asset\n'));
  checkContents(pkg, pack(), ['en']);

  const css = path.join(directory, 'dist/videojs-mobile-ui.css');

  fs.writeFileSync(css, '');
  assert.throws(() => checkContents(pkg, pack(), ['en']), /empty packed file: dist\/videojs-mobile-ui.css/);
  fs.writeFileSync(css, 'release asset\n');

  // A file can exist in the checkout but be omitted by npm's publication list.
  fs.writeFileSync(manifest, JSON.stringify({...pkg, files: ['dist/*.js', 'dist/lang/']}));
  assert.throws(() => checkContents(pkg, pack(), ['en']), /packed file: dist\/videojs-mobile-ui.css/);
  fs.writeFileSync(manifest, JSON.stringify(pkg));

  fs.unlinkSync(path.join(directory, 'dist/lang/en.js'));
  assert.throws(() => checkContents(pkg, pack(), ['en']), /packed file: dist\/lang\/en.js/);
  fs.writeFileSync(path.join(directory, 'dist/lang/en.js'), 'release asset\n');

  fs.unlinkSync(path.join(directory, pkg.module));
  assert.throws(() => checkContents(pkg, pack(), ['en']), /packed file: dist\/videojs-mobile-ui.es.js/);
  fs.writeFileSync(path.join(directory, pkg.module), 'release asset\n');

  fs.mkdirSync(path.join(directory, 'test/dist'), {recursive: true});
  fs.writeFileSync(path.join(directory, 'test/dist/bundle.js'), 'test-only asset\n');
  fs.writeFileSync(manifest, JSON.stringify({...pkg, files: ['dist/', 'test/']}));
  assert.throws(() => checkContents(pkg, pack(), ['en']), /Generated test or API documentation/);
  console.log('Packed-file checks passed: release assets, omitted/empty files, translations and test-only files.');
} finally {
  remove(directory);
}
