const https = require('https');
const http = require('http');

function testAdminRedirect() {
  const baseUrl = 'https://grace.demo.b1.church';
  const adminPath = '/admin';
  const fullUrl = baseUrl + adminPath;
  
  console.log('Testing admin redirect behavior...');
  console.log('URL:', fullUrl);
  
  const options = {
    method: 'GET',
    // Don't follow redirects automatically
    followRedirect: false,
    timeout: 10000
  };
  
  const req = https.request(fullUrl, options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    
    if (res.statusCode >= 300 && res.statusCode < 400) {
      console.log('Redirect Location:', res.headers.location);
      
      if (res.headers.location && res.headers.location.includes('/login')) {
        if (res.headers.location.includes('returnUrl') && res.headers.location.includes('admin')) {
          console.log('✅ SUCCESS: Admin page redirects to login with returnUrl');
        } else {
          console.log('❌ FAIL: Redirect to login but missing returnUrl or admin parameter');
        }
      } else {
        console.log('❌ FAIL: Does not redirect to login page');
      }
    } else if (res.statusCode === 200) {
      console.log('❌ FAIL: Admin page accessible without authentication');
    } else {
      console.log('❓ Unexpected status code:', res.statusCode);
    }
    
    // Read the response body to see if it contains redirect logic
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      if (body.includes('window.location') || body.includes('router.push') || body.includes('/login')) {
        console.log('✅ Response contains client-side redirect logic');
      }
    });
  });
  
  req.on('error', (err) => {
    console.error('Request error:', err.message);
  });
  
  req.on('timeout', () => {
    console.error('Request timeout');
    req.destroy();
  });
  
  req.end();
}

testAdminRedirect();