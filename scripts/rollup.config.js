// Based on videojs-generate-rollup-config 7.0.2 (Apache-2.0).
// Copyright Brightcove, Inc. See LICENSE.tooling for the license.
const babel = require('@rollup/plugin-babel').default;
const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const multiEntry = require('@rollup/plugin-multi-entry');
const resolve = require('@rollup/plugin-node-resolve').default;
const {terser} = require('rollup-plugin-terser');
const istanbul = require('rollup-plugin-istanbul');
const externalGlobals = require('rollup-plugin-external-globals');
const path = require('path');
const pkg = require('../package.json');
const babelConfig = require('./babel.config');

const watch = process.argv.some(arg => /^-w|--watch$/.test(arg));
const banner = `/*! @name ${pkg.name} @version ${pkg.version} @license ${pkg.license} */`;
const moduleExternals = ['global', '@babel/runtime', 'video.js'];
const testGlobals = {'qunit': 'QUnit', 'qunitjs': 'QUnit', 'sinon': 'sinon', 'video.js': 'videojs'};

// Keep the same plugin instances and order as the generated configuration.
const babelPlugin = babel(Object.assign({}, babelConfig, {
  babelHelpers: 'runtime',
  skipPreflightCheck: true
}));
const jsonPlugin = json();
const resolvePlugin = resolve({
  mainFields: ['browser', 'module', 'jsnext:main', 'main'],
  dedupe: id => moduleExternals.some(external => id.startsWith(external))
});
const commonjsPlugin = commonjs({sourceMap: false});

const builds = {
  browser: {
    input: 'src/plugin.js',
    watch: {clearScreen: false},
    external: id => id.startsWith('video.js'),
    plugins: [
      resolvePlugin,
      jsonPlugin,
      commonjsPlugin,
      externalGlobals({
        'global': 'window',
        'global/window': 'window',
        'global/document': 'document'
      }),
      babelPlugin
    ],
    output: [
      {
        banner,
        globals: {'video.js': 'videojs'},
        name: 'videojsMobileUi',
        file: 'dist/videojs-mobile-ui.js',
        format: 'umd'
      },
      ...watch ? [] : [{
        banner,
        globals: {'video.js': 'videojs'},
        name: 'videojsMobileUi',
        file: 'dist/videojs-mobile-ui.min.js',
        format: 'umd',
        plugins: [terser({output: {comments: 'some'}})]
      }]
    ]
  },
  test: {
    input: 'test/**/*.test.js',
    watch: {clearScreen: false},
    external: id => Object.keys(testGlobals).some(external => id.startsWith(external)),
    plugins: [
      multiEntry({exports: false}),
      resolvePlugin,
      jsonPlugin,
      commonjsPlugin,
      ...watch ? [] : [istanbul({
        exclude: ['test/**', 'node_modules/**', 'package.json', /^data-files!/]
      })],
      babelPlugin
    ],
    output: [{
      banner,
      globals: testGlobals,
      name: 'videojsMobileUiTests',
      file: 'test/dist/bundle.js',
      format: 'iife'
    }]
  },
  module: {
    input: 'src/plugin.js',
    watch: {clearScreen: false},
    external: id => path.extname(id) !== '.json' &&
      moduleExternals.some(external => id.startsWith(external)),
    plugins: [resolve({extensions: ['.json']}), jsonPlugin, babelPlugin],
    output: [
      {
        banner,
        globals: {'video.js': 'videojs'},
        file: 'dist/videojs-mobile-ui.cjs.js',
        format: 'cjs',
        exports: 'auto'
      },
      {
        banner,
        globals: {'video.js': 'videojs'},
        file: 'dist/videojs-mobile-ui.es.js',
        format: 'es',
        exports: 'auto'
      }
    ]
  }
};

if (process.env.TEST_BUNDLE_ONLY) {
  delete builds.module;
  delete builds.browser;
} else if (process.env.NO_TEST_BUNDLE) {
  delete builds.test;
}

export default Object.values(builds);
