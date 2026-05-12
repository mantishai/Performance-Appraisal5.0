const fs = require('fs');

const filePath = 'd:\\Performance Appraisal5.0\\js\\modules\\employee-detail.js';

fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }
    
    const cleanedData = data.replace(/console\.log\(\'\[DEBUG\].*?\);/g, '');
    
    fs.writeFile(filePath, cleanedData, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }
        console.log('Debug logs cleaned successfully!');
        process.exit(0);
    });
});