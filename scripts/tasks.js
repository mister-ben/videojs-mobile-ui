const fs = require('fs');
const path = require('path');
const {remove} = require('./files');
const runner = require('./process')();

const args = process.argv.slice(3);
const clean = () => {
  ['dist', 'test/dist', 'cjs', 'es'].forEach(directory => {
    const target = path.resolve(__dirname, '..', directory);

    remove(target);
    fs.mkdirSync(target, {recursive: true});
  });
};
const build = async (env = {}) => {
  await runner.script('readme-options.js', ['--check']);
  clean();
  await runner.parallel([
    runner.script('css.js'),
    runner.tool('rollup', 'rollup', ['-c', 'scripts/rollup.config.js'], env),
    runner.script('lang.js')
  ]);
};
const watch = () => runner.parallel([
  runner.script('css.js', ['--watch', ...args]),
  runner.tool('rollup', 'rollup', ['-c', 'scripts/rollup.config.js', '-w', ...args])
]);
const server = () => runner.tool('karma', 'karma', [
  'start', 'scripts/karma.conf.js', '--singleRun=false', '--auto-watch', ...args
]);
const tasks = {
  clean,
  'build': () => build(),
  'build-prod': () => build({NO_TEST_BUNDLE: '1'}),
  'build-test': () => build({TEST_BUNDLE_ONLY: '1'}),
  'test': async () => {
    await runner.script('readme-options.js', ['--check']);
    await runner.script('../test/options.js');
    await runner.tool('videojs-standard', 'vjsstandard');
    await runner.script('../test/tasks.js');
    await runner.script('../test/changelog.js');
    await runner.script('../test/package.js');
    await runner.script('../test/coverage.js');
    await runner.tool('typescript', 'tsc', ['-p', 'test/types/tsconfig.json']);
    await runner.tool('typescript', 'tsc', ['-p', 'test/types/tsconfig.bundler.json']);
    await runner.tool('typescript', 'tsc', ['-p', 'test/types/tsconfig.verbatim.json']);
    await runner.tool('typescript', 'tsc', ['-p', 'test/types/tsconfig.no-augmentation.json']);
    await runner.tool('typescript', 'tsc', ['-p', 'test/types/tsconfig.local-augmentation.json']);
    await build({TEST_BUNDLE_ONLY: '1'});
    await runner.tool('karma', 'karma', ['start', 'scripts/karma.conf.js', ...args]);
    await runner.script('coverage.js');
  },
  'posttest': () => process.stdout.write(fs.readFileSync(path.resolve(__dirname, '../test/dist/coverage/text.txt'))),
  watch,
  'start': () => runner.parallel([server(), watch()]),
  'publish': async () => {
    await build({NO_TEST_BUNDLE: '1'});
    await runner.script('verify-package.js');
  }
};

runner.main(() => {
  const task = tasks[process.argv[2]];

  if (!task) {
    throw new Error(`Unknown task: ${process.argv[2]}`);
  }
  return task();
});
