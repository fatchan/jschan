'use strict';

const Boards = require(__dirname+'/../../db/boards.js')
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, writePageHTML = require(__dirname+'/../../helpers/writepagehtml.js');

module.exports = async (req, res, next) => {

	//get a list of boards
	let boards;
	try {
		boards = await Boards.find();
		await writePageHTML('index.html', 'home.pug', { boards });
	} catch (err) {
		return next(err);
	}

	return res.sendFile(`${uploadDirectory}html/index.html`);

}
