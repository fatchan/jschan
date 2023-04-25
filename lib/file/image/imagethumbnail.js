const gm = require('@fatchan/gm')
	, im = require('@fatchan/gm').subClass({ imageMagick: true })
	, ffmpeg = require('fluent-ffmpeg')
	, config = require(__dirname+'/../../misc/config.js')
	, uploadDirectory = require(__dirname+'/../uploaddirectory.js');

module.exports = (file) => {

	const { thumbSize, ffmpegGifThumbnails, animatedGifThumbnails } = config.get;

	//decide whether to animate gif thumbnail and update thumbextension
	let firstFrameOnly = true;
	if (file.hasThumb
		&& file.mimetype === 'image/gif'
		&& animatedGifThumbnails === true) {
		firstFrameOnly = false;
		file.thumbextension = '.gif';
	}

	//if enabled, make animated gif thumbs with ffmpeg
	if (ffmpegGifThumbnails && !firstFrameOnly) {
		const thumbSizeFilter = file.geometry.width > file.geometry.height ? `${thumbSize}:-1` : `-1:${thumbSize}`;
		const complexFilters = [
				/* this complex filter scales (resizes), and works some magic to preserve transparency,
					with an additional filter to reduce the aliasing on outlines of transparent parts. */
			`[0:v] scale=${thumbSizeFilter},split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`
		];
		return new Promise((resolve, reject) => {
			ffmpeg(`${uploadDirectory}/file/${file.filename}`)
				.on('end', () => {
					return resolve();
				})
				.on('error', function(err) {
					return reject(err);
				})
				.complexFilter(complexFilters)
				.save(`${uploadDirectory}/file/thumb/${file.hash}${file.thumbextension}`);
		});
	}

	//else we are using im/gm
	let thumbnailing;
	if (file.mimetype === 'image/webp') {
		//animated webp (which we cant tell apart from non-anim) need to be processed with imagemagick and cant make animated thumbs
		thumbnailing = im(`${uploadDirectory}/file/${file.filename}[0]`);
	} else {
		thumbnailing = gm(`${uploadDirectory}/file/${file.filename}${firstFrameOnly ? '[0]' : ''}`);
		if (!firstFrameOnly) {
			//try (and fail) to make gm thumbnailing less shit.
			thumbnailing.coalesce();
		}
	}

	return new Promise((resolve, reject) => {
		thumbnailing.resize(Math.min(thumbSize, file.geometry.width), Math.min(thumbSize, file.geometry.height))
			.write(`${uploadDirectory}/file/thumb/${file.hash}${file.thumbextension}`, function (err) {
				if (err) {
					return reject(err);
				}
				return resolve();
			});
	});

};
