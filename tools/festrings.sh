#!/bin/bash
# roughly extract all translation calls used in frontend scripts
grep -ri '__' gulp/res/js/*.js \
	| sed 's/__/\n/g' \
	| awk -F'))' '{ print $1 }' \
	| grep -Po "(?<=')[^',]+(?=')" \
	| sort \
	| uniq \
	| awk '{ print "\""$0"\"""," }'

#	| awk -F'__' '{ print $2 }' \
