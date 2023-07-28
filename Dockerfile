# Use an official Node.js runtime as the base image
FROM node:14-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY server/package*.json ./

# Install the dependencies
RUN apk add --no-cache bash git openssh && \
    npm install

# Copy the server code to the working directory
COPY server/tsconfig.json ./
COPY server/src ./src

# Copy the shared code to the working directory
COPY shared ./shared

# Expose the port on which the server will run
EXPOSE 3000

# Build the server
RUN npm run build

# Start the application
CMD ["node", "./dist/app.js"]