#!/bin/bash
#
# A way to map IPs to the "T1" country code, for tor exit node identification. For sites not using cloudflare.
# 1. (optional) Add this to a cronjob
# 2. Add "include /etc/nginx/includes/map.conf;" to the http block of your /etc/nginx/nginx.conf
# 3. Change all the proxy_set_header directives in your nginx config to use the $mapped_country_code variable instead of $geoip_country_code or a fixed value like 'TOR'
# 4. (optional) If you want to instead redirect all these known exits to your .onion instead, add "if ($mapped_country_code = "T1") { return 302 'http://xxxx.onion$request_uri'; }" to your clearnet vhost (server block) of your jschan nginx sites-available config
#

#get secops institute tor exit list to temp file
wget --retry-connrefused -qO- https://raw.githubusercontent.com/SecOps-Institute/Tor-IP-Addresses/master/tor-exit-nodes.lst |  tee /tmp/tor-exits >/dev/null
#get fissionrelays tor exit lists to temp file
wget --retry-connrefused -qO- https://lists.fissionrelays.net/tor/exits-ipv6.txt |  tee -a /tmp/tor-exits >/dev/null
wget --retry-connrefused -qO- https://lists.fissionrelays.net/tor/exits-ipv4.txt |  tee -a /tmp/tor-exits >/dev/null
#add start of nginx conf file for default, loki and .onion
printf "map \$remote_addr \$mapped_country_code {\nhostnames;\ndefault \$geoip_country_code;\n172.16.0.* \"LOKI\";\n\"unix:\" \"TOR\";\n" | tee /etc/nginx/includes/map.conf
#add exits list and set T1 code, prefix.suffix lines, etc
cat /tmp/tor-exits | sort -h | uniq | sed "s/$/\ \"T1\";/g;" | sed -r 's/([0-9]{1,3}\.){3}[0-9]{1,3}/::ffff:&/g' | tee -a /etc/nginx/includes/map.conf
rm /tmp/tor-exits
#close off nginx conf file
printf "\n}" | tee -a /etc/nginx/includes/map.conf
#reload nginx to apply changes
systemctl reload nginx
