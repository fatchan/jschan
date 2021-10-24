`sites-available.example` is a sample /etc/nginx/sites-available/example.com file
`snippets/*` are sample snippets for /etc/nginx/snippets/

For standard installs, run nginx.sh for easy configuration with prompts.

For non-standard installations, DIY.

If you use cloudflare, please read [these](https://support.cloudflare.com/hc/en-us/articles/200170786-Restoring-original-visitor-IPs-Logging-visitor-IP-addresses-with-mod-cloudflare-) [articles](https://support.cloudflare.com/hc/en-us/articles/200168236-Configuring-Cloudflare-IP-Geolocation) to setup proper IP forwarding and geolocation headers. Similar steps would apply to other CDNs/reverse proxies.
