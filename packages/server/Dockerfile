# packages/server/Dockerfile
FROM node:22-bookworm-slim AS build

WORKDIR /app

# Install build dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests first to preserve cache layers (Rule 5 compliance)
COPY package.json yarn.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

RUN yarn install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build packages
RUN yarn workspace @dusan-game/shared build
RUN npx prisma generate --schema=packages/server/prisma/schema.prisma

# Production Stage
FROM node:22-bookworm-slim
WORKDIR /app
# Install Python and runtime libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first to cache pip installation layer
COPY --from=build /app/packages/server/requirements.txt ./packages/server/

# Create virtual environment and install requirements
RUN python3 -m venv packages/server/.venv && \
    packages/server/.venv/bin/pip install --upgrade pip && \
    packages/server/.venv/bin/pip install --no-cache-dir -r packages/server/requirements.txt

COPY --from=build /app /app

EXPOSE 3001
CMD ["yarn", "workspace", "@dusan-game/server", "start"]
