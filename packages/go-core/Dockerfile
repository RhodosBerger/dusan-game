# packages/go-core/Dockerfile
FROM golang:1.21-alpine AS build

WORKDIR /app

COPY packages/go-core/go.mod ./
# Copy Go source code
COPY packages/go-core/ ./

# Compile Go Core binary
RUN go build -o go-core .

# Production Stage
FROM alpine:latest
WORKDIR /app
COPY --from=build /app/go-core .
EXPOSE 8081
CMD ["./go-core"]
