/* eslint-disable no-console */

const fs = require('fs');

const PATHS = {
  plugin: './src/plugin.js',
  readme: './README.md'
};

/**
 * Updates options in the README with the typedef fer MobileUiOptions in plugin.js
 */
function main() {
  try {
    const pluginContent = fs.readFileSync(PATHS.plugin, 'utf8');
    const readmeContent = fs.readFileSync(PATHS.readme, 'utf8');

    console.log(`Reading JSDoc from ${PATHS.plugin}...`);
    const newDocs = generateMarkdownFromJSDoc(pluginContent);

    if (!newDocs) {
      console.error('Could not find "MobileUiOptions" JSDoc in plugin.js');
      return;
    }

    console.log(`Generated documentation for ${newDocs.split('\n').filter(l => l.startsWith('-')).length} properties.`);
    console.log(`Updating ${PATHS.readme}...`);

    const updatedReadme = updateReadmeContent(readmeContent, newDocs);

    fs.writeFileSync(PATHS.readme, updatedReadme);
    console.log('README.md updated successfully!');

  } catch (err) {
    console.error('Error:', err.message);
  }
}

/**
 * Parses the JSDoc block for MobileUiOptions and converts to formatted Markdown
 *
 * @param {string} content The file containing the jsdoc
 * @return {string} Formatted Markdown
 */
function generateMarkdownFromJSDoc(content) {
  const blockRegex = /\/\*\*[\s\S]*?@typedef \{Object\} MobileUiOptions[\s\S]*?\*\//;
  const match = content.match(blockRegex);

  if (!match) {
    return null;
  }

  const lines = match[0].split('\n');
  const properties = [];
  let currentProp = null;
  let isInternal = false;

  const propertyRegex = /@property\s+\{(.+?)\}\s+(?:\[(.+?)\]|(\S+))/;

  lines.forEach(line => {
    const cleanLine = line.trim().replace(/^\*\s?/, '').trim();

    if (cleanLine.includes('@internal')) {
      isInternal = true;
      return;
    }

    const propMatch = cleanLine.match(propertyRegex);

    if (propMatch) {
      if (currentProp) {
        properties.push(currentProp);
      }

      if (isInternal) {
        currentProp = null;
        isInternal = false;
        return;
      }

      const type = propMatch[1];
      const name = propMatch[2] || propMatch[3];

      currentProp = {
        name,
        type,
        description: []
      };
    } else if (currentProp && !cleanLine.startsWith('@') && cleanLine !== '/') {
      if (cleanLine.length > 0) {
        currentProp.description.push(cleanLine);
      }
    }
  });

  if (currentProp) {
    properties.push(currentProp);
  }

  return properties.map(prop => {
    const descString = prop.description.join('  \n  ');

    return `- **\`${prop.name}\`** {${prop.type}}  \n  ${descString}`;
  }).join('\n');
}

/**
 * Replaces content in README
 *
 * @param {string} readmeContent
 * Current README
 * @param {string} newDocs
 * New options content
 * @return {string} New README
 */
function updateReadmeContent(readmeContent, newDocs) {
  // Capture "### Options", everything in between, and "## Usage"
  // $1 = ### Options
  // $2 = Content (ignored/replaced)
  // $3 = ## Usage
  const sectionRegex = /(### Options)([\s\S]*?)(## Usage)/;

  if (!sectionRegex.test(readmeContent)) {
    throw new Error('Could not find "### Options" section followed by "## Usage" in README.md');
  }

  // Replace with: Header + 2 newlines + Content + 2 newlines + Next Header
  return readmeContent.replace(sectionRegex, `$1\n\n${newDocs}\n\n$3`);
}

main();
