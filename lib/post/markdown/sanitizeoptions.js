'use strict';

module.exports = {

	before: {
		allowedTags: [],
		allowedAttributes: {}
	},

	after: {
		allowedTags: [ 'span', 'a', 'img', 'small'],
		allowedAttributes: {
			'a': [ 'href', 'rel', 'class', 'referrerpolicy', 'target' ],
			'span': [ 'class' ],
			'img': ['src', 'height', 'width', 'alt', 'title', 'class']
		}
	}

};
