'use strict';

const { Posts, Bans } = require(__dirname+'/../../db/')
	, getTripCode = require(__dirname+'/../../helpers/posting/tripcode.js')
	, linkQuotes = require(__dirname+'/../../helpers/posting/quotes.js')
	, { markdown } = require(__dirname+'/../../helpers/posting/markdown.js')
	, sanitizeOptions = require(__dirname+'/../../helpers/posting/sanitizeoptions.js')
	, sanitize = require('sanitize-html')
	, nameRegex = /^(?<name>(?!##).*?)?(?:##(?<tripcode>[^ ]{1}.*?))?(?<capcode>##(?<capcodetext> .*?)?)?$/
	, { strictFiltering } = require(__dirname+'/../../configs/main.js')
	, buildQueue = require(__dirname+'/../../queue.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, { buildThread } = require(__dirname+'/../../helpers/tasks.js');

module.exports = async (req, res, next) => {

	//filters
	if (res.locals.permLevel > 1) { //global staff bypass filters
		//apply global filters (and local if in future to allow OPs to edit their post? and a board option to disable OP editing)
	}

	//get name with tripcode

	//remarkup post
	//find intersection of old and new quotes
	//unlink any quotes that dont exist anymore

	//apply edited object
	//{ username: '', date: new Date() }

	//update the post
	const postId = await Posts.updateOne({
		//query
	}, {
		//new post data
	});

	//rebuild thread
	//redirect
	//rebuild index page
	//if OP, rebuild catalog

}
