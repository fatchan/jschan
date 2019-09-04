# jschan

Anonymous imageboard. A type of BBS or forum software.
Still in development, so beware if attempting to run a public instance.
Demo site running at https://fatpeople.lol

## Goals
- Oldschool imageboard look
- Works on TOR with javascript disabled (maybe the name is a bit ironic)
- Leverage nginx to serve static files and handle GeoIP lookups

## Features
- [x] Post styling (markdown-esque)
- [x] Quote linking and replies
- [x] Multiple files per post
- [x] User created boards ala infinity
- [x] Captcha and basic antispam
- [x] Read-only JSON api
- [x] Public modlogs
- [x] Multi-select posts for moderation actions/reports
- [x] Fully functional for users with javascript disabled

## Todo
- Staff post editing/moving/thread merging
- IP range bans + IP ban history
- Configuration editor
- Overboard/multiboard/meta boards
- Boards list and search page
- User created board custom pages
- File URL uploads

## Setup
Please note:
- These are not step-by-step or complete instructions.
- For debian.

##### Requirements
- Linux
- Node.js (to run the app)
- MongoDB (database, duh)
- Redis (sessions, queue, locks and caching)
- Nginx (handle https, serve static content, GeoIP lookup)
- Certbot/letsencrypt (for https cert)
- Imagemagick (thumbnailing images)
- Ffmpeg (thumbnailing videos)
- Bcrypt (account password hashes)

Install some dependencies. You may need to add some sources.
```bash
$ sudo apt-get update
$ sudo apt-get install bcrypt nginx ffmpeg imagemagick
```

[Install](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-debian/#install-mongodb-community-edition-on-debian) and [configure auth for mongodb](https://medium.com/mongoaudit/how-to-enable-authentication-on-mongodb-b9e8a924efac). This is to avoid out of date verisons in debian repos.

[Install and configure](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-debian-9) Redis.

Install nodejs. You can use [node version manager](https://github.com/nvm-sh/nvm) (nvm) to help with this.
Once you have nvm, install the LTS version of nodejs (currently 10.x).
```bash
$ nvm install --lts
```

Configure nginx. Delete the default nginx config, then modify [the example config](https://gist.github.com/fatchan/87ac56e5556d178ab2213afdf7619dec) and put it in the correct folder. Next, get https with a certificate generated from [letsencrypt](https://wiki.debian.org/LetsEncrypt).

Now clone the repo, browse to the folder and set some things up.
```bash
# in repo directory
$ nano configs/main.json #edit config with appropriate data
$ npm i
$ npm i -g gulp pm2
$ gulp
$ npm run-script setup
$ npm run-script start #this will start the backend
$ pm2 list #list running apps
$ pm2 logs #see logs
```
