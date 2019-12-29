# jschan

Anonymous imageboard. A type of BBS or forum software.
Still in development, so beware if attempting to run a public instance.
Demo site running at https://fatpeople.lol

## Goals
- Oldschool imageboard look, with some modern touches
- Support users that have javascript disabled (TOR users, or the security conscious)
- Leverage nginx to serve static files, do GeoIP lookups and various other things

## Features
- [x] User created boards ala infinity
- [x] Multiple files per post
- [x] Captcha and basic antispam
- [x] Read-only JSON api
- [x] Multi-select moderation actions
- [x] Websocket update threads w/o polling
- [x] Webring support ([lynxchan](https://gitlab.com/alogware/LynxChanAddon-Webring)) ([infinity](https://gitlab.com/Tenicu/infinityaddon-webring))

## Todo
- Fix issues
- Add missing features
- Improve moderation tools
- Improve frontend scripts
- Fork some mobile app and make it compatible with the API

## Setup
Please note:
- these instructions are not step-by-step or complete
- you should be able to read, be comfortable with a command line and have problem solving skills (aka search engine)

##### Requirements
- Linux (debian used in this example)
- Node.js (to run the app)
- MongoDB (database, duh)
- Redis (sessions, build task queue, locks, caching, websocket data)
- Nginx (handle https, serve static content, GeoIP lookup)
- Certbot/letsencrypt (for https cert)
- Graphicsmagick+Imagemagick (thumbnailing images, generating captchas)
- Ffmpeg (thumbnailing videos)

Install some dependencies. You may need to add some sources.
```bash
$ sudo apt-get update
$ sudo apt-get install nginx ffmpeg imagemagick graphicsmagick
```

[Install](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-debian/#install-mongodb-community-edition-on-debian) and [configure auth for mongodb](https://medium.com/mongoaudit/how-to-enable-authentication-on-mongodb-b9e8a924efac). This is to avoid out of date verisons in debian repos.

[Install and configure](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-debian-9) Redis.

Install nodejs. You can use [node version manager](https://github.com/nvm-sh/nvm) (nvm) to help with this.
Once you have nvm, install the LTS version of nodejs
```bash
$ nvm install --lts
```

Configure nginx. Modify the example config included in configs/nginx.example and put it in /etc/nginx/sites-available, then symlink it to /etc/nginx/sites-enabled. Make sure the sites enabled folder is included by the main nginx.conf
Next, get https with a certificate generated from [letsencrypt](https://wiki.debian.org/LetsEncrypt).
If you need support for Country flags, [follow this guide](http://archive.is/2SMOb) to set them up in nginx.
Then edit your `/etc/nginx/nginx.conf` and put these directives within the http block:
```
#geoip settings
geoip_country /usr/share/GeoIP/GeoIP.dat;
geoip_city /usr/share/GeoIP/GeoIPCity.dat;

```

Now clone the repo, browse to the folder and set some things up.
```bash
# in repo directory
$ cp configs/main.js.example configs/main.js && nano configs/main.js #copy example config and edit, some comments included
$ npm install #install dependencies
$ npm run-script setup #install global modules pm2 and gulp, then runs gulp tasks
$ gulp reset #clear the database, creates account username:admin, password:changeme (dont run this again unless you want to completely irreversibly wipe everything)
$ npm run-script start #start all the backend processes
$ pm2 list #list running pm2 processes
$ pm2 logs #see logs
$ pm2 reload all #reload everything, or use "chan", "build-worker" or "schedules" to only reload specific parts if you know what you are doing
$ gulp --tasks #list available gulp tasks
$ gulp #run default gulp task, usually used for updates, can run specific tasks if you know what you are doing
```
