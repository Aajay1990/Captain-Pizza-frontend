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

walkDir('c:/Users/Denver/.gemini/antigravity/playground/inner-curie/pizza-wing-app/frontend/src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // Fix '${API_URL}' or "${API_URL}" to `API_URL` or template literal
  // If it's exactly '${API_URL}' or "${API_URL}", replace with API_URL
  content = content.replace(/'\$\{API_URL\}'/g, 'API_URL');
  content = content.replace(/"\$\{API_URL\}"/g, 'API_URL');

  // If it's '${API_URL}/...', replace with `${API_URL}/...`
  // Match single quotes containing ${API_URL}
  content = content.replace(/'(\$\{API_URL\}[^']*)'/g, '`$1`');
  // Match double quotes containing ${API_URL}
  content = content.replace(/"(\$\{API_URL\}[^"]*)"/g, '`$1`');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Fixed quotes in:', filePath);
  }
});
