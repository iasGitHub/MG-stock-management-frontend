const fs = require('fs');
const path = require('path');

const apiUrl = (process.env.API_URL || '/api').replace(/\/+$/, '');
const distDir = path.join(__dirname, '..', 'dist', 'stock-management-frontend', 'browser');
const file = path.join(distDir, 'env.js');

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(file, `window.API_URL = '${apiUrl}';\n`);
console.log(`env.js generated -> ${apiUrl}`);