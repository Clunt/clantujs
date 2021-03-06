module.exports = {
  entry: './src/index.js',
  output: {
    path: './dist',
    filename: 'clantu.js',
    library: 'Clantu',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [
      {
        test: /.js/,
        exclude: /node_modules\/dist/,
        loader: 'babel-loader'
      }
    ]
  },
  devtool: '#source-map'
}
