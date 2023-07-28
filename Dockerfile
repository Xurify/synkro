# Use an official Node.js runtime as the base image
FROM node:14-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies, ignoring scripts for now
RUN npm install --ignore-scripts
RUN prisma generate

# Print the contents of the working directory to debug
RUN ls -la

# Print the contents of the 'server/src' directory to debug
RUN ls -la ./server/src

# Print the contents of the 'shared' directory to debug
RUN ls -la ./shared

# Copy the server code to the working directory
COPY tsconfig.json ./
COPY server/src ./server/src

# Copy the shared code to the working directory
COPY shared ./shared

# Expose the port on which the server will run
EXPOSE 3000

# Print a message during the build process
RUN echo "Building the server..."

# Build the TypeScript code using tsc with diagnostics
RUN npx tsc --diagnostics

# Print a message after the build process
RUN echo "Build completed."

# Start the application
CMD ["node", "./dist/app.js"]
