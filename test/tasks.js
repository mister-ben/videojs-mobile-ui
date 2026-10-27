/* eslint-disable no-console */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {copy, remove} = require('../scripts/files');
const runner = require('../scripts/process')();

const waitFor = async check => {
  const deadline = Date.now() + 5000;

  while (!check()) {
    if (Date.now() > deadline) {
      throw new Error('Timed out waiting for child process');
    }
    await new Promise(resolve => setTimeout(resolve, 25));
  }
};

runner.main(async () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-ui-tasks-'));

  try {
    const result = path.join(fixture, 'arguments and environment.json');
    const argument = 'spaces, "quotes", $dollars and &symbols';

    await runner.run(process.execPath, ['-e',
      'require("fs").writeFileSync(process.argv[1], JSON.stringify([process.argv[2], process.env.MOBILE_UI_TEST]))',
      result, argument], {MOBILE_UI_TEST: 'child-only value'});
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(result)), [argument, 'child-only value']);
    assert.strictEqual(process.env.MOBILE_UI_TEST, undefined, 'child environment does not leak into the parent');
    await assert.rejects(runner.run(process.execPath, ['-e', 'process.exit(7)']), error => error.exitCode === 7);
    await assert.rejects(runner.run(path.join(fixture, 'missing-command')), error => error.code === 'ENOENT');
    await assert.rejects(runner.tool('mobile-ui-missing-tool', 'missing'), error => error.code === 'MODULE_NOT_FOUND');

    const scripts = path.join(fixture, 'scripts');
    const source = path.join(fixture, 'src/plugin.css');
    const output = path.join(fixture, 'dist/videojs-mobile-ui.css');

    fs.mkdirSync(scripts);
    fs.mkdirSync(path.dirname(source));
    fs.copyFileSync(path.resolve(__dirname, '../scripts/css.js'), path.join(scripts, 'css.js'));
    fs.writeFileSync(source, 'body { color: red; }\n');
    await runner.run(process.execPath, [path.join(scripts, 'css.js')]);
    assert.strictEqual(fs.readFileSync(output, 'utf8'), fs.readFileSync(source, 'utf8'));

    // Deployment must stop before copying assets if its build fails.
    ['netlify.js', 'files.js', 'process.js'].forEach(file => {
      fs.copyFileSync(path.resolve(__dirname, '../scripts', file), path.join(scripts, file));
    });
    fs.writeFileSync(path.join(scripts, 'tasks.js'), 'process.exit(23);\n');
    fs.writeFileSync(path.join(fixture, 'index.html'), 'demo');
    await assert.rejects(runner.run(process.execPath, [path.join(scripts, 'netlify.js')]), error => error.exitCode === 23);
    assert.ok(!fs.existsSync(path.join(fixture, 'deploy/dist')), 'failed build does not copy assets');
    assert.ok(!fs.existsSync(path.join(fixture, 'deploy/index.html')), 'failed build does not write a deploy page');

    fs.unlinkSync(output);
    const watcher = runner.run(process.execPath, [path.join(scripts, 'css.js'), '--watch']);
    // Attach a rejection handler immediately; stop() deliberately terminates it.
    const watcherResult = watcher.catch(error => error);

    await waitFor(() => fs.existsSync(output));
    fs.writeFileSync(source + '.new', 'body { color: blue; }\n');
    fs.renameSync(source + '.new', source);
    await waitFor(() => fs.readFileSync(output, 'utf8').includes('blue'));
    remove(path.dirname(output));
    fs.writeFileSync(source, 'body { color: green; }\n');
    await waitFor(() => fs.existsSync(output) && fs.readFileSync(output, 'utf8').includes('green'));

    copy(path.join(fixture, 'dist'), path.join(fixture, 'copied'));
    assert.strictEqual(fs.readFileSync(path.join(fixture, 'copied/videojs-mobile-ui.css'), 'utf8'), fs.readFileSync(source, 'utf8'));
    remove(path.join(fixture, 'copied'));
    remove(path.join(fixture, 'copied'));

    await assert.rejects(runner.parallel([
      watcher,
      runner.run(process.execPath, ['-e', 'process.exit(9)'])
    ]), error => error.exitCode === 9);
    assert.ok((await watcherResult).exitCode, 'a failed parallel task stops the CSS watcher');

    // A signal sent only to the task parent must also stop its detached children.
    const pidFile = path.join(fixture, 'child.pid');
    const parentFile = path.join(scripts, 'parent.js');
    const modulePath = path.resolve(__dirname, '../scripts/process.js');

    fs.writeFileSync(parentFile, `const runner = require(${JSON.stringify(modulePath)})();
runner.main(() => runner.run(process.execPath, ['-e',
  'require("fs").writeFileSync(process.argv[1], JSON.stringify({pid: process.pid, parent: process.ppid})); setInterval(() => {}, 1000)',
  ${JSON.stringify(pidFile)}]));\n`);
    const parent = runner.run(process.execPath, [parentFile]);
    const parentResult = parent.catch(error => error);

    await waitFor(() => fs.existsSync(pidFile));
    const {pid: childPid, parent: parentPid} = JSON.parse(fs.readFileSync(pidFile, 'utf8'));

    if (process.platform !== 'win32') {
      process.kill(parentPid, 'SIGINT');
    } else {
      runner.stop();
    }
    assert.ok((await parentResult).exitCode, 'interrupted task exits with a failure status');
    await waitFor(() => {
      try {
        process.kill(childPid, 0);
        return false;
      } catch (error) {
        return error.code === 'ESRCH';
      }
    });
    console.log('Task checks passed: arguments, environment, failures, CSS copy/watch, files, deployment failure and process cleanup.');
  } finally {
    runner.stop();
    remove(fixture);
  }
});
