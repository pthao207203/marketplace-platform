// fix-react-router-imports.js
// Chạy bằng: node fix-react-router-imports.js

const fs = require("fs");
const path = require("path");

// Thư mục gốc dự án
const ROOT_DIR = path.join(__dirname, "src"); // chỉnh lại nếu src của bạn ở chỗ khác

// Quét tất cả file .ts/.tsx/.js/.jsx
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// Thay thế import
function fixImports(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // Regex tìm import từ "react-router" (không chứa "-dom")
  const regex = /from\s+['"]react-router['"]/g;

  if (regex.test(content)) {
    content = content.replace(regex, `from 'react-router-dom'`);
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Fixed imports in: ${filePath}`);
  }
}

// Main
const allFiles = getAllFiles(ROOT_DIR);

allFiles.forEach(fixImports);

console.log("🎉 Done! Hãy restart dev server (Vite/CRA) và thử lại.");
