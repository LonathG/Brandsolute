const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    content = content.replace(/Poppins:300,400,500,600,700/g, 'Google Sans:300,400,500,600,700');
    content = content.replace(/'Poppins'/g, "'Google Sans'");
    content = content.replace(/Poppins, /g, '"Google Sans", ');
    content = content.replace(/ Poppins,/g, ' "Google Sans",');
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Updated ' + filePath);
    }
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('cms')) {
                traverseDir(fullPath);
            }
        } else if (fullPath.endsWith('.html') || fullPath.endsWith('.css')) {
            replaceInFile(fullPath);
        }
    }
}

traverseDir('.');
