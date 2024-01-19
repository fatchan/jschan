const linkmatch = require('./linkmatch.js');
/* eslint-disable no-useless-escape */
const linkRegex = /\[(?<label>[^\[][^\]]*?)\]\((?<url>(?:&#x2F;[^\s<>\[\]{}|\\^)]+|https?\:&#x2F;&#x2F;[^\s<>\[\]{}|\\^)]+))\)|(?<urlOnly>https?\:&#x2F;&#x2F;[^\s<>\[\]{}|\\^]+)/g;
const Permission = require('../../../permission/permission.js');
const ROOT = new Permission();
ROOT.setAll(Permission.allPermissions);
const NO_PERMISSION = new Permission();

describe('link markdown', () => {

	const rootCases = [
		{ in: 'http:&#x2F;&#x2F;something.com', out: 'href=' },
		{ in: 'https:&#x2F;&#x2F;something.com', out: 'href=' },
		{ in: '[test](http:&#x2F;&#x2F;something.com)', out: '>test</a>' },
		{ in: '[test](https:&#x2F;&#x2F;something.com)', out: '>test</a>' },
		{ in: 'http:&#x2F;&#x2F;', out: 'http:&#x2F;&#x2F;' },
		{ in: 'https:&#x2F;&#x2F;', out: 'https:&#x2F;&#x2F;' },
	];

	for (let i in rootCases) {
		test(`should contain ${rootCases[i].out} for an input of ${rootCases[i].in}`, () => {
			expect(rootCases[i].in.replace(linkRegex, linkmatch.bind(null, ROOT))).toContain(rootCases[i].out);
		});
	}

	const cases = [
		{ in: 'http:&#x2F;&#x2F;something.com', out: 'href=' },
		{ in: 'https:&#x2F;&#x2F;something.com', out: 'href=' },
		{ in: '[http:&#x2F;&#x2F;something.com](test)', out: '>http:&#x2F;&#x2F;something.com</a>' },
		{ in: '[https:&#x2F;&#x2F;something.com](test)', out: '>https:&#x2F;&#x2F;something.com</a>' },
		{ in: 'http:&#x2F;&#x2F;', out: 'http:&#x2F;&#x2F;' },
		{ in: 'https:&#x2F;&#x2F;', out: 'https:&#x2F;&#x2F;' },
	];

	for (let i in cases) {
		test(`should contain ${cases[i].out} for an input of ${cases[i].in}`, () => {
			expect(cases[i].in.replace(linkRegex, linkmatch.bind(null, NO_PERMISSION))).toContain(cases[i].out);
		});
	}

});
