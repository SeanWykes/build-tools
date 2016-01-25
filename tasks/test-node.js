var tools = require('./lib');
var path = require('path');
var gulp = require('gulp');

gulp.task('test-node', [ 'build-package', 'build-tests' ], function (done) {
  var opts = tools.options;
  var specs = path.join( opts.output,'system', opts.packageName + '.tests.js' );
  var configjs = tools.option('configjs', path.join(opts.root, 'config.js'));

  tools.performTests( specs, configjs );
});


