// Monitor Netlify deployment with build check
const https = require('https');

const SITE_URL = 'https://lighthearted-brioche-f591dc.netlify.app';
const CHECK_INTERVAL = 15000; // 15 seconds
const MAX_ATTEMPTS = 20; // 5 minutes

let attempts = 0;
let lastDate = null;

function checkSite() {
    return new Promise((resolve, reject) => {
        https.get(SITE_URL, (res) => {
            resolve({
                status: res.statusCode,
                date: res.headers.date
            });
        }).on('error', reject);
    });
}

async function monitor() {
    console.log('🔍 Monitoring Netlify deployment...\n');
    console.log(`Site: ${SITE_URL}`);
    console.log(`Waiting for new deployment...\n`);

    const interval = setInterval(async () => {
        attempts++;

        try {
            const result = await checkSite();
            const elapsed = Math.round(attempts * CHECK_INTERVAL / 1000);

            console.log(`[${elapsed}s] Check ${attempts}/${MAX_ATTEMPTS}`);
            console.log(`  Status: ${result.status}`);
            console.log(`  Date: ${result.date}`);

            if (!lastDate) {
                lastDate = result.date;
                console.log('  📌 Baseline set\n');
            } else if (result.date !== lastDate) {
                console.log('\n✅ NEW DEPLOYMENT DETECTED!');
                console.log(`  Previous: ${lastDate}`);
                console.log(`  Current:  ${result.date}`);
                console.log(`\nDeployment successful after ${elapsed} seconds`);
                clearInterval(interval);
                process.exit(0);
            } else {
                console.log('  ⏳ No change yet\n');
            }

            if (attempts >= MAX_ATTEMPTS) {
                console.log('\n⏱️ Max time reached. Check Netlify dashboard.');
                clearInterval(interval);
                process.exit(1);
            }
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}\n`);
        }
    }, CHECK_INTERVAL);
}

monitor();
