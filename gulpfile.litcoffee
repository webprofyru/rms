Старый вариант сборки
==============================
, сделанный на основе идей gulp-starter'а (https://github.com/vigetlabs/gulp-starter)

    # requireDir = require('require-dir');
    # requireDir('./gulp/tasks', { recurse: true });

И если надо, то для чтобы старый вариант заработал, надо вернуть в package.json следующий элемент верхнего уровня:
`"browserify": { "transform": [ "coffeeify" ]}`.

Новый вариант
==============================
, с использование ds-gulp-builder (https://www.npmjs.com/package/ds-gulp-builder,  https://github.com/delightsoft/DSGulpBuilder)

    {task, async, sync, go, gutil} = require('ds-gulp-builder')(gulp = require('gulp'))

Для gulp-задач, которых нет в ds-gulp-builder подключаем необходимые npm-пакеты

    path = require 'path'
    jade = require 'gulp-jade'
    changed = require 'gulp-changed'
    (notify = require 'gulp-notify').logger (->)

В clearFolders пишем все задачи очистки папок.  Папку ./build чистим сохраняя директорию .git, чтоб не терять
настройки публикации в ветку gh-pages (https://github.com/webprofyru/rms/tree/gh-pages).

    clearFolders = [
      task('clear-build').clearFolder('./build').keep('.git')]

Собираем все задачи в спискок задач

    tasks = []

Основное приложение
------------------------------

Файлы для правильной работы GitHub Pages (gh-pages)

    tasks.push task('gh-CNAME').copy('./src/CNAME').dest('./build')
    tasks.push task('gh-nojekyll').copy('./src/.nojekyll').dest('./build')

JS

    tasks.push task('app-js').browserify('./src/app/app.coffee').dest('./build')

HTML

    tasks.push task('app-html').jade('./src/app/index.jade').dest('./build')

CSS

    tasks.push task('app-css').sass('./src/sass').dest('./build')

Images

    tasks.push task('app-images').copy('./src/images').dest('./build/images')

Libs

    tasks.push task('app-libs').copy('./static/libs').dest('./build/libs')

Data

    tasks.push task('app-data').copy('./data').dest('./build/data')

Тесты
------------------------------
Их можно запускать по адресу http://localhost:3010/tests

Тесты добавляем только, если **gulp --test**

    if gutil.env.test

JS

      tasks.push task('tests-js').browserify('./test/test.coffee').dest('./build')

HTML

      tasks.push task('test-html').jade('./test').dest('./build')

Emails
------------------------------

HTML

  tasks.push task('emails-html').jade('./src/app/svc/emails/emails.jade').dest('./build')

JS

  tasks.push task('emails-js').browserify('./src/app/svc/emails/emails.coffee').dest('./build')

Делаем из jade скрипт-шаблон для формы письма, которые будем использоваться в http://rms.webprofy.ru/emails.

Это пример задачи, которой пока нет в арсенале ds-gulp-builder.  Потому мы её пишем просто в стиле gulp.

    do (taskName = 'emails-template-js', src = './src/app/svc/emails/_emailTemplate.jade', dest = './build') ->

      tasks.push taskName


      gulp.task taskName, (cb) ->

В качестве результата мы возвращаем pipe, так что дальше gulp сам разберется когда считать что задача выполнена.
Событие finish нам обрабатывать не надо.

        gulp.src src
        .pipe jade {client: true}
        .on 'error', (err) ->
          # TODO: Код обработки ошибок надо вынести в ds-gulp-builder как общую функцию
          notify.onError
            title: "Task '#{taskName}': Error"
            message: '<%= error %>'
          .apply @, Array::slice.call arguments
          return
        .pipe changed path.dirname dest, hasChanged: changed.compareSha1Digest
        .pipe gulp.dest dest

      GLOBAL.gulp.watch src, [taskName]

И всё запускаем :)
------------------------------

    if gutil.env.dev then go tasks
    else go sync [clearFolders, tasks]