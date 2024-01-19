const formatSize = require('./formatsize.js');

describe('formatSize() - convert bytes to human readable file size', () => {
	const cases = [
		{in: 1024, out: '1KB'},
		{in: Math.pow(1024, 2), out: '1MB'},
		{in: Math.pow(1024, 3), out: '1GB'},
		{in: Math.pow(1024, 4), out: '1TB'},
		{in: Math.pow(1024, 5), out: '1024TB'},
		{in: Math.pow(1024, 3)+(Math.pow(1024, 2)*512), out: '1.5GB'},
		{in: 100, out: '100B'},
		{in: 0, out: '0B'},
	];
	for (let i in cases) {
		test(`should output ${cases[i].out} for an input of ${cases[i].in} bytes`, () => {
			expect(formatSize(cases[i].in)).toBe(cases[i].out);
		});
	}
});
