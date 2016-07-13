var fs = require('fs')
var rollup = require('rollup')
var uglify = require('uglify-js')
var version = process.env.VERSION || require('../package.json').version
var banner =
  '/*!\n' +
  ' * Clantujs v' + version + '\n' +
  ' * (c) ' + new Date().getFullYear() + ' Clunt\n' +
  ' * Released under the MIT License.\n' +
  ' */'


rollup.rollup({
  entry: 'src/index.js'
})
.then(function (bundle) {
  return write('dist/clantu.js', bundle.generate({
    format: 'umd',
    banner: banner,
    moduleName: 'C'
  }).code)
})
.then(function () {
  return write(
    'dist/clantu.min.js',
    banner + '\n' + uglify.minify('dist/clantu.js').code
  )
})
.catch(logError)

function write (dest, code) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(dest, code, function (err) {
      if (err) return reject(err)
      console.log(blue(dest) + ' ' + getSize(code))
      resolve()
    })
  })
}

function getSize (code) {
  return (code.length / 1024).toFixed(2) + 'kb'
}

function logError (e) {
  console.log(e)
}

function blue (str) {
  return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
}
