const { execSync } = require('child_process');
const env = {
    ...process.env,
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/maintenance_test_db',
    NODE_ENV: 'test'
};
console.log('Running integration tests...');
try {
    execSync('npx.cmd jest --config jest.config.integration.js --runInBand', { stdio: 'inherit', env });
} catch (error) {
    process.exit(1);
}
