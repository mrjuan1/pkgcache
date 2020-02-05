#!/bin/bash -e

if [ -e cache ]; then
	rm -fv $(find cache|grep '\(\.db$\|APKINDEX\.tar\.gz$\)')
fi

exit 0
