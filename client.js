// Command-line chat client
// Connect to chat server using WebSocket

const WebSocket = require('ws');
const readline = require('readline');

const SERVER_URL = 'ws://localhost:8080';

// Setup command line interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
});

// Connect to server
console.log('Attempting to connect to chat server...');
console.log(`Server: ${SERVER_URL}\n`);

const ws = new WebSocket(SERVER_URL);

// Connection handlers

// Handle connection success
ws.on('open', () => {
    console.log('Connected to chat server!\n');
    console.log('Type your messages and press Enter to send.');
    console.log('Press Ctrl+C to disconnect and exit.\n');
    
    rl.prompt();
});

// Handle incoming messages
ws.on('message', (data) => {
    try {
        const message = data.toString();
        console.log(`\r${message}`);
        rl.prompt();
        
    } catch (error) {
        console.error('Error processing received message:', error);
    }
});

// Handle connection errors
ws.on('error', (error) => {
    console.error('Connection error:', error.message);
    console.error('Make sure the server is running on port 8080');
    process.exit(1);
});

// Handle disconnection
ws.on('close', (code, reason) => {
    console.log('\nDisconnected from server');
    if (reason) {
        console.log(`Reason: ${reason}`);
    }
    console.log('Goodbye!');
    rl.close();
    process.exit(0);
});

// Handle user input

rl.on('line', (input) => {
    const message = input.trim();
    
    if (!message) {
        rl.prompt();
        return;
    }
    
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
    } else {
        console.log('Not connected to server. Cannot send message.');
    }
    
    rl.prompt();
});

// Handle Ctrl+C
rl.on('SIGINT', () => {
    console.log('\nDisconnecting from chat...');
    
    if (ws.readyState === WebSocket.OPEN) {
        ws.close();
    } else {
        rl.close();
        process.exit(0);
    }
});