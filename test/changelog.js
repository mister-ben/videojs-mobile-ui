const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {execFileSync} = require('child_process');

const root = path.resolve(__dirname, '..');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-ui-changelog-'));
const git = (...args) => execFileSync('git', args, {cwd: directory, encoding: 'utf8'}).trim();
const normalize = text => text.replace(/\d{4}-\d{2}-\d{2}/g, 'DATE').replace(/\b[0-9a-f]{7,40}\b/g, 'HASH').trimEnd() + '\n';

try {
  git('init', '-q');
  git('config', 'commit.gpgsign', 'false');
  git('config', 'user.name', 'Changelog Test');
  git('config', 'user.email', 'changelog@example.com');
  git('remote', 'add', 'origin', 'https://github.com/mister-ben/videojs-mobile-ui.git');
  fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({
    name: 'videojs-mobile-ui', version: '1.2.0',
    repository: {type: 'git', url: 'https://github.com/mister-ben/videojs-mobile-ui.git'}
  }));
  git('add', 'package.json');
  git('commit', '-qm', 'chore: initial release');
  git('tag', 'v1.1.0');
  const messages = [
    'feat(touch): add controls #123 by @contributor',
    'fix(*): fix rotation\n\nCloses #124',
    'docs: explain controls', 'chore(deps): refresh tooling',
    'style: whitespace', 'refactor: simplify controls', 'test: cover rotation',
    'perf: reduce redraws',
    'build: change configuration\n\nBREAKING CHANGE: configuration must be updated',
    'ci: ignored automation'
  ];

  messages.forEach(message => git('commit', '--allow-empty', '-qm', message));
  const reverted = git('rev-parse', 'HEAD');

  git('commit', '--allow-empty', '-qm', `revert: ci: ignored automation\n\nThis reverts commit ${reverted}.`);
  const cli = path.join(root, 'node_modules/conventional-changelog/dist/cli/index.js');
  const config = ['-n', path.join(root, 'scripts/changelog.config.js')];
  const run = args => execFileSync(process.execPath, [cli, ...config, ...args], {
    cwd: directory, encoding: 'utf8'
  });
  // Captured using CLI 2.2.2 and the Video.js 3.0.2 preset. The new writer
  // trims trailing blank lines; the CLI adds the separator when prepending.
  const expected = normalize(fs.readFileSync(path.join(__dirname, 'fixtures/changelog.md'), 'utf8'));
  const output = normalize(run(['--stdout']));

  assert.strictEqual(output, expected);
  const previous = '# Existing changelog\n\nKeep all old entries.\n';

  fs.writeFileSync(path.join(directory, 'CHANGELOG.md'), previous);
  run(['-i', 'CHANGELOG.md']);
  assert.strictEqual(normalize(fs.readFileSync(path.join(directory, 'CHANGELOG.md'), 'utf8')), output + '\n' + previous);
  const manifest = path.join(directory, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));

  pkg.version = '1.2.1';
  fs.writeFileSync(manifest, JSON.stringify(pkg));
  fs.unlinkSync(path.join(directory, 'CHANGELOG.md'));
  assert.strictEqual(normalize(run(['--stdout'])), expected
    .replace('<a name="1.2.0">', '<a name="1.2.1">')
    .replace('# [1.2.0]', '## [1.2.1]')
    .replace('...v1.2.0)', '...v1.2.1)'));
} finally {
  fs.rmSync(directory, {recursive: true, force: true});
}
