const fs = require('fs');
const path = require('path');

const TARGET_DIR = __dirname;
const DB_FILE = path.join(TARGET_DIR, 'database.js');
const ALLOWED_EXTENSIONS = ['.gif', '.jpg', '.jpeg', '.png', '.webp'];

function getCategory(dirName) {
  if (dirName.includes('Anime-Wallpapers-main')) return 'Anime Wallpapers';
  if (dirName.includes('AnimeBackgrounds-master')) return 'Anime Backgrounds';
  if (dirName.includes('Wallpapers-main')) return 'Wallpapers';
  return dirName || 'Uncategorized';
}

function cleanName(fileName) {
  // Remove extension
  let name = path.parse(fileName).name;
  // Replace parenthesized numbers or brackets
  name = name.replace(/\(\d+\)/g, '').replace(/\[\d+\]/g, '');
  // Replace dashes, underscores, and multiple spaces
  name = name.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  // Capitalize first letter of each word
  name = name.replace(/\b\w/g, c => c.toUpperCase());
  // If name is empty (e.g. only numbers or brackets originally), fallback to default
  if (!name) {
    name = path.parse(fileName).name;
  }
  return name;
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      // Ignore git, node_modules and output/system dirs
      if (file !== '.git' && file !== 'node_modules' && !file.startsWith('.')) {
        walkDir(filePath, fileList);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

function generate() {
  console.log('Scanning directories...');
  const files = walkDir(TARGET_DIR);
  console.log(`Found ${files.length} wallpapers.`);

  const wallpapers = files.map((filePath, index) => {
    const relativePath = path.relative(TARGET_DIR, filePath);
    // Replace backslashes with forward slashes for URLs
    const pathParts = relativePath.split(path.sep);
    const urlPath = pathParts.map(part => encodeURIComponent(part)).join('/');
    const gitUrl = `https://wondermayank.github.io/wallpaper/${urlPath}`;
    
    // Parent folder logic
    const parentDir = path.basename(path.dirname(filePath));
    const category = getCategory(parentDir);
    const fileName = path.basename(filePath);
    const name = cleanName(fileName);
    const format = path.extname(filePath).substring(1).toUpperCase();
    const stat = fs.statSync(filePath);
    const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);

    return {
      id: `wp_${index + 1}`,
      name: name,
      category: category,
      url: gitUrl,
      format: format,
      size: `${sizeMB} MB`,
      path: relativePath.replace(/\\/g, '/')
    };
  });

  const content = `// This file is auto-generated. Do not edit directly.
const WALLPAPERS = ${JSON.stringify(wallpapers, null, 2)};
`;

  fs.writeFileSync(DB_FILE, content, 'utf8');
  console.log(`Database saved successfully to ${DB_FILE}`);
}

generate();
