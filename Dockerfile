# Stage 1: Build TypeScript code
FROM node:14-alpine AS build

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm ci --quiet

# Copy the server code to the working directory
COPY tsconfig.json ./
COPY server ./server

# Copy the shared code to the working directory
COPY shared ./shared

# Build the server
RUN npm run build

# Stage 2: Create production image
FROM node:14-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy only the necessary artifacts from the previous stage
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package*.json ./

# Expose the port on which the server will run
EXPOSE 3000

# Start the application
CMD ["node", "./dist/app.js"]
