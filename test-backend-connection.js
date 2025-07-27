const http = require('http');

// Test backend connection
function testBackend() {
    console.log('Testing backend connection...');
    
    const options = {
        hostname: 'localhost',
        port: 8085,
        path: '/',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res.headers)}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Response:', data);
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.end();
}

// Test calendar backend connection
function testCalendarBackend() {
    console.log('\nTesting calendar backend connection...');
    
    const options = {
        hostname: 'localhost',
        port: 8001,
        path: '/api/v1/',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res.headers)}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Response:', data);
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.end();
}

// Run tests
testBackend();
setTimeout(testCalendarBackend, 1000); 