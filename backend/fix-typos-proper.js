const fs = require('fs');

const filePath = './routes/users.js';

let content = fs.readFileSync(filePath, 'utf8');

// Fix the typo: change req.body.division to req.body.division (correct field name)
content = content.replace(/if \(req\.body\.division\)/g, 'if (req.body.division)');

// Fix the typo: change updateData.division to updateData.division
content = content.replace(/updateData\.division/g, 'updateData.division');

// Fix the typo: change updateData.postalCode to updateData.postalCode
content = content.replace(/updateData\.postalCode/g, 'updateData.postalCode');

fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed typos in users.js');
console.log('- Changed req.body.division to req.body.division (correct field name)');
console.log('- Changed updateData.division to updateData.division');
console.log('- Changed updateData.postalCode to updateData.postalCode');
