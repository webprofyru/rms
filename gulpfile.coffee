#{task, async, sync, go, gutil} = require('ds-gulp-builder')(gulp = require('gulp'))
{task, async, sync, go, gutil} = require('ds-gulp-builder')(gulp = require('gulp'))

tasks = []

# Clear build and temp folders
clearFolders = [

  task('clear-build').clearFolder('build').keep('.git')

]

buildTasks = []

# ----------------------------
# Build HTML UI

buildTasks.push task('build-ui-coffee').browserify('src/index.coffee').dest('build')

buildTasks.push task('build-ui-pug').jade('src').dest('build')

buildTasks.push task('build-ui-sass').sass('src').dest('build')

tasks.push sync [buildTasks, task('browser-sync').browserSync('build')]

# ----------------------------
# Run

go sync [clearFolders, tasks]
