'use strict';

const allowedMimeTypes = new Set(['image/jpeg', 'image/pjpeg', 'image/png', 'image/gif']);

module.exports = (mimetype) => allowedMimeTypes.has(mimetype);
