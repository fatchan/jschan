const fetch = require('node-fetch');

module.exports = () => describe('Test posting', () => {

	let threadId;
	test('post new thread',  async () => {
		const params = new URLSearchParams();
		params.append('message', Math.random());
		params.append('captcha', '000000');
		const response = await fetch('http://localhost/forms/board/test/post', {
			headers: {
				'x-using-xhr': 'true',
			},
			method: 'POST',
			body: params
		});
		expect(response.ok).toBe(true);
		threadId = (await response.json()).postId;
	});

	let replyId;
	test('post reply',  async () => {
		const params = new URLSearchParams();
		params.append('message', Math.random());
		params.append('thread', threadId);
		params.append('captcha', '000000');
		const response = await fetch('http://localhost/forms/board/test/post', {
			headers: {
				'x-using-xhr': 'true',
			},
			method: 'POST',
			body: params
		});
		expect(response.ok).toBe(true);
		replyId = (await response.json()).postId;
	});

	test('post reply with quotes',  async () => {
		const params = new URLSearchParams();
		params.append('message', `>>${threadId}
>>${replyId}`);
		params.append('thread', threadId);
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

	test('post reply with all markdowns',  async () => {
		const params = new URLSearchParams();
		params.append('captcha', '000000');
		params.append('message', `>greentext
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
>>${threadId}
>>>/test/
>>>/test/${threadId}
\`inline monospace\`
[code]language
int main() {...}
[/code]

[code]aa
∧＿∧
( ・ω・) Let's try that again.
[/code]
`);
		params.append('thread', threadId);
		const response = await fetch('http://localhost/forms/board/test/post', {
			headers: {
				'x-using-xhr': 'true',
			},
			method: 'POST',
			body: params
		});
		expect(response.ok).toBe(true);
	});

	async function postThreadsWithReplies(board, threads, replies) {
		const threadParams = new URLSearchParams();
		threadParams.append('message', Math.random());
		threadParams.append('captcha', '000000');
		for (let t = 0; t < threads; t++) {
			const response = await fetch(`http://localhost/forms/board/${board}/post`, {
				headers: {
					'x-using-xhr': 'true',
				},
				method: 'POST',
				body: threadParams
			});
			expect(response.ok).toBe(true);
			const thread = (await response.json()).postId;
			for (let r = 0; r < replies; r++) {
				const replyParams = new URLSearchParams();
				replyParams.append('message', Math.random());
				replyParams.append('thread', thread);
				replyParams.append('captcha', '000000');
				const response2 = await fetch(`http://localhost/forms/board/${board}/post`, {
					headers: {
						'x-using-xhr': 'true',
					},
					method: 'POST',
					body: replyParams
				});
				expect(response2.ok).toBe(true);
			}
		}
	}

	jest.setTimeout(5*60*1000); //give a generous timeout
	test('post some threads & replies on test boards',  async () => {
		try {
			await postThreadsWithReplies('test', 30, 5);
			await postThreadsWithReplies('test2', 10, 5);
		} catch (e) {
			console.error(e);
		}
		jest.setTimeout(5*1000); //back to normal timeout
	});

});
