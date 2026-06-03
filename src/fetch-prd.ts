import fs from 'fs';
import https from 'https';

const url = 'https://raw.githubusercontent.com/hanbedrijfskunde/straor-midterm-assessment/main/PRD.md';
const file = fs.createWriteStream('prd-downloaded.md');

https.get(url, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download Completed successfully!');
  });
}).on('error', (err) => {
  console.error('Error downloading the file:', err);
});
