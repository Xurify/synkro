# Use an official Node.js runtime as the base image
FROM node:14-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the server code to the working directory
COPY tsconfig.json ./
COPY server/src ./src

# Copy the shared code to the working directory
COPY shared ./shared

# Expose the port on which the server will run
EXPOSE 3000

RUN echo "FIRST_CHECK"

# Check the contents of the working directory
RUN ls -la

# Build the server
RUN npm run build

RUN echo "SECOND_CHECK"

# Check the contents of the 'dist' directory (assuming that's where the build output goes)
RUN ls -la ./dist

# Start the application
CMD ["node", "./dist/app.js"]
