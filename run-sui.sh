#!/bin/bash

export USE_INDEXER=0
#export RUST_LOG="off,sui_node=info"

# edit config file to enable port on macos, not sure if this can talk to the socket file
# /opt/homebrew/var/postgresql@14/postgresql.conf

export SUI_BIN=/Users/jordanjennings/code/sui/target/debug/sui
#export SUI_BIN=sui

# make pg args optional rewrite above

export args=""

# not equal
if [ $USE_INDEXER -eq 0 ]; then
  $SUI_BIN start \
   --with-faucet \
   --force-regenesis
else
 $SUI_BIN start \
   --with-faucet \
   --force-regenesis \
   --pg-port 5432 \
   --pg-host localhost \
   --pg-db-name sui \
   --pg-user sui \
   --pg-password sui-password123 \
   --with-graphql=127.0.0.1:9125
fi
