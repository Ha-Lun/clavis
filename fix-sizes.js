const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    content = content.replace(/\bw-([^\s"'`]+)\s+h-\1\b/g, 'size-$1');
    content = content.replace(/\bh-([^\s"'`]+)\s+w-\1\b/g, 'size-$1');
    
    if (content !== original) {
      console.log(`Updated ${filePath}`);
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});
