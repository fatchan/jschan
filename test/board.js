const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs-extra');

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

	let bannerId, assetId;
	test('add banner',  async () => {
		const fileParams = new FormData();
		const filePath = 'gulp/res/img/flags.png';
		const fileSizeInBytes = fs.statSync(filePath).size;
		const fileStream = fs.createReadStream(filePath);
		fileParams.append('_csrf', csrfToken);
		fileParams.append('file', fileStream, { knownLength: fileSizeInBytes });
		const response = await fetch('http://localhost/forms/board/test/addbanners', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
				...fileParams.getHeaders(),
			},
			method: 'POST',
			body: fileParams
		});
		expect(response.ok).toBe(true);
		const bannerPage = await fetch('http://localhost/test/manage/assets.html', {
			headers: {
				'cookie': sessionCookie,
			},
		}).then(res => res.text());
		const checkString = 'name="checkedbanners" value="';
		const checkIndex = bannerPage.indexOf(checkString);
		const bannerSubstring = bannerPage.substring(checkIndex+checkString.length, checkIndex+checkString.length+70);
		bannerId = bannerSubstring.substring(0, bannerSubstring.lastIndexOf('"'));
	});

	let flagId;
	test('add flag',  async () => {
		const fileParams = new FormData();
		const filePath = 'gulp/res/img/flags.png';
		const fileSizeInBytes = fs.statSync(filePath).size;
		const fileStream = fs.createReadStream(filePath);
		fileParams.append('_csrf', csrfToken);
		fileParams.append('file', fileStream, { knownLength: fileSizeInBytes });
		const response = await fetch('http://localhost/forms/board/test/addflags', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
				...fileParams.getHeaders(),
			},
			method: 'POST',
			body: fileParams
		});
		expect(response.ok).toBe(true);
		flagId = 'flags';
	});

	test('add asset',  async () => {
		const fileParams = new FormData();
		const filePath = 'gulp/res/img/flags.png';
		const fileSizeInBytes = fs.statSync(filePath).size;
		const fileStream = fs.createReadStream(filePath);
		fileParams.append('_csrf', csrfToken);
		fileParams.append('file', fileStream, { knownLength: fileSizeInBytes });
		const response = await fetch('http://localhost/forms/board/test/addassets', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
				...fileParams.getHeaders(),
			},
			method: 'POST',
			body: fileParams
		});
		expect(response.ok).toBe(true);
		const assetPage = await fetch('http://localhost/test/manage/assets.html', {
			headers: {
				'cookie': sessionCookie,
			},
		}).then(res => res.text());
		const checkString = 'name="checkedassets" value="';
		const checkIndex = assetPage.indexOf(checkString);
		const assetSubstring = assetPage.substring(checkIndex+checkString.length, checkIndex+checkString.length+70);
		assetId = assetSubstring.substring(0, assetSubstring.lastIndexOf('"'));
	});

	test('delete banner',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkedbanners: bannerId,
		});
		const response = await fetch('http://localhost/forms/board/test/deletebanners', {
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

	test('delete flag',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkedflags: flagId,
		});
		const response = await fetch('http://localhost/forms/board/test/deleteflags', {
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

	test('delete asset',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkedassets: assetId,
		});
		const response = await fetch('http://localhost/forms/board/test/deleteassets', {
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

	test('add custompage',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			page: 'test',
			title: 'test',
			message: `==This is a test custompage==
wow
>very cool
testing 123`
		});
		const response = await fetch('http://localhost/forms/board/test/addcustompages', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		expect(response.ok).toBe(true);
		const response2 = await fetch('http://localhost/test/page/test.html');
		expect(response2.ok).toBe(true);
	});

	test('edit and rename/move custompage',  async () => {
		const custompagesPage = await fetch('http://localhost/test/manage/custompages.html', {
			headers: {
				'cookie': sessionCookie,
			},
		}).then(res => res.text());
		const custompageId = custompagesPage.match(/href="\/test\/manage\/editcustompage\/([0-9a-f]{24}).html"/)[1];
		const params = new URLSearchParams({
			_csrf: csrfToken,
			page_id: custompageId,
			page: 'test2',
			title: 'test2',
			message: 'test2',
		});
		const response = await fetch('http://localhost/forms/board/test/editcustompage', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		expect(response.ok).toBe(true);
		const response2 = await fetch('http://localhost/test/page/test.html');
		expect(response2.status).toBe(404);
		const response3 = await fetch('http://localhost/test/page/test2.html');
		expect(response3.status).toBe(200);
	});

	test('delete custompage',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkedcustompages: 'test2',
		});
		const response = await fetch('http://localhost/forms/board/test/deletecustompages', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		expect(response.ok).toBe(true);
		const response2 = await fetch('http://localhost/test/page/test2.html');
		expect(response2.status).toBe(404);
	});

	let filterId;
	test('add filter to test board',  async () => {
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
		const response = await fetch('http://localhost/forms/board/test/addfilter', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		expect(response.ok).toBe(true);
		const filterPage = await fetch('http://localhost/test/manage/filters.html', {
			headers: {
				'cookie': sessionCookie,
			},
		}).then(res => res.text());
		const checkIndex = filterPage.indexOf('name="checkedfilters" value="');
		filterId = filterPage.substring(checkIndex+29, checkIndex+29+24);
	});

	test('edit filter on test board',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			filter_id: filterId,
			filters: 'edited filters',
			strict_filtering: 'true',
			filter_mode: '1',
			filter_message: 'edited message',
			filter_ban_duration: '1s'
			// filter_ban_appealable omitted to change to false
		});
		const response = await fetch('http://localhost/forms/board/test/editfilter', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		expect(response.ok).toBe(true);
		const filterPage = await fetch('http://localhost/test/manage/filters.html', {
			headers: {
				'cookie': sessionCookie,
			},
		}).then(res => res.text());
		const editTextIndex = filterPage.indexOf('edited filters');
		expect(editTextIndex).not.toBe(-1);
	});

	test('make a post that doesnt hit board filter',  async () => {
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

	test('make a post that hits board filter',  async () => {
		const params = new URLSearchParams();
		params.append('message', 'edited filters');
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

	test('delete test board filter',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkedfilters: filterId,
		});
		const response = await fetch('http://localhost/forms/board/test/deletefilter', {
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

	test('make a post that passes the deleted filter',  async () => {
		const params = new URLSearchParams();
		params.append('message', 'editing filter');
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
	
	test('add staff',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			username: 'test',
		});
		const response = await fetch('http://localhost/forms/board/test/addstaff', {
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

	test('edit staff permission',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			username: 'test',
			MANAGE_BOARD_BANS: '1',
			MANAGE_BOARD_LOGS: '1',
			MANAGE_BOARD_SETTINGS: '1',
		});
		const response = await fetch('http://localhost/forms/board/test/editstaff', {
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

	test('remove staff',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			checkedstaff: 'test',
		});
		const response = await fetch('http://localhost/forms/board/test/deletestaff', {
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
