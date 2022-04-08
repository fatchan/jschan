const fetch = require('node-fetch');

module.exports = () => describe('test some global form submissions', () => {

	let sessionCookie
		, csrfToken;

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
		csrfToken = await fetch('http://localhost/csrf.json', { headers: { 'cookie': sessionCookie }})
			.then(res => res.json())
			.then(json => json.token);
	});

	let newsId;
	test('add news post',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			title: 'Newspost title~',
			message: `==This is news==
wow
>very cool
testing 123`
		});
		const response = await fetch('http://localhost/forms/global/addnews', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		})
		expect(response.ok).toBe(true);
		const newsPage = await fetch('http://localhost/globalmanage/news.html', {
			headers: {
				'cookie': sessionCookie,
			},
		}).then(res => res.text());
		const checkIndex = newsPage.indexOf('name="checkednews" value="');
		newsId = newsPage.substring(checkIndex+26, checkIndex+26+24);
	});

	test('edit news post',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			news_id: newsId,
			title: 'edited title',
			message: 'edited message',
		});
		const response = await fetch('http://localhost/forms/global/editnews', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		})
		expect(response.ok).toBe(true);
		const newsPage = await fetch('http://localhost/globalmanage/news.html', {
			headers: {
				'cookie': sessionCookie,
			},
		}).then(res => res.text());
		const editTextIndex = newsPage.indexOf('edited title');
		expect(editTextIndex).not.toBe(-1);
	});

	test('delete news post',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkednews: newsId,
		});
		const response = await fetch('http://localhost/forms/global/deletenews', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		})
		expect(response.ok).toBe(true);
	});

	test('register test account',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			username: 'test',
			password: 'test',
			passwordconfirm: 'test',
			captcha: '000000',
		});
		const response = await fetch('http://localhost/forms/register', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		})
		expect(response.status).toBe(302);
	});

	test('edit account permission',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			username: 'test',
			template: 'fz/P4B//gAA=',
		});
		const response = await fetch('http://localhost/forms/global/editaccount', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		})
		expect(response.ok).toBe(true);
	});

});
