const fs = require('fs');
const path = require('path');


const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

// Insert changes to package.json files here.
packageJson.scripts = {};
fs.writeFileSync(path.join('dist', 'package.json'), JSON.stringify(packageJson, null, 1));
fs.copyFileSync('README.md', path.join('dist', 'README.md'));

console.log('Wrote dist/package.json');
