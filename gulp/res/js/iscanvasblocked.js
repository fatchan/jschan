/* eslint-disable no-unused-vars */
// Canvas Blocker & Firefox privacy.resistFingerprinting Detector. (c) 2018 // JOHN OZBAY // CRYPT.EE // MIT License: https://github.com/johnozbay/canvas-block-detector/blob/master/isCanvasBlocked.js
function isCanvasBlocked() {
	var canvas = document.createElement('canvas');
	var ctx = canvas.getContext('2d');
	if (!ctx) { return true; }
	var imageData = ctx.createImageData(1, 1);
	var originalImageData = imageData.data;
	originalImageData[0] = 128;
	originalImageData[1] = 128;
	originalImageData[2] = 128;
	originalImageData[3] = 255;
	ctx.putImageData(imageData, 1, 1);
	try {
		var checkData = ctx.getImageData(1, 1, 1, 1).data;
		if (
			originalImageData[0] !== checkData[0] &&
      originalImageData[1] !== checkData[1]
		) { return true; }
	} catch (error) {
		return true;
	}
	return false;
}
