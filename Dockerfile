FROM node:18.16.0-alpine as base

# Set the working directory to the server folder
WORKDIR /server

# Add package file
COPY package.json ./

# Install deps
RUN yarn install

# Copy source
COPY src ./src
COPY types ./types
COPY constants ./constants
COPY tsconfig.json ./

# Build dist
RUN yarn build

# Start production image build
FROM node:18.16.0-alpine

# Set the working directory to the server folder
WORKDIR /server

# Copy node modules and build directory
COPY --from=base /server/node_modules ./node_modules
COPY --from=base /server/dist ./dist

# Expose port 8000
EXPOSE 8000

# Start the application
CMD ["node", "dist/app.js"]