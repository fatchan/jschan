'use strict';

const { readdirSync } = require('fs');

module.exports = readdirSync(__dirname+'/../gulp/res/css/themes/').map(x => x.substring(0,x.length-4));
