#!/bin/bash
# run the script with the application name and semantic version as arguments
# Example: individual-build.sh app-name 1.0.0
APP=$1
SEMVER=$2
COMMIT_HASH=$(git rev-parse --short HEAD)
docker build -t arindamgb/request-inspector:${APP}-${SEMVER}-${COMMIT_HASH} -t arindamgb/request-inspector:${APP}-${COMMIT_HASH} -t arindamgb/request-inspector:${APP}-latest -f ${APP}/Dockerfile ${APP}
docker push arindamgb/request-inspector --all-tags