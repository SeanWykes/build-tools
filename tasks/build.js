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
//var dbg = require('gulp-debug');

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
  var sources;
  
  if ( paths.project )
  {
    var tsProject = ts.createProject( paths.project, { typescript: require('typescript'), target:'es6', emitDecoratorMetadata: true, noLib: true } );
    tscOptions = tsProject;
    sources = tsProject.src();
  }
  else {
    tscOptions = assign({}, tscOptions, {target:'es6',typescript: require('typescript')});
    sources = gulp.src( paths.sources );
  }

  var tscOut = sources.pipe(ts( tscOptions ));
  var externalImports = [];

  var js = tscOut.js
    .pipe(through2.obj(function(file, enc, callback) {
      file.contents = new Buffer(tools.extractImports(file.contents.toString("utf8"), externalImports));
      this.push(file);
      return callback();
    }))
    .pipe(concat('index.js'))
    .pipe(insert.transform(function(contents) {
      return tools.createImportBlock(externalImports) + contents;
    }))

  var dts = tscOut.dts //.pipe(dbg())
    .pipe(through2.obj(function(file, enc, callback) {
      file.contents = new Buffer( tools.extractImports(file.contents.toString("utf8")) );
      this.push(file);
      return callback();
    }))
    .pipe(concat(paths.packageName+'.d.ts'))
    .pipe(indent({amount:2}))
    .pipe(through2.obj(function(file, enc, callback) {
      var contents = tools.extractImports(file.contents.toString("utf8")/*, externalImports*/ );
      contents = "declare module '" + paths.packageName + '\n' 
               + "'{\n" 
               + tools.createImportBlock(externalImports) 
               + contents
               + "}\n";
      contents = contents.replace(/export declare/g,"export");
      file.contents = new Buffer(contents);
      this.push(file);
      return callback();
    }));

  return merge([
    dts.pipe(gulp.dest(paths.output))
      .pipe(gulp.dest(paths.output + 'es6'))
      .pipe(gulp.dest(paths.output + 'commonjs'))
      .pipe(gulp.dest(paths.output + 'amd')),
    js.pipe(gulp.dest(paths.output))
    ]);
});

gulp.task('build-es6', function () {
  return gulp.src(paths.output + 'index.js')
    .pipe(gulp.dest(paths.output + 'es6'));
});

gulp.task('build-commonjs', function () {
  return gulp.src(paths.output + 'index.js')
    .pipe(to5(assign({}, babelOptions, {modules:'common'})))
    .pipe(gulp.dest(paths.output + 'commonjs'));
});

gulp.task('build-amd', function () {
  return gulp.src(paths.output + 'index.js')
    .pipe(to5(assign({}, babelOptions, {modules:'amd'})))
    .pipe(gulp.dest(paths.output + 'amd'));
});

gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    'build-index-and-dts',
    ['build-es6', 'build-commonjs', 'build-amd'],
    callback
  );
});
