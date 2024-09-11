#!/bin/bash

#export RUST_LOG="off,sui_node=info"

export SUI_BIN=/Users/jordanjennings/code/sui/target/debug/sui
#export SUI_BIN=sui

$SUI_BIN start \
    --with-faucet \
    --force-regenesis \
    --pg-port 5432 \
    --pg-host localhost \
    --pg-db-name sui \
    --pg-user sui \
    --pg-password sui-password123 \
    --with-graphql=127.0.0.1:9125
