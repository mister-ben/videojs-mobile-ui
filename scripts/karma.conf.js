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
    }
  };

  config = generate(config, options);

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(config, null, 2));

  // any other custom stuff not supported by options here!
};
