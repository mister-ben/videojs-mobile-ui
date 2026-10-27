const fs = require('fs');
const path = require('path');

/**
 * Remove a directory, including on Node 14 releases preceding fs.rmSync.
 *
 * @param {string} directory Directory to remove.
 */
const remove = directory => {
  if (fs.rmSync) {
    fs.rmSync(directory, {recursive: true, force: true});
  } else if (fs.existsSync(directory)) {
    fs.rmdirSync(directory, {recursive: true});
  }
};

/**
 * Copy generated assets recursively using APIs available in Node 14.
 *
 * @param {string} source Source directory.
 * @param {string} destination Destination directory.
 */
const copy = (source, destination) => {
  fs.mkdirSync(destination, {recursive: true});
  fs.readdirSync(source, {withFileTypes: true}).forEach(entry => {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copy(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  });
};

module.exports = {remove, copy};
