'use strict';

//https://stackoverflow.com/a/4413721
module.exports = (startDate, stopDate) => {
	const dateArray = new Array();
    let currentDate = startDate;
    while (currentDate <= stopDate) {
        dateArray.push(new Date (currentDate.valueOf()));
		currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
}
