'use strict';

const Boards = require(__dirname+'/../../db-models/boards.js');

module.exports = async (req, res) => {
	//get a list of boards
	let boards;
	try {
		boards = await Boards.find();
	} catch (err) {
		return next(err);
	}

	//render the page
	res.render('home', {
		boards: boards
	});
}
