'use strict';

//todo: refactor
const Permissions = require(__dirname+'/../../permission/permissions.js')
	, dynamicResponse = require(__dirname+'/../../misc/dynamic.js')
	, cache = {
		one: {}, all: {}, any: {},
	};

module.exports = {

	one: (requiredPermission) => {
		return cache.one[requiredPermission] || (cache.one[requiredPermission] = function(req, res, next) {
			if (!res.locals.permissions.get(requiredPermission)) {
				return res.status(403).render('message', {
					'title': 'Forbidden',
					'message': 'No Permission',
					'redirect': req.headers.referer || '/',
				});
			}
			next();
		});
	},

	all: (...requiredPermissions) => {
		//these caches working as intended with arrays?
		return cache.all[requiredPermissions] || (cache.all[requiredPermissions] = function(req, res, next) {
			if (!res.locals.permissions.hasAll(...requiredPermissions)) {
				return res.status(403).render('message', {
					'title': 'Forbidden',
					'message': 'No Permission',
					'redirect': req.headers.referer || '/',
				});
			}
			next();
		});
	},

	any: (...requiredPermissions) => {
		//these caches working as intended with arrays?
		return cache.any[requiredPermissions] || (cache.any[requiredPermissions] = function(req, res, next) {
			if (!res.locals.permissions.hasAny(...requiredPermissions)) {
				return res.status(403).render('message', {
					'title': 'Forbidden',
					'message': 'No Permission',
					'redirect': req.headers.referer || '/',
				});
			}
			next();
		});
	},

};
