const path = require('path');
const sh = require('shelljs');
const fs = require('fs');

const deployDir = 'deploy';

sh.rm('-rf', deployDir);
sh.mkdir('-p', deployDir);

sh.exec('npm run build');
sh.cp('-r', 'dist', path.join(deployDir, 'dist'));

let pluginContent = fs.readFileSync('index.html', 'utf8');

pluginContent = pluginContent.replace(/="node_modules\/video.js/g, '="https://unpkg.com/video.js@8.24.2');
fs.writeFileSync(path.join(deployDir, 'index.html'), pluginContent);
