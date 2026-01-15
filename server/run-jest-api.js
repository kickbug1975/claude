const jest = require('jest');
const path = require('path');

process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/maintenance_test_db';
process.env.NODE_ENV = 'test';

const options = {
    config: path.resolve(__dirname, 'jest.config.integration.js'),
    runInBand: true, // Recommandé pour les tests de base de données
    verbose: true,
};

console.log('Starting integration tests via Jest Node API...');

jest.runCLI(options, [__dirname])
    .then(({ results }) => {
        if (results.success) {
            console.log('Tests passed!');
            process.exit(0);
        } else {
            console.error('Tests failed!');
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('Error running Jest:', error);
        process.exit(1);
    });
