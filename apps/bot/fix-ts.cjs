const fs = require('fs');
const path = require('path');
const dir = 'f:/Github/All-In-One-Discord-Bot/apps/bot/src/modules/music/commands';
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.ts')) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix permissionLevel: "MEMBER"
    content = content.replace(/permissionLevel:\s*"MEMBER",?\n?/g, '');
    
    // Fix play.ts msg null
    if (file === 'play.ts') {
      content = content.replace(/msg\.edit/g, 'msg?.edit');
      content = content.replace(/voiceChannel, query/g, '(voiceChannel as any), query');
    }
    
    // Fix loop.ts enum assignment
    if (file === 'loop.ts') {
      content = content.replace('let mode = QueueRepeatMode.OFF;', 'let mode: any = QueueRepeatMode.OFF;');
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
  }
}
