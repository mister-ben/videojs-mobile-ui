const fs = require('fs');
const path = require('path');
const {createCoverageMap} = require('istanbul-lib-coverage');
const {createContext} = require('istanbul-lib-report');
const reports = require('istanbul-reports');
const {remove} = require('./files');

const coverageDirectory = basePath => path.resolve(basePath, 'test/dist/coverage');
const browserFile = id => Buffer.from(String(id)).toString('hex') + '.json';

/**
 * Store Karma's asynchronously remapped coverage by browser ID.
 *
 * @param {string} basePath Project directory.
 */
function CoverageResults(basePath) {
  const directory = coverageDirectory(basePath);

  this.onRunStart = () => {
    remove(directory);
    fs.mkdirSync(path.join(directory, 'browsers'), {recursive: true});
  };
  this.onCoverageComplete = (browser, coverage) => {
    fs.writeFileSync(path.join(directory, 'browsers', browserFile(browser.id)), JSON.stringify({
      id: browser.id, name: browser.name, coverage
    }));
  };
  this.onRunComplete = (browsers, results) => {
    fs.writeFileSync(path.join(directory, 'run.json'), JSON.stringify({
      browsers: browsers.map(browser => ({id: browser.id, name: browser.name})),
      failed: Boolean(results.exitCode || results.failed || results.error || results.disconnected)
    }));
  };
}
CoverageResults.$inject = ['config.basePath'];

const writeReports = basePath => {
  const directory = coverageDirectory(basePath);
  const run = JSON.parse(fs.readFileSync(path.join(directory, 'run.json'), 'utf8'));

  if (run.failed || !run.browsers.length) {
    throw new Error('Cannot report coverage for an unsuccessful or empty browser run');
  }
  const merged = createCoverageMap({});
  const browsers = run.browsers.slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));

  for (const browser of browsers) {
    const file = path.join(directory, 'browsers', browserFile(browser.id));

    if (!fs.existsSync(file)) {
      throw new Error(`Missing coverage for ${browser.name} (${browser.id})`);
    }
    const result = JSON.parse(fs.readFileSync(file, 'utf8'));

    if (result.id !== browser.id || !Object.keys(result.coverage).length) {
      throw new Error(`Invalid or empty coverage for ${browser.name} (${browser.id})`);
    }
    merged.merge(result.coverage);
  }
  // Generate shared files only after every expected browser has contributed.
  const context = createContext({dir: directory, coverageMap: merged});

  ['html', 'lcovonly', 'json'].forEach(type => reports.create(type).execute(context));
  reports.create('text', {file: 'text.txt'}).execute(context);
  return merged;
};

module.exports = {CoverageResults, writeReports};

if (require.main === module) {
  require('./process')().main(() => writeReports(path.resolve(__dirname, '..')));
}
