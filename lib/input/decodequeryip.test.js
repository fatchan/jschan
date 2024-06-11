const decodeQueryIp = require('./decodequeryip.js');
const Permission = require('../permission/permission.js');
const ROOT = new Permission();
ROOT.setAll(Permission.allPermissions);
const NO_PERMISSION = new Permission();

describe('decode query ip', () => {

	const cases = [
		{ in: { query: null, permission: ROOT }, out: null },
		{ in: { query: {}, permission: ROOT }, out: null },
		{ in: { query: { ip: '10.0.0.1' }, permission: ROOT }, out: '10.0.0.1' },
		{ in: { query: { ip: '10.0.0.1' }, permission: NO_PERMISSION }, out: null },
		{ in: { query: { ip: '8s7AGX4n.qHsw9mp.uw54Nfl.IP' }, permission: ROOT }, out: '8s7AGX4n.qHsw9mp.uw54Nfl.IP' },
		{ in: { query: { ip: '8s7AGX4n.qHsw9mp.uw54Nfl.IP' }, permission: NO_PERMISSION }, out: '8s7AGX4n.qHsw9mp.uw54Nfl.IP' },
	];

	for (let i in cases) {
		test(`should output ${cases[i].out} for an input of ${cases[i].in}`, () => {
			expect(decodeQueryIp(cases[i].in.query, cases[i].in.permission)).toStrictEqual(cases[i].out);
		});
	}

});
