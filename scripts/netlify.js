const path = require('path');
const fs = require('fs');
const {remove, copy} = require('./files');
const runner = require('./process')();

runner.main(async () => {
  const deployDir = path.resolve(__dirname, '../deploy');

  remove(deployDir);
  fs.mkdirSync(deployDir, {recursive: true});

  await runner.script('tasks.js', ['build']);
  copy(path.resolve(__dirname, '../dist'), path.join(deployDir, 'dist'));

  let pluginContent = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

  pluginContent = pluginContent.replace(/="node_modules\/video.js/g, '="https://unpkg.com/video.js@8.24.2');
  fs.writeFileSync(path.join(deployDir, 'index.html'), pluginContent);
});
