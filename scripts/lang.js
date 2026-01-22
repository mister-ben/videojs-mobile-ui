const fs = require('fs');
const path = require('path');

const source = './lang';
const dest = './dist/lang';

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest);
}

// Read all files in the folder
fs.readdirSync(source)
  .filter(file => file.endsWith('.json'))
  .forEach(file => {
    // Read and parse JSON
    const jsonPath = path.join(source, file);
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // Create JS file contents
    const jsContent = `videojs.addLanguage('${
      path.basename(jsonPath, '.json')
    }', ${
      JSON.stringify(jsonData)
    });
`;

    // Write JS file next to JSON file
    const jsPath = path.join(
      dest,
      file.replace('.json', '.js')
    );

    fs.writeFileSync(jsPath, jsContent);
  });
