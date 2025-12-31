
const fs = require('fs');
const content = fs.readFileSync('E:/FETS LIVE ANTIGRAVITY/ETS.LIVE v04 2026/FETS.LIVE-v3.0/fets-point/src/components/checklist/ChecklistManager.tsx', 'utf8');

const lines = content.split('\n');
let depth = 0;
let inReturn = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('return (')) inReturn = true;

    if (inReturn) {
        const opens = (line.match(/<div/g) || []).length;
        const closes = (line.match(/<\/div/g) || []).length;
        const selfCloses = (line.match(/<div[^>]*\/>/g) || []).length;

        depth += (opens - selfCloses);
        depth -= closes;

        if (opens > 0 || closes > 0) {
            console.log(`${i + 1}: [${depth}] ${line.trim()}`);
        }
    }

    if (line.includes(');') && depth === 0) {
        inReturn = false;
    }
}
