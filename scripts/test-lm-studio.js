#!/usr/bin/env node

/**
 * LM Studio Connection Test Script
 * 
 * This script helps verify that your LM Studio installation is properly configured
 * and accessible for the Local AI Fiesta application.
 */

const https = require('https');
const http = require('http');

const DEFAULT_URL = 'http://localhost:1234';
const TEST_ENDPOINT = '/v1/models';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const options = {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = client.get(url + TEST_ENDPOINT, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: data, parseError: true });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testConnection(baseUrl = DEFAULT_URL) {
  console.log('🔍 Testing LM Studio Connection...');
  console.log(`📡 URL: ${baseUrl}${TEST_ENDPOINT}`);
  console.log('⏳ Please wait...\n');

  try {
    const result = await makeRequest(baseUrl);
    
    if (result.status === 200) {
      console.log('✅ Connection successful!');
      console.log(`📊 Status: ${result.status}`);
      
      if (result.data && result.data.data) {
        console.log(`🤖 Found ${result.data.data.length} model(s):`);
        result.data.data.forEach((model, index) => {
          console.log(`   ${index + 1}. ${model.id}`);
        });
      } else {
        console.log('⚠️  No models found. Please load at least one model in LM Studio.');
      }
      
      console.log('\n🎉 Your LM Studio setup is ready!');
      console.log('💡 You can now use the Local AI Fiesta application.');
      
    } else {
      console.log(`❌ Connection failed with status: ${result.status}`);
      console.log('📝 Response:', result.data);
    }
    
  } catch (error) {
    console.log('❌ Connection failed!');
    console.log('📝 Error:', error.message);
    
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure LM Studio is running');
    console.log('2. Go to LM Studio → Developer tab');
    console.log('3. Click "Start Server"');
    console.log('4. Verify the server address matches:', baseUrl);
    console.log('5. Check that your firewall allows the connection');
    console.log('6. Try restarting LM Studio');
  }
}

// Get URL from command line argument or use default
const url = process.argv[2] || DEFAULT_URL;

console.log('🎭 Local AI Fiesta - LM Studio Connection Test\n');
testConnection(url);
