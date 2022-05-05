const gm = require('gm')
	, ffmpeg = require('fluent-ffmpeg')
	, config = require(__dirname+'/../../misc/config.js')
	, uploadDirectory = require(__dirname+'/../uploaddirectory.js');

module.exports = (file, firstFrameOnly=true) => {

	const { thumbSize, ffmpegGifThumbnails } = config.get;
	return new Promise((resolve, reject) => {
		if (ffmpegGifThumbnails && !firstFrameOnly) {
			const thumbSizeFilter = file.geometry.width > file.geometry.height ? `${thumbSize}:-1` : `-1:${thumbSize}`;
			const complexFilters = [
					/* this complex filter scales (resizes), and works some magic to preserve transparency,
						with an additional filter to reduce the aliasing on outlines of transparent parts. */
				`[0:v] scale=${thumbSizeFilter},split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`
			];
			ffmpeg(`${uploadDirectory}/file/${file.filename}`)
				.on('end', () => {
					return resolve();
				})
				.on('error', function(err) {
					return reject(err);
				})
				.complexFilter(complexFilters)
				.save(`${uploadDirectory}/file/thumb/${file.hash}${file.thumbextension}`);
		} else {
			//[0] for first frame (gifs, etc)
			const thumbnailing = gm(`${uploadDirectory}/file/${file.filename}${firstFrameOnly ? '[0]' : ''}`);
			if (!firstFrameOnly) {
				//try (and fail) to make gm thumbnailing less shit.
				thumbnailing.coalesce();
			}
			thumbnailing.resize(Math.min(thumbSize, file.geometry.width), Math.min(thumbSize, file.geometry.height))
				.write(`${uploadDirectory}/file/thumb/${file.hash}${file.thumbextension}`, function (err) {
					if (err) {
						return reject(err);
					}
					return resolve();
				});
		}
	});

};
