# jschan
Anonymous imageboard software.
## Goals
- Oldschool look, newschool feel
- Work with javascript disabled
- Be usable on mobile
- Static file serving

## Features
- [x] User created boards ala infinity
- [x] Multiple files per post
- [x] Captcha and antispam
- [x] Read-only JSON api
- [x] Multi-select moderation actions
- [x] Websocket update threads w/o polling
- [x] Webring w/proxy support ([lynxchan](https://gitlab.com/alogware/LynxChanAddon-Webring)) ([infinity](https://gitlab.com/Tenicu/infinityaddon-webring))

## Todo
- Support running as a hidden service
- More features
- Mobile app
- Full install script

## Setup
Please note:
#### 🚨 The software is not production-ready. There may be bugs and WILL be breaking changes. If you insist on running your own instance, always ensure you have up-to-date configs and run `gulp migrate && gulp && pm2 reload all` after pulling. 🚨
- these instructions are not step-by-step or complete
- you should be able to read, be comfortable with a command line and have problem solving skills

##### Requirements
- Linux (debian used in this example)
- Node.js (to run the app)
- MongoDB (database, duh)
- Redis (sessions, build task queue, locks, caching, websocket data)
- Nginx (handle https, serve static content, GeoIP lookup)
- Certbot/letsencrypt (for https cert)
- Graphicsmagick+Imagemagick (thumbnailing images, generating captchas)
- Ffmpeg (thumbnailing videos)

1. Setup server with some basics

  - new user to run the nodejs backend
  - ssh root login disabled, key login only, etc
  - iptables only open http, https and ssh ports on INPUT

2. Install dependencies. You may need to add sources depending on your distro.
```bash
$ sudo apt-get update
$ sudo apt-get install nginx ffmpeg imagemagick graphicsmagick
```

3. [Install MongoDB](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-debian/#install-mongodb-community-edition-on-debian) and [configure authentication](https://medium.com/mongoaudit/how-to-enable-authentication-on-mongodb-b9e8a924efac)

4. [Install and configure](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-debian-9) Redis

5. Install nodejs
Recommended to use [node version manager](https://github.com/nvm-sh/nvm) (nvm).
Install nvm then run the following commands to get the LTS version of nodejs.
```bash
$ nvm install --lts
$ nvm use --lts
```
You can also repeat this process in future to update node versions as they are generally backwards compatible.

6. Configure nginx
- Use the example config included in `configs/nginx.example` and put it in `/etc/nginx/sites-available/YOURDOMAIN.COM`, then symlink it to `/etc/nginx/sites-enabled/YOURDOMAIN.com`.
- Make sure the sites enabled folder is included by `/etc/nginx/nginx.conf`
- Get https certificate from [letsencrypt](https://wiki.debian.org/LetsEncrypt).
- For geo flags, [follow this guide](http://archive.is/2SMOb) to setup the [legacy GeoIP db](https://www.miyuru.lk/geoiplegacy) and add these directives to the http block in `/etc/nginx/nginx.conf`:
```
geoip_country /usr/share/GeoIP/GeoIP.dat;
geoip_city /usr/share/GeoIP/GeoIPCity.dat;
```

7. Clone this repo, browse to the folder and set some things up
```bash
# copy example config file and edit it
$ cp configs/main.js.example configs/main.js && editor configs/main.js

# copy example custompages for rules and faq and edit
$ cp views/custompages/faq.pug.example views/custompages/faq.pug
$ cp views/custompages/rules.pug.example views/custompages/rules.pug

# install dependencies and run build tasks
$ npm install
$ npm run-script setup

# setup the database and folder structure, creates admin account admin:changeme
# dont run this again unless you want to completely irreversibly wipe everything
$ gulp reset
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

8. Optionally, if you plan to use the webring and want to make requests with tor to mask your origin server IP:
Install docker and run torproxy in a container: https://github.com/dperson/torproxy
Edit configs/webring.json and wer proxy enabled:true

