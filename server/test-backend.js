// Script to test backend API connection
const https = require('https');

const API_URL = process.env.VITE_API_URL || 'https://claude-backend-latest.onrender.com';

console.log(`Testing connection to: ${API_URL}\n`);

// Test health endpoint
const testEndpoint = (path) => {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_URL);

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        }).on('error', reject);
    });
};

async function testBackend() {
    try {
        console.log('1. Testing /api/health...');
        const health = await testEndpoint('/api/health');
        console.log(`   Status: ${health.status}`);
        console.log(`   Response: ${health.body}\n`);

        console.log('2. Testing /api/csrf-token...');
        const csrf = await testEndpoint('/api/csrf-token');
        console.log(`   Status: ${csrf.status}`);
        console.log(`   Response: ${csrf.body.substring(0, 100)}...\n`);

        console.log('✅ Backend is reachable');
    } catch (error) {
        console.error('❌ Backend connection failed:', error.message);
        console.error('\nPossible causes:');
        console.error('- Render service is down or restarting');
        console.error('- Network connectivity issue');
        console.error('- Backend crashed due to recent changes');
    }
}

testBackend();
