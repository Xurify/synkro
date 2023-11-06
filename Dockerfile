FROM node:18.16.0-alpine as base

# Set working directory
WORKDIR /server

# Add package file
COPY package.json ./
COPY yarn.lock ./

# Install deps
RUN yarn install

# Copy source
COPY src ./src
COPY tsconfig.json ./tsconfig.json

# Build dist
RUN yarn build

# Start production image build
FROM node:18.16.0-alpine

# Set working directory
WORKDIR /server

# Copy node modules and build directory
COPY --from=base /server/node_modules ./node_modules
COPY --from=base /server/dist ./dist

# Expose port 8000
EXPOSE 8000
CMD ["node", "dist/app.js"]