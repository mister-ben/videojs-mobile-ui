const generate = require('videojs-generate-karma-config');

module.exports = function(config) {

  // see https://github.com/videojs/videojs-generate-karma-config
  // for options
  /* eslint-disable quote-props, camelcase */
  const options = {
    browserstackLaunchers(defaults) {
      return {
        bsChrome: defaults.bsChrome,
        bsFirefox: defaults.bsFirefox,
        bsSafari17: defaults.bsSafari17,
        bsSafari26: {
          base: 'BrowserStack',
          browser: 'safari',
          os: 'OS X',
          os_version: 'Tahoe',
          'browserstack.local': false,
          'browserstack.video': false,
        }
      }
    // browserstackLaunchers(defaults) {
    //   return {
    //     bsAndroid: {
    //       base: 'BrowserStack',
    //       browser: 'chrome',
    //       os: 'Android',
    //       os_version: '16',
    //       'browserstack.local': 'false',
    //       'browserstack.video': 'false'
    //     },
    //     bsSafari: {
    //       base: 'BrowserStack',
    //       browser: 'safari',
    //       os: 'OS X',
    //       os_version: 'Tahoe',
    //       'browserstack.local': 'false',
    //       'browserstack.video': 'false'
    //     },
    //     bsIPhone: {
    //       base: 'BrowserStack',
    //       device: 'iPhone 15',
    //       os: 'ios',
    //       os_version: '26',
    //       'browserstack.local': 'false',
    //       'browserstack.video': 'false'
    //     },
    //     bsChromeDefault: defaults.bsChrome,
    //     bsChrome: {
    //       base: 'BrowserStack',
    //       browser: 'chrome',
    //       os: 'Windows',
    //       os_version: '10',
    //       'browserstack.local': 'false',
    //       'browserstack.video': 'false'
    //     },
    //     bsFirefox: {
    //       base: 'BrowserStack',
    //       browser: 'firefox',
    //       os: 'Windows',
    //       os_version: '11',
    //       'browserstack.local': 'false',
    //       'browserstack.video': 'false'
    //     }
    //   };
    // }
  };

  config = generate(config, options);

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(config, null, 2));

  // any other custom stuff not supported by options here!
};
