#!/bin/bash
#sets up nginx config

#are you root?
[[ "$EUID" -ne 0 ]] && echo "Please run as root" && exit;

echo "[jschan nginx configuration helper]"
read -p "Enter the directory you cloned jschan, no trailing slash. (blank=$(pwd)): " JSCHAN_DIRECTORY
JSCHAN_DIRECTORY=${JSCHAN_DIRECTORY:-$(pwd)}
read -p "Enter your clearnet domain name e.g. example.com (blank=no clearnet domain): " CLEARNET_DOMAIN
SITES_AVAILABLE_NAME=${CLEARNET_DOMAIN:-jschan} #not sure on a good default, used for sites-available config name
read -p "Enter tor .onion address (blank=no .onion address): " ONION_DOMAIN
read -p "Enter lokinet .loki address (blank=no .loki address): " LOKI_DOMAIN
read -p "Would you like to add a www. subdomain? (y/n): " ADD_WWW_SUBDOMAIN
if [ "$CLEARNET_DOMAIN" != "" ]; then
	read -p "Run certbot and automatically configure a certificate for https on clearnet? (y/n): " CERTBOT
	if [ "$CERTBOT" == "n" ]; then
		read -p "Generate a self-signed certificate instead? (y/n): " SELFSIGNED
	fi
	if [ "$SELFSIGNED" == "n" ]; then
		read -p "Warning: no https certificate chosen for clearnet. Continue without https? (y/n): " NOHTTPS
		[[ "$NOHTTPS" == "n" ]] && echo "Exiting..." && exit;
	fi
fi
read -p "Should robots.txt disallow compliant crawlers? (y/n): " ROBOTS_TXT_DISALLOW
read -p "Allow google captcha in content-security policy? (y/n): " GOOGLE_CAPTCHA
read -p "Allow Hcaptcha in content-security policy? (y/n): " H_CAPTCHA
read -p "Download and setup geoip for post flags? (y/n): " GEOIP

#looks good?
read -p "Is this correct?
jschan directory: $JSCHAN_DIRECTORY
clearnet domain: $CLEARNET_DOMAIN
.onion address: $ONION_DOMAIN
.loki address: $LOKI_DOMAIN
www subdomains: $ADD_WWW_SUBDOMAIN
certbot https cert: $CERTBOT
self-signed https cert: $SELFSIGNED
no https cert: $NOHTTPS
robots.txt disallow all: $ROBOTS_TXT_DISALLOW
google captcha: $GOOGLE_CAPTCHA
hcaptcha: $H_CAPTCHA
geoip: $GEOIP
(y/n): " CORRECT
#not saying no = yes, just like real life
[[ "$CORRECT" == "n" ]] && echo "Exiting..." && exit;

#ask to overwrite if already exists
if [[ -f /etc/nginx/sites-available/$SITES_AVAILABLE_NAME ]]; then
	read -p "/etc/nginx/sites-available/$SITES_AVAILABLE_NAME already exists. Continue and overwrite existing configuration? (y/n)" OVERWRITE
	[[ "$OVERWRITE" == "n" ]] && echo "Exiting..." && exit;
	rm /etc/nginx/sites-available/$SITES_AVAILABLE_NAME
	rm /etc/nginx/sites-enabled/$SITES_AVAILABLE_NAME
fi

echo "Stopping nginx..."
sudo systemctl stop nginx

if [ "$CERTBOT" == "y" ]; then
	#run certbot for certificate
	if [ "$ADD_WWW_SUBDOMAIN" == "y" ]; then
		echo "Running certbot to setup SSL cert for $CLEARNET_DOMAIN and www.$CLEARNET_COMAIN..."
		sudo certbot certonly --nginx -d $CLEARNET_DOMAIN -d www.$CLEARNET_DOMAIN
	else
		echo "Running certbot to setup SSL cert for $CLEARNET_DOMAIN..."
		sudo certbot certonly --nginx -d $CLEARNET_DOMAIN
	fi
fi

echo "Copying snippets to nginx folder & replacing paths..."
#copy the snippets and replace install path, they aren't templated
sudo cp $JSCHAN_DIRECTORY/configs/nginx/snippets/* /etc/nginx/snippets
sudo sed -i "s|/path/to/jschan|$JSCHAN_DIRECTORY|g" /etc/nginx/snippets/*

#declare teplate start
JSCHAN_CONFIG="upstream chan {
	server 127.0.0.1:7000;
}"

#Use some variabels to make the templating easier later, depending on if they want www. or not
CLEARNET_SERVER_NAME="$CLEARNET_DOMAIN"
LOKI_SERVER_NAME="$LOKI_DOMAIN"
ONION_SERVER_NAME="$ONION_DOMAIN"
if [ "$ADD_WWW_SUBDOMAIN" == "y" ]; then
	CLEARNET_SERVER_NAME="$CLEARNET_DOMAIN www.$CLEARNET_DOMAIN"
	LOKI_SERVER_NAME="$LOKI_DOMAIN www.$LOKI_DOMAIN"
	ONION_SERVER_NAME="$ONION_DOMAIN www.$ONION_DOMAIN"
fi

if [ "$CLEARNET_DOMAIN" != "" ]; then

	HTTPS_MIDSECTION=""
	HTTPS_CERT_SECTION=""
	if [ "$CERTBOT" == "y" ]; then
		HTTPS_CERT_SECTION="
	ssl_certificate /etc/letsencrypt/live/$CLEARNET_DOMAIN/fullchain.pem;
	ssl_certificate_key /etc/letsencrypt/live/$CLEARNET_DOMAIN/privkey.pem;
	include /etc/letsencrypt/options-ssl-nginx.conf;
	ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
	"
	elif [ "$SELFSIGNED" == "y" ]; then
		echo "Generating self-signed SSL cert..."
		mkdir /etc/ssl/private/
		mkdir /etc/ssl/certs/
		sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt
		echo "Generating dh group. This may take a while..."
		sudo openssl dhparam -out /etc/nginx/dhparam.pem 4096
		cat > /etc/nginx/snippets/ssl-params.conf <<EOF
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_session_tickets off;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA";
EOF

		HTTPS_CERT_SECTION="
	ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
	ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
	ssl_dhparam /etc/nginx/dhparam.pem;
	include /etc/nginx/snippets/ssl-params.conf;
	"
	fi

	if [ "$NOHTTPS" != "y" ]; then
			HTTPS_MIDSECTION="
	listen [::]:443 ssl ipv6only=on;
	listen 443 ssl;
	$HTTPS_CERT_SECTION

}

server {
	if (\$host = www.$CLEARNET_DOMAIN) {
		return 301 https://\$host\$request_uri;
	}

	if (\$host = $CLEARNET_DOMAIN) {
		return 301 https://\$host\$request_uri;
	}

	server_name $CLEARNET_SERVER_NAME;
	return 444;
"
	fi

	#onion_location redirect header
	ONION_LOCATION=""
	if [ "$ONION_DOMAIN" != "" ]; then
		ONION_LOCATION="add_header onion-location 'http://$ONION_DOMAIN\$request_uri';"
	fi

	#concat clearnet server{} block
	JSCHAN_CONFIG="${JSCHAN_CONFIG}

server {
	server_name $CLEARNET_SERVER_NAME;
	client_max_body_size 0;

	$ONION_LOCATION

	include /etc/nginx/snippets/security_headers.conf;
	include /etc/nginx/snippets/error_pages.conf;
	include /etc/nginx/snippets/jschan_clearnet_routes.conf;
	include /etc/nginx/snippets/jschan_common_routes.conf;

$HTTPS_MIDSECTION

	listen 80;
	listen [::]:80;
}"

	#replace clearnet domain in snippets
	echo "Replacing clearnet domain in snippets..."
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
	echo "Replacing onion domain in snippets..."
	sudo sed -i "s/example.onion/$ONION_DOMAIN/g" /etc/nginx/snippets/*

else
	#no onion, remove it from CSP
	echo "No onion, removing example.onion from CSP..."
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
	echo "Replacing loki domain in snippets..."
	sudo sed -i "s/example.loki/$LOKI_DOMAIN/g" /etc/nginx/snippets/*

else
	#no lokinet, remove it from csp
	echo "No lokinet, removing example.loki from CSP..."
	sudo sed -i 's/ wss:\/\/www.example.loki\/ wss:\/\/example.loki\///g' /etc/nginx/snippets/security_headers*
fi

#write the config to file and syymlink to sites-available
echo "Writing main jschan vhost config..."
printf "$JSCHAN_CONFIG" > /etc/nginx/sites-available/$SITES_AVAILABLE_NAME
sudo ln -s -f /etc/nginx/sites-available/$SITES_AVAILABLE_NAME /etc/nginx/sites-enabled/$SITES_AVAILABLE_NAME

if [ "$NOHTTPS" == "y" ]; then
	echo "Adjusting config snippets to support NOHTTPS mode..."
	sudo sed -i "s/Forwarded-Proto https/Forwarded-Proto http/g" /etc/nginx/snippets/jschan_clearnet_routes.conf
fi

if [ "$GOOGLE_CAPTCHA" == "y" ]; then
	echo "Allowing recaptcha in CSP..."
	#add google captcha CSP exceptions
	sudo sed -i "s|script-src|script-src https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ |g" /etc/nginx/snippets/*
	sudo sed -i "s|frame-src|frame-src https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/ |g" /etc/nginx/snippets/*
fi

if [ "$H_CAPTCHA" == "y" ]; then
	echo "Allowing hcaptcha in CSP..."
	#add hcaptcha CSP exceptions
	sudo sed -i "s|script-src|script-src https://hcaptcha.com https://*.hcaptcha.com |g" /etc/nginx/snippets/*
	sudo sed -i "s|frame-src|frame-src https://hcaptcha.com https://*.hcaptcha.com |g" /etc/nginx/snippets/*
	sudo sed -i "s|style-src|style-src https://hcaptcha.com https://*.hcaptcha.com |g" /etc/nginx/snippets/*
	sudo sed -i "s|connect-src|connect-src https://hcaptcha.com https://*.hcaptcha.com |g" /etc/nginx/snippets/*
fi

if [ "$ROBOTS_TXT_DISALLOW" == "y" ]; then
	echo "Setting robots.txt to disallow all..."
	#add path / (all) to disallow to make robots.txt block all robots instead of allowing
	sudo sed -i "s|Disallow:|Disallow: /|g" /etc/nginx/snippets/jschan_common_routes.conf
fi

if [ "$GEOIP" == "y" ]; then
	echo "Downloading and installing geoip database for nginx..."
	#download geoip data
	cd /usr/share/GeoIP
	mv GeoIP.dat GeoIP.dat.bak
	wget --retry-connrefused https://dl.miyuru.lk/geoip/dbip/country/dbip.dat.gz
	gunzip dbip.dat.gz
	mv dbip.dat GeoIP.dat
	chown www-data:www-data /usr/share/GeoIP/GeoIP.dat

	#add goeip_country to /etc/nginx/nginx.conf, only if not already exists
	grep -qF "geoip_country" /etc/nginx/nginx.conf
	if [ $? -eq 1 ]; then
		sudo sed -i '/http {/a \
geoip_country /usr/share/GeoIP/GeoIP.dat;' /etc/nginx/nginx.conf
	fi
else
	echo "Geoip not installed, removing directives..."
	sudo sed '/geoip_country/d' /etc/nginx/nginx.conf
	sudo sed '/geoip_country_code/d' /etc/nginx/snippets/jschan_clearnet_routes.conf
fi

echo "Restarting nginx..."
#and restart nginx
sudo systemctl restart nginx
