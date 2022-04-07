const fetch = require('node-fetch');

module.exports = () => describe('Test loading dynamic pages', () => {

	test('/boards.html',  async () => {
		const response = await fetch('http://localhost/boards.html');
		expect(response.ok).toBe(true);
	});

	test('/boards.json',  async () => {
		const response = await fetch('http://localhost/boards.json');
		expect(response.ok).toBe(true);
		expect((await response.json()).boards.length).toBeGreaterThan(0);
	});

	test('/boards.html with query search for existing board',  async () => {
		const response = await fetch('http://localhost/boards.html?search=test&sort=popularity&direction=desc');
		expect(response.ok).toBe(true);
	});

	test('/boards.json with query search for existing board',  async () => {
		const response = await fetch('http://localhost/boards.json?search=test&sort=popularity&direction=desc');
		expect(response.ok).toBe(true);
		expect((await response.json()).boards.length).toBeGreaterThan(0);
	});

	test('/boards.json with query search for not existing board',  async () => {
		const response = await fetch('http://localhost/boards.json?search=notexistingboard');
		expect(response.ok).toBe(true);
		expect((await response.json()).boards.length).toBe(0);
	});

	test('/overboard.html',  async () => {
		const response = await fetch('http://localhost/overboard.html');
		expect(response.ok).toBe(true);
	});

	test('/overboard.json',  async () => {
		const response = await fetch('http://localhost/overboard.json');
		expect(response.ok).toBe(true);
	});

	test('/overboard.html with query',  async () => {
		const response = await fetch('http://localhost/overboard.html?add=test&rem=abc');
		expect(response.ok).toBe(true);
	});

	test('/overboard.json with query',  async () => {
		const response = await fetch('http://localhost/overboard.json?add=test&rem=abc');
		expect(response.ok).toBe(true);
	});

	test('/index.html',  async () => {
		const response = await fetch('http://localhost/index.html');
		expect(response.ok).toBe(true);
	});

	test('/news.html',  async () => {
		const response = await fetch('http://localhost/news.html');
		expect(response.ok).toBe(true);
	});

	test('/rules.html',  async () => {
		const response = await fetch('http://localhost/rules.html');
		expect(response.ok).toBe(true);
	});

	test('/faq.html',  async () => {
		const response = await fetch('http://localhost/faq.html');
		expect(response.ok).toBe(true);
	});

});
