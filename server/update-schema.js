// Script to push schema changes to database
const { execSync } = require('child_process');

try {
    console.log('🔄 Pushing schema changes to database...');
    console.log('⚠️  This will accept data loss for removed fields\n');

    const output = execSync('npx prisma db push --accept-data-loss', {
        cwd: __dirname,
        encoding: 'utf-8',
        stdio: 'inherit'
    });

    console.log('\n✅ Schema pushed successfully!');
    console.log('\n🔄 Regenerating Prisma Client...');

    execSync('npx prisma generate', {
        cwd: __dirname,
        encoding: 'utf-8',
        stdio: 'inherit'
    });

    console.log('\n✅ Prisma Client regenerated!');
    console.log('\n🎉 Database schema updated successfully!');

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
