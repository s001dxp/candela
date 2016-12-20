var webpack = require('webpack');
var path = require('path');

var CleanPlugin = require('clean-webpack-plugin');

__dirname = path.resolve(__dirname, '..');

module.exports = {
  devtool: 'source-map',
  __dirname: __dirname,
  entry: {
    candela: './index.js',
  },
  output: {
    library: '[name]',
    libraryTarget: 'umd',
    path: 'build',
    filename: '[name]/[name].js'
  },
  plugins: [
    new CleanPlugin([path.resolve(__dirname, 'build/candela')], {
      root: __dirname
    }),
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        },
        include: [
          __dirname + '/app',
          __dirname + '/index.js',
          __dirname + '/components',
          __dirname + '/test',
          __dirname + '/util',
          __dirname + '/VisComponent'
        ]
      },
      {
        test: /\.jpe?g$|\.gif$|\.png$|\.woff$|\.wav$|\.mp3$|\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$|\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader'
      },
      {
        test: /\.csv$/,
        loader: 'raw-loader'
      },
      {
        test: /\.html$/,
        loader: 'html-loader?attrs=img:src'
      },
      {
        test: /\.styl$/,
        loaders: ['style-loader', 'css-loader', 'stylus-loader']
      },
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader']
      },
      {
        test: /\.scss$/,
        loaders: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.jade$/,
        loaders: ['jade-loader']
      },
      {
        test: /\.json$/,
        loaders: ['json-loader', 'strip-json-comments-loader']
      }
    ]
  }
};
