// Based on @videojs/babel-config 1.0.2/es.js (Apache-2.0).
// Copyright Brightcove, Inc. See LICENSE.tooling for the license.
// Preserve the existing transpilation targets and preset options.
const path = require('path');
const presetEnv = require.resolve('@babel/preset-env');

const defaultBrowsersList = [
  'last 3 major versions',
  'Firefox ESR',
  // This ensures support for certain smart TVs (ex. LG WebOS 4)
  'Chrome >= 53',
  'not dead',
  'not ie 11',
  'not baidu 7',
  'not and_qq 11',
  'not and_uc 12',
  'not op_mini all'
];

module.exports = {
  exclude: path.join(process.cwd(), 'node_modules/**'),
  compact: false,
  babelrc: false,
  presets: [
    [presetEnv, {bugfixes: true, loose: true, modules: false, targets: defaultBrowsersList}]
  ]
};
