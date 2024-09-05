#!/bin/bash

echo package $1
echo function $2

sui client call --package $1 --module error_pocs --function $2