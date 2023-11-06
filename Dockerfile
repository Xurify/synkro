FROM node:18.16.0-alpine as base

# Add package file
COPY server/package.json ./
COPY server/yarn.lock ./

# Install deps
RUN yarn install

# Copy source
COPY server/src ./src
COPY src/types ./src/types
COPY src/constants ./src/constants
COPY tsconfig.json ./tsconfig.json

# Build dist
RUN yarn build

# Start production image build
FROM node:18.16.0-alpine

# Copy node modules and build directory
COPY --from=base server/node_modules ./node_modules
COPY --from=base server/dist /dist

# Expose port 8000
EXPOSE 8000
CMD ["node", "dist/app.js"]