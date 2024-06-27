const generate = require('videojs-generate-rollup-config');

// see https://github.com/videojs/videojs-generate-rollup-config
// for options
const options = {};
const config = generate(options);

// Add additonal builds/customization here!

console.log(JSON.stringify(config, null, 2));

// export the builds to rollup
export default Object.values(config.builds);
