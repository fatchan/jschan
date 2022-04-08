'use strict';

module.exports = {

	trimSetting: (setting, oldSetting) => {
		return typeof setting === 'string' ? setting.trim() : oldSetting;
	},

	numberSetting: (setting, oldSetting) => {
		return typeof setting === 'number' && setting !== oldSetting ? setting : oldSetting;
	},

	booleanSetting: (setting) => {
		return setting != null;
	},

	arraySetting: (setting, oldSetting, limit=false) => {
		if (typeof setting === 'string') {
			const split = setting
				.split(/\r?\n/)
				.filter(n => n);
			return split
				.slice(0, limit || split.length);
		}
		return oldSetting;
	},

};
