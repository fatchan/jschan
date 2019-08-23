# jschan

Anonymous imageboard. A type of BBS or forum software.
Still in development, so beware if attempting to run a public instance.
Demo site running at https://fatpeople.lol

## Goals
- Oldschool imageboard look
- Works on TOR with javascript disabled (maybe the name is a bit ironic)
- Take advantage of modern html5/css features for some usability perks

## Features
- [x] Classic post styling e.g. greentext, spoilers, quotes
- [x] Multiple files per post
- [x] Optional user created boards ala infinity
- [x] Captcha and basic antispam
- [x] Multi-select posts for reports, bans, post deletions, etc
- [x] Public board modlogs
- [x] Homepage boards sorted by active users, pph, total posts descending
- [x] Management page with reports, bans, banners, board settings and news
- [x] Customise homepage, faq, rules or add custom pages

## Todo
- [ ] Post moving/thread merging
- [ ] Flags. Geographic and custom uploaded
- [ ] IP range bans
- [ ] IP notes/records/ban history of some sort
- [ ] JSON api
- [ ] Configuration editor
- [ ] Overboard/multiboard/meta boards
- [ ] Boards search page
- [ ] User created board custom pages
- [ ] File URL uploads

## Setup
Please note:
- These are not step-by-step or complete instructions.
- For debian.

##### Requirements
- Linux (most likely could work elsewhere, but why?)
- Node.js (to run the app)
- Nginx (handle https, serve static content and html)
- Certbot/letsencrypt (for https cert)
- MongoDB (database, duh)
- Imagemagick (thumbnailing images)
- Ffmpeg (thumbnailing videos)
- Bcrypt (account password hashes)

Install some dependencies. You may need to add some sources.
```bash
$ sudo apt-get update
$ sudo apt-get install bcrypt nginx ffmpeg imagemagick
```

[Install](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-debian/#install-mongodb-community-edition-on-debian) and [configure auth for mongodb](https://medium.com/mongoaudit/how-to-enable-authentication-on-mongodb-b9e8a924efac). This is to avoid out of date verisons in debian repos.

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
