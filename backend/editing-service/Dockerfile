# Use official Node.js runtime
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install necessary OS dependencies
RUN apt-get update && apt-get install -y \
  build-essential \
  && rm -rf /var/lib/apt/lists/*

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Set environment variable for Cloud Run
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the compiled app
CMD ["node", "dist/index.js"]
