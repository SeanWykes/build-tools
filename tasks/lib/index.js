var build = require('./build');
var config = require('./config');
var harness = require('./harness');
var transpile = require('./transpile');

module.exports = {
  ensureArray: require('./ensure-array').ensureArray,

  transpileTS: transpile.transpileTS,

  configure: config.set,
  options: config.options,
  option: config.get,

  performTests: harness.performTests,

  extractImports:build.extractImports,
  createImportBlock:build.createImportBlock
};
