'use strict';

/* planned schema would be array of smth like this:
{
	func: <check function, either predefined, some other check like isAlphaNumeric, or a custom callback>,
	expected: <true or false>
	error: <error text>,
	permLevel: [optional perm level],
}
*/

module.exports = {

//TODO: move some other checks here? like isAlphaNumeric would be a good example

	//check length of string or array
	lengthBody: (data, minlength=0, maxlength=Infinity) => {
		return data && (data.length < minlength || data.length > maxlength);
	},

	//checks if data is a number and within a range
	numberBody: (data, min=0, max=Infinity) => {
		return typeof data === 'number' && (data < min || data > max);
	},

	//check 2 number values, that one is less than the other, usually for setings with a min and max that they dont violate eachother
	minmaxBody: (minData, maxData) => {
		return typeof minData === 'number' && typeof maxData === 'number' && minData < maxData;
	},

	//check if value is included in a set or array, usually for blacklist or whitelist
	inArrayBody: (data, list) => {
		return data && list[list.constructor.name === 'Array' ? 'includes' : 'has'](data);
	},

	//the opposite kinda, check if the data includes any of the values in the array
	arrayInBody: (filters, data) => {
		return filters.some(filter => data.includes(filter));
	},

	//check the actual schema
	checkSchema: async (schema, permLevel) => {
		const errors = [];
		//filter check if my perm level is lower than the requirement. e.g. bypass filters checks
		const filteredSchema = schema.filter(c => c.permLevel > permLevel);
		for (check of filteredSchema) {
			const result = await check.func();
			if (result !== check.expected) {
				errors.push(check.error);
			}
		}
		return errors;
	},

};
