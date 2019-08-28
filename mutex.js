'use strict';

const { Client } = require('live-mutex');

module.exports = new Client({ udsPath: process.env.HOME + '/.lmx/uds.sock' });
