# ChatServerCommands - Upgraded WebSocket Chat Application

Real-time chat server with all the bells and whistles. Has commands for private messaging, user management, and admin stuff. If you just want basic chat, use the regular `ChatServer` instead.

## Features

### Basic Chat Stuff
- Each client gets a unique ID
- Welcome messages when people join
- Notifications for joins/leaves
- Messages broadcast to everyone
- Everything logged to `chat.log`
- Handles disconnects cleanly

### Commands
- `/w username message` - Send private messages
- `/username newname` - Change your display name
- `/clientlist` - See who's online
- `/kick username password` - Boot someone (admin only)
- `/clear password` - Clear the chat log (admin only)
- `/help` - Show available commands

### Client
- Command-line interface
- Real-time messaging
- Connection monitoring
- Input validation
- Command hints

## Setup

1. **Install dependencies**
   ```bash
   cd ChatServerCommands
   npm install
   ```

2. **Start server**
   ```bash
   node server.js
   ```
   Runs on `ws://localhost:8080`

3. **Connect clients**
   ```bash
   node client.js
   ```
   Open multiple terminals to test.

## Files

```
ChatServerCommands/
├── server.js          # Main server
├── client.js          # Command-line client  
├── package.json       # Dependencies
├── chat.log           # Chat history
└── README.md          # This file
```

## Tech Stack

- Node.js with WebSockets (ws library)
- File system for logging
- Command-line interface