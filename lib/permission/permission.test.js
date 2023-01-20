const Permission = require('./permission.js');
const { Permissions } = require('./permissions.js');

describe('testing permissions', () => {

	const NO_PERMISSION = new Permission();

	const ANON = new Permission();
	ANON.setAll([
		Permissions.USE_MARKDOWN_PINKTEXT, Permissions.USE_MARKDOWN_GREENTEXT, Permissions.USE_MARKDOWN_BOLD,
		Permissions.USE_MARKDOWN_UNDERLINE, Permissions.USE_MARKDOWN_STRIKETHROUGH, Permissions.USE_MARKDOWN_TITLE,
		Permissions.USE_MARKDOWN_ITALIC, Permissions.USE_MARKDOWN_SPOILER, Permissions.USE_MARKDOWN_MONO,
		Permissions.USE_MARKDOWN_CODE, Permissions.USE_MARKDOWN_DETECTED, Permissions.USE_MARKDOWN_LINK,
		Permissions.USE_MARKDOWN_DICE, Permissions.USE_MARKDOWN_FORTUNE, Permissions.CREATE_BOARD,
		Permissions.CREATE_ACCOUNT
	]);

	test('test a permission they have = true', () => {
		expect(ANON.get(Permissions.CREATE_ACCOUNT)).toBe(true);
	});

	test('test a permission they dont have = false', () => {
		expect(ANON.get(Permissions.ROOT)).toBe(false);
	});

	const BOARD_STAFF = new Permission(ANON.base64);
	BOARD_STAFF.setAll([
		Permissions.MANAGE_BOARD_GENERAL, Permissions.MANAGE_BOARD_BANS, Permissions.MANAGE_BOARD_LOGS,
	]);
	const BOARD_OWNER = new Permission(BOARD_STAFF.base64);
	BOARD_OWNER.setAll([
		Permissions.MANAGE_BOARD_OWNER, Permissions.MANAGE_BOARD_STAFF, Permissions.MANAGE_BOARD_CUSTOMISATION,
		Permissions.MANAGE_BOARD_SETTINGS,
	]);

	test('BO has all board perms', () => {
		expect(Permissions._MANAGE_BOARD_BITS.every(b => BOARD_OWNER.get(b))).toBe(true);
	});

	test('applyInheritance() gives BO all board perms as long as they have Permissions.MANAGE_BOARD_OWNER', () => {
		BOARD_OWNER.setAll(Permissions._MANAGE_BOARD_BITS, false);
		BOARD_OWNER.set(Permissions.MANAGE_BOARD_OWNER);
		BOARD_OWNER.applyInheritance();
		expect(Permissions._MANAGE_BOARD_BITS.every(b => BOARD_OWNER.get(b))).toBe(true);
	});

	const GLOBAL_STAFF = new Permission(BOARD_OWNER.base64);
	GLOBAL_STAFF.setAll([
		Permissions.MANAGE_GLOBAL_GENERAL, Permissions.MANAGE_GLOBAL_BANS, Permissions.MANAGE_GLOBAL_LOGS, Permissions.MANAGE_GLOBAL_NEWS,
		Permissions.MANAGE_GLOBAL_BOARDS, Permissions.MANAGE_GLOBAL_SETTINGS, Permissions.MANAGE_BOARD_OWNER, Permissions.BYPASS_FILTERS,
		Permissions.BYPASS_BANS, Permissions.BYPASS_SPAMCHECK, Permissions.BYPASS_RATELIMITS,
	]);
	const ADMIN = new Permission(GLOBAL_STAFF.base64);
	ADMIN.setAll([
		Permissions.MANAGE_GLOBAL_ACCOUNTS, Permissions.MANAGE_GLOBAL_ROLES, Permissions.VIEW_RAW_IP,
	]);
	const ROOT = new Permission();
	ROOT.setAll(Permission.allPermissions);

	test('root has all permissions', () => {
		expect(Permission.allPermissions.every(p => ROOT.get(p))).toBe(true);
	});

	test('applyInheritance() gives ROOT all permissions as long as they have Permissions.ROOT', () => {
		NO_PERMISSION.set(Permissions.ROOT);
		NO_PERMISSION.applyInheritance();
		expect(Permission.allPermissions.every(b => NO_PERMISSION.get(b))).toBe(true);
	});

	test('handleBody() by somebody with editorPermission NOT having Permissions.ROOT cannot set Permissions.ROOT', () => {
		const TEST_PERMISSION = new Permission();
		TEST_PERMISSION.handleBody({
			'permission_bit_0': 0,
		}, ANON);
		expect(TEST_PERMISSION.get(0)).toBe(false);
	});

	test('handleBody() by somebody with editorPermission having Permissions.ROOT CAN set Permissions.ROOT', () => {
		const TEST_PERMISSION = new Permission();
		TEST_PERMISSION.handleBody({
			'permission_bit_0': 0,
		}, ROOT);
		expect(TEST_PERMISSION.get(0)).toBe(true);
	});

	test('handleBody() does not allow setting permission outside of _MANAGE_BOARD_BITS when boardOnly=true, even with permission', () => {
		const TEST_PERMISSION = new Permission();
		TEST_PERMISSION.handleBody({
			'permission_bit_0': 0,
		}, ROOT, true);
		expect(TEST_PERMISSION.get(0)).toBe(false);
	});

});
