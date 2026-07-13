# packages/server/Dockerfile
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests first to preserve cache layers (Rule 5 compliance)
COPY package.json yarn.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

RUN yarn install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build packages
RUN yarn workspace @dusan-game/shared build

# Production Stage
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app /app
EXPOSE 3001
CMD ["yarn", "workspace", "@dusan-game/server", "start"]
