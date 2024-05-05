const { existsBody, lengthBody, numberBody, numberBodyVariable,
	minmaxBody, inArrayBody, arrayInBody, checkSchema } = require('./schema.js');

describe('schema checking (input handling after paramconverter)', () => {

	const existsBodyCases = [
		{ in: { body: { test: 1 }, expected: true }, out: 0 },
		{ in: { body: { test: null }, expected: false }, out: 0 },
		{ in: { body: {}, expected: false }, out: 0 },
		{ in: { body: { test: 1 }, expected: false }, out: 1 },
		{ in: { body: { test: '' }, expected: true }, out: 0 },
	];
	for (let i in existsBodyCases) {
		test(`existsBody should output ${existsBodyCases[i].out} for an input of ${existsBodyCases[i].in.body.test}`, async () => {
			const result = await checkSchema([
				{ result: existsBody(existsBodyCases[i].in.body.test), expected: existsBodyCases[i].in.expected, error: 'error' },
			]);
			expect(result.length).toBe(existsBodyCases[i].out);
		});
	}

	const lengthBodyCases = [
		{ in: { body: { test: null }, expected: false }, out: 0 },
		{ in: { body: { test: '' }, expected: false }, out: 0 },
		{ in: { body: { test: null }, min: 1, expected: false }, out: 1 },
		{ in: { body: { test: '' }, min: 1, expected: false }, out: 1 },
		{ in: { body: { test: 'hello' }, expected: false }, out: 0 },
		{ in: { body: { test: 'hello' }, min: 0, max: 10, expected: false }, out: 0 },
		{ in: { body: { test: 'hello' }, min: 10, expected: false }, out: 1 },
		{ in: { body: { test: 'hellohellohello' }, min: 10, expected: false }, out: 0 },
		{ in: { body: { test: 'hellohellohello' }, min: 0, max: 10, expected: false }, out: 1 },
		{ in: { body: { test: 'hellohellohello' }, max: 10, expected: false }, out: 1 },
	];
	for (let i in lengthBodyCases) {
		test(`lengthBody should output ${lengthBodyCases[i].out} for an input of ${lengthBodyCases[i].in.body.test}`, async () => {
			const result = await checkSchema([
				{ result: lengthBody(lengthBodyCases[i].in.body.test, lengthBodyCases[i].in.min, lengthBodyCases[i].in.max), expected: lengthBodyCases[i].in.expected, error: 'error' },
			]);
			expect(result.length).toBe(lengthBodyCases[i].out);
		});
	}

	const numberBodyCases = [
		{ in: { body: { test: null }, expected: false }, out: 0 },
		{ in: { body: { test: 1 }, expected: true }, out: 0 },
		{ in: { body: { test: 10 }, max: 10, expected: true }, out: 0 },
		{ in: { body: { test: 11 }, max: 10, expected: true }, out: 1 },
		{ in: { body: { test: 9 }, min: 10, expected: true }, out: 1 },
		{ in: { body: { test: 10 }, min: 10, expected: true }, out: 0 },
	];
	for (let i in numberBodyCases) {
		test(`numberBody should output ${numberBodyCases[i].out} for an input of ${numberBodyCases[i].in.body.test}`, async () => {
			const result = await checkSchema([
				{ result: numberBody(numberBodyCases[i].in.body.test, numberBodyCases[i].in.min, numberBodyCases[i].in.max), expected: numberBodyCases[i].in.expected, error: 'error' },
			]);
			expect(result.length).toBe(numberBodyCases[i].out);
		});
	}

	const numberBodyVariableCases = [
		{ in: { body: { test: 5 }, minOld: 0, minNew: 0, maxOld: 10, maxNew: 5, expected: true }, out: 0 },
		{ in: { body: { test: 5 }, minOld: 0, minNew: 6, maxOld: 10, maxNew: 10, expected: true }, out: 1 },
	];
	for (let i in numberBodyVariableCases) {
		test(`numberBodyVariable should output ${numberBodyVariableCases[i].out} for an input of ${numberBodyVariableCases[i].in.body.test}`, async () => {
			const { body, minOld, minNew, maxOld, maxNew } = numberBodyVariableCases[i].in;
			const result = await checkSchema([
				{ result: numberBodyVariable(body.test, minOld, minNew, maxOld, maxNew), expected: numberBodyVariableCases[i].in.expected, error: 'error' },
			]);
			expect(result.length).toBe(numberBodyVariableCases[i].out);
		});
	}

	const minmaxBodyCases = [
		{ in: { a: 0, b: 100, expected: true }, out: 0 },
		{ in: { a: 101, b: 100, expected: true }, out: 1 },
	];
	for (let i in minmaxBodyCases) {
		test(`minmaxBody should output ${minmaxBodyCases[i].out} for an input of ${minmaxBodyCases[i].in}`, async () => {
			const { a, b, expected } = minmaxBodyCases[i].in;
			const result = await checkSchema([
				{ result: minmaxBody(a, b), expected, error: 'error' },
			]);
			expect(result.length).toBe(minmaxBodyCases[i].out);
		});
	}

	const inArrayBodyCases = [
		{ in: { a: null, b: ['a', 'b', 'c'], expected: false }, out: 0 },
		{ in: { a: 'x', b: [], expected: false }, out: 0 },
		{ in: { a: 'x', b: ['a', 'b', 'c'], expected: false }, out: 0 },
		{ in: { a: 'a', b: ['a', 'b', 'c'], expected: true }, out: 0 },
		{ in: { a: null, b: new Set(['a', 'b', 'c']), expected: false }, out: 0 },
		{ in: { a: 'x', b: new Set(), expected: false }, out: 0 },
		{ in: { a: 'x', b: new Set(['a', 'b', 'c']), expected: false }, out: 0 },
		{ in: { a: 'a', b: new Set(['a', 'b', 'c']), expected: true }, out: 0 },
	];
	for (let i in inArrayBodyCases) {
		test(`inArrayBody should output ${inArrayBodyCases[i].out} for an input of ${inArrayBodyCases[i].in}`, async () => {
			const { a, b, expected } = inArrayBodyCases[i].in;
			const result = await checkSchema([
				{ result: inArrayBody(a, b), expected, error: 'error' },
			]);
			expect(result.length).toBe(inArrayBodyCases[i].out);
		});
	}

	const arrayInBodyCases = [
		{ in: { a: null, b: ['a', 'b', 'c'], expected: false }, out: 0 },
		{ in: { a: 'x', b: [], expected: false }, out: 0 },
		{ in: { a: 'x', b: ['a', 'b', 'c'], expected: false }, out: 0 },
		{ in: { a: 'a', b: ['a', 'b', 'c'], expected: true }, out: 0 },
	];
	for (let i in arrayInBodyCases) {
		test(`arrayInBody should output ${arrayInBodyCases[i].out} for an input of ${arrayInBodyCases[i].in}`, async () => {
			const { a, b, expected } = arrayInBodyCases[i].in;
			const result = await checkSchema([
				{ result: arrayInBody(b, a), expected, error: 'error' },
			]);
			expect(result.length).toBe(arrayInBodyCases[i].out);
		});
	}

});
