FROM node:16

RUN apt-get update -y
RUN apt-get install ffmpeg imagemagick graphicsmagick -y

WORKDIR /opt

COPY . .

RUN npm install

RUN npm install -g pm2 gulp

RUN rm /opt/gulp/res/js/socket.io.js

COPY ./docker/jschan/secrets.js ./configs/secrets.js

CMD ["/bin/sh", "-c", "gulp; pm2-runtime start ecosystem.config.js"]
