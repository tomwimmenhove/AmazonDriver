#!/usr/bin/env bash
# amazon-logs.sh
#
# Usage:
#   amazon-logs.sh apiserver   # interactive view of api server logs
#   amazon-logs.sh acquire     # interactive view of data-acquire logs

SERVICE_NAME=""
case "$1" in
  apiserver) SERVICE_NAME="amazon-apiserver.service" ;;
  acquire)   SERVICE_NAME="amazon-acquire.service"   ;;
  *)
    echo "Usage: $0 {apiserver|acquire}"
    exit 1
    ;;
esac

journalctl -u "$SERVICE_NAME" -o cat -f | \
	sed -ue '/^{/!{
      	s/\\/\\\\/g
    	s/"/\\"/g
  	s/.*/"&"/}' | \
	jq -c '.'

#  	s/.*/{"message":"&"}/}' | \
