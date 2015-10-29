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

var tscOptions = tscOptions || {};

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


gulp.task('build-index-and-dts', function () {
  "use strict";
  var sources;

  if ( config.project )
  {
    var tsProject = ts.createProject( config.project, { typescript: require('typescript'), target:'es6' } );
    tscOptions = tsProject;
    sources = tsProject.src();
  }
  else {
    tscOptions = assign({}, tscOptions, {target:'es6',typescript: require('typescript')});
    sources = gulp.src( config.sources );
  }

  var tscOut = sources.pipe(ts( tscOptions ));
  var externalImportsInJS = [];

  var js = tscOut.js
    .pipe(through2.obj(function(file, enc, callback) {
      file.contents = new Buffer(tools.extractImports(file.contents.toString("utf8"), externalImportsInJS));
      this.push(file);
      return callback();
    }))
    .pipe(concat('index.js'))
    .pipe(insert.transform(function(contents) {
      return tools.createImportBlock(externalImportsInJS) + contents;
    }));


  var externalImportsInDTS = [];
  var dts = tscOut.dts //.pipe(dbg())
    .pipe(through2.obj(function(file, enc, callback) {
      file.contents = new Buffer(tools.extractImports(file.contents.toString("utf8"), externalImportsInDTS));
      this.push(file);
      return callback();
    }))
    .pipe(concat(config.packageName+'.d.ts'))
    .pipe(indent({amount:2}))
    .pipe(through2.obj(function(file, enc, callback) {
      var contents = file.contents.toString("utf8");
      contents = "declare module '" + config.packageName + "'\n"
               + "{\n"
               + tools.createImportBlock(externalImportsInDTS)
               + contents
               + "}\n";
      contents = contents.replace(/export declare/g,"export");
      file.contents = new Buffer(contents);
      this.push(file);
      return callback();
    }));

  return merge([
    dts.pipe(gulp.dest(config.output))
      .pipe(gulp.dest(config.output + 'es6'))
      .pipe(gulp.dest(config.output + 'commonjs'))
      .pipe(gulp.dest(config.output + 'amd')),
    js.pipe(gulp.dest(config.output))
    ]);
});

gulp.task('build-es6', function () {
  return gulp.src(config.output + 'index.js')
    .pipe(gulp.dest(config.output + 'es6'));
});

gulp.task('build-commonjs', function () {
  return gulp.src(config.output + 'index.js')
    .pipe(to5(assign({}, babelOptions, {modules:'common'})))
    .pipe(gulp.dest(config.output + 'commonjs'));
});

gulp.task('build-amd', function () {
  return gulp.src(config.output + 'index.js')
    .pipe(to5(assign({}, babelOptions, {modules:'amd'})))
    .pipe(gulp.dest(config.output + 'amd'));
});

gulp.task('build-tests', function () {
//  process.stdout.write( __dirname );
  var tests = [  __dirname+'/../tslibs/*.ts', config.tslibs, config.tests ];

  var sources = gulp.src( tests );
//  sources.pipe(dbg());

  tscOptions = assign({}, tscOptions, {target:'es6',typescript: require('typescript')});

  var tscOut = sources.pipe(ts( tscOptions ));

  return tscOut.js
      .pipe(concat(config.packageName+'.tests'/*+config.packageVersion*/+'.js'))
      .pipe(gulp.dest(config.output))
});

gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    'build-index-and-dts',
    ['build-es6', 'build-commonjs', 'build-amd'],
    callback
  );
});
