const generate = require('videojs-generate-rollup-config');

// see https://github.com/videojs/videojs-generate-rollup-config
// for options
const options = {};
const config = generate(options);

// Add additonal builds/customization here!

config.settings.globals.browser['@ungap/global-this'] = 'window';
config.settings.globals.module['@ungap/global-this'] = 'window';
config.settings.externals.browser.push('@ungap/global-this');
config.settings.externals.module.push('@ungap/global-this');

// export the builds to rollup
export default Object.values(config.builds);
