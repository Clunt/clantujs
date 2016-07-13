module.exports = {
  entry: {
    app: ['webpack/hot/dev-server', './example/advanced/index.js']
  },
  output: {
    path: './example/advanced',
    filename: 'example.build.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules\/dist/,
        loader: 'babel-loader'
      }
    ]
  },
  devtool: 'source-map'
}
