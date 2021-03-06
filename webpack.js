var path = require('path');
var process = require('process');

function _includePaths (basePath) {
  if (basePath) {
    return [
      path.resolve(basePath, 'index.js'),
      path.resolve(basePath, 'candela.js'),
      path.resolve(basePath, 'test'),
      path.resolve(basePath, 'util'),
      path.resolve(basePath, 'VisComponent'),
      path.resolve(basePath, 'plugins')
    ];
  } else {
    return [
      /\/node_modules\/candela\//
    ];
  }
}

function addNMPath (packages, paths) {
  if (!Array.isArray(packages)) {
    packages = [packages];
  }

  return packages.map(function (pkg) {
    return new RegExp('/node_modules/' + pkg + '/');
  }).concat(paths);
}

module.exports = function (config, basePath, options) {
  var includePaths = _includePaths(basePath);

  options = options || {};

  // Install empty module and module.loaders entries if missing.
  config.module = config.module || {};

  if (process.env.WEBPACK1) {
    config.module.loaders = config.module.loaders || [];
  } else {
    config.module.rules = config.module.rules || [];
  }

  // By default, exclude the existing loaders from affecting
  // node_modules/candela. This prevents double application of loaders if they
  // are specified in the client project without any include or exclude
  // directives.
  var exclude = options.excludeCandelaNM === undefined || options.excludeCandelaNM;

  // Exclude the base paths from having existing loaders applied to them.
  if (exclude) {
    // For each loader, append the Candela include paths to its `exclude`
    // property.
    var excluder = function (loader) {
      // Install an empty list if there is no `exclude` property.
      loader.exclude = loader.exclude || [];

      // If the `exclude` propertry is a non-list singleton, wrap it in a list.
      if (!Array.isArray(loader.exclude)) {
        loader.exclude = [loader.exclude];
      }

      loader.exclude = loader.exclude.concat(includePaths);
    };

    if (process.env.WEBPACK1) {
      config.module.loaders.forEach(excluder);
    } else {
      config.module.rules.forEach(excluder);
    }
  }

  // Prepend the Candela loaders.
  if (basePath === undefined) {
    basePath = '.';
  }
  var gloPath = path.resolve(basePath, 'node_modules/glo/glo.js');
  if (process.env.WEBPACK1) {
    config.module.loaders = [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        },
        include: includePaths.concat(gloPath)
      },
      {
        test: /\.js$/,
        loaders: [
          'exports-loader?GLO',
          'imports-loader?_=underscore&cola=webcola'
        ],
        include: gloPath
      },
      {
        test: /\.jpe?g$|\.gif$|\.png$|\.woff$|\.wav$|\.mp3$|\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$|\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader',
        include: addNMPath(['font-awesome', 'bootstrap'], includePaths)
      },
      {
        test: /\.csv$/,
        loader: 'raw-loader',
        include: includePaths
      },
      {
        test: /\.html$/,
        loader: 'html-loader?attrs=img:src',
        include: includePaths
      },
      {
        test: /\.styl$/,
        loaders: ['style-loader', 'css-loader', 'stylus-loader'],
        include: includePaths
      },
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader'],
        include: addNMPath(['lineupjs', 'nvd3', 'vega-tooltip'], includePaths)
      },
      {
        test: /\.scss$/,
        loaders: ['style-loader', 'css-loader', 'sass-loader'],
        include: addNMPath('UpSet', includePaths)
      },
      {
        test: /\.jade$/,
        loaders: ['jade-loader'],
        include: includePaths
      }
    ].concat(config.module.loaders);
  } else {
    config.module.rules = [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['es2015']
          }
        },
        include: includePaths.concat(gloPath)
      },
      {
        test: /\.js$/,
        use: [
          'exports-loader?GLO',
          'imports-loader?_=underscore&cola=webcola'
        ],
        include: gloPath
      },
      {
        test: /\.jpe?g$|\.gif$|\.png$|\.woff$|\.wav$|\.mp3$|\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$|\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: 'url-loader',
        include: addNMPath(['font-awesome', 'bootstrap'], includePaths)
      },
      {
        test: /\.csv$/,
        use: 'raw-loader',
        include: includePaths
      },
      {
        test: /\.html$/,
        use: 'html-loader?attrs=img:src',
        include: includePaths
      },
      {
        test: /\.styl$/,
        use: ['style-loader', 'css-loader', 'stylus-loader'],
        include: includePaths
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
        include: addNMPath(['lineupjs', 'nvd3', 'vega-tooltip'], includePaths)
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
        include: addNMPath('UpSet', includePaths)
      },
      {
        test: /\.jade$/,
        use: 'jade-loader',
        include: includePaths
      }
    ].concat(config.module.rules);
  }

  return config;
};
