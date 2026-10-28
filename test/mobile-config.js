/* eslint-disable no-console */
const assert = require('assert');
const path = require('path');
const {spawnSync} = require('child_process');
const {config} = require('karma');
const runner = require('../scripts/process')();

runner.main(async () => {
  const root = path.resolve(__dirname, '..');
  const parse = (file, options = {}) => config.parseConfig(path.join(root, 'scripts', file), options, {
    promiseConfig: true, throwErrors: true
  });
  const desktop = await parse('karma.conf.js', {browsers: ['ChromeHeadless', 'FirefoxHeadless']});
  const mobile = await parse('karma.mobile.conf.js');

  assert.deepStrictEqual(desktop.browsers, ['ChromeHeadless', 'FirefoxHeadless']);
  assert.ok(desktop.reporters.includes('coverage-results'));
  assert.ok(!desktop.client.mobileCompatibility);
  assert.deepStrictEqual(mobile.browsers, ['bsIosSafari', 'bsAndroidChrome']);
  assert.strictEqual(mobile.concurrency, 1);
  assert.strictEqual(mobile.hostname, 'bs-local.com');
  assert.ok(mobile.browserStack.startTunnel && mobile.browserStack.forceLocal);
  assert.ok(mobile.browserStack.localIdentifier);
  assert.ok(mobile.client.mobileCompatibility);
  assert.ok(!mobile.detectBrowsers.enabled);
  assert.ok(!mobile.reporters.includes('coverage') && !mobile.reporters.includes('coverage-results'));
  mobile.browsers.forEach(name => {
    const launcher = mobile.customLaunchers[name];

    assert.strictEqual(launcher.base, 'BrowserStack');
    assert.strictEqual(launcher.real_mobile, true);
    assert.strictEqual(launcher.browser_version, null);
    assert.ok(launcher.device && launcher.os && launcher.os_version);
    assert.notStrictEqual(launcher['browserstack.local'], 'false');
  });

  const env = {...process.env};

  delete env.BROWSER_STACK_USERNAME;
  delete env.BROWSER_STACK_ACCESS_KEY;
  const missing = spawnSync(process.execPath, ['scripts/tasks.js', 'test-mobile'], {
    cwd: root, env, encoding: 'utf8'
  });

  assert.strictEqual(missing.status, 1);
  assert.match(missing.stderr, /require BROWSER_STACK_USERNAME and BROWSER_STACK_ACCESS_KEY/);
  console.log('Mobile configuration checks passed: real devices, tunnel, isolated coverage and missing credentials.');
});
