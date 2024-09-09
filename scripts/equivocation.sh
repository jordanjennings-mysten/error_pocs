#!/bin/bash
set -e

echo "warning: assumes your first object is a coin"

export COIN_ID=`sui client objects --json | jq -r ".[0].data.objectId"`

sui client ptb --gas-coin @$COIN_ID --split-coins gas "[1]" \
  --assign new_coins \
  --transfer-objects [new_coins.0] @0xccb8a90ff6ede2012b865873213eb56e6ac5f226a436a7e89965ef94e42fbbca