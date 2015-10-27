gulp = require("gulp")
config = require("../config").copyData

gulp.task "copyCNAME", [], (->
  gulp.src("#{config.src}/CNAME").pipe(gulp.dest(config.dest));
  gulp.src("#{config.src}/.nojekyll").pipe(gulp.dest(config.dest));
  return)