// Script to push Prisma schema changes to database
const { execSync } = require('child_process');

try {
    console.log('🔄 Pushing schema changes to database...\n');

    const output = execSync('node node_modules/prisma/build/index.js db push', {
        cwd: __dirname,
        encoding: 'utf-8',
        stdio: 'inherit'
    });

    console.log('\n✅ Schema pushed successfully!');
} catch (error) {
    console.error('❌ Error pushing schema:', error.message);
    process.exit(1);
}
