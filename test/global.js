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
		});
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
		});
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
		});
		expect(response.ok).toBe(true);
	});

	let filterId;
	test('add global filter',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			filters: `notgood
bad words`,
			strict_filtering: 'true',
			filter_mode: '1',
			filter_message: 'Rule+1:+No+fun+allowed',
			filter_ban_duration: '1s',
			filter_ban_appealable: 'true',
		});
		const response = await fetch('http://localhost/forms/global/addfilter', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		expect(response.ok).toBe(true);
		const filterPage = await fetch('http://localhost/globalmanage/filters.html', {
			headers: {
				'cookie': sessionCookie,
			},
		}).then(res => res.text());
		const checkIndex = filterPage.indexOf('name="checkedfilters" value="');
		filterId = filterPage.substring(checkIndex+29, checkIndex+29+24);
	});

	test('edit global filter',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			filter_id: filterId,
			filters: 'edited globalfilters',
			strict_filtering: 'true',
			filter_mode: '1',
			filter_message: 'edited message',
			filter_ban_duration: '1s'
			// filter_ban_appealable omitted to change to false
		});
		const response = await fetch('http://localhost/forms/global/editfilter', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		expect(response.ok).toBe(true);
		const filterPage = await fetch('http://localhost/globalmanage/filters.html', {
			headers: {
				'cookie': sessionCookie,
			},
		}).then(res => res.text());
		const editTextIndex = filterPage.indexOf('edited globalfilters');
		expect(editTextIndex).not.toBe(-1);
	});

	test('make post that doesnt hit global filter',  async () => {
		const params = new URLSearchParams();
		params.append('message', 'blahblahblah');
		params.append('captcha', '000000');
		const response = await fetch('http://localhost/forms/board/test/post', {
			headers: {
				'x-using-xhr': 'true',
			},
			method: 'POST',
			body: params
		});
		expect(response.ok).toBe(true);
	});

	test('make post that hits global filter',  async () => {
		const params = new URLSearchParams();
		params.append('message', 'edited globalfilters');
		params.append('captcha', '000000');
		const response = await fetch('http://localhost/forms/board/test/post', {
			headers: {
				'x-using-xhr': 'true',
			},
			method: 'POST',
			body: params
		});
		expect(response.ok).not.toBe(true);
		await new Promise(res => setTimeout(res, 10000)); //let ban expire
	});

	test('delete global filter',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkedfilters: filterId,
		});
		const response = await fetch('http://localhost/forms/global/deletefilter', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
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
		});
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
		});
		expect(response.ok).toBe(true);
	});

});
