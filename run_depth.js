
const fs = require('fs');
const content = fs.readFileSync('E:/FETS LIVE ANTIGRAVITY/ETS.LIVE v04 2026/FETS.LIVE-v3.0/fets-point/src/components/checklist/ChecklistManager.tsx', 'utf8');

const lines = content.split('\n');
let depth = 0;
let output = '';

lines.forEach((line, i) => {
    const opens = (line.match(/<div(?![^>]*\/>)/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;

    if (opens > 0 || closes > 0) {
        depth += opens;
        depth -= closes;
        output += `Line ${i + 1}: depth=${depth} (+${opens}, -${closes}) - ${line.trim().substring(0, 40)}\n`;
    }
});

fs.writeFileSync('E:/FETS LIVE ANTIGRAVITY/ETS.LIVE v04 2026/FETS.LIVE-v3.0/depth_results.txt', output);
