# The start of the code!
FROM node:alpine

# Metadata labels
LABEL maintainer="Github: honrot" \
      description="Chat server with command support using WebSocket" \
      cohort="21" \
      animal="Artic_Snow_Hare"

# App Directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set port environment variable
ENV PORT=8080

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]