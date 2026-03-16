
const https = require('https');

https.get('https://emr-software.netlify.app/assets/index-D_OZBfbK.js', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const searchString = 'Interactive Guide';
    const found = data.includes(searchString);
    console.log(`Searching for "${searchString}": ${found ? 'FOUND' : 'NOT FOUND'}`);
  });
}).on('error', (err) => {
  console.error('Error: ' + err.message);
});
