const randomRange = require('./randomrange.js');

describe('randomRange() - return number with secure crypto', () => {

	const cases = [
		{ in: { min: 0, max: 10 } },
		{ in: { min: 0.5, max: 1 } },
		{ in: { min: 0, max: 1000 } },
		{ in: { min: -1, max: 10 } },
		{ in: { min: 0, max: 0 } },
		{ in: { min: 1000, max: 1000 } },
	];
	for(let i in cases) {
		test(`randomRange should output ${cases[i].in.min}<=out<=${cases[i].in.max} for an input of ${cases[i].in.min}, ${cases[i].in.max}`, async () => {
			const output = await randomRange(cases[i].in.min, cases[i].in.max);
			expect(output).toBeGreaterThanOrEqual(Math.floor(cases[i].in.min));
			expect(output).toBeLessThanOrEqual(Math.floor(cases[i].in.max));
		});
	}

});
