'use strict';

const { buildCatalog } = require(__dirname+'/../../helpers/build.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js');

module.exports = async (req, res, next) => {

    try {
		await buildCatalog(res.locals.board);
    } catch (err) {
        return next(err);
    }

	return res.sendFile(`${uploadDirectory}html/${req.params.board}/catalog.html`);

}
