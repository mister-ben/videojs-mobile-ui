const fs = require('fs');
const path = require('path');

const source = './lang';
const dest = './dist/lang';

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest);
}

fs.readdirSync(source)
  .filter(file => file.endsWith('.json'))
  .forEach(file => {
    const jsonPath = path.join(source, file);
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const langName = path.basename(jsonPath, '.json');
    const jsPath = path.join(dest, langName + '.js');

    const jsContent = `videojs.addLanguage('${langName}', ${
      JSON.stringify(jsonData)
    });\n`;

    fs.writeFileSync(jsPath, jsContent);
  });
