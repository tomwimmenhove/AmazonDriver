#!/usr/bin/env bash

cd "$(dirname "${BASH_SOURCE[0]}")"

if [ -f .env ]; then
	  source .env
fi

npm run update 15 50 100 480 3600 100

