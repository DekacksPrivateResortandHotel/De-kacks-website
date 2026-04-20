const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const fixedContent = content.replace(
  'html += `<p style="margin-top:14px;">No fully paid transactions have been archived yet.</p></div>`;',
  'html += `<p style="margin-top:14px;">No fully paid transactions have been archived yet.</p></div>`;'
);
fs.writeFileSync('index.html', fixedContent);
console.log('Fixed syntax error at line 8379');
