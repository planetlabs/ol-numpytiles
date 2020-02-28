module.exports = {
  "presets": ["@babel/preset-env"],
  "plugins" : ["add-module-exports"],
  exclude: /node_modules\/(?!ol)/,
}
