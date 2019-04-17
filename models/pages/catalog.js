'use strict';

const Posts = require(__dirname+'/../../db/posts.js');

module.exports = async (req, res, next) => {

	// get all threads
    let threads;
    try {
        threads = await Posts.getCatalog(req.params.board);
    } catch (err) {
        return next(err);
    }

    //render the page
    res.render('catalog', {
		threads: threads || [],
    });

}
