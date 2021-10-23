#!/bin/bash
#sets up nginx config

#are you root?
[[ "$EUID" -ne 0 ]] && echo "Please run as root" && exit;

echo "[jschan nginx configuration helper]"
read -p "Enter the directory you cloned jschan (blank=$(pwd)): " JSCHAN_DIRECTORY
JSCHAN_DIRECTORY=${JSCHAN_DIRECTORY:-$(pwd)}
read -p "Enter your clearnet domain name e.g. example.com (blank=no clearnet domain): " CLEARNET_DOMAIN
SITES_AVAILABLE_NAME=${CLEARNET_DOMAIN:-jschan} #not sure on a good default, used for sites-available config name
read -p "Enter tor .onion address (blank=no .onion address): " ONION_DOMAIN
read -p "Enter lokinet .loki address (blank=no .loki address): " LOKI_DOMAIN
read -p "Should robots.txt disallow compliant crawlers? (y/n): " ROBOTS_TXT_DISALLOW
read -p "Allow google captcha in content-security policy? (y/n): " GOOGLE_CAPTCHA
read -p "Allow Hcaptcha in content-security policy? (y/n): " H_CAPTCHA
read -p "Download and setup geoip for post flags? (y/n): " GEOIP
read -p "Use certbot to install letsencrypt certificate for https? (y/n): " LETSENCRYPT

#looks good?
read -p "Is this correct?
jschan directory: $JSCHAN_DIRECTORY
clearnet domain: $CLEARNET_DOMAIN
.onion address: $ONION_DOMAIN
.loki address: $LOKI_DOMAIN
robots.txt disallow all: $ROBOTS_TXT_DISALLOW
google captcha: $GOOGLE_CAPTCHA
hcaptcha: $H_CAPTCHA
geoip: $GEOIP
(y/n): " CORRECT

#not saying no = yes, just like real life
[[ "$CORRECT" == "n" ]] && echo "Exiting..." && exit;

#copy the snippets and replace install path, they aren't templated
sudo cp $JSCHAN_DIRECTORY/configs/nginx/snippets/* /etc/nginx/snippets
sudo sed -i "s|/path/to/jschan|$JSCHAN_DIRECTORY|g" /etc/nginx/snippets/*

#declare teplate start
JSCHAN_CONFIG="upstream chan {
	server 127.0.0.1:7000;
}"

if [ "$CLEARNET_DOMAIN" != "" ]; then

	if [ "$LETSENCRYPT" == "y" ]; then
		#run certbot for certificate
		sudo certbot certonly --standalone -d $CLEARNET_DOMAIN -d www.$CLEARNET_DOMAIN
	fi

	#onion_location rediret header
	ONION_LOCATION=""
	if [ "$ONION_DOMAIN" != "" ]; then
		ONION_LOCATION="add_header onion-location 'http://$ONION_DOMAIN\$request_uri';"
	fi

	#concat clearnet server{} block
	JSCHAN_CONFIG="${JSCHAN_CONFIG}

server {
	server_name www.$CLEARNET_DOMAIN $CLEARNET_DOMAIN;
	client_max_body_size 0;

	$ONION_LOCATION

	listen [::]:443 ssl ipv6only=on; # managed by Certbot
	listen 443 ssl; # managed by Certbot
	ssl_certificate /etc/letsencrypt/live/$CLEARNET_DOMAIN/fullchain.pem; # managed by Certbot
	ssl_certificate_key /etc/letsencrypt/live/$CLEARNET_DOMAIN/privkey.pem; # managed by Certbot
	include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
	ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

	include /etc/nginx/snippets/security_headers.conf;
	include /etc/nginx/snippets/error_pages.conf;
	include /etc/nginx/snippets/jschan_clearnet_routes.conf;
	include /etc/nginx/snippets/jschan_common_routes.conf;
}

server {
	if (\$host = www.$CLEARNET_DOMAIN) {
		return 301 https://\$host\$request_uri;
	} # managed by Certbot

	if (\$host = $CLEARNET_DOMAIN) {
		return 301 https://$host\$request_uri;
	} # managed by Certbot

	server_name www.$CLEARNET_DOMAIN $CLEARNET_DOMAIN;

	listen 80;
	listen [::]:80;
	return 444; # managed by Certbot
}"

	#replace clearnet domain in snippets
	sudo sed -i "s/example.com/$CLEARNET_DOMAIN/g" /etc/nginx/snippets/*

fi

if [ "$ONION_DOMAIN" != "" ]; then

	#concat onion server{} block
	JSCHAN_CONFIG="${JSCHAN_CONFIG}

server {
	server_name www.$ONION_DOMAIN $ONION_DOMAIN;
	client_max_body_size 0;

	listen unix:/var/run/nginx-tor.sock;
	allow 'unix:';
	deny all;

	include /etc/nginx/snippets/security_headers.conf;
	include /etc/nginx/snippets/error_pages.conf;
	include /etc/nginx/snippets/jschan_common_routes.conf;
	include /etc/nginx/snippets/jschan_tor_routes.conf;
}"

	#replace onion domain in snippets
	sudo sed -i "s/example.onion/$ONION_DOMAIN/g" /etc/nginx/snippets/*

else
	#no onion, remove it from CSP
	sudo sed -i 's/ wss:\/\/www.example.onion\/ wss:\/\/example.onion\///g' /etc/nginx/snippets/security_headers*
fi

if [ "$LOKI_DOMAIN" != "" ]; then

	#concat lokinet server{} block
	JSCHAN_CONFIG="${JSCHAN_CONFIG}

server {
	server_name www.$LOKI_DOMAIN $LOKI_DOMAIN;
	client_max_body_size 0;

	#address may vary if this address is already used by something other than lokinet
	listen 172.16.0.1:80;

	include /etc/nginx/snippets/security_headers.conf;
	include /etc/nginx/snippets/error_pages.conf;
	include /etc/nginx/snippets/jschan_common_routes.conf;
	include /etc/nginx/snippets/jschan_loki_routes.conf;
}"

	#replace lokinet domain in snippets
	sudo sed -i "s/example.loki/$LOKI_DOMAIN/g" /etc/nginx/snippets/*

else
	#no lokinet, remove it from csp
	sudo sed -i 's/ wss:\/\/www.example.loki\/ wss:\/\/example.loki\///g' /etc/nginx/snippets/security_headers*
fi

#debug
#printf "$JSCHAN_CONFIG"

#write the config to file and syymlink to sites-available
printf "$JSCHAN_CONFIG" >> /etc/nginx/sites-available/$SITES_AVAILABLE_NAME
sudo ln -s /etc/nginx/sites-available/$SITES_AVAILABLE_NAME /etc/nginx/sites-enabled/$SITES_AVAILABLE_NAME

if [ "$GOOGLE_CAPTCHA" == "y" ]; then
	#add google captcha CSP exceptions
	sudo sed -i "s|script-src|script-src https://www.google.com/recaptcha/, https://www.gstatic.com/recaptcha/ |g" /etc/nginx/snippets/*
	sudo sed -i "s|frame-src|frame-src https://www.google.com/recaptcha/, https://recaptcha.google.com/recaptcha/ |g" /etc/nginx/snippets/*
fi

if [ "$H_CAPTCHA" == "y" ]; then
	#add hcaptcha CSP exceptions
	sudo sed -i "s|script-src|script-src https://hcaptcha.com, https://*.hcaptcha.com |g" /etc/nginx/snippets/*
	sudo sed -i "s|frame-src|frame-src https://hcaptcha.com, https://*.hcaptcha.com |g" /etc/nginx/snippets/*
	sudo sed -i "s|style-src|style-src https://hcaptcha.com, https://*.hcaptcha.com |g" /etc/nginx/snippets/*
	sudo sed -i "s|connect-src|connect-src https://hcaptcha.com, https://*.hcaptcha.com |g" /etc/nginx/snippets/*
fi

if [ "$ROBOTS_TXT_DISALLOW" == "y" ]; then
	#add path / (all) to disallow to make robots.txt block all robots instead of allowing
	sudo sed -d "s|Disallow:|Disallow: /|g" /etc/nginx/snippets/jschan_common_routes.conf
fi

if [ "$GEOIP" == "y" ]; then

	#download geoip data
	cd /usr/share/GeoIP
	mv GeoIP.dat GeoIP.dat.bak
	wget --retry-connrefused https://dl.miyuru.lk/geoip/dbip/country/dbip.dat.gz
	gunzip dbip.dat.gz
	mv dbip.dat GeoIP.dat
	chown www-data:www-data /usr/share/GeoIP/GeoIP.dat

	#add config statement to /etc/nginx/nginx.conf
	sudo sed -i '/http {/a \
geoip_country /usr/share/GeoIP/GeoIP.dat;' /etc/nginx/nginx.conf

fi

#and restart nginx
sudo systemctl restart nginx
