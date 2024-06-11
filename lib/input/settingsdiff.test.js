const { getDotProp, includeChildren, compareSettings } = require('./settingsdiff.js');

describe('getDotProp, includeChildren, compareSettings in settingsdiff', () => {

	const getDotPropCases = [
		{ in: { object: {a:{b:{c:1}}}, prop: 'a.b.c' }, out: 1 },
		{ in: { object: {a:null}, prop: 'a.b.c' }, out: null },
		{ in: { object: {}, prop: 'a.b.c' }, out: null },
	];
	for (let i in getDotPropCases) {
		test(`getDotProp should output ${getDotPropCases[i].out} for an input of ${getDotPropCases[i].in}`, () => {
			expect(getDotProp(getDotPropCases[i].in.object, getDotPropCases[i].in.prop)).toStrictEqual(getDotPropCases[i].out);
		});
	}

	const includeChildrenCases = [
		{ in: { object: {a:{b:1,c:2,d:3},a2:{b:'notme'}}, prop: 'a' }, out: {'a.b':['example'], 'a.c':['example'], 'a.d':['example']} },
		{ in: { object: null, prop: 'a' }, out: {} },
		{ in: { object: {a:null}, prop: 'a' }, out: {} },
	];
	for (let i in includeChildrenCases) {
		test(`includeChildren should output ${includeChildrenCases[i].out} for an input of ${includeChildrenCases[i].in}`, () => {
			expect(includeChildren(includeChildrenCases[i].in.object, includeChildrenCases[i].in.prop, ['example'])).toStrictEqual(includeChildrenCases[i].out);
		});
	}

	const compareSettingsCases = [
		{
			in: {
				entries: [['a.b.c',['1']]],
				old: {a:{b:{c:1,d:2}}},
				new: {a:{b:{c:1,d:2}}},
			},
			out: new Set(),
		},
		{
			in: {
				entries: [['a.b.c',['1']]],
				old: {a:{b:{c:1,d:2}}},
				new: {a:{b:{c:1,d:3}}},
			},
			out: new Set(),
		},
		{
			in: {
				entries: [['a.b.c',['1']]],
				old: {a:{b:{c:1,d:2}}},
				new: {a:{b:{c:2,d:2}}},
			},
			out: new Set(['1']),
		},
	];
	for (let i in compareSettingsCases) {
		test(`compareSettings should output ${compareSettingsCases[i].out} for an input of ${compareSettingsCases[i].in}`, () => {
			expect(compareSettings(compareSettingsCases[i].in.entries, compareSettingsCases[i].in.old, compareSettingsCases[i].in.new, 4)).toStrictEqual(compareSettingsCases[i].out);
		});
	}

});
