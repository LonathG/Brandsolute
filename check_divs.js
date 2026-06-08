const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
let divCount = 0;
const lines = html.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  divCount += opens - closes;
  if (i > 850 && i < 890) {
    console.log(`Line ${i + 1}: opens=${opens}, closes=${closes}, count=${divCount}`);
  }
}
console.log(`Final div count: ${divCount}`);
