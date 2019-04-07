'use strict';

const Boards = require(__dirname+'/../../db-models/boards.js');

module.exports = async (req, res, next) => {

	//get a list of boards
	let boards;
	try {
		boards = await Boards.find();
	} catch (err) {
		console.error(err)
		return next();
	}

	//render the page
	res.render('home', {
		boards: boards
	});
}
