const fetch = require('node-fetch');

module.exports = () => describe('delete tests and cleanup', () => {

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

	test('delete_ip_thread test',  async () => {
		const threads = await fetch('http://localhost/test/catalog.json').then(res => res.json());
		//delete a reply and check if the OP is deleted (ip is the same for all posts atm)
		const randomThreadId = threads.find(t => t.replyposts > 0).postId;
		const thread = await fetch(`http://localhost/test/thread/${randomThreadId}.json`).then(res => res.json());
		const post = thread.replies[Math.floor(Math.random() * thread.replies.length)];
		const params = new URLSearchParams({
			_csrf: csrfToken,
			delete_ip_thread: '1',
			checkedposts: post.postId,
		});
		const response = await fetch('http://localhost/forms/board/test/modactions', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
		});
		expect(response.ok).toBe(true);
		const response2 = await fetch(`http://localhost/test/thread/${randomThreadId}.json`);
		expect(response2.status).toBe(404);
	});

	test('delete_ip_board test',  async () => {
		const threads = await fetch('http://localhost/test/catalog.json').then(res => res.json());
		const randomThreadId = threads[Math.floor(Math.random() * threads.length)].postId;
		const params = new URLSearchParams({
			_csrf: csrfToken,
			delete_ip_board: '1',
			checkedposts: randomThreadId,
		});
		const response = await fetch('http://localhost/forms/board/test/modactions', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
		});
		expect(response.ok).toBe(true);
		await new Promise((resolve) => { setTimeout(resolve, 1000); }); //wait for async builds
		const response2 = await fetch('http://localhost/test/catalog.json').then(res => res.json());
		expect(response2.length).toBe(0);
	});

	test('delete test board',  async () => {
		const params = new URLSearchParams();
		params.append('_csrf', csrfToken);
		params.append('uri', 'test');
		params.append('confirm', 'true');
		const response = await fetch('http://localhost/forms/board/test/deleteboard', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		expect([200, 404]).toContain(response.status);
	});

	test('delete test account',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkedaccounts: 'test',
		});
		const response = await fetch('http://localhost/forms/global/deleteaccounts', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		// console.log((await response.text()))
		expect(response.ok).toBe(true);
	});

	test('delete test account (with delete_owned_boards option)',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkedaccounts: 'test2',
			delete_owned_boards: 'test2',
		});
		const response = await fetch('http://localhost/forms/global/deleteaccounts', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		// console.log((await response.text()))
		expect(response.ok).toBe(true);
	});

});
