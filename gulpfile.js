'use strict';
const gulp = require('gulp')
	, less = require('gulp-less')
	, uglify = require('gulp-uglify-es').default
	, cleanCSS = require('gulp-clean-css')
	, del = require('del');

const paths = {
	styles: {
		src: 'gulp/res/css/*.css',
		dest: 'static/css/'
	},
	images: {
		src: 'gulp/res/img/*',
		dest: 'static/img/'
	}
};

function clean() {
	return del([ 'static/html/*' ]);
}

//update the css file
function css() {
	return gulp.src(paths.styles.src)
		.pipe(less())
		.pipe(cleanCSS())
		.pipe(gulp.dest(paths.styles.dest));
}

//favicon, spoiler image, default banner, spoiler/sticky/sage icons
function images() {
	return gulp.src(paths.images.src)
		.pipe(gulp.dest(paths.images.dest));
}

const build = gulp.parallel(css, images);

module.exports = {
	clean,
	css,
	images,
	default: build
};

