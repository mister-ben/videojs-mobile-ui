module.exports = function(context) {
  const result = {
    plugins: [
      {
        postcssPlugin: 'postcss-progress-start'
      },
      {
        postcssPlugin: 'postcss-import'
      },
      {
        postcssPlugin: 'postcss-nested'
      },
      null,
      null,
      null,
      {
        browsers: [
          'defaults'
        ],
        options: {},
        postcssPlugin: 'autoprefixer'
      },
      {
        postcssPlugin: 'postcss-csso'
      },
      {
        postcssPlugin: 'postcss-progress-stop'
      }
    ]
  };

  return result;
};
