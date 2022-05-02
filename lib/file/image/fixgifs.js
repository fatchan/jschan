'use strict';

module.exports = (file) => {
	//handle gifs with multiple geometry and size
	if (Array.isArray(file.geometry)) {
		file.geometry = file.geometry[0];
	}
	if (Array.isArray(file.sizeString)) {
		file.sizeString = file.sizeString[0];
	}
	if (Array.isArray(file.geometryString)) {
		file.geometryString = file.geometryString[0];
	}
	return file;
};
