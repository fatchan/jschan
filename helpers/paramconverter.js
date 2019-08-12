'use strict';

const { ObjectId } = require(__dirname+'/../db/db.js')
	, allowedArrays = new Set(['checkedposts', 'globalcheckedposts', 'checkedbans', 'checkedbanners']) //only these can be arrays, since express bodyparser will output arrays
	, trimFields = ['uri', 'moderators', 'filters', 'announcement', 'description', 'message',
		'name', 'subject', 'email', 'password', 'default_name', 'report_reason', 'ban_reason'] //trim if we dont want filed with whitespace
	, numberFields = ['filter_mode', 'captcha_mode', 'tph_trigger', 'tph_trigger_action', 'reply_limit',
		'max_files', 'thread_limit', 'thread', 'min_thread_message_length', 'min_reply_message_length'] //convert these to numbers before they hit our routes
	, banDurationRegex = /^(?<year>[\d]+y)?(?<month>[\d]+m)?(?<week>[\d]+w)?(?<day>[\d]+d)?(?<hour>[\d]+h)?$/
	, msTime = require(__dirname+'/mstime.js')

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
	//convert checked bans to mongoid
	if (req.body.checkedbans) {
		req.body.checkedbans = req.body.checkedbans.map(ObjectId)
	}

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
					&& Number.isSafeInteger(mult*msTime[key]) //and multiplying it is safe int
					&& Number.isSafeInteger((mult*msTime[key])+banDuration)) { //and adding it to the total is safe
					banDuration += mult*msTime[key];
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
	//board page
	if (req.params.page) {
		req.params.page = req.params.page === 'index' ? 'index' : +req.params.page;
	}

	next();

}
