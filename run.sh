#!/bin/sh -e

# cd /your/pkgcache/path/here

./clear-indices.sh
screen -dmS pkgcache ./index.js
