const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend', 'src', 'pages');

const replaceInFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('http://localhost:5001')) {
    const newContent = content.replace(/http:\/\/localhost:5001/g, 'http://localhost:5000');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
};

fs.readdirSync(directoryPath).forEach(file => {
  const filePath = path.join(directoryPath, file);
  if (fs.statSync(filePath).isFile() && filePath.endsWith('.jsx')) {
    replaceInFile(filePath);
  }
});
