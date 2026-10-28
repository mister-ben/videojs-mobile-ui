# CONTRIBUTING

We welcome contributions from everyone!

## Getting Started

Make sure you have Node.js 24 (as specified in `.nvmrc`) and npm installed.

1. Fork this repository and clone your fork
1. Install dependencies: `npm install`
1. Run a development server: `npm start`

### Making Changes

Refer to the [video.js plugin conventions][conventions] for more detail on best practices and tooling for video.js plugin authorship.

When you've made your changes, push your commit(s) to your fork and issue a pull request against the original repository.

### Running Tests

Testing is a crucial part of any software project. For all but the most trivial changes (typos, etc) test cases are expected. Tests are run in actual browsers using [Karma][karma].

- In all available and supported browsers: `npm test`
- In a specific browser: `npm test -- --browsers ChromeHeadless` or `npm test -- --browsers FirefoxHeadless`.
- Build-task checks without a browser: `npm run test:tasks` (also included in `npm test`).
- While development server is running (`npm start`), navigate to [`http://localhost:9999/test/`][local]


[karma]: http://karma-runner.github.io/
[local]: http://localhost:9999/test/
[conventions]: https://github.com/videojs/generator-videojs-plugin/blob/master/docs/conventions.md

### Styles and build tasks

Edit `src/plugin.css` as ordinary, unnested CSS. `npm run build:css` copies it
to `dist/videojs-mobile-ui.css`; `npm run watch:css` keeps that copy up to date.
No CSS transformation or minification runs during builds.

The Node scripts under `scripts/` handle cleaning, build modes, parallel tools
and development-process cleanup. `npm run build-prod` omits the test bundle;
`npm run build-test` builds only the test JavaScript bundle, alongside CSS and
language files. The Babel configuration and browser targets are unchanged.

### Changelog tooling

`npm run update-changelog` uses the CLI supplied by `conventional-changelog`
and the local Video.js configuration and templates in `scripts/changelog*`.
It prepends the next release to `CHANGELOG.md`, preserving existing entries.
This development tool requires Node.js 22 or newer; the published plugin
retains its existing compatibility requirements and Babel browser targets.

`npm run test:changelog` checks formatting against output captured from the
previous Video.js preset and verifies that existing entries are preserved.
These checks also run as part of `npm test`.

### Coverage reports

`npm test` collects source-mapped coverage from each browser and merges it after
Karma finishes. HTML, LCOV, JSON and text reports are generated once under
`test/dist/coverage/`; the console summary describes that combined coverage.
A statement or branch is covered if any participating browser exercises it.
Individual browser results are retained as JSON under `test/dist/coverage/browsers/`,
with browser names and unique IDs recorded for diagnosis.

Missing or empty browser coverage fails report generation. Failed tests retain
their failure status and cannot leave a stale successful report from an earlier
run. `npm run test:coverage` checks merging and reporting without a browser; these
checks also run in `npm test`. Running Karma directly only collects the individual
results; run `node scripts/coverage.js` afterwards to generate the merged reports.
Development server mode (`npm start` or `npm run server`) does not collect coverage.
