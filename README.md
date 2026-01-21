# lab3-Docker-Assignment - ChatServerCommands - Upgraded WebSocket Chat Application

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

## Docker Compose Deployment

This project includes a `docker-compose.yaml` file that deploys two services with multiple replicas for high availability and load distribution.

### Architecture
- **Service 1**: 3 replicas accessible on port 3000
- **Service 2**: 2 replicas accessible on port 3001
- Both services use the `lab2_assignment` Docker image
- Services are connected via a custom bridge network

### Required Docker Commands

#### 1. Deploy the stack
```bash
docker-compose up -d
```

#### 2. Scale the first service to 7 instances/replicas
```bash
docker-compose up -d --scale chat-service-1=7
```

#### 3. Remove the stack and delete containers
```bash
docker-compose down
```

### Additional Management Commands

#### View running services
```bash
docker-compose ps
```

#### View logs for all services
```bash
docker-compose logs
```

#### View logs for specific service
```bash
docker-compose logs chat-service-1
```

#### Scale services individually
```bash
# Scale service 1 to 5 replicas
docker-compose up -d --scale chat-service-1=5

# Scale service 2 to 4 replicas
docker-compose up -d --scale chat-service-2=4
```

#### Stop and restart services
```bash
# Stop all services
docker-compose stop

# Start all services
docker-compose start

# Restart all services
docker-compose restart
```

#### Remove specific services
```bash
# Stop and remove containers but keep the network and volumes
docker-compose down

# Stop and remove everything including networks and volumes
docker-compose down --volumes --remove-orphans
```

