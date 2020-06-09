#!/bin/sh -e

# cd /your/pkgcache/path/here

if [ -e cache ]; then
	rm -Rfv $(find cache|grep '\(\.db$\|/APKINDEX\.tar\.gz$\|releases\|/dists/\)')
fi
