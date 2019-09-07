'use strict';

module.exports = {

	before: {
		allowedTags: [],
		allowedAttributes: {}
	},

	after: {
		allowedTags: [ 'span', 'a', 'em', 'strong', 'img', 'small'],
		allowedAttributes: {
			'a': [ 'href', 'rel', 'class', 'referrerpolicy', 'target' ],
			'span': [ 'class' ],
			'img': ['src', 'height', 'width']
		}
	}

}
