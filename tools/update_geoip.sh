#!/bin/bash
#
# Script to update geoip database for nginx/jschan. Can be added as a cronjob
#

#go to geoip folder
cd /usr/share/GeoIP
#move the existing db to a .bak just in case
mv GeoIP.dat GeoIP.dat.bak
#try and download the DBIP database
wget --retry-connrefused https://dl.miyuru.lk/geoip/dbip/country/dbip.dat.gz
#extract and move it
gunzip dbip.dat.gz
mv dbip.dat GeoIP.dat
#make sure www-data (debian nginx user:group) has permissions
chown www-data:www-data /usr/share/GeoIP/GeoIP.dat
