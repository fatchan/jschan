'use strict';

const Boards = require(__dirname+'/../../db-models/boards.js');

module.exports = async (req, res) => {
    //get a list of boards
    let boards;
    try {
        boards = await Boards.find();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ 'message': 'Error fetching from DB' })
    }

    //render the page
    res.json(boards)
}
