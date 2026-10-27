/* eslint-disable no-console */
const {spawn, spawnSync} = require('child_process');
const path = require('path');
const {constants} = require('os');

/**
 * Run this project's tools without shell quoting or platform-specific npm shims.
 *
 * @return {Object} Process helpers sharing a set of active children.
 */
module.exports = function() {
  const children = new Set();

  const stop = () => {
    children.forEach(child => {
      if (!child.pid) {
        return;
      }
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], {stdio: 'ignore'});
      } else {
        try {
          // Each tool has its own process group, including any workers it starts.
          process.kill(-child.pid, 'SIGTERM');
        } catch (error) {
          if (error.code === 'EPERM') {
            // Restricted environments may allow signalling only direct children.
            child.kill('SIGTERM');
          } else if (error.code !== 'ESRCH') {
            throw error;
          }
        }
      }
    });
  };

  const run = (command, args = [], env = {}) => new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: path.resolve(__dirname, '..'),
      env: Object.assign({}, process.env, env),
      stdio: 'inherit',
      detached: process.platform !== 'win32'
    });

    children.add(child);
    child.once('error', reject);
    child.once('close', (code, signal) => {
      children.delete(child);
      if (code === 0) {
        resolve();
      } else {
        const error = new Error(`${command} exited with ${signal || code}`);

        error.exitCode = code || 128 + (constants.signals[signal] || 0);
        reject(error);
      }
    });
  });

  const script = (file, args = [], env = {}) =>
    run(process.execPath, [path.resolve(__dirname, file), ...args], env);

  const tool = async (packageName, name, args = [], env = {}) => {
    // These tools are direct dev dependencies; bypass package export maps.
    const manifest = path.resolve(__dirname, '../node_modules', packageName, 'package.json');
    const pkg = require(manifest);
    const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin[name];

    return run(process.execPath, [path.resolve(path.dirname(manifest), bin), ...args], env);
  };

  const parallel = jobs => Promise.all(jobs).catch(error => {
    stop();
    throw error;
  });

  const main = async job => {
    let interrupted = false;
    const onSignal = signal => {
      interrupted = true;
      process.exitCode = 128 + constants.signals[signal];
      stop();
    };
    const onInterrupt = () => onSignal('SIGINT');
    const onTerminate = () => onSignal('SIGTERM');

    process.on('SIGINT', onInterrupt);
    process.on('SIGTERM', onTerminate);
    try {
      await job();
    } catch (error) {
      stop();
      if (!interrupted) {
        console.error(error.message);
        process.exitCode = error.exitCode || 1;
      }
    } finally {
      process.removeListener('SIGINT', onInterrupt);
      process.removeListener('SIGTERM', onTerminate);
    }
  };

  return {run, script, tool, parallel, main, stop};
};
