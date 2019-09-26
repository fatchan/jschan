'use strict';

const uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, { remove } = require('fs-extra')
	, { Posts } = require(__dirname+'/../../db/')
	, linkQuotes = require(__dirname+'/../../helpers/posting/quotes.js')
	, simpleMarkdown = require(__dirname+'/../../helpers/posting/markdown.js')
	, sanitize = require('sanitize-html')
	, sanitizeOptions = require(__dirname+'/../../helpers/posting/sanitizeoptions.js');


module.exports = async (req, res) => {

	const threadIds = new Set(res.locals.posts.filter(p => p.thread == null).map(p => p.postId));
    if (threadIds.size > 0) {
		//threads moved, so their html/json doesnt need to exist anymore
        await Promise.all([...threadIds].map(thread => {
            remove(`${uploadDirectory}html/${thread.board}/thread/${thread.postId}.html`)
            remove(`${uploadDirectory}json/${thread.board}/thread/${thread.postId}.json`)
        }));
    }

/*
TODO: make posts get remarked up
1. for all posts selected, use their QUOTES and remove BACKLINKS from quoted posts
2. move the posts
3. remarkup/link all the posts

and will need to refactor the code in deletepost model to make it fit for both delete or moving without much duplication
*/

	const postMongoIds = res.locals.posts.map(x => x._id);
	const movedPosts = await Posts.move(postMongoIds, req.body.move_to_thread).then(result => result.modifiedCount);

	const ret = {
		message: 'Moved posts',
		action: movedPosts > 0,
	};

	return ret;

}
