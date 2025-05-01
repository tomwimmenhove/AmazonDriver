#!/usr/bin/env bash

if [ -f .env ]; then
	  source .env
fi

set -euo pipefail

LOG_DIR="./logs"
mkdir -p "$LOG_DIR"

NOW=$(date -u +"%Y-%m-%d_%H-%M-%S")
LOGFILE="$LOG_DIR/$NOW.log.json"

./node_modules/.bin/npm-run-all \
	--silent \
	--parallel start-apiserver start-acquire \
	| tee -a "$LOGFILE" | jq -c .

exit ${PIPESTATUS[0]}
