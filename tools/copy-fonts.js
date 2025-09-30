/* eslint-env es6 */
const fs = require('fs');
const path = require('path');

/**
 * Copy font files from node_modules to assets/fonts for better PWA caching
 */

const fontSourceDir = 'node_modules/@fontsource/open-sans/files';
const targetDir = 'src/assets/fonts/open-sans';

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created directory: ${targetDir}`);
}

// Copy font files
try {
  const files = fs.readdirSync(fontSourceDir);
  const fontFiles = files.filter(
    (file) => file.endsWith('.woff') || file.endsWith('.woff2'),
  );

  console.log(`Found ${fontFiles.length} font files to copy`);

  fontFiles.forEach((fileName) => {
    const sourcePath = path.join(fontSourceDir, fileName);
    const targetPath = path.join(targetDir, fileName);

    try {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied: ${fileName}`);
    } catch (error) {
      console.error(`Error copying ${fileName}:`, error);
    }
  });

  console.log('Font copy completed');
} catch (error) {
  console.error('Error reading font source directory:', error);
}
