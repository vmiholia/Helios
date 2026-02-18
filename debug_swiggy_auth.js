const https = require('https');

// MCP JSON-RPC Initialize Request
const initRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
        protocolVersion: "0.1.0",
        capabilities: {},
        clientInfo: {
            name: "manual-debug-client",
            version: "1.0.0"
        }
    }
};

const data = JSON.stringify(initRequest);
const url = new URL('https://mcp.swiggy.com/food?message=' + encodeURIComponent(data));

console.log('Fetching from:', url.toString());

const req = https.request(url, {
    method: 'GET',
    headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
    }
}, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Body:', body);
        try {
            const json = JSON.parse(body);
            // If we get a login URL in the error or body, print it clearly
            if (json.loginUrl || (json.error && json.error.data && json.error.data.loginUrl)) {
                console.log("\nFOUND LOGIN URL:", json.loginUrl || json.error.data.loginUrl);
            }
        } catch (e) {
            // Not JSON
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
