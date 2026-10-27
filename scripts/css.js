const fs = require('fs');
const path = require('path');

const source = path.resolve(__dirname, '../src/plugin.css');
const destination = path.resolve(__dirname, '../dist/videojs-mobile-ui.css');
const copy = () => {
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  fs.copyFileSync(source, destination);
};

if (process.argv.includes('-w') || process.argv.includes('--watch')) {
  // Poll one source file: handles atomic saves and avoids OS watcher limits.
  fs.watchFile(source, {interval: 250}, current => {
    if (current.nlink) {
      copy();
    }
  });
}

copy();
