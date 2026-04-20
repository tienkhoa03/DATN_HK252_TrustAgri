/**
 * Generate color exports in multiple formats
 * This script generates CSS and JSON files from color tokens
 */

import { toCssVariables, toJson } from './colors';
import * as fs from 'fs';
import * as path from 'path';

const outputDir = path.join(__dirname, 'exports');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate CSS file
const cssContent = toCssVariables();
fs.writeFileSync(path.join(outputDir, 'colors.css'), cssContent, 'utf-8');
console.log('✓ Generated colors.css');

// Generate JSON file
const jsonContent = toJson();
fs.writeFileSync(path.join(outputDir, 'colors.json'), jsonContent, 'utf-8');
console.log('✓ Generated colors.json');

console.log('\nColor exports generated successfully!');
console.log(`Output directory: ${outputDir}`);
