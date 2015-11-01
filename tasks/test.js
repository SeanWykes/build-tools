var gulp = require('gulp');
var karma = require('karma').server;

/**
 * Run test once and exit
 */
gulp.task('test', [ 'build-package', 'build-tests' ], function (done) {
  karma.start({
    configFile: config.karma,
    singleRun: true
  }, function(e) {
    done();
  });
});

/**
 * Watch for file changes and re-run tests on each change
 * NOT WORKING!!
 */
gulp.task('tdd', [ 'build-package', 'build-tests' ], function (done) {
  karma.start({
    configFile: config.karma
  }, function(e) {
      done();
  });
});

/**
 * Run test once with code coverage and exit
 * NOT WORKING!!
 */
gulp.task('cover', function (done) {
  karma.start({
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
  });
});
