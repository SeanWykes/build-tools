var gulp = require('gulp');
var tools = require('./lib');

var path = require('path');
var ts = require('gulp-typescript');
var runSequence = require('run-sequence');
var to5 = require('gulp-babel');
var assign = Object.assign || require('object.assign');
var merge = require('merge2');
var concat = require('gulp-concat');
var dbg = require('gulp-debug');

var config = tools.options;

var babelOptions = babelOptions || {
  filename: '',
  filenameRelative: '',
  modules: '',
  sourceMap: true,
  sourceMapName: '',
  sourceRoot: '',
  moduleRoot: path.resolve('src').replace(/\\/g, '/'),
  moduleIds: false,
  experimental: false,
  comments: false,
  compact: false,
  code:true,
  stage:2,
  loose: "all",
  optional: [
    "es7.decorators",
    "es7.classProperties"
  ]
};

gulp.task('build-package', function () {
  var project = ts.createProject( config.project,
    { target:'es6',
    typescript: require('typescript'),
    noExternalResolve: true }
  );

  var sources = project.src();

  var compiledTS = tools.transpileTS( project, sources, tools.ensureArray( config.typings ), config.packageName );

  return merge([
    compiledTS.dts.pipe(gulp.dest(config.output))
      .pipe(gulp.dest(config.output + 'cjs'))
      .pipe(gulp.dest(config.output + 'amd')),
    compiledTS.js.pipe(gulp.dest(config.output))
  ]);
});

gulp.task('build-es6', [ 'build-package' ], function () {
  return gulp.src( config.output + config.packageName + '.js' )
    .pipe( gulp.dest(config.output + 'es6') );
});

gulp.task('build-cjs', [ 'build-package' ], function () {
  return gulp.src(config.output + config.packageName + '.js')
    .pipe( to5( assign({}, babelOptions, {modules:'common'} ) ) )
    //.pipe( concat( config.packageName + '.js' ))
    .pipe( gulp.dest(config.output + 'cjs') );
});

gulp.task('build-system', [ 'build-package' ], function () {
  return gulp.src(config.output + config.packageName + '.js')
    .pipe(to5(assign({}, babelOptions, {modules:'system'})))
    .pipe(gulp.dest(config.output + 'system'));
});

gulp.task('build-amd', [ 'build-package' ], function () {
  return gulp.src( config.output + config.packageName + '.js' )
    .pipe( to5( assign( {}, babelOptions, {modules:'amd'} ) ) )
    .pipe( gulp.dest(config.output + 'amd') );
});

gulp.task('build-tests', function () {
  var tests = tools.ensureArray( config.tests );

  var typings = tools.ensureArray( config.typings );

  typings.push( __dirname+'/../typings/*.ts' );

  var options = { target:'es6',typescript: require('typescript'), experimentalDecorators: true, emitDecoratorMetadata: true };
  var project = ts.createProject( options );
  var sources = gulp.src( tests );

  var compiledTS = tools.transpileTS( project, sources, typings, config.packageName + '.tests' );

  return compiledTS.js
    .pipe(gulp.dest(config.output))
    .pipe(to5(assign({}, babelOptions, {modules:'system'})))
    .pipe(gulp.dest(config.output + 'system'));
});

gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    //'build-package',
    //'build-es6', 'build-commonjs',
    'build-amd', 'build-cjs', 'build-system',
    'build-tests',
    callback
  );
});
