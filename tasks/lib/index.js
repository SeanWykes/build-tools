var build = require('./build');
var config = require('./config');
var harness = require('./harness');

module.exports = {
  option: config.get,
  configure: config.set,
  options: config.options,
  performTests: harness.performTests,
  extractImports:build.extractImports,
  createImportBlock:build.createImportBlock
};
