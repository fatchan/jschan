'use strict';

const { readdirSync } = require('fs');

module.exports = {

	themes: readdirSync(__dirname+'/../gulp/res/css/themes/').map(x => x.substring(0,x.length-4)),

	codeThemes: readdirSync(__dirname+'/../node_modules/highlight.js/styles/').map(x => x.substring(0,x.length-4)),

}
