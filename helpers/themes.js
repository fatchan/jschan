'use strict';

const { readdirSync } = require('fs-extra')
	, { themes, codeThemes } = require(__dirname+'/../config.js').get;

module.exports = {

	themes: themes.length > 0 ? themes : readdirSync(__dirname+'/../gulp/res/css/themes/').map(x => x.substring(0,x.length-4)),

	codeThemes: codeThemes.length > 0 ? codeThemes : readdirSync(__dirname+'/../node_modules/highlight.js/styles/').map(x => x.substring(0,x.length-4)),

}
