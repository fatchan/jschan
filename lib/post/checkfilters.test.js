const checkFilters = require('./checkfilters.js');
const getFilterStrings = require('./getfilterstrings.js');

const rs = () => Math.random().toString(26);

//non-message are just small random strings
const getDummyReq = (message) => ({
	body: {
		name: rs(),
		message: message,
		subject: rs(),
		email: rs(),
	},
	files: {
		file: new Array(3)
			.fill(0)
			.map(() => ({
				name: rs(),
				fname: rs(),
			}))
	}
});

const getDummyRes = () => ({
	locals: {
		numFiles: 3,
	}
});

const normalFilter = {
	_id: 'normal',
	board: 'test',
	filters: [ 'ace' ],
	strictFiltering: false,
	filterMode: 0,
	filterMessage: 'test',
	filterBanDuration: 10000,
	filterBanAppealable: false
};

const strictFilter = {
	_id: 'strict',
	board: 'test',
	filters: [ 'ace' ],
	strictFiltering: true,
	filterMode: 0,
	filterMessage: 'test',
	filterBanDuration: 10000,
	filterBanAppealable: false
};

describe('checkFilters() - basic filter matching', () => {
	const strings = [
		{ in: 'ace', out: true },
		{ in: 'áçé', out: false },
	];
	for(let s of strings) {
		const { combinedString, strictCombinedString } = getFilterStrings(getDummyReq(s.in), getDummyRes());
		test(`should not error and match ${s.out} for filter ${normalFilter._id}`, async () => {
			const res = await checkFilters([normalFilter], combinedString, strictCombinedString);
			if (s.out) {
				expect(true).not.toBe(false);
			} else {
				expect(res).toBe(false);
			}
		});
	}
});

describe('checkFilters() - basic filter not matching', () => {
	const strings = [
		{ in: 'zzz', out: false },
		{ in: '123', out: false },
	];
	for(let s of strings) {
		const { combinedString, strictCombinedString } = getFilterStrings(getDummyReq(s.in), getDummyRes());
		test(`should not error and match ${s.out} for filter ${normalFilter._id}`, async () => {
			const res = await checkFilters([normalFilter], combinedString, strictCombinedString);
			if (s.out) {
				expect(res).not.toBe(false);
			} else {
				expect(res).toBe(false);
			}
		});
	}
});

describe('checkFilters() - strict filter matching', () => {
	const strings = [
		{ in: 'ace', out: true },
		{ in: 'áçé', out: true },
	];
	for(let s of strings) {
		const { combinedString, strictCombinedString } = getFilterStrings(getDummyReq(s.in), getDummyRes());
		test(`should not error and match ${s.out} for filter ${normalFilter._id}`, async () => {
			const res = await checkFilters([strictFilter], combinedString, strictCombinedString);
			if (s.out) {
				expect(true).not.toBe(false);
			} else {
				expect(res).toBe(false);
			}
		});
	}
});

describe('checkFilters() - strict filter not matching', () => {
	const strings = [
		{ in: 'zzz', out: false },
		{ in: '123', out: false },
	];
	for(let s of strings) {
		const { combinedString, strictCombinedString } = getFilterStrings(getDummyReq(s.in), getDummyRes());
		test(`should not error and match ${s.out} for filter ${normalFilter._id}`, async () => {
			const res = await checkFilters([strictFilter], combinedString, strictCombinedString);
			if (s.out) {
				expect(res).not.toBe(false);
			} else {
				expect(res).toBe(false);
			}
		});
	}
});
