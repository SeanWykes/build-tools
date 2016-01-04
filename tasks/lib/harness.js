var System = require('systemjs');
require( config.root + '/config.js');
var jas = require('jasmine-core');
var TestsReporter = require('jasmine2-reporter').Jasmine2Reporter

var jasmine = jas.core( jas );
var env = jasmine.getEnv();
var jasmineInterface = jas.interface(jasmine, env);

function extend(destination, source) {
  for (var property in source) destination[property] = source[property];
  return destination;
}

extend( global, jasmineInterface );

env.addReporter(new TestsReporter({}));

module.exports.performTests = function( specs )
{
  console.log( 'spec:' + specs );

  System.import( specs ).then(function(m) {
//  console.log( env );
    env.execute();
  }).catch(function(err) {
    console.log('System: ' + err);
  });
};

