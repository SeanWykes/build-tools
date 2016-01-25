var tools = require('./tasks/lib');

require('require-dir')('tasks');

module.exports = {
  configure: tools.configure
};
