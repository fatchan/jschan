'use strict';

const Posts = require(__dirname+'/../../db/posts.js')
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, writePageHTML = require(__dirname+'/../../helpers/writepagehtml.js');

module.exports = async (req, res, next) => {

	// get all threads
    let threads;
	let pageURL;
    try {
        threads = await Posts.getCatalog(req.params.board);
		pageURL = `${req.params.board}/catalog.html`;
		await writePageHTML(pageURL, 'catalog.pug', {
			board: res.locals.board,
			threads: threads || [],
		});
    } catch (err) {
        return next(err);
    }

	return res.sendFile(`${uploadDirectory}html/${pageURL}`);

}
