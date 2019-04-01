'use strict';

const Posts = require(__dirname+'/../../db-models/posts.js');

module.exports = async (req, res) => {
    //get the recently bumped thread & preview posts
    let data;
    try {
        data = await Posts.getCatalog(req.params.board);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ 'message': 'Error fetching from DB' });
    }

    if (!data) {
        return res.status(404).json({ 'message': 'Not found' });
    }

    return res.json(data)
}
