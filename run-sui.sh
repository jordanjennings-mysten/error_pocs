#!/bin/bash

show_help() {
    echo "Usage: $(basename "$0") [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --bin <path>   Use custom sui binary path (default: sui)"
    echo "  --code         Use local debug binary (/Users/jordanjennings/code/sui/target/debug/sui)"
    echo "  --full         Start with full services (Postgres, Indexer, GraphQL)"
    echo "  --verbose      Enable detailed logs (RUST_LOG=\"off,sui_node=info\")"
    echo "  --help         Show this help message"
}

SUI_BIN=sui
FULL_MODE=false
VERBOSE=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --bin) SUI_BIN="$2"; shift ;;
        --code) SUI_BIN=/Users/jordanjennings/code/sui/target/debug/sui ;;
        --full) FULL_MODE=true ;;
        --verbose) VERBOSE=true ;;
        --help) show_help; exit 0 ;;
        *) echo "Unknown parameter passed: $1"; show_help; exit 1 ;;
    esac
    shift
done

if [ "$VERBOSE" = true ]; then
    export RUST_LOG="debug,sui_node=debug"
fi

if [ "$FULL_MODE" = true ]; then
    $SUI_BIN start \
        --with-faucet \
        --force-regenesis \
        --pg-port 5432 \
        --pg-host localhost \
        --pg-db-name sui \
        --pg-user sui \
        --pg-password sui-password123 \
        --with-graphql=127.0.0.1:9125 \
        --with-indexer
else
    $SUI_BIN start \
        --with-faucet \
        --force-regenesis \
        --with-graphql
fi
