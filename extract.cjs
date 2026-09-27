const fs = require('fs');
const text = fs.readFileSync('public/quantum-library/assets/index-CcThedRa.js', 'utf8');

const regex = /title:`([^`]+)`.+?category:`([^`]+)`.+?shortDescription:`([^`]+)`.+?detailedExplanation:`([^`]+)`/gs;
let match;
const data = [];
while ((match = regex.exec(text)) !== null) {
  data.push({
    title: match[1],
    category: match[2],
    shortDescription: match[3],
    detailedExplanation: match[4]
  });
}
console.log('Found:', data.length);
fs.writeFileSync('src/data/extractedConcepts.json', JSON.stringify(data, null, 2));
