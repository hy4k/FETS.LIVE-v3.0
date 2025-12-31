
const fs = require('fs');
const content = fs.readFileSync('E:/FETS LIVE ANTIGRAVITY/ETS.LIVE v04 2026/FETS.LIVE-v3.0/fets-point/src/components/checklist/ChecklistManager.tsx', 'utf8');

let depth = 0;
const lines = content.split('\n');

lines.forEach((line, i) => {
    const opens = (line.match(/<div(?![^>]*\/>)/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;

    if (opens > 0 || closes > 0) {
        depth += opens;
        depth -= closes;
        console.log(`Line ${i + 1}: depth=${depth} (opens=${opens}, closes=${closes}) - ${line.trim().substring(0, 50)}`);
    }
});
