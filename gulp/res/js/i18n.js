/* eslint-disable no-unused-vars */
/* globals LANG */
const CURRENTLANG = document.head.dataset.lang;
const __ = (key) => {
	//TODO: we'll see if this needs to be more advanced in future
	return LANG[CURRENTLANG][key];
};
