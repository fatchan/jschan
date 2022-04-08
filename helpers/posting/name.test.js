const name = require('./name.js');
const Permission = require('../permission.js')
const Permissions = require('../permissions.js')
const ROOT = new Permission();
ROOT.setAll(Permission.allPermissions);

describe('name/trip/capcode handler', () => {

	const cases = [
		{ in: '## Admin', out: { name: 'Anon', tripcode: null, capcode: '## Admin' } },
		{ in: '## Global Staff', out: { name: 'Anon', tripcode: null, capcode: '## Global Staff' } },
		{ in: '## Board Owner', out: { name: 'Anon', tripcode: null, capcode: '## Admin' } },
		{ in: '## Board Mod', out: { name: 'Anon', tripcode: null, capcode: '## Admin' } },
		{ in: '##', out: { name: 'Anon', tripcode: null, capcode: '## Admin' } },
		{ in: '', out: { name: 'Anon', tripcode: null, capcode: null } },
		{ in: 'test', out: { name: 'test', tripcode: null, capcode: null } },
		{ in: 'test#12345', out: { name: 'test', tripcode: '!CSZ6G0yP9Q', capcode: null } },
		{ in: '#12345', out: { name: 'Anon', tripcode: '!CSZ6G0yP9Q', capcode: null } },
		{ in: '#12345## Admin', out: { name: 'Anon', tripcode: '!CSZ6G0yP9Q', capcode: '## Admin' } },
		{ in: 'test#12345## Admin', out: { name: 'test', tripcode: '!CSZ6G0yP9Q', capcode: '## Admin' } },
	];

	for(let i in cases) {
		test(`should contain ${cases[i].out.capcode} for an input of ${cases[i].in}`, async () => {
			const output = await name(cases[i].in, ROOT, {forceAnon: false, defaultName: 'Anon'}, 'a', {a:ROOT}, 'b')
			expect(output).toStrictEqual(cases[i].out)
		});
	}


});
