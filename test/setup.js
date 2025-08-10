const fetch = require('node-fetch');
process.env.NO_CAPTCHA = 1;

module.exports = () => describe('login and create test board', () => {

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

	test('delete test board if exists',  async () => {
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

	test('create /test/ board',  async () => {
		const params = new URLSearchParams();
		params.set('uri', 'test');
		params.set('name', 'test');
		const options = {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		};
		const response1 = await fetch('http://localhost/forms/create', options);
		expect([302]).toContain(response1.status);
	});

	test('create /test2/ board',  async () => {
		const params = new URLSearchParams();
		params.append('uri', 'test2');
		params.append('name', 'test2');
		const response = await fetch('http://localhost/forms/create', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		expect([302, 409]).toContain(response.status);
	});

	test('create /deleteownertest/ board',  async () => {
		const params = new URLSearchParams();
		params.append('uri', 'deleteownertest');
		params.append('name', 'deleteownertest');
		const response = await fetch('http://localhost/forms/create', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		expect([302]).toContain(response.status);
	});

	test('change global settings, disable antispam',  async () => {
		const params = new URLSearchParams({
			_csrf: csrfToken,
			allowed_hosts: '',
			prune_ips: '0',
			global_announcement: '',
			country_code_header: 'x-country-code',
			ip_header: 'x-real-ip',
			meta_site_name: '',
			meta_url: '',
			stats_count_anonymizers: 'true',
			prune_immediately: 'true',
			thumb_extension: '.jpg',
			cache_templates: 'true',
			lock_wait: '3000',
			overboard_limit: '20',
			overboard_catalog_limit: '100',
			allow_custom_overboard: 'true',
			language: 'en-GB',
			archive_links: 'https://archive.today/?run=1&url=%s',
			reverse_links: 'https://tineye.com/search?url=%s',
			prune_modlogs: '30',
			default_ban_duration: '1000',
			quote_limit: '25',
			preview_replies: '5',
			sticky_preview_replies: '5',
			early_404_fraction: '3',
			early_404_replies: '5',
			max_recent_news: '5',
			inactive_account_time: '7889400000',
			inactive_account_action: '0',
			abandoned_board_action: '0',
			hot_threads_limit: '5',
			hot_threads_threshold: '10',
			hot_threads_max_age: '2629800000',
			captcha_options_font: 'default',
			captcha_options_type: 'text',
			captcha_options_generate_limit: '250',
			captcha_options_text_font: 'default',
			captcha_options_text_line: 'true',
			captcha_options_text_wave: '0',
			captcha_options_text_paint: '2',
			captcha_options_text_noise: '0',
			captcha_options_grid_image_size: '120',
			captcha_options_grid_size: '4',
			captcha_options_grid_icon_y_offset: '15',
			captcha_options_grid_trues: '●\n■\n♞\n♦\n▼\n▲\n♜\n✦\n♚\n♞\n♛\n♝\n♟\n♣',
			captcha_options_grid_falses: '○\n□\n♘\n♢\n▽\n△\n♖\n✧\n♔\n♘\n♕\n♗\n♙\n♧',
			captcha_options_grid_question: 'Select+the+solid/filled+icons',
			captcha_options_grid_edge: '25',
			captcha_options_grid_noise: '0',
			captcha_options_num_distorts_min: '2',
			captcha_options_num_distorts_max: '3',
			captcha_options_distortion: '7',
			block_bypass_force_anonymizers: 'true',
			block_bypass_expire_after_uses: '50',
			block_bypass_expire_after_time: '86400000',
			flood_timers_same_content_same_ip: '0',
			flood_timers_same_content_any_ip: '0',
			flood_timers_any_content_same_ip: '0',
			dnsbl_blacklists: 'tor.dan.me.uk',
			dnsbl_cache_time: '3600',
			rate_limit_cost_captcha: '10',
			rate_limit_cost_board_settings: '30',
			rate_limit_cost_edit_post: '30',
			highlight_options_language_subset: 'javascript\n' +
						'typescript\n' +
						'perl\n' +
						'js\n' +
						'c++\n' +
						'c\n' +
						'java\n' +
						'kotlin\n' +
						'php\n' +
						'h\n' +
						'csharp\n' +
						'bash\n' +
						'sh\n' +
						'zsh\n' +
						'python\n' +
						'ruby\n' +
						'css\n' +
						'html\n' +
						'json\n' +
						'golang\n' +
						'rust\n' +
						'aa',
			highlight_options_threshold: '5',
			themes: '',
			code_themes: '',
			board_defaults_language: 'en-GB',
			board_defaults_theme: 'yotsuba-b',
			board_defaults_code_theme: 'ir-black',
			global_limits_custom_css_enabled: 'true',
			global_limits_custom_css_filters: '@\nurl(',
			global_limits_custom_css_strict: 'true',
			global_limits_custom_css_max: '10000',
			global_limits_filters_max: 100,
			global_limits_field_length_name: '100',
			global_limits_field_length_email: '100',
			global_limits_field_length_subject: '100',
			global_limits_field_length_postpassword: '100',
			global_limits_field_length_message: '20000',
			global_limits_field_length_report_reason: '100',
			global_limits_field_length_ban_reason: '100',
			global_limits_field_length_log_message: '100',
			global_limits_field_length_uri: '50',
			global_limits_field_length_boardname: '50',
			global_limits_field_length_description: '100',
			global_limits_multi_input_posts_anon: '20',
			global_limits_multi_input_posts_staff: '100',
			frontend_script_default_embeds_enabled: 'true',
			frontend_script_default_hide_recursive: 'true',
			frontend_script_default_smooth_scrolling: 'true',
			frontend_script_default_thread_watcher: 'true',
			frontend_script_default_volume: '100',
			frontend_script_default_loop: 'true',
			frontend_script_default_image_loading_bars: 'true',
			frontend_script_default_live: 'true',
			frontend_script_default_local_time: 'true',
			frontend_script_default_relative_time: 'true',
			frontend_script_default_show_yous: 'true',
			frontend_script_default_notifications_yous_only: 'true',
			frontend_script_default_tegaki_width: '500',
			frontend_script_default_tegaki_height: '500',
			audio_thumbnails: 'true',
			ffmpeg_gif_thumbnails: 'true',
			thumb_size: '250',
			video_thumb_percentage: '5',
			other_mime_types: 'text/plain\napplication/pdf',
			space_file_name_replacement: '_',
			global_limits_reply_limit_min: '10',
			global_limits_reply_limit_max: '1000',
			global_limits_thread_limit_min: '100',
			global_limits_thread_limit_max: '200',
			global_limits_bump_limit_min: '10',
			global_limits_bump_limit_max: '1000',
			global_limits_post_files_max: '5',
			global_limits_post_files_size_max: '10485760',
			global_limits_custom_pages_max_length: '10000',
			global_limits_post_files_size_video_resolution: '100000000',
			global_limits_post_files_size_image_resolution: '100000000',
			global_limits_custom_pages_max: '10',
			global_limits_banner_files_width: '500',
			global_limits_banner_files_height: '500',
			global_limits_banner_files_size_max: '10485760',
			global_limits_banner_files_max: '10',
			global_limits_banner_files_total: '100',
			global_limits_flag_files_size_max: '1048576',
			global_limits_flag_files_max: '10',
			global_limits_flag_files_total: '100',
			global_limits_asset_files_size_max: '10485760',
			global_limits_asset_files_max: '10',
			global_limits_asset_files_total: '50',
			proxy_address: '',
			webring_following: '',
			webring_logos: '',
			webring_blacklist: '',
			board_defaults_message_r9k_mode: '0',
			board_defaults_file_r9k_mode: '0',
			board_defaults_lock_mode: '0',
			board_defaults_captcha_mode: '0',
			board_defaults_pph_trigger: '50',
			board_defaults_pph_trigger_action: '2',
			board_defaults_tph_trigger: '10',
			board_defaults_tph_trigger_action: '1',
			board_defaults_lock_reset: '0',
			board_defaults_captcha_reset: '0',
			board_defaults_default_name: 'Anon',
			board_defaults_enable_tegaki: 'true',
			board_defaults_user_post_delete: 'true',
			board_defaults_user_post_spoiler: 'true',
			board_defaults_user_post_unlink: 'true',
			board_defaults_thread_limit: '100',
			board_defaults_reply_limit: '1000',
			board_defaults_bump_limit: '500',
			board_defaults_max_files: '5',
			board_defaults_min_thread_message_length: '0',
			board_defaults_min_reply_message_length: '0',
			board_defaults_max_thread_message_length: '20000',
			board_defaults_max_reply_message_length: '20000',
			board_defaults_delete_protection_count: '0',
			board_defaults_delete_protection_age: '0',
			board_defaults_auto_bumplock_time: '0',
			board_defaults_allowed_file_types_video: 'true',
			board_defaults_allowed_file_types_image: 'true',
			board_defaults_allowed_file_types_animated_image: 'true',
			board_defaults_allowed_file_types_audio: 'true',
			ethereum_links: 'https://example.com/%s',
		});
		const response = await fetch('http://localhost/forms/global/settings', {
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

	test('edit default role, allow bypass captcha',  async () => {
		const roles = await fetch('http://localhost/globalmanage/roles.json', {
			headers: {
				'cookie': sessionCookie,
			}
		}).then(res => res.json());
		const anonRole = roles.find(r => r.name === 'ANON');
		const params = new URLSearchParams({
			_csrf: csrfToken,
			roleid: anonRole._id,
			CREATE_BOARD: '2',
			CREATE_ACCOUNT: '3',
			BYPASS_CAPTCHA: '8',
			USE_MARKDOWN_PINKTEXT: '35',
			USE_MARKDOWN_GREENTEXT: '36',
			USE_MARKDOWN_BOLD: '37',
			USE_MARKDOWN_UNDERLINE: '38',
			USE_MARKDOWN_STRIKETHROUGH: '39',
			USE_MARKDOWN_TITLE: '40',
			USE_MARKDOWN_ITALIC: '41',
			USE_MARKDOWN_SPOILER: '42',
			USE_MARKDOWN_MONO: '43',
			USE_MARKDOWN_CODE: '44',
			USE_MARKDOWN_DETECTED: '45',
			USE_MARKDOWN_LINK: '46',
			USE_MARKDOWN_DICE: '47',
			USE_MARKDOWN_FORTUNE: '48'
		});
		const response = await fetch('http://localhost/forms/global/editrole', {
			headers: {
				'x-using-xhr': 'true',
				'cookie': sessionCookie,
			},
			method: 'POST',
			body: params,
			redirect: 'manual',
		});
		expect([200, 302, 409]).toContain(response.status);
	});

});
