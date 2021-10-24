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

-----

**0. Read the LICENSE**

**1. Setup server with some basics**

- Separate, non-root user to run the application
- Basic security like ssh root login disabled, key login only, firewall (ufw works) deny all incoming on ports besides http/s and ssh.
- Set the timezone to UTC
- Clone the repo somewhere. The homedir for the user you setup or /var/www should work.

**2. Install dependencies.**

```bash
$ sudo apt-get update
$ sudo apt-get install nginx ffmpeg imagemagick graphicsmagick python-certbot-nginx
```
NOTE: If you plan to use animated .gif thumbnails, ffmpeg >=4.3.1 is recommended as there are known issues with older ffmpeg versions producing buggy thumbnails. You can [compile ffmpeg from source](https://trac.ffmpeg.org/wiki/CompilationGuide) to get a newer version.

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
#stop the jschan backend
$ pm2 stop ecosystem.config.js
#pull the latest changes
$ git pull
#install dependencies again in case any have updated or changed
$ npm install
#run the gulp migrate task. this will update things such as your database schema.
$ gulp migrate
#run the default gulp task to update, scripts, css, icons, images and delete old html
$ gulp
#start the backend again
$ pm2 restart ecosystem.config.js --env production
#if something breaks, check and read the logs, they will help figure out what went wrong
$ pm2 logs
```
