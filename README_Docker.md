# Docker Lab Assignment - Chat Server

## Project Description
WebSocket-based chat server with command support, containerized using Docker.

## Docker Commands

### Build Command
```bash
docker build -t lab2_assignment .
```

### Run Command (with -P option for automatic port mapping)
```bash
docker run -P --name chat_server lab2_assignment
```

### Run Command (with manual port mapping)
```bash
docker run -p 8080:8080 --name chat_server lab2_assignment
```

### Additional Docker Commands
```bash
# View running containers
docker ps

# View container logs
docker logs chat_server

# Stop container
docker stop chat_server

# Remove container
docker rm chat_server
```

## How to Access the Website
- **URL**: `http://localhost:8080`
- **WebSocket Connection**: `ws://localhost:8080`

### Testing the Chat Server
1. Build and run the container using commands above
2. Open a WebSocket client or browser developer console
3. Connect to `ws://localhost:8080`
4. Send messages to test the chat functionality

### Available Chat Commands
- `/help` - Show available commands
- `/users` - List connected users
- `/clear` - Clear chat history
- `/admin [password]` - Enter admin mode
- `/kick [username]` - Kick a user (admin only)
- `/ban [username]` - Ban a user (admin only)