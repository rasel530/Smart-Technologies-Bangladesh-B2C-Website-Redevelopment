#!/bin/bash

# Run diagnostic script inside Docker container
docker exec -it smarttech_backend node diagnose-export.js $1
