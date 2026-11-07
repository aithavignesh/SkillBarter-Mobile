const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 1x1 transparent PNG binary buffer
const png1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEeQHzkF35vQAAAABJRU5ErkJggg==',
  'base64'
);

const files = ['icon.png', 'splash-icon.png', 'adaptive-icon.png', 'favicon.png'];
for (const file of files) {
  const filePath = path.join(assetsDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, png1x1);
  }
}
console.log('Default assets generated successfully.');
