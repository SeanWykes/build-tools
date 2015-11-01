var path = require('path');
var gulp = require('gulp');
var runSequence = require('run-sequence');
var ts = require('gulp-typescript');
var to5 = require('gulp-babel');
var assign = Object.assign || require('object.assign');
var merge = require('merge2');
var through2 = require('through2');
var concat = require('gulp-concat');
var insert = require('gulp-insert');
var tools = require('./lib');
var indent = require('gulp-indent');
var dbg = require('gulp-debug');

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

function transpileTS( project, sources, packageName )
{
  var tscOut;

  // Compile TS sources to ES6, using supplied options hash
  // Force ES6 output, and use compiler specified in package.json
//  options = assign( {}, options, { target:'es6', typescript: require('typescript') } );

  tscOut = sources.pipe( ts( project ) );

  // Post-process transpiled TS and combine into package
  // 1. Remove all import statements, extracting any external (non-relative) ones
  // 2. Concatenate all processed TS into package,
  //    and prefix with a single block of **unique** non-relative imports
  var externalImportsInJS = [];

  var js = tscOut.js
    .pipe(through2.obj(function(file, enc, callback) {
      file.contents = new Buffer(tools.extractImports(file.contents.toString("utf8"), externalImportsInJS));
      this.push(file);
      return callback();
    }))
    .pipe(concat( packageName + '.js' ))
    .pipe(insert.transform(function(contents) {
      return tools.createImportBlock(externalImportsInJS) + contents;
    }));

  // Post-process TS definitions ("exports") and combine
  // 1. Remove all import statements, extracting any external (non-relative) ones
  // 2. Transform all processed DTS into a single module/namespace,
  //    in a single file prefixed with a single block of **unique** non-relative imports
  var externalImportsInDTS = [];
  var dts = tscOut.dts
    .pipe(through2.obj(function(file, enc, callback) {
      file.contents = new Buffer(tools.extractImports(file.contents.toString("utf8"), externalImportsInDTS));
      this.push(file);
      return callback();
    }))
    .pipe(concat( packageName+'.d.ts' ) )
    .pipe(indent({amount:2}))
    .pipe(through2.obj(function(file, enc, callback) {
      var contents = file.contents.toString("utf8");
      contents = "declare module '" + packageName + "'\n"
               + "{\n"
               + tools.createImportBlock(externalImportsInDTS)
               + contents
               + "}\n";
      contents = contents.replace(/export declare/g,"export");
      file.contents = new Buffer(contents);
      this.push(file);
      return callback();
    }));

  return {
    js: js,
    dts: dts
  };
}

gulp.task('build-package', function () {
  var project = ts.createProject( config.project, { target:'es6', typescript: require('typescript') } );
  var sources = project.src();

  var compiledTS = transpileTS( project, sources, config.packageName );

  return merge([
    compiledTS.dts.pipe(gulp.dest(config.output))
      .pipe(gulp.dest(config.output + 'es6'))
      .pipe(gulp.dest(config.output + 'commonjs'))
      .pipe(gulp.dest(config.output + 'amd')),
    compiledTS.js.pipe(gulp.dest(config.output))
    ]);
});

gulp.task('build-es6', [ 'build-package' ], function () {
  return gulp.src( config.output + config.packageName + '.js' )
    .pipe( concat( 'index.js' ) )
    .pipe( gulp.dest(config.output + 'es6') );
});

gulp.task('build-commonjs', [ 'build-package' ], function () {
  return gulp.src(config.output + config.packageName + '.js')
    .pipe( to5( assign({}, babelOptions, {modules:'common'} ) ) )
    .pipe( concat( 'index.js' ))
    .pipe( gulp.dest(config.output + 'commonjs') );
});

gulp.task('build-amd', [ 'build-package' ], function () {
  return gulp.src( config.output + config.packageName + '.js' )
    .pipe( to5( assign( {}, babelOptions, {modules:'amd'} ) ) )
    .pipe( concat( 'index.js' ))
    .pipe( gulp.dest(config.output + 'amd') );
});

gulp.task('build-tests', function () {
  var tests = [  __dirname+'/../tslibs/*.ts', config.tslibs, config.tests ];

  var options = { target:'es6',typescript: require('typescript') };
  var project = ts.createProject( options );
  var sources = gulp.src( tests );

  var compiledTS = transpileTS( project, sources, config.packageName + '.tests' );

  return compiledTS.js
//      .pipe(concat(config.packageName+'.tests'/*+config.packageVersion*/+'.js'))
      .pipe(gulp.dest(config.output))
});

gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    //'build-package',
    'build-es6', 'build-commonjs', 'build-amd',
    'build-tests',
    callback
  );
});
