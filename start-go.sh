#!/bin/bash
export PATH=$PATH:/opt/go/bin
echo "[START] Spúšťam Go Core na porte 8081 s Go $(go version)..."
cd packages/go-core
go run main.go
