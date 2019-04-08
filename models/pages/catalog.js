'use strict';

const Posts = require(__dirname+'/../../db-models/posts.js');

module.exports = async (req, res, next) => {

	// get all threads
    let threads;
    try {
        threads = await Posts.getCatalog(req.params.board);
    } catch (err) {
		console.error(err);
        return next();
    }

    //render the page
    res.render('catalog', {
		threads: threads || [],
    });

}
