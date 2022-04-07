const fetch = require('node-fetch');

module.exports = () => describe('Test post modactions', () => {

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

	test('delete 5 random posts from /test/',  async () => {
		const threads = await fetch('http://localhost/test/catalog.json').then(res => res.json());
		for (let i = 0; i < 5; i++) {
			const thread = threads[Math.floor(Math.random() * threads.length)];
			const params = new URLSearchParams({
				_csrf: csrfToken,
				delete: '1',
			});
			params.append('checkedposts', thread.postId);
			const response = await fetch('http://localhost/forms/board/test/modactions', {
				headers: {
					'x-using-xhr': 'true',
					'cookie': sessionCookie,
				},
				method: 'POST',
				body: params,
			});
			expect(response.ok).toBe(true);
		}
		//this is scuffed but because the json could still be building async in the background this can break following tests
		await new Promise((resolve) => { setTimeout(resolve, 1000) });
	});

	test('bumplock, lock, and sticky 5 random posts from /test/',  async () => {
		const threads = await fetch('http://localhost/test/catalog.json').then(res => res.json());
		for (let i = 0; i < 5; i++) {
			const thread = threads[Math.floor(Math.random() * threads.length)];
			const params = new URLSearchParams({
				_csrf: csrfToken,
				sticky: i+1,
				bumplock: '1',
				lock: '1',
			});
			params.append('checkedposts', thread.postId);
			const response = await fetch('http://localhost/forms/board/test/modactions', {
				headers: {
					'x-using-xhr': 'true',
					'cookie': sessionCookie,
				},
				method: 'POST',
				body: params,
			});
			expect(response.ok).toBe(true);
		}
	});

	jest.setTimeout(5*60*1000); //give a generous timeout
	test('make new 5 threads with 10 replies each',  async () => {
		const threadParams = new URLSearchParams();
		threadParams.append('message', Math.random());
		threadParams.append('captcha', '000000');
		const promises = [];
		for (let t = 0; t < 5; t++) {
			const promise = fetch('http://localhost/forms/board/test/post', {
				headers: {
					'x-using-xhr': 'true',
				},
				method: 'POST',
				body: threadParams
			}).then(async (response) => {
				expect(response.ok).toBe(true);
				const thread = (await response.json()).postId;
				for (let r = 0; r < 10; r++) {
					const replyParams = new URLSearchParams();
					replyParams.append('message', Math.random());
					replyParams.append('thread', thread);
					replyParams.append('captcha', '000000');
					const promise2 = await fetch('http://localhost/forms/board/test/post', {
						headers: {
							'x-using-xhr': 'true',
						},
						method: 'POST',
						body: replyParams
					}).then(async (response2) => {
						expect(response2.ok).toBe(true);
					});
					promises.push(promise2);
				}
			});
			promises.push(promise);
		}
		await Promise.all(promises); //wait for all posts to go through
		jest.setTimeout(5*1000); //back to normal timeout
	});

	test('remove the bumplock, lock and sticky on any threads',  async () => {
		const threads = await fetch('http://localhost/test/catalog.json').then(res => res.json());
		const params = new URLSearchParams({
			_csrf: csrfToken,
			sticky: '0',
			bumplock: '1', //these are a "toggle",
			lock: '1',
		});
		threads.filter(t => t.locked).forEach(t => params.append('checkedposts', t.postId));
		//this is a lot of threads per action, but its using admin account, and the globalsettings is set to allow 100 checkedposts
		const response = await fetch('http://localhost/forms/board/test/modactions', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
		});
		expect(response.ok).toBe(true);
	});

});
