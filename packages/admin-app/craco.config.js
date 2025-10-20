const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 找到 babel-loader 規則
      const babelLoaderRule = webpackConfig.module.rules.find(
        (rule) => rule.oneOf
      );

      if (babelLoaderRule) {
        const babelRule = babelLoaderRule.oneOf.find(
          (rule) =>
            rule.loader && rule.loader.includes('babel-loader')
        );

        if (babelRule) {
          // 修改 include 以包含 shared package
          babelRule.include = [
            babelRule.include,
            path.resolve(__dirname, '../shared')
          ];
        }
      }

      return webpackConfig;
    },
  },
};
