gulp = require 'gulp'
del = require 'del'
config = require("../config").cleanup

gulp.task "cleanup", ((cb) ->

  del config, cb

  return)
