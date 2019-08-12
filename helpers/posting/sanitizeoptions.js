'use strict';

module.exports = {

	before: {
		allowedTags: [],
		allowedAttributes: {}
	},

	after: {
		allowedTags: [ 'span', 'a', 'em', 'strong', 'img'],
		allowedAttributes: {
			'a': [ 'href', 'class', 'referrerpolicy', 'target' ],
			'span': [ 'class' ],
			'img': ['src', 'height', 'width']
		}
	}

}
