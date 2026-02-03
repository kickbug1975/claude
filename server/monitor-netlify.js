// Script to monitor Netlify deployment status
const https = require('https');

const NETLIFY_SITE_URL = 'https://claude-frontend.netlify.app';
const CHECK_INTERVAL = 10000; // 10 seconds
const MAX_ATTEMPTS = 30; // 5 minutes max

let attempts = 0;

function checkDeployment() {
    return new Promise((resolve, reject) => {
        https.get(NETLIFY_SITE_URL, (res) => {
            resolve({
                status: res.statusCode,
                headers: res.headers
            });
        }).on('error', reject);
    });
}

async function monitor() {
    console.log('🔍 Monitoring Netlify deployment...\n');
    console.log(`Site: ${NETLIFY_SITE_URL}`);
    console.log(`Checking every ${CHECK_INTERVAL / 1000} seconds\n`);

    const startTime = Date.now();

    const interval = setInterval(async () => {
        attempts++;

        try {
            const result = await checkDeployment();
            const elapsed = Math.round((Date.now() - startTime) / 1000);

            console.log(`[${elapsed}s] Attempt ${attempts}/${MAX_ATTEMPTS}`);
            console.log(`  Status: ${result.status}`);
            console.log(`  Date: ${result.headers.date}`);

            if (result.status === 200) {
                console.log('\n✅ Deployment successful!');
                console.log(`Total time: ${elapsed} seconds`);
                clearInterval(interval);
                process.exit(0);
            }

            if (attempts >= MAX_ATTEMPTS) {
                console.log('\n⏱️ Max attempts reached. Deployment may still be in progress.');
                console.log('Check Netlify dashboard for details.');
                clearInterval(interval);
                process.exit(1);
            }
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
        }
    }, CHECK_INTERVAL);
}

monitor();
