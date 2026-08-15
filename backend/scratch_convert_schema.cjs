const fs = require('fs');

let c = fs.readFileSync('src/prisma/schema.prisma', 'utf8');
c = c.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
c = c.replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url = "file:./dev.db"');
c = c.replace(/\s*directUrl\s*=\s*env\("DIRECT_URL"\)/, '');
c = c.replace(/@db\.VarChar(\(\d+\))?/g, '');
c = c.replace(/@db\.Time\(\d+\)/g, '');
c = c.replace(/@db\.Decimal/g, '');
c = c.replace(/ Decimal/g, ' Float');
c = c.replace(/ Json/g, ' String');

fs.writeFileSync('src/prisma/schema.prisma', c);
console.log('Schema converted successfully.');
