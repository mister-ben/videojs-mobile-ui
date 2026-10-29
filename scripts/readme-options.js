/* eslint-disable no-console */

const fs = require('fs');

const PATHS = {
  plugin: './src/plugin.js',
  readme: './README.md',
  types: './plugin.d.ts'
};

const COLOURS = {
  blue: '\x1b[34m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

/**
 * Main execution entry point. Reads files, validates data, and updates generated outputs.
 *
 * @param {boolean} check Check freshness without writing files.
 */
function main(check = process.argv.includes('--check')) {
  try {
    const pluginContent = fs.readFileSync(PATHS.plugin, 'utf8');
    const readmeContent = fs.readFileSync(PATHS.readme, 'utf8');

    console.log(`Reading source from ${PATHS.plugin}...`);

    const properties = parseJSDoc(pluginContent);

    if (!properties || properties.length === 0) {
      throw new Error('Could not find "MobileUiOptions" JSDoc in plugin.js');
    }

    const defaultsObj = extractAndParseDefaults(pluginContent);
    const defaultsCodeBlock = extractDefaultsCodeBlock(pluginContent);

    if (defaultsObj) {
      const structureValid = validateStructure(properties, defaultsObj);
      const valuesValid = validateValues(properties, defaultsObj);

      if (!structureValid || !valuesValid) {
        console.error(`${COLOURS.red}Validation failed. Please fix the inconsistencies above.${COLOURS.reset}`);
        process.exit(1);
      }
    } else {
      throw new Error('Could not parse "defaults" object from code.');
    }

    const publicProperties = properties.filter(p => !p.isInternal);
    const newDocsMarkdown = generateMarkdown(publicProperties);

    console.log(`Generated documentation for ${publicProperties.length} public properties.`);
    console.log(check ? 'Checking generated files...' : 'Updating generated files...');

    const updatedReadme = updateReadmeContent(readmeContent, newDocsMarkdown, defaultsCodeBlock);

    const typesContent = fs.readFileSync(PATHS.types, 'utf8');
    const updatedTypes = updateTypesContent(typesContent, publicProperties);
    const outputs = [[PATHS.readme, readmeContent, updatedReadme],
      [PATHS.types, typesContent, updatedTypes]];
    const stale = outputs.filter(([, current, generated]) => current !== generated);

    if (check && stale.length) {
      throw new Error(`Generated options are stale: ${stale.map(([file]) => file).join(', ')}. Run npm run docs:options.`);
    }
    if (!check) {
      stale.forEach(([file, , generated]) => fs.writeFileSync(file, generated));
    }
    console.log(check ? 'Generated options are up to date.' : 'README and options types updated.');

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

/**
 * -------------------------------------------------------
 * PARSING
 * -------------------------------------------------------
 */

/**
 * Parses the JSDoc @typedef block for MobileUiOptions into an array of property objects.
 *
 * @param {string} content - The file content to parse.
 * @return {Array} List of property objects.
 */
function parseJSDoc(content) {
  const blocks = content.match(/\/\*\*[\s\S]*?\*\//g) || [];
  const matches = blocks.filter(block => /@typedef \{Object\} MobileUiOptions\b/.test(block));

  if (matches.length !== 1) {
    throw new Error('Expected exactly one MobileUiOptions JSDoc block');
  }
  const lines = matches[0].split('\n');
  const properties = [];
  let currentProp = null;
  let nextIsInternal = false;

  const propertyRegex = /@property\s+\{(.+?)\}\s+(?:\[(.+?)\]|(\S+))/;

  lines.forEach(line => {
    const cleanLine = line.trim().replace(/^\*\s?/, '').trim();

    if (cleanLine.includes('@internal')) {
      nextIsInternal = true;
      return;
    }

    const propMatch = cleanLine.match(propertyRegex);

    if (cleanLine.startsWith('@property') && !propMatch) {
      throw new Error(`Unsupported property syntax: ${cleanLine}`);
    }

    if (propMatch) {
      if (currentProp) {
        properties.push(currentProp);
      }

      currentProp = {
        name: propMatch[2] || propMatch[3],
        type: propMatch[1],
        optional: Boolean(propMatch[2]),
        description: [],
        isInternal: nextIsInternal
      };

      nextIsInternal = false;

    } else if (currentProp && !cleanLine.startsWith('@') && cleanLine !== '/') {
      if (cleanLine.length > 0) {
        currentProp.description.push(cleanLine);
      }
    }
  });

  if (currentProp) {
    properties.push(currentProp);
  }

  const names = new Set();

  properties.forEach(prop => {
    if (!/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(prop.name) ||
        !['Object', 'boolean', 'number'].includes(prop.type) || names.has(prop.name)) {
      throw new Error(`Unsupported or duplicate option: ${prop.name} {${prop.type}}`);
    }
    names.add(prop.name);
    const parent = prop.name.split('.').slice(0, -1).join('.');

    if (parent && !properties.some(p => p.name === parent && p.type === 'Object' &&
        (prop.isInternal || !p.isInternal))) {
      throw new Error(`Missing public object parent for ${prop.name}`);
    }
  });
  return properties;
}

/**
 * Extracts and evaluates the 'defaults' object literal from the source code.
 *
 * @param {string} content - The file content.
 * @return {Object|null} The evaluated JavaScript object or null.
 */
function extractAndParseDefaults(content) {
  const regex = /const defaults = (\{[\s\S]*?^\};)/m;
  const match = content.match(regex);

  if (!match) {
    return null;
  }

  try {
    /* eslint-disable-next-line no-new-func */
    const func = new Function('return ' + match[1]);

    return func();
  } catch (e) {
    console.error('Failed to parse defaults object:', e.message);
    return null;
  }
}

/**
 * Extracts the raw string representation of the 'defaults' object for display.
 *
 * @param {string} content - The file content.
 * @return {string|null} The raw code block string.
 */
function extractDefaultsCodeBlock(content) {
  const regex = /const defaults = (\{[\s\S]*?^\};)/m;
  const match = content.match(regex);

  return match ? match[1] : null;
}

/**
 * -------------------------------------------------------
 * VALIDATION
 * -------------------------------------------------------
 */

/**
 * Validates that all JSDoc properties exist in defaults and vice-versa.
 *
 * @param {Array} properties - Parsed JSDoc properties.
 * @param {Object} defaults - The actual code defaults object.
 * @return {boolean} True if valid.
 */
function validateStructure(properties, defaults) {
  let isValid = true;
  const errors = [];
  const defaultsKeys = flattenKeys(defaults);

  // 1. Check JSDoc -> Code
  properties.filter(p => !p.isInternal).forEach(prop => {
    // Check if prop is a leaf node or a container object in defaults
    const isPresent = defaultsKeys.includes(prop.name) ||
                      defaultsKeys.some(k => k.startsWith(prop.name + '.'));

    if (!isPresent) {
      errors.push(`MISSING IN DEFAULTS: JSDoc property "${prop.name}" is missing from the defaults object.`);
      isValid = false;
    }
  });

  // 2. Check Code -> JSDoc
  defaultsKeys.forEach(defKey => {
    const isDocumented = properties.some(p => p.name === defKey);

    if (!isDocumented) {
      errors.push(`UNDOCUMENTED PROPERTY: Defaults contains "${defKey}" which is not in the JSDoc.`);
      isValid = false;
    }
  });

  if (!isValid) {
    console.error(`--- ${COLOURS.blue}DEFAULTS MISMATCH${COLOURS.reset} --------`);
    errors.forEach(e => console.error(e));
    console.error('-------------------------------');
  }

  return isValid;
}

/**
 * Verifies that JSDoc 'Default' descriptions match actual code values.
 *
 * @param {Array} properties - Parsed JSDoc properties.
 * @param {Object} defaults - The actual code defaults object.
 * @return {boolean} True if valid.
 */
function validateValues(properties, defaults) {
  let isValid = true;
  const errors = [];

  properties.forEach(prop => {
    const value = getNestedValue(defaults, prop.name);

    if (value !== undefined && (prop.type === 'Object' ?
      typeof value !== 'object' || value === null || Array.isArray(value) : typeof value !== prop.type)) {
      errors.push(`TYPE MISMATCH for ${prop.name}: expected ${prop.type}`);
      isValid = false;
    }
    const defaultLine = prop.description.find(line => line.startsWith('Default '));

    if (defaultLine) {
      let rawValue = defaultLine.substring('Default '.length).trim();

      rawValue = rawValue.replace(/\.$/, '').replace(/^`|`$/g, '');

      const expectedValue = castValueToType(rawValue, prop.type);
      const actualValue = getNestedValue(defaults, prop.name);

      if (actualValue !== undefined && actualValue !== expectedValue) {
        errors.push(`VALUE MISMATCH for "${prop.name}":\n` +
          `   - JSDoc expects: ${JSON.stringify(expectedValue)}\n` +
          `   - Code has:      ${JSON.stringify(actualValue)}`);
        isValid = false;
      }
    }
  });

  if (!isValid) {
    console.error(`--- ${COLOURS.blue}VALUE VALIDATION ERRORS${COLOURS.reset} ---`);
    errors.forEach(e => console.error(e));
    console.error('-------------------------------');
  }

  return isValid;
}

/**
 * Recursively flattens an object into an array of dot-notation keys.
 *
 * @param {Object} obj - The object to flatten.
 * @param {string} prefix - The current key path prefix.
 * @return {Array<string>} Array of keys.
 */
function flattenKeys(obj, prefix = '') {
  let keys = [];

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys = keys.concat(flattenKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  return keys;
}

/**
 * Casts a string value to a JavaScript type based on the JSDoc type definition.
 *
 * @param {string} str - The raw string value.
 * @param {string} type - The JSDoc type (e.g., 'boolean', 'number').
 * @return {*} The casted value.
 */
function castValueToType(str, type) {
  const lowerType = type.toLowerCase();

  if (lowerType === 'boolean') {
    return str === 'true';
  }
  if (lowerType === 'number') {
    return Number(str);
  }
  if (lowerType === 'string') {
    return str.replace(/^['"]|['"]$/g, '');
  }
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
}

/**
 * Retrieves a value from a nested object using a dot-notation path string.
 *
 * @param {Object} obj - The source object.
 * @param {string} path - The dot-notation path (e.g., 'fullscreen.enterOnRotate').
 * @return {*} The found value or undefined.
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : undefined;
  }, obj);
}

/**
 * -------------------------------------------------------
 * OUTPUT GENERATION
 * -------------------------------------------------------
 */

/**
 * Formats property objects into a specific Markdown list style.
 *
 * @param {Array} properties - List of property objects.
 * @return {string} Formatted Markdown string.
 */
function generateMarkdown(properties) {
  return properties.map(prop => {
    const descString = prop.description.join('  \n  ');

    return `- **\`${prop.name}\`** {${prop.type}}  \n  ${descString}`;
  }).join('\n');
}

/**
 * Replaces specific sections in the README content with new documentation.
 *
 * @param {string} readmeContent - The original README text.
 * @param {string} newDocs - The new options list Markdown.
 * @param {string} defaultsCodeBlock - The new defaults code block.
 * @return {string} The updated README text.
 */
function updateReadmeContent(readmeContent, newDocs, defaultsCodeBlock) {
  let content = readmeContent;

  if (defaultsCodeBlock) {
    const defaultsRegex = /(### Default options)([\s\S]*?)(### Options)/;

    if (!defaultsRegex.test(content)) {
      throw new Error('Could not find README default options section');
    }
    if (defaultsRegex.test(content)) {
      const codeBlock = `\`\`\`js\n${defaultsCodeBlock}\n\`\`\``;

      content = content.replace(defaultsRegex, `$1\n\n${codeBlock}\n\n$3`);
    }
  }

  const optionsRegex = /(### Options)([\s\S]*?)(## Installation)/;

  if (!optionsRegex.test(content)) {
    throw new Error('Could not find "### Options" section followed by "## Installation" in README.md');
  }

  return content.replace(optionsRegex, `$1\n\n${newDocs}\n\n$3`);
}

/**
 * Update only the marked interface; module exports and augmentation stay handwritten.
 *
 * @param {string} content Existing declaration.
 * @param {Array} properties Public JSDoc properties.
 * @return {string} Updated declaration.
 */
function updateTypesContent(content, properties) {
  const render = (parent, indent) => properties.filter(prop =>
    prop.name.split('.').slice(0, -1).join('.') === parent).map(prop => {
    const name = prop.name.split('.').pop();
    const comments = prop.description.length ?
      `${indent}/**\n${prop.description.map(line => `${indent} * ${line}`).join('\n')}\n${indent} */\n` : '';
    const type = prop.type === 'Object' ?
      `{\n${render(prop.name, indent + '  ')}\n${indent}}` : prop.type;

    return `${comments}${indent}${name}${prop.optional ? '?' : ''}: ${type};`;
  }).join('\n');
  const start = '  // BEGIN GENERATED OPTIONS';
  const end = '  // END GENERATED OPTIONS';
  const section = `${start}\n  // Generated from src/plugin.js by npm run docs:options.\n` +
    `  interface MobileUiOptions {\n${render('', '    ')}\n  }\n${end}`;
  const parts = content.split(start);

  if (parts.length !== 2 || parts[1].split(end).length !== 2) {
    throw new Error('Missing or duplicate generated options markers in plugin.d.ts');
  }
  return parts[0] + section + parts[1].split(end)[1];
}

module.exports = {main, parseJSDoc, updateTypesContent};
if (require.main === module) {
  main();
}
