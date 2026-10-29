const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {createRequire} = require('module');

const [consumer, entry] = process.argv.slice(2);
const load = createRequire(path.join(consumer, 'package.json'));
const pkgPath = load.resolve('videojs-mobile-ui/package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const videojs = load('video.js');
let plugin;

assert.strictEqual(videojs.VERSION.split('.')[0], '8', 'Consumer uses Video.js 8');
if (entry === 'browser' || entry === 'minified') {
  const file = entry === 'browser' ? pkg.browser : `dist/${pkg.name}.min.js`;
  const context = {
    videojs,
    window: load('global/window'),
    document: load('global/document'),
    console
  };

  // Exercise the UMD browser-global branch, including the minified artifact.
  vm.runInNewContext(fs.readFileSync(path.join(path.dirname(pkgPath), file), 'utf8'), context);
  plugin = context.videojsMobileUi;
} else {
  plugin = load(entry === 'main' ? pkg.name : path.join(path.dirname(pkgPath), 'module-smoke.cjs'));
}
assert.strictEqual(typeof plugin, 'function', `${entry} exports a plugin`);
assert.strictEqual(plugin.VERSION, pkg.version, `${entry} exposes the release version`);
assert.strictEqual(videojs.getPlugin('mobileUi'), plugin, `${entry} registers with Video.js`);
