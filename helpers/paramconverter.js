'use strict';

const { ObjectId } = require(__dirname+'/../db/db.js')
	, allowedArrays = new Set(['captcha', 'checkednews', 'checkedposts', 'globalcheckedposts', 'spoiler', 'strip_filename',
		'checkedreports', 'checkedbans', 'checkedbanners', 'checkedaccounts', 'countries']) //only these should be arrays, since express bodyparser can output arrays
	, trimFields = ['tags', 'uri', 'moderators', 'filters', 'announcement', 'description', 'message',
		'name', 'subject', 'email', 'postpassword', 'password', 'default_name', 'report_reason', 'ban_reason', 'log_message', 'custom_css'] //trim if we dont want filed with whitespace
	, numberFields = ['filter_mode', 'lock_mode', 'captcha_mode', 'tph_trigger', 'pph_trigger', 'trigger_action', 'bump_limit', 'reply_limit', 'move_to_thread',, 'postId',
		'max_files', 'thread_limit', 'thread', 'max_thread_message_length', 'max_reply_message_length', 'min_thread_message_length', 'min_reply_message_length', 'auth_level'] //convert these to numbers before they hit our routes
	, banDurationRegex = /^(?<YEAR>[\d]+y)?(?<MONTH>[\d]+m)?(?<WEEK>[\d]+w)?(?<DAY>[\d]+d)?(?<HOUR>[\d]+h)?$/
	, timeUtils = require(__dirname+'/timeutils.js')
	, makeArrayIfSingle = (obj) => !Array.isArray(obj) ? [obj] : obj;

module.exports = (req, res, next) => {

	const bodyfields = Object.keys(req.body);
	for (let i = 0; i < bodyfields.length; i++) {
		const key = bodyfields[i];
		const val = req.body[key];
		/*
			bodyparser can form arrays e.g. for multiple files, but we only want arrays in fields we
			expect, to prevent issues when validating/using them later on.
		*/
		if (!allowedArrays.has(key) && Array.isArray(val)) {
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': 'Malformed input'
			});
		} else if (allowedArrays.has(key) && !Array.isArray(val)) {
			req.body[key] = makeArrayIfSingle(req.body[key]); //convert to arrays with single item for simpler case batch handling later
		}
	}

	for (let i = 0; i < trimFields.length; i++) {
		const field = trimFields[i];
		if (req.body[field]) {
			//trimEnd() because trailing whitespace doesnt affect how a post appear and if it is all whitespace, trimEnd will get it all anyway
			req.body[field] = req.body[field].trimEnd();
		}
	}

	for (let i = 0; i < numberFields.length; i++) {
		const field = numberFields[i];
		if (req.body[field]) {
			const num = parseInt(req.body[field]);
			if (Number.isSafeInteger(num)) {
				req.body[field] = num;
			} else {
				req.body[field] = null;
			}
		}
	}

	//convert checked reports to number
	if (req.body.checkedposts) {
		req.body.checkedposts = req.body.checkedposts.map(Number);
	}
	//convert checked global reports to mongoid
	if (req.body.globalcheckedposts) {
		req.body.globalcheckedposts = req.body.globalcheckedposts.map(ObjectId)
	}
	if (req.body.checkednews) {
		req.body.checkednews = req.body.checkednews.map(ObjectId)
	}
	//convert checked bans to mongoid
	if (req.body.checkedbans) {
		req.body.checkedbans = req.body.checkedbans.map(ObjectId)
	}
/*
	//convert checked reports to mongoid
	if (req.body.checkedreports) {
		req.body.checkedreports = req.body.checkedreports.map(ObjectId)
	}
*/

	//ban duration convert to ban time in ms
	if (req.body.ban_duration) {
		const matches = req.body.ban_duration.match(banDurationRegex);
		if (matches && matches.groups) {
			const groups = matches.groups;
			let banDuration = 0;
			const groupKeys = Object.keys(groups);
			for (let i = 0; i < groupKeys.length; i++) {
				const key = groupKeys[i];
				if (!groups[key]) {
					continue;
				}
				const mult = +groups[key].substring(0,groups[key].length-1); //remove the d, m, y, etc from end of the value
				if (Number.isSafeInteger(mult) //if the multiplier is safe int
					&& Number.isSafeInteger(mult*timeUtils[key]) //and multiplying it is safe int
					&& Number.isSafeInteger((mult*timeUtils[key])+banDuration)) { //and adding it to the total is safe
					banDuration += mult*timeUtils[key];
				}
			}
			req.body.ban_duration = banDuration;
		} else {
			req.body.ban_duration = null;
		}
	}

	//thread id
	if (req.params.id) {
		req.params.id = +req.params.id;
	}
	//moglog date
	if (req.params.date) {
		let [ month, day, year ] = req.params.date.split('-');
		month = month-1;
		const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
		if (date !== 'Invalid Date') {
			res.locals.date = { month, day, year, date };
		}
	}

	next();

}
