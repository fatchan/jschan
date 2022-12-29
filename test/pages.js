const fetch = require('node-fetch');

module.exports = () => describe('Test loading a bunch of pages', () => {

	const urls = [
		'boards.html',
		'boards.json',
		'boards.json?search=test&sort=popularity&direction=desc',
		'boards.html?search=test&sort=popularity&direction=desc',
		'overboard.html',
		'overboard.json',
		'overboard.html?add=test&rem=abc',
		'overboard.json?add=test&rem=abc',
		'index.html',
		'news.html',
		'rules.html',
		'faq.html',
		'globalmanage/recent.html',
		'globalmanage/recent.json',
		'globalmanage/reports.html',
		'globalmanage/reports.json',
		'globalmanage/bans.html',
		'globalmanage/boards.html',
		'globalmanage/boards.json',
		'globalmanage/globallogs.html',
		'globalmanage/accounts.html',
		'globalmanage/roles.html',
		'globalmanage/roles.json',
		'globalmanage/news.html',
		'globalmanage/settings.html',
	];

	let sessionCookie;
	test('login as admin',  async () => {
		const params = new URLSearchParams();
		params.append('username', 'admin');
		params.append('password', process.env.TEST_ADMIN_PASSWORD);
		const response = await fetch('http://localhost/forms/login', {
			headers: {
				'x-using-xhr': 'true',
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		const rawHeaders = response.headers.raw();
		expect(rawHeaders['set-cookie']).toBeDefined();
		expect(rawHeaders['set-cookie'][0]).toMatch(/^connect\.sid/);
		sessionCookie = rawHeaders['set-cookie'][0];
	});

	urls.forEach(u => {
		test(u,  async () => {
			const response = await fetch(`http://localhost/${u}`, {
				headers: {
					cookie: sessionCookie,
				},
			});
			expect(response.ok).toBe(true);
		});
	});

});
