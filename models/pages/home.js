'use strict';

const Boards = require(__dirname+'/../../db/boards.js');

module.exports = async (req, res, next) => {

	//get a list of boards
	let boards;
	try {
		boards = await Boards.find();
	} catch (err) {
		return next(err);
	}

	res.render('home',  { boards });

}
