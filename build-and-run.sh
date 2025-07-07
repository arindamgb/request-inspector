#!/bin/bash
# This script runs the request-inspector project by building the Docker images locally.
docker-compose -f docker-compose-with-build.yml up --build -d
