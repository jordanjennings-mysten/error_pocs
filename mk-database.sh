#!/bin/bash

psql -d postgres -c "CREATE DATABASE sui;"
psql -d postgres -c "CREATE USER sui WITH PASSWORD 'sui-password123';"
psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE sui TO sui;"