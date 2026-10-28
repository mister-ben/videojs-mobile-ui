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

CI explicitly runs `ChromeHeadless` and `FirefoxHeadless` so coverage does not
depend on automatic browser discovery. Local `npm test` retains browser discovery;
use `npm test -- --browsers ChromeHeadless,FirefoxHeadless` for the same browser
list as CI. Existing BrowserStack launchers remain available through an explicit
browser list. Mobile Safari compatibility is a separate follow-up.

### Real-device mobile compatibility

`npm run test:mobile` runs the browser suite on BrowserStack using Safari on a
real iPhone 16 / iOS 18 and Chrome on a real Samsung Galaxy S24 / Android 14.
Set `BROWSER_STACK_USERNAME` and `BROWSER_STACK_ACCESS_KEY` in your environment.
The launcher manages BrowserStack Local so devices can reach the local Karma
server through `bs-local.com`. Sessions run sequentially for accounts with one
parallel session. Device and OS versions are explicit in `scripts/karma.mobile.conf.js`.

The separate `mobile compatibility` workflow runs on master, trusted repository
pull requests and manual dispatch. Repository Actions secrets with the same
names are required. Fork and Dependabot PRs skip this workflow; a maintainer can
run it from a trusted branch. Mobile results are not uploaded to Codecov and do
not contribute to the desktop coverage baseline.

These runs exercise the existing touch, orientation-listener, swipe and CSS
checks in real mobile browsers, plus initialization without forced platform
detection. Fullscreen assertions use stubs and touch events are synthetic;
they do not establish that native gestures, playback permissions or native
fullscreen transitions work. Before a release, use a playable video on each
platform to check actual single/double taps, swipes, portrait/landscape rotation,
and entering/exiting fullscreen. These manual checks complement the automated
suite and require no additional browser automation dependencies.
