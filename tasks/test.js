var gulp = require('gulp');
var harness = require('./lib/harness' );

gulp.task('test', [ 'build-package', 'build-tests' ], function (done) {
  console.log( 'test:' + config.output );
  harness.performTests( config.output + 'system/' + config.packageName + '.tests' );
});


