FROM node:16

RUN apt-get update -y
RUN apt-get install ffmpeg imagemagick graphicsmagick -y

WORKDIR /opt

COPY . .

RUN npm install

RUN npm install -g pm2 gulp

COPY ./docker/jschan/secrets.js ./configs/secrets.js

#i fucking hate docker
ENV MONGO_USERNAME jschan
ENV MONGO_PASSWORD changeme
ENV REDIS_PASSWORD changeme

RUN gulp generate-favicon

CMD ["/bin/sh", "-c", "gulp; pm2-runtime start ecosystem.config.js"]
