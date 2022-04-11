'use strict';

const { readdirSync } = require('fs-extra')
	, config = require(__dirname+'/config.js')
	, { addCallback } = require(__dirname+'/../redis/redis.js')
	, updateThemes = () => {
		const { themes, codeThemes } = config.get;
		module.exports.themes = themes.length > 0 ? themes : readdirSync(__dirname+'/../../gulp/res/css/themes/').filter(x => x.endsWith('.css')).map(x => x.substring(0,x.length-4));
		module.exports.codeThemes = codeThemes.length > 0 ? codeThemes : readdirSync(__dirname+'/../../node_modules/highlight.js/styles/').filter(x => x.endsWith('.css')).map(x => x.substring(0,x.length-4));
	};

updateThemes();
addCallback('config', updateThemes);
