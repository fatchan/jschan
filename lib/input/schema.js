'use strict';

module.exports = {

//TODO: move some other checks here? like isAlphaNumeric would be a good example

	//just whether it exists, for stuff like checkboxes where the value doesnt matter
	existsBody: (data) => {
		return data != null;
	},

	//check length of input, for strings or multi-select options
	lengthBody: (data, minlength=0, maxlength=Infinity) => {
		if (!data) {
			return minlength > 0;
		} else {
			return (data.length < minlength || data.length > maxlength);
		}
	},

	//checks if data is a number and within a range
	numberBody: (data, min=0, max=Infinity) => {
		return typeof data === 'number' && (min <= data && max >= data);
	},

	//same, but with old/new fallbacks for settings that can adjust a dependency at same time
	numberBodyVariable: (data, minOld, minNew, maxOld, maxNew) => {
		if (minNew == null) {
			minNew = minOld;
		}
		if (maxNew == null) {
			maxNew = maxOld;
		}
		let varMin = minNew;
		if (isNaN(varMin)) {
			varMin = minOld;
		}
		let varMax = maxNew;
		if (isNaN(varMax)) {
			varMax = maxOld;
		}
		return typeof data === 'number' && (varMin <= data && varMax >= data);
	},

	//check 2 number values, that one is less than the other, usually for setings with a min and max that they dont violate eachother
	minmaxBody: (minData, maxData) => {
		return typeof minData === 'number' && typeof maxData === 'number' && minData < maxData;
	},

	//check if value is included in a set or array, usually for blacklist or whitelist
	inArrayBody: (data, list) => {
		return data !== null && list[list.constructor.name === 'Array' ? 'includes' : 'has'](data);
	},

	//the opposite kinda, check if the data includes any of the values in the array
	arrayInBody: (filters, data) => {
		return data !== null && filters.some(filter => data.includes(filter));
	},

	//check the actual schema
	checkSchema: async (schema, permissions) => {
		const errors = [];
		//filter to checks with no permission or ones we dont have permission to skip.
		let filteredSchema = schema;
		if (permissions) {
			filteredSchema = filteredSchema.filter(c => c.permission == null || !permissions.get(c.permission));
		}
		for (let check of filteredSchema) {
			const result = await (typeof check.result === 'function' ? check.result() : check.result);
			const expected = (check.expected || false);
			if (result !== expected) {
				errors.push(check.error);
				if (check.blocking === true) {
					break; //errors that you want to stop and not bother checking the rest
				}
			}
		}
		return errors;
	},

};
