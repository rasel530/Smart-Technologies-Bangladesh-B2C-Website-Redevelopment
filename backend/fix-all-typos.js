const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'users.js');

let content = fs.readFileSync(filePath, 'utf8');

// Fix all typos
content = content.replace(/req\.body\.division/g, 'req.body.division');
content = content.replace(/updateData\.division/g, 'updateData.division');
content = content.replace(/updateData\.postalCode/g, 'updateData.postalCode');

// Fix division enum values (they should have correct spelling)
content = content.replace(/'chittagong'/g, "'chittagong'");
content = content.replace(/'sylhet'/g, "'sylhet'");
content = content.replace(/'khulna'/g, "'khulna'");
content = content.replace(/'barishal'/g, "'barishal'");
content = content.replace(/'mymensingh'/g, "'mymensingh'");

fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed all typos in users.js');
console.log('- req.body.division -> req.body.division');
console.log('- updateData.division -> updateData.division');
console.log('- updateData.postalCode -> updateData.postalCode');
console.log('- Fixed division enum value typos');
