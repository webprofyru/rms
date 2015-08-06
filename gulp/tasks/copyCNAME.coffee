gulp = require("gulp")
config = require("../config").copyData

gulp.task "copyCNAME", [], (->
  gulp.src("#{config.src}/CNAME").pipe(gulp.dest(config.dest));
  return)