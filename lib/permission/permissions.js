'use strict';

const Permissions = Object.seal(Object.freeze(Object.preventExtensions({

	ROOT: 0,

	VIEW_RAW_IP: 1,

	CREATE_BOARD: 2,
	CREATE_ACCOUNT: 3,

	BYPASS_BANS: 4,
	BYPASS_SPAMCHECK: 5,
	BYPASS_RATELIMITS: 6,
	BYPASS_FILTERS: 7,
	BYPASS_CAPTCHA: 8,
	BYPASS_DNSBL: 9,
	BYPASS_ANONYMIZER_RESTRICTIONS: 10,

	MANAGE_GLOBAL_GENERAL: 11,
	MANAGE_GLOBAL_LOGS: 12,
	MANAGE_GLOBAL_NEWS: 13,
	MANAGE_GLOBAL_BOARDS: 14,
	MANAGE_GLOBAL_SETTINGS: 15,
	MANAGE_GLOBAL_ACCOUNTS: 16,
	MANAGE_GLOBAL_ROLES: 17,
	MANAGE_GLOBAL_BANS: 18,

	MANAGE_BOARD_OWNER: 20,
	MANAGE_BOARD_GENERAL: 21,
	MANAGE_BOARD_BANS: 22,
	MANAGE_BOARD_LOGS: 23,
	MANAGE_BOARD_SETTINGS: 24,
	MANAGE_BOARD_CUSTOMISATION: 25,
	MANAGE_BOARD_STAFF: 26,
	_MANAGE_BOARD_BITS: [20,21,22,23,24,25,26], //bits that can be set by a BO and partial bitfield will be stored in board staff object

	VIEW_BOARD_GLOBAL_BANS: 30,

	USE_MARKDOWN_PINKTEXT: 35,
	USE_MARKDOWN_GREENTEXT: 36,
	USE_MARKDOWN_BOLD: 37,
	USE_MARKDOWN_UNDERLINE: 38,
	USE_MARKDOWN_STRIKETHROUGH: 39,
	USE_MARKDOWN_TITLE: 40,
	USE_MARKDOWN_ITALIC: 41,
	USE_MARKDOWN_SPOILER: 42,
	USE_MARKDOWN_MONO: 43,
	USE_MARKDOWN_CODE: 44,
	USE_MARKDOWN_DETECTED: 45,
	USE_MARKDOWN_LINK: 46,
	USE_MARKDOWN_DICE: 47,
	USE_MARKDOWN_FORTUNE: 48,

})));

const Metadata = Object.seal(Object.freeze(Object.preventExtensions({

	[Permissions.ROOT]: { title: 'Root', label: 'Root', desc: 'Full control. Use with caution!', parent: Permissions.ROOT },

	[Permissions.VIEW_RAW_IP]: { title: 'Raw IPs', label: 'View Raw IPs', desc: 'Ability to see raw IPs in moderation interfaces.' },

	[Permissions.CREATE_BOARD]: { title: 'Create', label: 'Create Board', desc: 'Ability to create new boards.' },
	[Permissions.CREATE_ACCOUNT]: { label: 'Create Account', desc: 'Ability to register an account.' },

	[Permissions.BYPASS_BANS]: { title: 'Bypasses', label: 'Bypass Bans', desc: 'Bypass all bans.' },
	[Permissions.BYPASS_SPAMCHECK]: { label: 'Bypass Spamcheck', desc: 'Bypass the basic anti-flood spamcheck for too frequent similar posting.' },
	[Permissions.BYPASS_RATELIMITS]: { label: 'Bypass Ratelimits', desc: 'Bypass ratelimits for getting new captchas, editing posts, editing board settings, etc.' },
	[Permissions.BYPASS_FILTERS]: { label: 'Bypass Filters', desc: 'Bypass all post filters.' },
	[Permissions.BYPASS_CAPTCHA]: { label: 'Bypass Captcha', desc: 'Bypass captcha.' },
	[Permissions.BYPASS_DNSBL]: { label: 'Bypass DNSBL', desc: 'Bypass DNSBL.' },
	[Permissions.BYPASS_ANONYMIZER_RESTRICTIONS]: { label: 'Bypass Anonymizer Restrictions', desc: 'Bypass anonymizer restrictions e.g. disabled file posting.' },

	[Permissions.MANAGE_GLOBAL_GENERAL]: { title: 'Global Management',label: 'Global Staff', desc: 'General global staff permission. Access to recent posts and reports. Ability to submit global actions.' },
	[Permissions.MANAGE_GLOBAL_BANS]: { label: 'Global Bans', desc: 'Access global bans. Ability to unban, edit, or deny appeals.' },
	[Permissions.MANAGE_GLOBAL_LOGS]: { label: 'Global Logs', desc: 'Access global logs. Ability to search/filter' },
	[Permissions.MANAGE_GLOBAL_NEWS]: { label: 'News', desc: 'Access news posting. Ability to add, edit, or delete newsposts.' },
	[Permissions.MANAGE_GLOBAL_BOARDS]: { label: 'Boards', desc: 'Access the global board list. Ability to search/filter. Also grants the ability to transfer or delete any board.' },
	[Permissions.MANAGE_GLOBAL_SETTINGS]: { label: 'Global Settings', desc: 'Access global settings. Ability to change any settings.' },
	[Permissions.MANAGE_GLOBAL_ACCOUNTS]: { label: 'Accounts', desc: 'Access the accounts list. Ability to search/sort. Ability to edit permissions of any user.', parent: Permissions.ROOT },
	[Permissions.MANAGE_GLOBAL_ROLES]: { label: 'Roles', desc: 'Access roles list. Ability to edit roles', parent: Permissions.ROOT },

	[Permissions.MANAGE_BOARD_OWNER]: { title: 'Board Management', subtitle: 'Note: Setting board management permissions on an account/role level will grant them globally i.e for all boards.\nTo make somebody a normal board owner/staff, transfer them the board or give them the appropriate permissions in the board staff permission editing interface.', label: 'Board Owner', desc: 'Full control of the board, equivalent to the BO. Can delete and/or transfer the board. Can only be given by somebody else with "Board Owner" permission. Use with caution!', parent: Permissions.MANAGE_BOARD_OWNER },
	[Permissions.MANAGE_BOARD_GENERAL]: { label: 'Board Staff', desc: 'General board staff permission. Access mod index, catalog, recent posts and reports. Ability to submit mod actions. Bypass board-specific bans and post filters.', block: true },
	[Permissions.MANAGE_BOARD_BANS]: { label: 'Bans', desc: 'Access board bans. Ability to unban, edit, or deny appeals.' },
	[Permissions.MANAGE_BOARD_LOGS]: { label: 'Logs', desc: 'Access board logs. Ability to search/filter.' },
	[Permissions.MANAGE_BOARD_SETTINGS]: { label: 'Settings', desc: 'Access board settings. Ability to change any settings. Settings page will show transfer/delete forms for those with "Board Owner" permission.' },
	[Permissions.MANAGE_BOARD_CUSTOMISATION]: { label: 'Customisation', desc: 'Access to board assets and custompages. Ability to upload, create, edit, delete.' },
	[Permissions.MANAGE_BOARD_STAFF]: { label: 'Staff', desc: 'Access to staff management, and ability to add or remove permissions from others. Can only be given by somebody else with "Board Owner" permission. Use with caution!', parent: Permissions.MANAGE_BOARD_OWNER },
	[Permissions.VIEW_BOARD_GLOBAL_BANS]: { label: 'View Board Global Bans', desc: 'Ability to view global bans on board modlog pages if the banned post originated from that board.', parent: Permissions.ROOT },

	[Permissions.USE_MARKDOWN_PINKTEXT]: { title: 'Post styling', label: 'Pinktext', desc: 'Use pinktext' },
	[Permissions.USE_MARKDOWN_GREENTEXT]: { label: 'Greentext', desc: 'Use greentext' },
	[Permissions.USE_MARKDOWN_BOLD]: { label: 'Bold', desc: 'Use bold' },
	[Permissions.USE_MARKDOWN_UNDERLINE]: { label: 'Underline', desc: 'Use underline' },
	[Permissions.USE_MARKDOWN_STRIKETHROUGH]: { label: 'Strikethrough', desc: 'Use strikethrough' },
	[Permissions.USE_MARKDOWN_TITLE]: { label: 'Title', desc: 'Use titles' },
	[Permissions.USE_MARKDOWN_ITALIC]: { label: 'Italic', desc: 'Use italics' },
	[Permissions.USE_MARKDOWN_SPOILER]: { label: 'Spoiler', desc: 'Use spoilers' },
	[Permissions.USE_MARKDOWN_MONO]: { label: 'Inline Monospace', desc: 'Use inline monospace' },
	[Permissions.USE_MARKDOWN_CODE]: { label: 'Code Block', desc: 'Use code blocks' },
	[Permissions.USE_MARKDOWN_DETECTED]: { label: 'Detected', desc: 'Use detected' },
	[Permissions.USE_MARKDOWN_LINK]: { label: 'Links', desc: 'Make links clickable' },
	[Permissions.USE_MARKDOWN_DICE]: { label: 'Dice Roll', desc: 'Use dice rolls' },
	[Permissions.USE_MARKDOWN_FORTUNE]: { label: 'Fortune', desc: 'Use fortunes' },

})));

module.exports = {

	Permissions,

	Metadata,

};
