gulp = require("gulp")
gutil = require("gulp-util")
changed = require("gulp-changed")
browserSync = require("browser-sync")
handleErrors = require("../util/handleErrors")
jade = require('gulp-jade')
rename = require('gulp-rename')
config = require("../config")

gulp.task "jade", (->

  jadeOpts =
    locals:
      dev: gutil.env.dev

  # app.html
  gulp.src(config.jade.src).pipe(jade(jadeOpts)).on("error", handleErrors)
#    .pipe(changed(config.jade.dest)) # Zork: Don't know why, but this blocks index.html update, when some included jade is changed
    .pipe(gulp.dest(config.jade.dest))
    .pipe(browserSync.reload(stream: true))

  # dev pages
  gulp.src(config.jade.indexSrc).pipe(jade(jadeOpts)).on("error", handleErrors)
    .pipe(rename('emails.html'))
    .pipe(changed(config.jade.dest))
    .pipe(gulp.dest(config.jade.dest))
    .pipe(browserSync.reload(stream: true))

  # dev pages
#  gulp.src(config.jade.indexSrc).pipe(jade(jadeOpts)).on("error", handleErrors)
#    .pipe(rename('people.html'))
#    .pipe(gulp.dest(config.jade.dest))
#    .pipe(browserSync.reload(stream: true))
#
#  gulp.src(config.jade.indexSrc).pipe(jade(jadeOpts)).on("error", handleErrors)
#    .pipe(rename('config.html'))
#    .pipe(gulp.dest(config.jade.dest))
#    .pipe(browserSync.reload(stream: true))
#
#  gulp.src(config.jade.indexSrc).pipe(jade(jadeOpts)).on("error", handleErrors)
#    .pipe(rename('data.html'))
#    .pipe(gulp.dest(config.jade.dest))
#    .pipe(browserSync.reload(stream: true))

  # test.html
  if gutil.env.test
    gulp.src(config.test.src).pipe(jade(jadeOpts)).on("error", handleErrors)
      .pipe(changed(config.test.dest))
      .pipe(gulp.dest(config.test.dest))
      .pipe(browserSync.reload(stream: true))

  return)
