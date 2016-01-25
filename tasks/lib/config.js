'use strict';

var cgfx;
(function(cgfx) {
  var config = {};

  cgfx.set = function set( key, value ) {
    if ( key instanceof Object ) {
      for( var k in key ) {
        config[ k ] = key[ k ];
        console.log( 'set: [' + k + '] = ' + key[k] );
      }
    } else {
      config[ key ] = value;
    }
  }

  cgfx.get = function get( key, def ) {
    return config[ key ] || def;
  }

  cgfx.config = config;
  cgfx.options = config;

})(cgfx || ( cgfx = {} ));

module.exports = cgfx;

