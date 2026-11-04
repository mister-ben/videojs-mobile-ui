/* eslint-disable no-console */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');
const {copy} = require('./files');

// Use the development compiler against the installed package, not checkout paths.
const checkInstalledTypes = consumer => {
  const tsc = require.resolve('typescript/bin/tsc');
  const fixtures = path.resolve(__dirname, '../test/types');
  const directory = path.join(consumer, 'type-checks');
  const compile = config => execFileSync(process.execPath, [tsc, '-p', config], {
    encoding: 'utf8', stdio: 'pipe', timeout: 30000
  });

  fs.mkdirSync(directory);
  fs.readdirSync(fixtures).filter(file => /\.(json|ts|cts|mts)$/.test(file)).forEach(file => {
    const source = fs.readFileSync(path.join(fixtures, file), 'utf8')
      .replace(/\.\.\/\.\.\/player/g, 'videojs-mobile-ui/player')
      .replace(/\.\.\/\.\.\/plugin/g, 'videojs-mobile-ui/plugin')
      .replace(/(['"])\.\.\/\.\.\1/g, "'videojs-mobile-ui'");

    fs.writeFileSync(path.join(directory, file), source);
  });
  for (const config of ['tsconfig.json', 'tsconfig.bundler.json', 'tsconfig.verbatim.json',
    'tsconfig.no-augmentation.json', 'tsconfig.local-augmentation.json']) {
    compile(path.join(directory, config));
  }
  console.log('Installed type-only entries work with CommonJS, bundler and Node16 ESM resolution.');

  // A runtime-only user can keep a top-level Video.js workaround without loading
  // the original, broken deep declarations. No additional legacy dependencies.
  const isolated = path.join(directory, 'existing-workaround');
  const modules = path.join(isolated, 'node_modules');
  const videojs = path.join(modules, 'video.js');

  fs.mkdirSync(path.join(videojs, 'dist/types'), {recursive: true});
  copy(path.join(consumer, 'node_modules/videojs-mobile-ui'), path.join(modules, 'videojs-mobile-ui'));
  fs.writeFileSync(path.join(videojs, 'package.json'), JSON.stringify({name: 'video.js', types: 'index.d.ts'}));
  const broken = 'export default class Player extends MissingVideoJsBase {}\n';

  fs.writeFileSync(path.join(videojs, 'index.d.ts'), broken);
  fs.writeFileSync(path.join(videojs, 'dist/types/player.d.ts'), broken);
  fs.writeFileSync(path.join(isolated, 'videojs-workaround.d.ts'), `
interface LocalPlayer {
  mobileUi(options?: {touchControls?: {seekSeconds?: number}}): void;
}
export default function videojs(id: string): LocalPlayer;
`);
  fs.writeFileSync(path.join(isolated, 'consumer.ts'), `
import videojs from 'video.js';
import 'videojs-mobile-ui';
// @ts-expect-error the runtime root deliberately retains its untyped API
import mobileUi from 'videojs-mobile-ui';
videojs('my-video').mobileUi({touchControls: {seekSeconds: 15}});
const version: string = mobileUi.VERSION;
`);
  const config = {
    compilerOptions: {
      target: 'ES2020', module: 'CommonJS', moduleResolution: 'node',
      strict: true, noEmit: true, esModuleInterop: true, skipLibCheck: false,
      types: [], baseUrl: '.', paths: {'video.js': ['./videojs-workaround.d.ts']}
    },
    files: ['consumer.ts']
  };
  const configPath = path.join(isolated, 'tsconfig.json');

  fs.writeFileSync(configPath, JSON.stringify(config));
  compile(configPath);
  // Ensure the sentinel declaration really fails when explicitly requested.
  config.files.push('node_modules/video.js/dist/types/player.d.ts');
  fs.writeFileSync(configPath, JSON.stringify(config));
  assert.throws(() => compile(configPath), error => error.stdout.includes('MissingVideoJsBase'));
  console.log('Installed runtime imports preserve local types and bypass broken Video.js declarations.');
};

module.exports = {checkInstalledTypes};
