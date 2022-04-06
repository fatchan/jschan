const fetch = require('node-fetch');

describe('Test posting', () => {

	let threadId;
	test('post new thread',  async () => {
		const params = new URLSearchParams();
		params.append('message', Math.random());
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

});
