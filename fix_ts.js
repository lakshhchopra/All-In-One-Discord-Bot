const fs = require('fs');

const files = [
  'apps/bot/src/modules/antiraid/commands/raidlock.ts',
  'apps/bot/src/modules/antiraid/commands/unraidlock.ts',
  'apps/bot/src/modules/botinfo/commands/info.ts',
  'apps/bot/src/modules/developer/commands/serverlist.ts',
  'apps/bot/src/modules/general/commands/list.ts',
  'apps/bot/src/modules/general/commands/listadmins.ts',
  'apps/bot/src/modules/general/commands/listbans.ts',
  'apps/bot/src/modules/general/commands/listboosters.ts',
  'apps/bot/src/modules/general/commands/listbots.ts',
  'apps/bot/src/modules/general/commands/listchannels.ts',
  'apps/bot/src/modules/general/commands/listemojis.ts',
  'apps/bot/src/modules/general/commands/listhasperms.ts',
  'apps/bot/src/modules/general/commands/listinrole.ts',
  'apps/bot/src/modules/general/commands/listmods.ts',
  'apps/bot/src/modules/general/commands/listpending.ts',
  'apps/bot/src/modules/general/commands/listroles.ts',
  'apps/bot/src/modules/general/commands/listtimeouts.ts',
  'apps/bot/src/modules/general/commands/membercount.ts'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix existing (c) =>, etc.
    const vars = ['c', 'g', 'm', 'r', 'e', 'b'];
    for (const v of vars) {
      const regex = new RegExp(`\\(\\s*${v}\\s*\\)\\s*=>`, 'g');
      content = content.replace(regex, `(${v}: any) =>`);
      
      const regex2 = new RegExp(`\\b${v}\\s*=>`, 'g');
      content = content.replace(regex2, `(${v}: any) =>`);
    }

    if (file.includes('serverlist.ts')) {
      content = content.replace(/\(a, b\) =>/g, '(a: any, b: any) =>');
    }
    
    fs.writeFileSync(file, content, 'utf8');
  }
}
console.log('Done!');
