'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = ''; // 👈 apni Anthropic key yahan daalo
const PORT = 3000;

const server = http.createServer((req, res) => {

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // index.html serve karo
  if (req.method === 'GET' && req.url === '/') {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // Chat API proxy
  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => {

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => { data += chunk.toString(); });
        apiRes.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data);
        });
      });

      apiReq.on('error', (err) => {
        res.writeHead(500);
        res.end(JSON.stringify({ error: { message: err.message } }));
      });

      apiReq.write(body);
      apiReq.end();
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('Server chal raha hai: http://localhost:' + PORT);
});