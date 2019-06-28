'use strict';

const { buildBanners } = require(__dirname+'/../../helpers/build.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js');

module.exports = async (req, res, next) => {

    try {
		await buildBanners(res.locals.board);
    } catch (err) {
        return next(err);
    }

	return res.sendFile(`${uploadDirectory}html/${req.params.board}/banners.html`);

}
