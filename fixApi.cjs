const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      if (dirPath.endsWith('.jsx') || dirPath.endsWith('.js')) {
        callback(dirPath);
      }
    }
  });
}

const targetUrl = "'https://pizza-backend-api-a5mm.onrender.com'";
// for some cases it might be inside template literals like `https://pizza-backend-api-a5mm.onrender.com/api...`

walkDir('c:/Users/Denver/.gemini/antigravity/playground/inner-curie/pizza-wing-app/frontend/src', (filePath) => {
  if (filePath.includes('apiConfig.js')) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  if (content.includes('https://pizza-backend-api-a5mm.onrender.com')) {
    // If it's defining const API = 'https://...', replace it with import
    if (content.includes("const API = 'https://pizza-backend-api-a5mm.onrender.com';")) {
        const importLevel = filePath.includes('pages\\admin') || filePath.includes('pages/admin') || filePath.includes('pages/pos') || filePath.includes('pages\\pos') ? '../../apiConfig' : '../apiConfig';
        content = content.replace("const API = 'https://pizza-backend-api-a5mm.onrender.com';", `import API_URL from '${importLevel}';\nconst API = API_URL;`);
    } else {
        // Find how deep the file is to import apiConfig
        const relativePath = path.relative('c:/Users/Denver/.gemini/antigravity/playground/inner-curie/pizza-wing-app/frontend/src', filePath);
        const depth = relativePath.split(path.sep).length - 1;
        let importPath = depth === 0 ? './apiConfig' : '../'.repeat(depth) + 'apiConfig';
        
        let shouldImport = false;

        // Replace literal string concat
        if (content.includes("'https://pizza-backend-api-a5mm.onrender.com'")) {
            content = content.replace(/'https:\/\/pizza-backend-api-a5mm\.onrender\.com'/g, 'API_URL');
            shouldImport = true;
        }
        
        // Replace inside template literals
        if (content.includes("https://pizza-backend-api-a5mm.onrender.com")) {
            content = content.replace(/https:\/\/pizza-backend-api-a5mm\.onrender\.com/g, '${API_URL}');
            shouldImport = true;
        }

        if (shouldImport && !content.includes('import API_URL')) {
            content = `import API_URL from '${importPath}';\n` + content;
        }
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Fixed:', filePath);
    }
  }
});
