/**
 * Quick Backend & CORS Diagnostic Script
 * Run this in browser console at: https://emr-software.netlify.app
 * Or copy entire script and save as: test-cors.js
 */

console.log('🔍 MedCore EMR - Backend Diagnostic Starting...\n');

const BACKEND_URL = 'https://medcore-emr-backend.onrender.com/api';
const FRONTEND_ORIGIN = window.location.origin;

async function testBackendHealth() {
    console.log('1️⃣  Testing Backend Health...');
    try {
        const res = await fetch(`${BACKEND_URL}/health`);
        const data = await res.json();

        console.log('✅ Backend Responding:');
        console.log(`   Status Code: ${res.status}`);
        console.log(`   Response:`, data);
        console.log(`   Access-Control-Allow-Origin: ${res.headers.get('Access-Control-Allow-Origin')}`);

        if (res.status === 200 && res.headers.get('Access-Control-Allow-Origin')) {
            console.log('✅ CORS Headers Present - Backend Ready!\n');
            return true;
        } else {
            console.log('⚠️  Backend responding but CORS headers missing\n');
            return false;
        }
    } catch (err) {
        console.log(`❌ Backend Not Responding: ${err.message}\n`);
        return false;
    }
}

async function testCORSPreflight() {
    console.log('2️⃣  Testing CORS Preflight (OPTIONS)...');
    try {
        const res = await fetch(`${BACKEND_URL}/auth/login`, {
            method: 'OPTIONS',
            headers: {
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type',
                'Origin': FRONTEND_ORIGIN
            }
        });

        console.log('✅ Preflight Response:');
        console.log(`   Status: ${res.status}`);
        console.log(`   Allow-Origin: ${res.headers.get('Access-Control-Allow-Origin')}`);
        console.log(`   Allow-Methods: ${res.headers.get('Access-Control-Allow-Methods')}`);
        console.log(`   Allow-Headers: ${res.headers.get('Access-Control-Allow-Headers')}\n`);

        return res.status === 200 || res.status === 204;
    } catch (err) {
        console.log(`❌ Preflight Failed: ${err.message}\n`);
        return false;
    }
}

async function testLoginEndpoint() {
    console.log('3️⃣  Testing Login Endpoint...');
    try {
        const res = await fetch(`${BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': FRONTEND_ORIGIN
            },
            body: JSON.stringify({
                email: 'demo@medcore.in',
                password: 'demo123'
            })
        });

        const data = await res.json();

        if (data.success && data.token) {
            console.log('✅ Login Test Successful:');
            console.log(`   Token: ${data.token.substring(0, 20)}...`);
            console.log(`   User: ${data.user?.email || 'N/A'}`);
            console.log(`   CORS Allow-Origin: ${res.headers.get('Access-Control-Allow-Origin')}\n`);
            return { success: true, token: data.token };
        } else {
            console.log('⚠️  Login returned error:');
            console.log(`   Error: ${data.error || 'Unknown error'}\n`);
            return { success: false };
        }
    } catch (err) {
        console.log(`❌ Login Request Failed: ${err.message}\n`);
        return { success: false };
    }
}

async function checkBrowserConsoleErrors() {
    console.log('4️⃣  Browser Environment:');
    console.log(`   Frontend URL: ${FRONTEND_ORIGIN}`);
    console.log(`   Backend URL: ${BACKEND_URL}`);
    console.log(`   User Agent: ${navigator.userAgent.substring(0, 50)}...`);
    console.log(`   Online: ${navigator.onLine ? '✅ Yes' : '❌ No'}\n`);
}

// ════════════════════════════════════════════════════════════
//  RUN ALL TESTS
// ════════════════════════════════════════════════════════════

async function runFullDiagnostic() {
    checkBrowserConsoleErrors();

    const healthOk = await testBackendHealth();
    const preflightOk = await testCORSPreflight();
    const loginResult = await testLoginEndpoint();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 DIAGNOSTIC SUMMARY:\n');

    if (healthOk && preflightOk && loginResult.success) {
        console.log('✅ ALL SYSTEMS OPERATIONAL');
        console.log('\n✨ You can now login at: https://emr-software.netlify.app');
        console.log('   Email: demo@medcore.in');
        console.log('   Password: demo123\n');
    } else {
        console.log('⚠️  ISSUES DETECTED:');
        console.log(`   Backend Health: ${healthOk ? '✅' : '❌'}`);
        console.log(`   CORS Preflight: ${preflightOk ? '✅' : '❌'}`);
        console.log(`   Login Endpoint: ${loginResult.success ? '✅' : '❌'}`);
        console.log('\n📍 Next Steps:');
        console.log('   1. Wait 5-10 minutes for Render redeploy');
        console.log('   2. Clear browser cache (Ctrl+Shift+Delete)');
        console.log('   3. Try this diagnostic again');
        console.log('   4. If still failing, check: https://dashboard.render.com\n');
    }

    console.log('═══════════════════════════════════════════════════════════\n');
}

// Execute diagnostic
runFullDiagnostic().catch(err => {
    console.error('🔴 Diagnostic Failed:', err);
});
