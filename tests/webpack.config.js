var candelaWebpack = require('../webpack');

module.exports = candelaWebpack({
  entry: {
    tests: './tests.js'
  },
  devtool: 'inline-source-map',
  node: {
    fs: 'empty'
  },
  output: {
    path: 'build',
      filename: 'tests.js'
  }
});
