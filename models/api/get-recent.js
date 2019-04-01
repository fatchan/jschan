'use strict';

const Posts = require(__dirname+'/../../db-models/posts.js');

module.exports = async (req, res) => {
    //get the recently bumped thread & preview posts
    let threads;
    try {
        threads = await Posts.getRecent(req.params.board, req.params.page || 1);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ 'message': 'Error fetching from DB' });
    }

    if (!threads || threads.lenth === 0) {
        return res.status(404).json({ 'message': 'Not found' });
    }

    return res.json(threads);
}
