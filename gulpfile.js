'use strict';
const gulp = require('gulp')
	, less = require('gulp-less')
	, uglify = require('gulp-uglify-es').default
	, cleanCSS = require('gulp-clean-css')
	, del = require('del');

const paths = {
	styles: {
		src: 'gulp/res/css/*.css',
		dest: 'dist/css/'
	},
	images: {
		src: 'gulp/res/img/*',
		dest: 'uploads/img/'
	},
	scripts: {
		src: 'gulp/res/js/*.js',
		dest: 'dist/js/'
	}
};

function clean() {
	return del([ 'dist' ]);
}

function styles() {
	return gulp.src(paths.styles.src)
		.pipe(less())
		.pipe(cleanCSS())
		.pipe(gulp.dest(paths.styles.dest));
}

function scripts() {
	return gulp.src(paths.scripts.src)
		.pipe(uglify())
		.pipe(gulp.dest(paths.scripts.dest));
}

function images() { //basically the favicon and spoiler image
  return gulp.src(paths.images.src)
    .pipe(gulp.dest(paths.images.dest));
}


const build = gulp.parallel(styles, scripts, images);

module.exports.clean = clean;
module.exports.default = build;

