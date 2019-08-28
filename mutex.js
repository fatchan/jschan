'use strict';

const { Client } = require('live-mutex');

const mutexClient = new Client({ udsPath: process.env.HOME + '/.lmx/uds.sock' });
mutexClient.emitter.on('warning', console.error);

module.exports = mutexClient;
