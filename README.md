# jschan
Anonymous imageboard software.

Demo/test site: [clearnet](https://fatchan.org) [tor hidden service](http://cimixezweeq64g42vl6tyhk4becxhi4ldwqq6w43u53qhwsd3s4c3lyd.onion/)

## Goals
- Oldschool look, newschool features
- Work with javascript disabled
- Support running as a hidden service
- Be usable on mobile
- Simple static file serving

## Features
- [x] User created boards ala infinity
- [x] Multiple files per post
- [x] Basic antispam & multiple captcha options
- [x] Read-only JSON api
- [x] Multi-select moderation actions
- [x] Websocket update threads w/o polling
- [x] Webring w/proxy support (compatible with [lynxchan](https://gitlab.com/alogware/LynxChanAddon-Webring) & [infinity](https://gitlab.com/Tenicu/infinityaddon-webring))
- [x] Run as a tor hidden service

## Todo
- More features
- Mobile app integration
- Improve installation instructions

## Setup
##### Please note:
#### 🚨 jschan is not production-ready. There may be bugs and WILL be breaking changes. 🚨
##### If you insist on running your own instance, do not expect help when something breaks. Please read everything including the update section thoroughly. These instructions are NOT step-by-step or complete, and assume you have some experience with software setup, servers, networking, etc.

##### Requirements
- Linux - Debian used in this example
- Node.js - the application runtime
- MongoDB - the database
- Redis - session store, task queue, locks, caching, websocket message arbiter
- Nginx - webserver/proxy, serve static files, handle https, GeoIP lookup
- Certbot/letsencrypt - to get a free https certificate
- Graphicsmagick+Imagemagick - identify and thumbnail images, generate captchas
- Ffmpeg - identify and thumbnail audio and video

-----

**1. Setup server with some basics**

- Separate, non-root user to run the application
- Basic security like ssh root login disabled, key login only, firewall all ports besides http/s and ssh.

**2. Install dependencies.**

NOTE: You may need to add sources depending on your distro.
```bash
$ sudo apt-get update
$ sudo apt-get install nginx ffmpeg imagemagick graphicsmagick
```

**3. Install MongoDB**

[MongoDB Installation](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-debian/#install-mongodb-community-edition-on-debian) & [enable authentication](https://medium.com/mongoaudit/how-to-enable-authentication-on-mongodb-b9e8a924efac)

**4. Install Redis**

[Redis Installation](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-debian-9)

**5. Install Node.js**

For easy installation, use [node version manager](https://github.com/nvm-sh/nvm) "nvm". 
Install nvm then run the following commands to get the LTS version of nodejs.
```bash
$ nvm install --lts
$ nvm use --lts
```
You can repeat this process in future to update node versions.

You may install Node.js yourself without nvm if you prefer.

**6. Configure nginx**

- Copy the nginx.example config to the sites-eavailable folder, and create a symlink from sites-available -> sites-enabled
```bash
$ sudo cp configs/nginx/nginx.example /etc/nginx/sites-available/DOMAIN.COM
$ sudo ln -s /etc/nginx/sites-available/DOMAIN.COM /etc/nginx/sites-enabled/DOMAIN.COM
```

Edit/replace the following in your nginx config:
- "domain.com" with your domain name
- "/path/to/jschan" with the path of your jschan root folder
- If using .onion, uncomment the .onion block, and replace the example address with your .onion
```bash
$ sudo editor /etc/nginx/sites-available/DOMAIN.COM
```

- Make sure the sites enabled folder is included by `/etc/nginx/nginx.conf` (it is in debian nginx package)
- Use [certbot](https://certbot.eff.org/) to get a free https certificate.
- For post flags to work, [follow this guide](http://archive.is/2SMOb) to setup the [legacy GeoIP database](https://www.miyuru.lk/geoiplegacy) and add these directives to the http block in `/etc/nginx/nginx.conf`:
```
geoip_country /usr/share/GeoIP/GeoIP.dat;
geoip_city /usr/share/GeoIP/GeoIPCity.dat;
```
If your nginx doesn't have the necessary module by default, or is using v2 instead, find your own guide.

If you use cloudflare, please read [these](https://support.cloudflare.com/hc/en-us/articles/200170786-Restoring-original-visitor-IPs-Logging-visitor-IP-addresses-with-mod-cloudflare-) [articles](https://support.cloudflare.com/hc/en-us/articles/200168236-Configuring-Cloudflare-IP-Geolocation) to setup proper IP forwarding and geolocation headers. Similar steps would apply to other CDNs/reverse proxies.
There are also 2 config entries in configs/main.js, `ipHeader` and `countryCodeHeader` that you can tweak for jschan to use different headers for country code or real visitor IP.

Also included is an "nginx_advanced" config, and a snippets folder for advanced users who want to better organise and more easily customise the nginx configuration. It functions the same as the normal nginx.example, but you need to create the snippets folder in /etc/nginx/snippets, and copy the example snippets.

**7. Clone this repo, browse to the folder and set some things up**

```bash
# copy example config file and edit it
$ cp configs/main.js.example configs/main.js && editor configs/main.js

# copy example custompages for rules and faq and edit
$ cp views/custompages/faq.pug.example views/custompages/faq.pug
$ cp views/custompages/rules.pug.example views/custompages/rules.pug

# install dependencies and run build tasks
$ npm install
$ npm run-script setup

# setup the database and folder structure, and creates the admin account. **The (random) password will be printed in the command line.**
$ gulp reset 
# NOTE: dont run gulp reset again unless you want to completely irreversibly wipe everything

# make pm2 (process manager) start on server restart
$ pm2 startup #and follow any prompts
# save the process list so jschan is started with pm2
$ pm2 save
```

Use https://realfavicongenerator.net/ to generate favicons how you want them to look and replace the files in gulp/res/icons/ with the icons from that package

```bash
# start all the backend processes
$ npm run-script start
$ gulp

# some commands you may need to use in future/find helpful
# pm2 is a process manager for nodejs
$ pm2 list #list running pm2 processes
$ pm2 logs #see logs
$ pm2 reload all #reload all backend processes

# gulp is used for various jobs like minifying and compiling scripts
$ gulp --tasks #list available gulp tasks
$ gulp migrate #check for and run db migrations
$ gulp #run default gulp task
```

**8. Optionally, if you plan to use the webring and want to make requests with a proxy to mask your origin server IP:**

EITHER:

- Install docker and run torproxy in a container: https://github.com/dperson/torproxy (of course, audit the docker image yourself). This is the easiest, free way to get a proxy setup and means you can also follow .onions in your webring list since requests will go through tor.
- Use your own socks proxy

Edit configs/webring.json with your proxy address and set enabled: true

## Updating

```bash
#pull the latest changes
$ git pull
#install dependencies again in case any have updated or changed
$ npm install
#diff the config files to see if anything changed and edit accordingly. OR backup your config, replace it with the fresh example, and update it with whatever settings you want to keep from your backup.
$ diff configs/main.js configs/main.js.example
#run the migrate task to update your database
$ gulp migrate
#reload jschan backend
$ pm2 reload all
#run the default gulp task, updates scripts, css, icons, images and deletes old html
$ gulp
#if something breaks, check and read the logs, they will help figure out what went wrong.
$ pm2 logs
```

## For generous people

BTC address: `bc1q4elrlz5puak4m9xy3hfvmpempnpqpu95v8s9m6`
