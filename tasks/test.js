var gulp = require('gulp');
var karma = require('karma').Server;
var ts = require('gulp-typescript');
var fn = require('gulp-filenames');

/**
 * Run test once and exit
 */
gulp.task('test', [ 'build-package', 'build-tests' ], function (done) {
  new karma({
    configFile: config.karma,
    singleRun: true
  }, function(e) {
    done();
  }).start();
});

/**
 * Watch for file changes and re-run tests on each change
 */
gulp.task('tdd', [ 'build-package', 'build-tests' ], function (done) {
  var project = ts.createProject( config.project );
  project.src()
    .pipe(fn());

  gulp.watch(fn.get(), ['build-package'] );
  gulp.watch(config.tests, ['build-tests'] );
  new karma({
    configFile: config.karma,
    singleRun: false
  }, function(e) {
    done();
  }).start();
});

/**
 * Run test once with code coverage and exit
 * NOT WORKING!!
 */
gulp.task('cover', function (done) {
  new karma({
    configFile: config.karma,
    singleRun: true,
    reporters: ['coverage'],
    preprocessors: {
      'test/**/*.js': ['babel'],
      'src/**/*.js': ['babel', 'coverage']
    },
    coverageReporter: {
      type: 'html',
      dir: 'build/reports/coverage'
    }
  }, function (e) {
    done();
  }).start();
});
