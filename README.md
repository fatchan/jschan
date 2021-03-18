# jschan
Anonymous imageboard software.

Demo/test instance: [Clearnet](https://fatchan.org), [Tor hidden service](http://cimixezweeq64g42vl6tyhk4becxhi4ldwqq6w43u53qhwsd3s4c3lyd.onion/), [Lokinet SNApp](http://fatchan.loki/)

## Goals
- Oldschool look, newschool features
- Work with javascript disabled
- Support using anonymizers such as Tor, Lokinet or I2P
- Be usable on mobile
- Simple static file serving

## Features
- [x] User created boards ala infinity
- [x] Multiple files per post
- [x] Basic antispam & multiple captcha options
- [x] Read-only JSON api
- [x] Multi-select moderation actions
- [x] Websocket update threads w/o polling
- [x] Webring w/proxy support (compatible with [lynxchan](https://gitlab.com/alogware/LynxChanAddon-Webring) & [infinity](https://gitlab.com/Tenicu/infinityaddon-webring) versions)
- [x] Manage everything from the web panel
- [x] Works properly with anonymizer networks

## Wants
- docker-compose file, use docker volumes and networks for super easy installation, backup and migration
- Mobile app integration (somebody pls)

## Setup
##### These instructions are not for the uninitiated and assume you have a brain. Follow them carefully and you will have a nice working imageboard by the end.

##### Requirements
- Linux - Debian used in this example
- Node.js - the application runtime
- MongoDB >= 4.4 - the database
- Redis - session store, task queue, locks, caching, websocket message arbiter
- Nginx - webserver/proxy, serve static files, handle https, GeoIP lookup
- Certbot/letsencrypt - to get a free https certificate
- Graphicsmagick+Imagemagick - identify and thumbnail images, generate captchas
- Ffmpeg - identify and thumbnail audio, video and gifs

-----

**0. Read the LICENSE**

**1. Setup server with some basics**

- Separate, non-root user to run the application
- Basic security like ssh root login disabled, key login only, firewall (ufw works) deny all incoming on ports besides http/s and ssh.

**2. Install dependencies.**

NOTE: You may need to add sources depending on your distro. If you want animated gif thumbnails, ffmpeg ?=4.3.x is recommended. For debian, it can be found in the testing repos or compiled from source.
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

`sed` can be used to automate this process:
```bash
$ sudo sed -i 's|/path/to/jschan|/path/to/your/install|g' /etc/nginx/sites-available/DOMAIN.COM
$ sudo sed -i 's/domain.com/your.domain.com/g' /etc/nginx/sites-available/DOMAIN.COM
```

- Make sure the sites enabled folder is included by `/etc/nginx/nginx.conf` (it is in debian nginx package)
- Use [certbot](https://certbot.eff.org/) to get a free https certificate.

- For post flags to work, [follow this guide](http://archive.is/2SMOb) to setup the [legacy GeoIP database](https://www.miyuru.lk/geoiplegacy) and add these directives to the http block in `/etc/nginx/nginx.conf`:
```
geoip_country /usr/share/GeoIP/GeoIP.dat;
```
If your nginx doesn't have the necessary module by default, or is using v2 instead, find your own guide.

If you use cloudflare, please read [these](https://support.cloudflare.com/hc/en-us/articles/200170786-Restoring-original-visitor-IPs-Logging-visitor-IP-addresses-with-mod-cloudflare-) [articles](https://support.cloudflare.com/hc/en-us/articles/200168236-Configuring-Cloudflare-IP-Geolocation) to setup proper IP forwarding and geolocation headers. Similar steps would apply to other CDNs/reverse proxies.

Also included is an "nginx_advanced" config, and a snippets folder for advanced users who want to better organise and more easily customise the nginx configuration. It functions the same as the normal nginx.example, but you need to create the snippets folder in /etc/nginx/snippets, and copy the example snippets.

- Use https://realfavicongenerator.net/ to generate favicons how you want them to look and replace the files in gulp/res/icons/ with the icons from that package.

**7. Clone this repo, browse to the folder and set some things up**

```bash
# copy example secrets file and edit it to fill out the details
$ cp configs/secrets.js.example configs/secrets.js && editor configs/secrets.js

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

# start all the backend processes
$ npm run-script start
$ gulp

# some commands you may need to use in future/find helpful
# pm2 is a process manager for nodejs
$ pm2 list #list running pm2 processes
$ pm2 logs #see logs
$ pm2 reload all #reload all backend processes

# gulp is used for various jobs like minifying and compiling scripts
# the build-worker process may also run some of these for certain operations e.g. editing global settings in the web panel
$ gulp --tasks #list available gulp tasks
$ gulp migrate #check for and run db migrations
$ gulp password #reset the admin account password if you forgot it
$ gulp #run default gulp task
```

**8. Optionally, if you plan to use the webring and want to make requests with a proxy to mask your origin server IP:**

EITHER:

- Install docker and run torproxy in a container: https://github.com/dperson/torproxy (of course, audit the docker image yourself).
- Use the socks proxy provided by a non-docker tor daemon, which is probably already setup on port 9050 if you have a tor installed for hidden service.
- Use your own socks proxy

Then update the proxy address in global settings. The first 2 will allow you to follow .onions in your webring follow list.

## Updating

```bash
#pull the latest changes
$ git pull
#install dependencies again in case any have updated or changed
$ npm install
#run the gulp migrate task. this will update things such as your database schema
$ gulp migrate
#stop the jschan backend
$ pm2 stop all
#run the default gulp task to update, scripts, css, icons, images and delete old html
$ gulp
#start the backend again
$ pm2 restart all
#if something breaks, check and read the logs, they will help figure out what went wrong
$ pm2 logs
```

## For generous people

BTC address: `bc1q4elrlz5puak4m9xy3hfvmpempnpqpu95v8s9m6`
