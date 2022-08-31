## Installation
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

**0. Read the LICENSE**

**1. Setup server with some basics**

- Separate, unpriveliged user to run the application.
- Basic security:
  - Sshd root login disabled, key login only, listen only on desired interface.
  - Firewall (ufw works) to deny all incoming on ports besides http/s and sshd.
  - Setup unattended-upgrades for security patches.
- Set the timezone to UTC.
- Clone the repo somewhere. The homedir for the user you setup or /var/www should work.

**2. Install dependencies.**

```bash
$ sudo apt-get update
$ sudo apt-get install nginx ffmpeg imagemagick graphicsmagick python-certbot-nginx fonts-dejavu
```

**3. Install MongoDB**

[MongoDB Installation](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-debian/#install-mongodb-community-edition-on-debian) & [enable authentication](https://www.mongodb.com/features/mongodb-authentication)

**4. Install Redis**

[Redis Installation](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-debian-10)

**5. Install Node.js**

For easy installation, use [node version manager](https://github.com/nvm-sh/nvm) "nvm".

Install nvm then run the following commands to get the LTS version of nodejs.
```bash
$ nvm install --lts
```

You may install Node.js yourself without nvm if you prefer.

**6. Configure nginx**

For standard installations, run `configs/nginx/nginx.sh` as root. This will prompt you for installation directory, domains, onion/lokinet, enable geoip, install a letsencrypt certificate with certbot and more.

For non-standard installations like using a CDN, see [configs/nginx/README.md](configs/nginx/README.md) and DIY.

**7. Get the backend setup & running**

```bash
# copy example secrets file and edit it to fill out the details
$ cp configs/secrets.js.example configs/secrets.js && editor configs/secrets.js

# edit rules and faq pages if desired:
$ editor views/custompages/faq.pug views/custompages/rules.pug
# you can also add more .pug files in that folder with the same general format to create other custom pages

# install nodejs packages
$ npm install

# replace the master file for your favicon in gulp/res/icons/master.png

# run the setup script. installs pm2 process manager and gulp build system and runs some gulp tasks.
$ npm run-script setup

# run gulp reset to setup the database and folder structure and create the admin account. **Default admin account details with random password will be printed to the command line.**
$ gulp reset
# NOTE: dont run gulp reset again unless you want to completely irreversibly wipe everything.

# make jschan pm2 a service and load on system startup. this will output some additional commands you need to run to complete the process if you were smart and didnt do everything as "root" user.
$ pm2 startup

# save the process list so jschan is started with pm2
$ pm2 save

# start all the backend processes
$ npm run-script start
$ gulp

# some commands you may need to use in future/find helpful
$ pm2 list #list running pm2 processes
$ pm2 logs #see logs
$ pm2 reload ecosystem.config.js #reload all backend processes

# gulp is used for various jobs like minifying and compiling scripts
# the build-worker process may also run some of these for certain operations e.g. editing global settings in the web panel
$ gulp --tasks #list available gulp tasks
$ gulp migrate #check for and run db migrations
$ gulp password #reset the admin account password if you forgot it
$ gulp #run default gulp task
```

**8. Optionally, if you plan to use the webring and want to make requests with a proxy to mask your origin server IP:**

EITHER:

- Use the socks proxy provided by a non-docker tor daemon, which is probably already setup on port 9050 if you have tor installed for a hidden service.
- Install docker and run torproxy in a container: https://github.com/dperson/torproxy (of course, audit the docker image yourself).
- Use your own socks proxy

Either of the first two options will allow you to follow .onions in your webring follow list.

To enable the proxy, tick "Use Socks Proxy" in global management settings and set the appropriate proxy address, e.g. `socks5h://127.0.0.1:9050`, then save settings.

## Updating

```bash
#first, stop the jschan backend
$ pm2 stop ecosystem.config.js

#update node.js to the latest LTS node version, latest npm, and reinstall global packages:
#NOTE: Only works if you installed node.js "nvm" as per the recommendation in the installation instructions.
$ nvm install --lts --reinstall-packages-from=$(node --version) --latest-npm

#pull the latest changes
$ git pull

#install dependencies again in case any have updated or changed
$ npm install

#check if anything nginx related changed between the old and new verison, e.g.
$ git diff v0.1.5 v0.1.6 configs/nginx
#If you use a completely standard jschan nginx, run configs/nginx/nginx.sh again.
#Otherwise, update your nginx config with the necessary changes.

#run the gulp migrate task. this will update things such as your database schema.
$ gulp migrate
#run the default gulp task to update, scripts, css, icons, images and delete old html
$ gulp

#start the backend again
$ pm2 restart ecosystem.config.js --env production

#if something breaks, check and read the logs, they will help figure out what went wrong
$ pm2 logs
```

## Help! Something didn't work!!!1!!1

If you are sure you did everything correctly and you still can't get it working, you can ask for help in the IRC (linked in [README](README.md)).

Be polite, ask [smart questions](http://www.catb.org/~esr/faqs/smart-questions.html), and keep in mind nobody is obliged to help you. 

## Advanced

This is an optional section for people who know what they are doing.

Here are some additional "advanced" things you can do with your jschan installation:

<details><summary>Advanced</summary>

#### Performance tweaks

**Using unix sockets for nginx, tor, redis, and mongodb:**

If you run an instance with local redis, mongodb, tor, nginx, etc then you can (usually) net some performance improvement by making them communicate with unix sockets rather than TCP. No more localhost. The biggest disadvantage is making sure each component that communicates using a given socket has the correct permissions set. Generally, creating a socket that is owned by a group to which you add both components is good enough.

This example is for nginx <-> tor daemon communication. You should be able to work out redis and mongodb yourself based on this.

In the nginx `server {}` block:

```nginx
listen unix:/var/run/nginx-tor.sock;
allow "unix:";
deny all;
```

In your torrc:

```
HiddenServicePort 80 unix:/var/run/nginx-tor.sock
```

sudo systemctl restart tor && sudo systemctl restart nginx

**Don't use pm2/nodejs clustering:**

By default, the "chan" pm2 process (the main web serving component of jschan backend) will be "clustered". In nodejs this means that you can have multiple processes e.g. sharing the same port, whereby the "master" will accept connections and pass the handlers over to each process in a round-robin fashion. The pm2 master process handles all this and allows for nice things like zero downtime reloads. The downside is that there is a slight overhead associated with having that single thread accept connections and delegate them to each worker. Instead, you can run each chan process on a sequential port, starting from the port in configs/secrets.js. Then you can configure multiple ip:ports in nginx to connect to each nodejs process independently. 

**Note: pm2 reload will no longer give zero downtime restarts this way.**

1. Change the `exec_mode` in ecosystem.config.js and some code in server.js for listening to the ports:

```diff
diff --git a/ecosystem.config.js b/ecosystem.config.js
index fc000094..f2b53c1b 100644
--- a/ecosystem.config.js
+++ b/ecosystem.config.js
@@ -30,0 +31 @@ module.exports = {
+               exec_mode: 'fork',
diff --git a/server.js b/server.js
index f9e19dbc..1630dce0 100644
--- a/server.js
+++ b/server.js
@@ -152 +152 @@ const express = require('express')
-       server.listen(port, '127.0.0.1', () => {
+       server.listen(port+parseInt(process.env.NODE_APP_INSTANCE), '127.0.0.1', () => {
```

2. Change the `upstream` block in your jschan sites-available nginx config to have a backend for each chan process, like so:

```nginx
upstream chan {
	server 127.0.0.1:7000;
	server 127.0.0.1:7001;
	server 127.0.0.1:7002;
	server 127.0.0.1:7003;
}
```

You will need to match the number of servers to however many chan processes you are running, which by default is (number of cpu threads/2)

3. pm2 restart ecosystem.config.js --env production && sudo systemctl restart nginx

#### Customisation

Customisation is pretty easy. As long as you format whatever you are customising properly e.g. pug templates, css, etc and have correct syntax for javascript files, the build system will handle the rest for you. Here are some things you can do:

**Custom pages**

To add additional custom pages which will be at the root of your site, add a .pug file to views/custompages/. See rules.pug or faq.pug as an example. These will get added to the root of your site just like /rules.html and /faq.html.

Pug template language reference: https://pugjs.org/api/getting-started.html

To build all custompages, run `gulp custompages`.

**Custom CSS & themes**

All css files in gulp/res/css/ will get combined and minified into the main style.css for the site. If you want to edit the css, it is advised to not edit gulp/res/css/style.css directly as this can change between updates. Instead, add a "custom.css" (example name only) to the same folder with what ever css you want. This will be included after style.css so rules will take precedence.

Theme files in gulp/res/css/themes/ can also be edited, if desired. You can also create new themes copying their general format of including variables inside `:root{}`.

To build all css files, run `gulp css`. For some situations, such as adding or removing themes, you should run `gulp` and `pm2 restart all` because scripts and templates containing the theme selector dropdowns and server-side checks for valid theme names will need to be updated.

#### Handy nginx stuff

For detecting and automatically updating Tor exit node lists, see [tools/update_tor_exits.sh](tools/update_tor_exits.sh)

For updating the GeoIP database for nginx, see [tools/update_geoip.sh](tools/update_geoip.sh)


#### Docker

Experimental, strictly for development only.

Basically:

```bash
docker-compose up -d mongodb redis

#on the first run, or to "gulp reset" later:
docker-compose up jschan-reset

docker-compose up -d jschan

docker-compose up -d nginx
```

</details>
