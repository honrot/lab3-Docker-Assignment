// Chat server with command support
// Handles WebSocket connections and chat commands

const WebSocket = require('ws');
const fs = require('fs');

// Server config
const PORT = 8080;
const LOG_FILE = 'chat.log';
const ADMIN_PASSWORD = 'supersecretpw';

// Client tracking
// Connected clients
const clients = new Map();
let clientIdCounter = 1;
// Username lookup for commands
const clientsByUsername = new Map();

// Utility functions

// Log messages to console and file
function logMessage(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    console.log(logEntry.trim());
    fs.appendFileSync(LOG_FILE, logEntry);
}

// Send message to all clients except sender
function broadcastMessage(message, excludeClient = null) {
    clients.forEach((clientInfo, client) => {
        if (client === excludeClient) return;
        
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Remove client and cleanup
function removeClient(client) {
    const clientInfo = clients.get(client);
    if (clientInfo) {
        clientsByUsername.delete(clientInfo.username);
        clients.delete(client);
        return clientInfo;
    }
    return null;
}

// Command functions

// Send private message between users
function sendPrivateMessage(senderWs, targetUsername, message) {
    const senderInfo = clients.get(senderWs);
    const targetWs = clientsByUsername.get(targetUsername);
    
    if (!targetWs || targetWs.readyState !== WebSocket.OPEN) {
        senderWs.send(`Error: User '${targetUsername}' not found or not connected.`);
        return false;
    }
    
    const whisperMessage = `[WHISPER from ${senderInfo.username}]: ${message}`;
    targetWs.send(whisperMessage);
    
    senderWs.send(`Whisper sent to ${targetUsername}: ${message}`);
    
    logMessage(`WHISPER: ${senderInfo.username} -> ${targetUsername}: ${message}`);
    return true;
}

// Change user's display name
function changeUsername(client, newUsername) {
    const clientInfo = clients.get(client);
    const oldUsername = clientInfo.username;
    
    if (newUsername === oldUsername) {
        client.send(`Error: Your username is already '${newUsername}'.`);
        return false;
    }
    
    if (clientsByUsername.has(newUsername)) {
        client.send(`Error: Username '${newUsername}' is already taken.`);
        return false;
    }
    
    // Update username mappings
    clientsByUsername.delete(oldUsername);
    clientsByUsername.set(newUsername, client);
    clientInfo.username = newUsername;
    
    client.send(`Your username has been changed from '${oldUsername}' to '${newUsername}'.`);
    
    const nameChangeMessage = `${oldUsername} changed their name to ${newUsername}.`;
    broadcastMessage(nameChangeMessage, client);
    
    logMessage(`USERNAME CHANGE: ${oldUsername} -> ${newUsername}`);
    return true;
}

// Kick user from server (admin only)
function kickUser(adminClient, targetUsername, password) {
    const adminInfo = clients.get(adminClient);
    
    if (password !== ADMIN_PASSWORD) {
        adminClient.send('Error: Incorrect admin password.');
        return false;
    }
    
    if (targetUsername === adminInfo.username) {
        adminClient.send('Error: You cannot kick yourself.');
        return false;
    }
    
    const targetWs = clientsByUsername.get(targetUsername);
    if (!targetWs || targetWs.readyState !== WebSocket.OPEN) {
        adminClient.send(`Error: User '${targetUsername}' not found or not connected.`);
        return false;
    }
    
    targetWs.send('You have been kicked from the chat by an administrator.');
    
    const kickMessage = `${targetUsername} has been kicked from the chat.`;
    broadcastMessage(kickMessage, targetWs);
    
    logMessage(`KICK: ${adminInfo.username} kicked ${targetUsername}`);
    
    setTimeout(() => {
        targetWs.close(1000, 'Kicked by administrator');
    }, 100);
    
    return true;
}

// Show list of connected users
function sendClientList(requesterClient) {
    const usernames = Array.from(clientsByUsername.keys());
    const clientListMessage = `Connected users (${usernames.length}): ${usernames.join(', ')}`;
    requesterClient.send(clientListMessage);
}

// Show available commands
function sendHelpMessage(client) {
    const helpMessage = [
        '=== CHAT COMMANDS HELP ===',
        '',
        '/help or /commands - Show this help message',
        '/w <username> <message> - Send a private whisper to another user',
        '/username <newname> - Change your username',
        '/kick <username> <password> - Kick a user (requires admin password)',
        '/clientlist or /list or /users - Show all connected users',
        '/clear <password> - Clear the chat log (requires admin password)',
        '',
        'Examples:',
        '  /w john Hello there!',
        '  /username MyNewName',
        '  /clientlist',
        '  /clear password',
        '',
        'Note: Commands are case-insensitive'
    ].join('\n');
    
    client.send(helpMessage);
}

// Clear chat log with password
function clearChatLog(password) {
    if (password !== 'password') {
        return false;
    }
    
    try {
        fs.writeFileSync(LOG_FILE, '');
        logMessage('=== CHAT LOG CLEARED ===');
        return true;
    } catch (error) {
        console.error('Error clearing chat log:', error);
        return false;
    }
}

// Handle chat commands
function handleCommand(client, message) {
    const parts = message.split(' ');
    const command = parts[0].toLowerCase();
    const clientInfo = clients.get(client);
    
    switch (command) {
        case '/w':
        case '/whisper':
            if (parts.length < 3) {
                client.send('Error: Whisper usage: /w <username> <message>');
                return true;
            }
            const targetUser = parts[1];
            const whisperMsg = parts.slice(2).join(' ');
            sendPrivateMessage(client, targetUser, whisperMsg);
            return true;
            
        case '/username':
            if (parts.length !== 2) {
                client.send('Error: Username usage: /username <newname>');
                return true;
            }
            const newUsername = parts[1];
            // Basic username validation
            if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
                client.send('Error: Username can only contain letters, numbers, underscores, and hyphens.');
                return true;
            }
            if (newUsername.length < 2 || newUsername.length > 20) {
                client.send('Error: Username must be between 2 and 20 characters.');
                return true;
            }
            changeUsername(client, newUsername);
            return true;
            
        case '/kick':
            if (parts.length !== 3) {
                client.send('Error: Kick usage: /kick <username> <password>');
                return true;
            }
            const userToKick = parts[1];
            const adminPassword = parts[2];
            kickUser(client, userToKick, adminPassword);
            return true;
            
        case '/clientlist':
        case '/list':
        case '/users':
            if (parts.length !== 1) {
                client.send('Error: Client list usage: /clientlist');
                return true;
            }
            sendClientList(client);
            return true;
            
        case '/help':
        case '/commands':
            if (parts.length !== 1) {
                client.send('Error: Help usage: /help');
                return true;
            }
            sendHelpMessage(client);
            return true;
            
        case '/clear':
            if (parts.length !== 2) {
                client.send('Error: Clear usage: /clear <password>');
                return true;
            }
            
            const clearPassword = parts[1];
            const cleared = clearChatLog(clearPassword);
            
            if (cleared) {
                const currentUsername = clientInfo.username;
                client.send('Chat log cleared successfully!');
                broadcastMessage(`${currentUsername} cleared the chat log.`, client);
                logMessage(`COMMAND: ${currentUsername} cleared chat log`);
            } else {
                client.send('Error: Incorrect password for clearing chat log.');
                const currentUsername = clientInfo.username;
                logMessage(`COMMAND FAILED: ${currentUsername} attempted to clear log with wrong password`);
            }
            return true;
            
        default:
            client.send(`Error: Unknown command '${command}'. Type /help to see available commands.`);
            return true;
    }
}

// Create WebSocket server
const wss = new WebSocket.Server({ 
    port: PORT,
    callback: () => {
        console.log(`Chat server started on port ${PORT}`);
        console.log(`Logging to: ${LOG_FILE}`);
        console.log(`Ready for client connections...`);
        console.log(`Connect clients using: node client.js\n`);
        
        logMessage('=== CHAT SERVER STARTED ===');
    }
});

// Handle new connections
wss.on('connection', (ws, req) => {
    const clientId = `Client${clientIdCounter++}`;
    
    const clientInfo = {
        id: clientId,
        username: clientId,
        connectedAt: new Date().toISOString(),
        ip: req.socket.remoteAddress
    };
    
    clients.set(ws, clientInfo);
    clientsByUsername.set(clientId, ws);
    
    // Welcome new client
    const welcomeMessage = `Welcome to the chat, ${clientId}! You are now connected.`;
    ws.send(welcomeMessage);
    
    // Notify others
    const joinNotification = `${clientId} has joined the chat!`;
    broadcastMessage(joinNotification, ws);
    
    // Log connection
    const connectionLog = `CLIENT CONNECTED: ${clientId} from ${clientInfo.ip}`;
    logMessage(connectionLog);
    
    console.log(`${clientId} connected (Total clients: ${clients.size})`);
    
    // Handle messages
    ws.on('message', (data) => {
        try {
            const message = data.toString().trim();
            
            if (!message) return;
            
            // Check for commands
            if (message.startsWith('/')) {
                handleCommand(ws, message);
                return;
            }
            
            // Broadcast regular message
            const senderInfo = clients.get(ws);
            const formattedMessage = `${senderInfo.username}: ${message}`;
            
            broadcastMessage(formattedMessage, ws);
            
            logMessage(`MESSAGE: ${formattedMessage}`);
            console.log(`${formattedMessage}`);
            
        } catch (error) {
            console.error(`Error processing message from ${clientId}:`, error);
        }
    });
    
    // Handle disconnect
    ws.on('close', () => {
        const disconnectedClient = removeClient(ws);
        
        if (disconnectedClient) {
            const leaveNotification = `${disconnectedClient.id} has left the chat.`;
            broadcastMessage(leaveNotification);
            
            const disconnectionLog = `CLIENT DISCONNECTED: ${disconnectedClient.id}`;
            logMessage(disconnectionLog);
            
            console.log(`${disconnectedClient.id} disconnected (Remaining clients: ${clients.size})`);
        }
    });
    
    // Handle errors
    ws.on('error', (error) => {
        console.error(`WebSocket error for ${clientId}:`, error);
        logMessage(`ERROR: ${clientId} - ${error.message}`);
    });
});

// Server error handling
wss.on('error', (error) => {
    console.error('Server error:', error);
    logMessage(`SERVER ERROR: ${error.message}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down chat server...');
    logMessage('=== CHAT SERVER SHUTDOWN ===');
    
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send('Server is shutting down. Goodbye!');
            client.close();
        }
    });
    
    wss.close(() => {
        console.log('Server shutdown complete.');
        process.exit(0);
    });
});