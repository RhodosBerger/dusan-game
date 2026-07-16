# packages/babylon-sovereign/Dockerfile
FROM node:22-alpine AS build

WORKDIR /app

# Copy dependency manifests first to preserve cache layers (Rule 4 compliance)
COPY package.json yarn.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/client/package.json ./packages/client/
COPY packages/server/package.json ./packages/server/
COPY packages/babylon-sovereign/package.json ./packages/babylon-sovereign/

RUN yarn install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build packages
RUN yarn workspace @dusan-game/shared build
RUN yarn workspace @dusan-game/babylon-sovereign build:server

# Production Stage
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app /app
EXPOSE 3005
CMD ["yarn", "workspace", "@dusan-game/babylon-sovereign", "start"]
