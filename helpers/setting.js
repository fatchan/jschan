'use strict';

module.exports = {
	trimSetting: (setting, oldSetting) => {
		return setting && setting.trim().length > 0 ? setting : oldSetting;
	},
	numberSetting: (setting, oldSetting) => {
		return typeof setting === 'number' && setting !== oldSetting ? setting : oldSetting;
	},
	booleanSetting: (setting) => {
		return setting != null;
	},
	arraySetting: (setting, oldSetting, limit=false) => {
		if (setting !== null) {
			const split = setting
				.split(/\r?\n/)
				.filter(n => n);
			return split
				.slice(0, limit || split.length);
		}
		return oldSetting;
	}
};
