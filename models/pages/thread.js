'use strict';

const { buildThread } = require(__dirname+'/../../helpers/build.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js');

module.exports = async (req, res, next) => {

    try {
		await buildThread(res.locals.thread.postId, res.locals.board);
    } catch (err) {
        return next(err);
	}

	return res.sendFile(`${uploadDirectory}html/${req.params.board}/thread/${req.params.id}.html`);

}
