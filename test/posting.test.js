const fetch = require('node-fetch');

describe('Test posting', () => {
	test('making a new thread',  async () => {
		const response = await fetch("http://localhost/forms/board/test/post", {
			"credentials": "include",
			"headers": {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0",
				"Accept": "*/*",
				"Accept-Language": "en-US,en;q=0.5",
				"x-using-xhr": "true",
				"Content-Type": "multipart/form-data; boundary=---------------------------288233515138121562724710438"
			},
			"referrer": "http://localhost/test/index.html",
			"body": `-----------------------------288233515138121562724710438\r\nContent-Disposition: form-data; name=\"thread\"\r\n\r\n\r\n-----------------------------288233515138121562724710438\r\nContent-Disposition: form-data; name=\"name\"\r\n\r\n\r\n-----------------------------288233515138121562724710438\r\nContent-Disposition: form-data; name=\"email\"\r\n\r\n\r\n-----------------------------288233515138121562724710438\r\nContent-Disposition: form-data; name=\"subject\"\r\n\r\n\r\n-----------------------------288233515138121562724710438\r\nContent-Disposition: form-data; name=\"message\"\r\n\r\n${Math.random()}\r\n-----------------------------288233515138121562724710438\r\nContent-Disposition: form-data; name=\"postpassword\"\r\n\r\nHUN6gKxJJJiQJ0gA/Ym8Y3ozqKI=\r\n-----------------------------288233515138121562724710438--\r\n`,
			"method": "POST",
		});
		expect(response.ok).toBe(true);
	});
});
