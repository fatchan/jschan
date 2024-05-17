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
sudo apt update -y
sudo apt install curl wget libgeoip-dev gnupg ffmpeg imagemagick graphicsmagick fontconfig fonts-dejavu -y
```

**3. Install MongoDB**

NOTE: As per the MongoDB Documentation, since MongoDB 5.0, the AVX instruction set is required.

> MongoDB 5.0 requires use of the AVX instruction set, available on [select Intel and AMD processors](https://en.wikipedia.org/wiki/Advanced_Vector_Extensions#CPUs_with_AVX).

Please ensure your hardware is supported before reporting issues. The complete platform support matrix is available [here](https://www.mongodb.com/docs/manual/administration/production-notes/#platform-support-matrix).

[MongoDB Installation](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-debian/#install-mongodb-community-edition-on-debian):
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb http://repo.mongodb.org/apt/debian $(lsb_release -sc)/mongodb-org/7.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
```

NOTE: If at this point, mongod doesn't start or has an error, fix the permissions ([stackoverflow](https://stackoverflow.com/questions/64608581/mongodb-code-exited-status-14-failed-but-not-any-clear-errors/66107451#66107451)):
```bash
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown mongodb:mongodb /tmp/mongodb-27017.sock
sudo service mongod restart
```

[Enable authentication](https://www.mongodb.com/features/mongodb-authentication):
```bash
#NOTE: change "CHANGE-ME-YOUR-SECURE-MONGODB-PASSWORD" to something secure.
mongosh admin --eval "db.getSiblingDB('jschan').createUser({user: 'jschan', pwd: 'CHANGE-ME-YOUR-SECURE-MONGODB-PASSWORD', roles: [{role:'readWrite', db:'jschan'}]})"
sudo sh -c "cat > /etc/mongod.conf" <<'EOF'
storage:
  dbPath: /var/lib/mongodb
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
net:
  port: 27017
  bindIp: 127.0.0.1
processManagement:
  timeZoneInfo: /usr/share/zoneinfo
security:
  authorization: "enabled"
EOF

sudo systemctl restart mongod
#NOTE: to access to DB directly in future:
#mongosh "mongodb://jschan:CHANGE-ME-YOUR-SECURE-MONGODB-PASSWORD@127.0.0.1:27017/jschan"
```

**4. Install Redis**

[Redis Installation](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-debian-10):
```bash
sudo apt update -y
sudo apt install redis-server -y
sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf
sudo systemctl enable --now redis-server
```

Enable authentication:
```
echo "requirepass CHANGE-ME-YOUR-SECURE-REDIS-PASSWORD" | sudo tee -a /etc/redis/redis.conf
sudo systemctl restart redis-server
```

**5. Install Node.js**

For easy installation, use [node version manager](https://github.com/nvm-sh/nvm#installing-and-updating) "nvm":
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

Then run the following command to get the LTS version of nodejs.
```bash
nvm install --lts
```

Installing Node.js yourself without nvm is possible, but unsupported by this guide.

**6. (Optional) If you want a .onion address (Tor) and/or .loki address (Lokinet)**

Install Tor, setup a hidden service, and output your .onion address:
```bash
sudo apt install tor -y
sudo systemctl enable --now tor
sudo sh -c "cat > /etc/tor/torrc" <<'EOF'
HiddenServiceDir /var/lib/tor/jschan/
HiddenServiceVersion 3
HiddenServicePort 80 unix:/var/run/nginx-tor.sock
EOF

sudo systemctl restart tor
until [ -f /var/lib/tor/jschan/hostname ]
do
     sleep 1
done
sudo cat /var/lib/tor/jschan/hostname
```

Install Lokinet, setup a SNApp, and find your .loki address:
```bash
sudo curl -so /etc/apt/trusted.gpg.d/oxen.gpg https://deb.oxen.io/pub.gpg
echo "deb https://deb.oxen.io $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/oxen.list
sudo apt update -y
sudo apt install lokinet -y
sudo systemctl enable --now lokinet
sudo sh -c "cat > /var/lib/lokinet/lokinet.ini" <<'EOF'
[router]
[network]
keyfile=/var/lib/lokinet/snappkey.private
[paths]
[dns]
[bind]
[api]
[bootstrap]
[logging]
EOF

sudo systemctl restart lokinet
nslookup -type=cname localhost.loki # Your loki address is the "canonical name".
```

For Lokinet, make sure to firewall all ports except 80 on `lokitun0` interface. If you use `ufw` for example, you could do:
```bash
sudo ufw deny in on lokitun0 to any
sudo ufw allow in on lokitun0 to any port 80 proto tcp
```

Note down the .loki and .onion address for the next step.

**7. Setup nginx**

For standard installations, run `configs/nginx/nginx.sh`. This will prompt you for installation directory, domains, onion/lokinet, enable geoip, install a letsencrypt certificate with certbot and more:
```bash
wget https://raw.githubusercontent.com/fatchan/nginx-autoinstall/master/nginx-autoinstall.sh
chmod +x nginx-autoinstall.sh
sudo su
HEADLESS=y OPTION=1 NGINX_VER=STABLE SUBFILTER=y RTMP=y ./nginx-autoinstall.sh
echo "You can safely ignore that error about restarting nginx ^"
exit
rm nginx-autoinstall.sh
sudo bash configs/nginx/nginx.sh
```

For non-standard installations like using a CDN, see [configs/nginx/README.md](configs/nginx/README.md) and DIY.

**8. Get the backend setup & running**

1. Copy the example secrets file and edit it with your mongodb+redis credentials, cookie secrets, etc:
```bash
cp configs/secrets.js.example configs/secrets.js && editor configs/secrets.js
```

2. Edit the rules and FAQ page if desired:
```bash
editor views/custompages/faq.pug views/custompages/rules.pug
```

3. Install nodejs dependencies:
```bash
npm install
```

4. Replace `gulp/res/icons/master.png` with your desired favicon image.

5. Run the setup script. This will install `pm2` (nodejs process manager) and `gulp` (task system) and runs some gulp tasks.
```bash
npm run-script setup
```

6. Run gulp reset to initialize the database and folder structure, and create the admin account. **Default admin account with random password will be printed to the command line.** NOTE: dont run gulp reset again unless you want to completely irreversibly wipe everything.
```bash
gulp reset
```

7. Make pm2 a system service and load on system startup. **NOTE: This will also output some additional commands you need to run to complete the process. Read the command output carefully.**
```
pm2 startup
```

8. Start all the backend processes.
```bash
npm run-script start
gulp
pm2 save
```

Some commands you may need to use in future/find helpful:
- `pm2 list` - Lists running pm2 processes.
- `pm2 logs` - Start tailing logs.
- `pm2 reload ecosystem.config.js` - Reload all backend processes.
- `gulp password` - Reset the admin account password if you forgot it.
- `gulp` - Run the default gulp task.

More information and commands for customisation or advanced use is in the ADVANCED section.

**9. (Optional) if you plan to use the webring and want to make requests with a proxy to mask your origin server IP**

EITHER:

- Use the socks proxy provided by a non-docker tor daemon, which is probably already setup on port 9050 if you have tor installed for a hidden service.
- Install docker and run torproxy in a container: https://github.com/dperson/torproxy (of course, audit the docker image yourself).
- Use your own socks proxy

Either of the first two options will allow you to follow .onions in your webring follow list.

To enable the proxy, tick "Use Socks Proxy" in global management settings and set the appropriate proxy address, e.g. `socks5h://127.0.0.1:9050`, then save settings.

**10. All done!**

## Updating

0. `cd` to your jschan installation folder.

1. Stop the running backend:
```bash
pm2 stop ecosystem.config.js
```

2. (Optional) Update node.js to the latest LTS node version, latest npm, and reinstall global packages. NOTE: Only works if you installed node.js "nvm" as per the recommendation in the installation instructions.
```bash
nvm install --lts --reinstall-packages-from=$(node --version) --latest-npm
```

3. Pull the latest changes from git:
```bash
git pull
```

4. Install nodejs dependencies again in case any have updated or changed
```bash
npm install
```

5. Check if the nginx config needs updating, comparing the version you updated from with the current version:
```bash
git diff v0.9.2 v0.8.0 configs/nginx
```
If the output was blank, goto step 6.

If the output showed changes and you used `configs/nginx/nginx.sh` to setup nginx, run it again to reconfigure nginx and overwrite your old configuration.

If you have a non-standard nginx config, update your nginx config yourself.

6. Run the gulp migrate task. This will run "migrations" such as updating the database schema or file structure:
```bash
gulp migrate && gulp
```

7. Start the backend:
```bash
pm2 restart ecosystem.config.js --env production
```

At this point, your installation is updated. If something is broken, check and read the logs, they will help figure out what went wrong:
```bash
pm2 logs
```

## Help! Something didn't work!!!1!!1

If you are sure you did everything correctly and you still can't get it working, you can ask for help in the IRC (linked in [README](README.md)).

Be polite, be patient, ask [smart questions](http://www.catb.org/~esr/faqs/smart-questions.html), and keep in mind nobody is obliged to help you.

Paid support is available at a rate of $50USD/hr, payable in cryptocurrency (BTC/XMR) only. Email the address on my [Gitgud profile](https://gitgud.io/fatchan) to inquire.

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
