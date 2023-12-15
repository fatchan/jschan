const { relativeString, relativeColor, durationString } = require('./timeutils.js');

describe('timeutils relativeString, relativeColor, durationString', () => {

	const i18n = require(__dirname+'/../locale/locale.js');
	i18n.setLocale('en-GB');

	const relativeStringCases = [
		{ in: { start: new Date('2022-04-07T08:00:00.000Z'), end: new Date('2022-04-07T08:00:00.000Z') }, out: 'Now'},
		{ in: { start: new Date('2022-04-07T08:01:00.000Z'), end: new Date('2022-04-07T08:00:00.000Z') }, out: '1 minute ago'},
		{ in: { start: new Date('2022-04-07T08:01:29.000Z'), end: new Date('2022-04-07T08:00:00.000Z') }, out: '1 minute ago'},
		{ in: { start: new Date('2022-04-07T08:01:30.000Z'), end: new Date('2022-04-07T08:00:00.000Z') }, out: '2 minutes ago'},
		{ in: { start: new Date('2022-04-07T08:00:00.000Z'), end: new Date('2022-04-07T08:02:00.000Z') }, out: '2 minutes from now'},
		{ in: { start: new Date('2022-04-07T11:00:00.000Z'), end: new Date('2022-04-07T08:00:00.000Z') }, out: '3 hours ago'},
		{ in: { start: new Date('2022-04-10T08:00:00.000Z'), end: new Date('2022-04-07T08:00:00.000Z') }, out: '3 days ago'},
		{ in: { start: new Date('2022-04-28T08:00:00.000Z'), end: new Date('2022-04-07T08:00:00.000Z') }, out: '3 weeks ago'},
		{ in: { start: new Date('2022-07-07T08:00:00.000Z'), end: new Date('2022-04-07T08:00:00.000Z') }, out: '3 months ago'},
		{ in: { start: new Date('2022-07-08T08:00:00.000Z'), end: new Date('2022-04-07T08:00:00.000Z') }, out: '3 months ago'},
		{ in: { start: new Date('2022-07-25T08:00:00.000Z'), end: new Date('2022-04-07T08:00:00.000Z') }, out: '4 months ago'},
		{ in: { start: new Date('2023-04-07T08:00:00.000Z'), end: new Date('2022-04-07T08:00:00.000Z') }, out: '1 year ago'},
		{ in: { start: new Date('2032-04-07T08:00:00.000Z'), end: new Date('2022-04-07T08:00:00.000Z') }, out: '10 years ago'},
		{ in: { start: new Date('2132-04-07T08:00:00.000Z'), end: new Date('2022-04-07T08:00:00.000Z') }, out: '110 years ago'},
		{ in: { end: new Date('2132-04-07T08:00:00.000Z'), start: new Date('2022-04-07T08:00:00.000Z') }, out: '110 years from now'},
	];
	for(let i in relativeStringCases) {
		test(`relativeString should output ${relativeStringCases[i].out} for an input of ${relativeStringCases[i].in}`, () => {
			expect(relativeString(relativeStringCases[i].in.start, relativeStringCases[i].in.end, i18n)).toStrictEqual(relativeStringCases[i].out);
		});
	}

	const relativeColorCases = [
		{ in: { start: new Date('2022-04-07T08:00:00.000Z'), end: new Date('2022-04-07T08:00:00.000Z') }, out: '#0098ff'},
		{ in: { start: new Date('2022-04-10T08:00:00.000Z'), end: new Date('2022-04-07T08:00:00.000Z') }, out: '#d9aa00'},
		{ in: { start: new Date('2023-04-07T08:00:00.000Z'), end: new Date('2022-04-07T08:00:00.000Z') }, out: '#000000'},
		{ in: { start: new Date('2032-04-07T08:00:00.000Z'), end: new Date('2022-04-07T08:00:00.000Z') }, out: '#000000'},
		{ in: { start: new Date('2132-04-07T08:00:00.000Z'), end: new Date('2022-04-07T08:00:00.000Z') }, out: '#000000'},
		{ in: { end: new Date('2132-04-07T08:00:00.000Z'), start: new Date('2022-04-07T08:00:00.000Z') }, out: '#0098ff'},
	];
	for(let i in relativeColorCases) {
		test(`relativeColor should output ${relativeColorCases[i].out} for an input of ${relativeColorCases[i].in}`, () => {
			expect(relativeColor(relativeColorCases[i].in.start, relativeColorCases[i].in.end)).toStrictEqual(relativeColorCases[i].out);
		});
	}

	const durationStringCases = [
		{ in: 0*1000, out: '00:00' },
		{ in: 10*1000, out: '00:10' },
		{ in: 100*1000, out: '01:40' },
		{ in: 121*1000, out: '02:01' },
		{ in: 2*60*60*1000, out: '02:00:00' },
		{ in: 999*60*60*1000, out: '999:00:00' },
	];
	for(let i in durationStringCases) {
		test(`durationString should output ${durationStringCases[i].out} for an input of ${durationStringCases[i].in}`, () => {
			expect(durationString(durationStringCases[i].in)).toStrictEqual(durationStringCases[i].out);
		});
	}

});
