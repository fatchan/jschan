const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs-extra');

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

	jest.setTimeout(5*60*1000); //give a generous timeout
	test('make new 10 threads with 10 replies each',  async () => {
		const threadParams = new URLSearchParams();
		threadParams.append('message', Math.random());
		threadParams.append('captcha', '000000');
		const promises = [];
		for (let t = 0; t < 10; t++) {
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
		await new Promise((resolve) => { setTimeout(resolve, 1000); }); //wait for async builds
	});

	test('bumplock, lock, and sticky 5 random posts from /test/',  async () => {
		const threads = await fetch('http://localhost/test/catalog.json').then(res => res.json());
		const params = new URLSearchParams({
			_csrf: csrfToken,
			sticky: '1',
			bumplock: '1',
			lock: '1',
		});
		for (let i = 0; i < 5; i++) {
			const thread = threads[Math.floor(Math.random() * threads.length)];
			params.append('checkedposts', thread.postId);
		}
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

	test('lower reply limit',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			name: 'test',
			description: '',
			tags: '',
			announcement: '',
			theme: 'yotsuba-b',
			code_theme: 'ir-black',
			custom_css: '',
			language: 'en-GB',
			enable_tegaki: 'true',
			max_files: '5',
			files_allow_video: 'true',
			files_allow_image: 'true',
			files_allow_animated_image: 'true',
			files_allow_audio: 'true',
			user_post_spoiler: 'true',
			user_post_unlink: 'true',
			default_name: 'Anon',
			user_post_delete: 'true',
			min_thread_message_length: '0',
			min_reply_message_length: '0',
			max_thread_message_length: '20000',
			max_reply_message_length: '20000',
			thread_limit: '100',
			reply_limit: '20',
			bump_limit: '500',
			file_r9k_mode: '0',
			message_r9k_mode: '0',
			delete_protection_count: '0',
			delete_protection_age: '0',
			lock_mode: '0',
			captcha_mode: '2',
			pph_trigger: '50',
			pph_trigger_action: '2',
			tph_trigger: '10',
			tph_trigger_action: '1',
			lock_reset: '0',
			captcha_reset: '0',
			filters: '',
			filter_mode: '0',
			ban_duration: '0'
		});
		const response = await fetch('http://localhost/forms/board/test/settings', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		expect(response.status).toBe(200);
	});

	jest.setTimeout(5*60*1000); //give generous timeout
	test('make new cyclic thread and check it prunes replies after the limit',  async () => {

		//new thread
		const threadParams = new URLSearchParams();
		threadParams.append('message', Math.random());
		threadParams.append('captcha', '000000');
		const response = await fetch('http://localhost/forms/board/test/post', {
			headers: {
				'x-using-xhr': 'true',
			},
			method: 'POST',
			body: threadParams
		});
		expect(response.ok).toBe(true);
		const thread = (await response.json()).postId;

		//make it cyclic
		const params = new URLSearchParams({
			_csrf: csrfToken,
			cyclic: '1',
			checkedposts: thread,
		});
		const response2 = await fetch('http://localhost/forms/board/test/modactions', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
		});
		expect(response2.ok).toBe(true);

		//make the replies
		const promises = [];
		for (let r = 0; r < 25; r++) {
			const replyParams = new URLSearchParams();
			replyParams.append('message', Math.random());
			replyParams.append('thread', thread);
			replyParams.append('captcha', '000000');
			const promise = await fetch('http://localhost/forms/board/test/post', {
				headers: {
					'x-using-xhr': 'true',
				},
				method: 'POST',
				body: replyParams
			}).then(response3 => {
				expect(response3.ok).toBe(true);
			});
			promises.push(promise);
		}
		await Promise.all(promises); //wait for all posts to go through

		//check the replies in json
		const response3 = await fetch(`http://localhost/test/thread/${thread}.json`).then(res => res.json());
		expect(response3.replies.length).toBe(20);
		jest.setTimeout(5*1000); //back to normal timeout

	});

	test('move/merge a thread in same board',  async () => {
		const threads = await fetch('http://localhost/test/catalog.json').then(res => res.json());
		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkedposts: threads[Math.floor(threads.length/2)].postId,
			move: '1',
			move_to_thread: threads[0].postId,
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
	});

	test('move/merge a thread cross board',  async () => {
		const threads = await fetch('http://localhost/test/catalog.json').then(res => res.json());
		const threads2 = await fetch('http://localhost/test2/catalog.json').then(res => res.json());
		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkedposts: threads[0].postId,
			move: '1',
			move_to_board: 'test2',
			move_to_thread: threads2[0].postId,
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
	});

	test('move/merge a thread cross board (new thread)',  async () => {
		const threads = await fetch('http://localhost/test/catalog.json').then(res => res.json());
		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkedposts: threads[0].postId,
			move: '1',
			move_to_board: 'test2',
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
	});

	test('move/merge a thread cross board (other way)',  async () => {
		const threads = await fetch('http://localhost/test/catalog.json').then(res => res.json());
		const threads2 = await fetch('http://localhost/test2/catalog.json').then(res => res.json());
		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkedposts: threads2[0].postId,
			move: '1',
			move_to_board: 'test',
			move_to_thread: threads[0].postId,
		});
		const response = await fetch('http://localhost/forms/board/test2/modactions', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
		});
		expect(response.ok).toBe(true);
	});

	test('delete 5 random posts from /test/',  async () => {
		const threads = await fetch('http://localhost/test/catalog.json').then(res => res.json());
		const params = new URLSearchParams({
			_csrf: csrfToken,
			delete: '1',
		});
		for (let i = 0; i < 5; i++) {
			const thread = threads[Math.floor(Math.random() * threads.length)];
			params.append('checkedposts', thread.postId);
		}
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
	
	let reportedPost;
	test('test local report + global report',  async () => {
		const threads = await fetch('http://localhost/test/catalog.json').then(res => res.json());
		const randomThread = threads[Math.floor(Math.random() * threads.length)];
		reportedPost = randomThread;
		const randomThreadId = randomThread.postId;
		const params = new URLSearchParams({
			_csrf: csrfToken,
			report: '1',
			global_report: '1',
			report_reason: 'test',
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
	});

	test('test post editing, add a bunch of markdown',  async () => {
		const threads = await fetch('http://localhost/test/catalog.json').then(res => res.json());
		const randomThreadId = threads[Math.floor(Math.random() * threads.length)].postId;
		const params = new URLSearchParams({
			_csrf: csrfToken,
			board: 'test',
			postId: randomThreadId,
			subject: 'NEW SUBJECT',
			email: 'NEW EMAIL',
			name: 'NEW NAME',
			message: `>greentext
<pinktext
==title==
''bold''
__underline__
~strikethrough~~
||spoiler text||
**italic**
(((detected)))
##2d9+3
https://example.com
[Board Rules](https://your.imageboard/a/custompage/rules.html)(staff only)
>>123
>>>/test/
>>>/test/123
\`inline monospace\`
[code]language
int main() {...}
[/code]

[code]aa
∧＿∧
( ・ω・) Let's try that again.
[/code]`,
			log_message: 'test edit',
		});
		const response = await fetch('http://localhost/forms/editpost', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
		});
		expect(response.ok).toBe(true);
	});

	let postId;
	test('make post with image',  async () => {
		const threadParams = new FormData({
			message: Math.random(),
			captcha: '000000',
		});
		const filePath = 'gulp/res/img/flags.png';
		const fileSizeInBytes = fs.statSync(filePath).size;
		const fileStream = fs.createReadStream(filePath);
		threadParams.append('file', fileStream, { knownLength: fileSizeInBytes });
		const response = await fetch('http://localhost/forms/board/test/post', {
			headers: {
				'x-using-xhr': 'true',
				...threadParams.getHeaders(),
			},
			method: 'POST',
			body: threadParams
		});
		expect(response.ok).toBe(true);
		postId = (await response.json()).postId;
	});

	test('spoiler the file in a post',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			spoiler: '1',
			checkedposts: postId,
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
	});

	test('unlink file',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			unlink_file: '1',
			checkedposts: postId,
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
	});

	test('make post with already spoilered image',  async () => {
		const threadParams = new FormData({
			message: Math.random(),
			captcha: '000000',
			spoiler_all: '1',
		});
		const filePath = 'gulp/res/img/flags.png';
		const fileSizeInBytes = fs.statSync(filePath).size;
		const fileStream = fs.createReadStream(filePath);
		threadParams.append('file', fileStream, { knownLength: fileSizeInBytes });
		const response = await fetch('http://localhost/forms/board/test/post', {
			headers: {
				'x-using-xhr': 'true',
				...threadParams.getHeaders(),
			},
			method: 'POST',
			body: threadParams
		});
		expect(response.ok).toBe(true);
		postId = (await response.json()).postId;
	});

	test('delete file',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			delete_file: '1',
			checkedposts: postId,
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
	});

	test('ban reporter for local report',  async () => {
		const reportsPage = await fetch('http://localhost/test/manage/reports.html', {
			headers: {
				'cookie': sessionCookie,
			},
		}).then(res => res.text());
		const checkString = 'name="checkedreports" value="';
		const checkIndex = reportsPage.indexOf(checkString);
		const reportId = reportsPage.substring(checkIndex+checkString.length, checkIndex+checkString.length+24);
		const params = new URLSearchParams({
			_csrf: csrfToken,
			report_ban: '1',
			checkedposts: reportedPost.postId,
			checkedreports: reportId,
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
	});

	test('dismiss local report',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			dismiss: '1',
			checkedposts: reportedPost.postId,
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
	});

	test('ban reporter for global report',  async () => {
		const reportsPage = await fetch('http://localhost/globalmanage/reports.html', {
			headers: {
				'cookie': sessionCookie,
			},
		}).then(res => res.text());
		const checkString = 'name="checkedreports" value="';
		const checkIndex = reportsPage.indexOf(checkString);
		const reportId = reportsPage.substring(checkIndex+checkString.length, checkIndex+checkString.length+24);
		const params = new URLSearchParams({
			_csrf: csrfToken,
			global_report_ban: '1',
			globalcheckedposts: reportedPost._id,
			checkedreports: reportId,
		});
		const response = await fetch('http://localhost/forms/global/actions', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
		});
		expect(response.ok).toBe(true);
	});

	test('remove global report ban',  async () => {
		const banPage = await fetch('http://localhost/globalmanage/bans.html', {
			headers: {
				'cookie': sessionCookie,
			},
		}).then(res => res.text());
		const checkString = 'name="checkedbans" value="';
		const checkIndex = banPage.indexOf(checkString);
		banId = banPage.substring(checkIndex+checkString.length, checkIndex+checkString.length+24);
		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkedbans: banId,
			option: 'unban',
		});
		const response = await fetch('http://localhost/forms/global/editbans', {
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

	test('test banning',  async () => {
		const threads = await fetch('http://localhost/test/catalog.json').then(res => res.json());
		const randomThreadId = threads[Math.floor(Math.random() * threads.length)].postId;
		const params = new URLSearchParams({
			_csrf: csrfToken,
			ban: '1',
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
	});

	test('test global ban',  async () => {
		const threads = await fetch('http://localhost/test/catalog.json').then(res => res.json());
		const randomThreadId = threads[Math.floor(Math.random() * threads.length)].postId;
		const params = new URLSearchParams({
			_csrf: csrfToken,
			global_ban: '1',
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
	});

	let banId;
	test('deny ban appeal',  async () => {
		const banPage = await fetch('http://localhost/globalmanage/bans.html', {
			headers: {
				'cookie': sessionCookie,
			},
		}).then(res => res.text());
		const checkString = 'name="checkedbans" value="';
		const checkIndex = banPage.indexOf(checkString);
		banId = banPage.substring(checkIndex+checkString.length, checkIndex+checkString.length+24);
		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkedbans: banId,
			option: 'deny_appeal',
		});
		const response = await fetch('http://localhost/forms/global/editbans', {
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

	test('test upgrade a ban to qrange',  async () => {

		const banPage = await fetch('http://localhost/globalmanage/bans.html', {
			headers: {
				'cookie': sessionCookie,
			},
		}).then(res => res.text());
		const checkString = 'name="checkedbans" value="';
		const checkIndex = banPage.indexOf(checkString);
		banId = banPage.substring(checkIndex+checkString.length, checkIndex+checkString.length+24);

		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkedbans: banId,
			option: 'upgrade',
			upgrade: 1,
		});
		const response = await fetch('http://localhost/forms/global/editbans', {
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

	test('edit ban duration',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkedbans: banId,
			option: 'edit_duration',
			ban_duration: '3d',
		});
		const response = await fetch('http://localhost/forms/global/editbans', {
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

	test('remove ban',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkedbans: banId,
			option: 'unban',
		});
		const response = await fetch('http://localhost/forms/global/editbans', {
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

	test('test ban + qrange + non-appealable + show post in ban + hide name in modlog + modlog message + ban reason',  async () => {
		const threads = await fetch('http://localhost/test/catalog.json').then(res => res.json());
		const randomThreadId = threads[Math.floor(Math.random() * threads.length)].postId;
		const params = new URLSearchParams({
			_csrf: csrfToken,
			ban: '1',
			ban_q: '1',
			ban_reason: 'test',
			log_message: 'test',
			preserve_post: '1',
			hide_name: '1',
			no_appeal: '1',
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
	});

});
