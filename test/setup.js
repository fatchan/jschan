const fetch = require('node-fetch');

module.exports = () => describe('login and create test board', () => {

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

	test('create test board',  async () => {
		const params = new URLSearchParams();
		params.append('uri', 'test');
		params.append('name', 'test');
		const response = await fetch('http://localhost/forms/create', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		expect([302, 409]).toContain(response.status)
	});

});
