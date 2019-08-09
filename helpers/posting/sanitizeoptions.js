'use strict';

module.exports = {

	before: {
		allowedTags: [],
		allowedAttributes: {}
	},

	after: {
		allowedTags: [ 'span', 'a', 'em', 'strong', 'small' ],
		allowedAttributes: {
			'a': [ 'href', 'class', 'referrerpolicy', 'target' ],
			'span': [ 'class' ]
		}
	}

}
