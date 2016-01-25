var gulp = require('gulp');
var ts = require('gulp-typescript');
var through2 = require('through2');
var concat = require('gulp-concat');
var dedupe = require('gulp-dedupe');
var ignore = require('gulp-ignore');
var insert = require('gulp-insert');
var tools = require('./build');
var indent = require('gulp-indent');
var dbg = require('gulp-debug');
var es = require('event-stream');

module.exports.transpileTS = function transpileTS( project, sources, typings, packageName )
{
  var tscOut;

  // Compile TS sources to ES6, using supplied options hash
  // Force ES6 output, and use compiler specified in package.json
  //  options = assign( {}, options, { target:'es6', typescript: require('typescript') } );

  // Inject any additional 'typings' into source list
  if ( typings )
  {
    var s = gulp.src( typings );

    // Exclude any .d.ts in the source listing
    sources = sources.pipe( ignore.exclude('*.d.ts'));

    // Inline typings into src
    sources = es.concat( sources, s )
      .pipe( dedupe() );
  }

//  sources.pipe( dbg() );

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
