#!/bin/bash
# roughly extract all translation calls used in pug view file into key: value
grep -ri '__' $1 \
	| sed 's/__/\n/g' \
	| grep -Po "(?<=')[^',]+(?=')" \
	| awk '{ print "\""$0"\""": ""\""$0"\"""," }'
