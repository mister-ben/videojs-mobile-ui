/* eslint-disable no-console */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {CoverageResults, writeReports} = require('../scripts/coverage');
const {remove} = require('../scripts/files');

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-ui-coverage-'));
const source = path.join(fixture, 'example.js');
const directory = path.join(fixture, 'test/dist/coverage');
const chrome = {id: 'chrome', name: 'Chrome Headless'};
// Identical names deliberately exercise the collision seen in browser discovery.
const otherChrome = {id: 'chrome-2', name: 'Chrome Headless'};
const firefox = {id: 'firefox', name: 'Firefox'};
const browsers = [chrome, otherChrome, firefox];
const range = line => ({start: {line, column: 0}, end: {line, column: 4}});
const coverage = (first, second) => ({
  [source]: {
    path: source,
    statementMap: {0: range(1), 1: range(2)},
    fnMap: {0: {name: 'example', decl: range(1), loc: range(1), line: 1}},
    branchMap: {0: {type: 'if', line: 1, loc: range(1), locations: [range(1), range(2)]}},
    s: {0: first, 1: second}, f: {0: first}, b: {0: [first, second]}
  }
});
const snapshot = () => Object.fromEntries(['text.txt', 'lcov.info', 'coverage-final.json', 'index.html']
  .map(file => [file, fs.readFileSync(path.join(directory, file), 'utf8').replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/g, 'TIMESTAMP')]));

try {
  fs.writeFileSync(source, 'true;\ntrue;\n');
  const reporter = new CoverageResults(fixture);

  reporter.onRunStart();
  // Some browsers run a subset of tests. Union their hits, not percentages.
  reporter.onRunComplete(browsers, {exitCode: 0});
  reporter.onCoverageComplete(firefox, coverage(0, 1));
  reporter.onCoverageComplete(otherChrome, coverage(1, 0));
  reporter.onCoverageComplete(chrome, coverage(1, 0));
  const merged = writeReports(fixture);

  assert.strictEqual(merged.getCoverageSummary().statements.pct, 100);
  assert.strictEqual(merged.getCoverageSummary().branches.pct, 100);
  assert.deepStrictEqual(merged.fileCoverageFor(source).s, {0: 2, 1: 1});
  assert.strictEqual(fs.readdirSync(path.join(directory, 'browsers')).length, 3);
  const first = snapshot();

  reporter.onRunStart();
  assert.ok(!fs.existsSync(path.join(directory, 'text.txt')), 'remove stale aggregate reports');
  reporter.onCoverageComplete(chrome, coverage(1, 0));
  reporter.onCoverageComplete(otherChrome, coverage(1, 0));
  reporter.onCoverageComplete(firefox, coverage(0, 1));
  reporter.onRunComplete(browsers.slice().reverse(), {exitCode: 0});
  writeReports(fixture);
  assert.deepStrictEqual(snapshot(), first, 'browser completion and reporting order do not change reports');

  reporter.onRunStart();
  reporter.onRunComplete(browsers, {exitCode: 0});
  reporter.onCoverageComplete(chrome, coverage(1, 0));
  assert.throws(() => writeReports(fixture), /Missing coverage/);
  assert.ok(!fs.existsSync(path.join(directory, 'text.txt')), 'missing browser cannot produce an aggregate report');

  reporter.onRunStart();
  reporter.onRunComplete([chrome], {failed: 1});
  reporter.onCoverageComplete(chrome, coverage(1, 0));
  assert.throws(() => writeReports(fixture), /unsuccessful/);
  assert.ok(!fs.existsSync(path.join(directory, 'text.txt')));

  reporter.onRunStart();
  reporter.onRunComplete([chrome], {disconnected: true});
  assert.throws(() => writeReports(fixture), /unsuccessful/);

  reporter.onRunStart();
  reporter.onRunComplete([], {exitCode: 0});
  assert.throws(() => writeReports(fixture), /empty/);

  reporter.onRunStart();
  reporter.onRunComplete([chrome], {exitCode: 0});
  reporter.onCoverageComplete(chrome, {});
  assert.throws(() => writeReports(fixture), /empty coverage/);
  console.log('Coverage checks passed: merged hits, browser identity, report order, stale data and failed/missing results.');
} finally {
  remove(fixture);
}
