const path = require('path');
const webpack = require('webpack');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PreloadWebpackPlugin = require('preload-webpack-plugin');
const CssUrlRelativePlugin = require('css-url-relative-plugin');
const glob = require('glob');

const IS_DEV = process.env.NODE_ENV === 'dev';
// 入口文件定义
var srcDir = path.resolve(process.cwd(), 'src');
var entries = function () {
    var jsDir = path.resolve(srcDir, 'js')
    var entryFiles = glob.sync(jsDir + '/*.{js,jsx}')
    var map = {};

    for (var i = 0; i < entryFiles.length; i++) {
        var filePath = entryFiles[i];
        var filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'));
        map[filename] = filePath;
    }
    console.log('map',map)
    return map;
}

const config = {
  mode: IS_DEV ? 'development' : 'production',
  devtool: IS_DEV ? 'eval' : 'source-map',
  // entry: './src/js/index.js',
  entry:entries(),
  output: {
    filename: 'js/[name].[hash].js',
    chunkFilename: 'js/[name].[chunkhash:8].chunk.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        // include: [resolve('src'), resolve('test'), resolve('node_modules/webpack-dev-server/client')]
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: IS_DEV,
            },
          },
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              name: '[name].[ext]',
              fallback: 'file-loader',
              outputPath: 'public/images',
            },
          },
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 65,
              },
              pngquant: {
                quality: '65-90',
                speed: 4,
              },
              gifsicle: {
                interlaced: false,
              },
              webp: {
                quality: 75,
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
    }),
    new CopyWebpackPlugin([
      {
        from: './src/public',
        to: 'public',
      },
    ]),
    new MiniCssExtractPlugin({
      filename: IS_DEV ? 'css/[name].css' : 'css/[name].[contenthash].css',
      chunkFilename: 'css/[id].css',
    }),
    new webpack.HashedModuleIdsPlugin(),
    // preload会导致文件被提前加载
    // new PreloadWebpackPlugin({
    //   include: 'initial',
    // }),
    new CssUrlRelativePlugin(),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'src'),
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /node_modules/,
          chunks: 'initial',
          name: 'vendor',
          priority: 10,
          enforce: true,
        },
      },
    },
    minimizer: [],
  },
};

if (!IS_DEV) {
  const TerserPlugin = require('terser-webpack-plugin');
  const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

  config.optimization.minimizer.push(
    new TerserPlugin(),
    new OptimizeCSSAssetsPlugin({})
  );
}

const files = glob.sync('./src/*.html');
// debugger;
files.forEach(file => {
  let filename = file.substring(file.lastIndexOf('\/') + 1, file.lastIndexOf('.'));

  config.plugins.push(
  //1、为html文件中引入的外部资源如script、link动态添加每次compile后的hash，防止引用缓存的外部文件问题2
  //2、可以生成创建html入口文件，比如单页面可以生成一个html文件入口，配置N个html-webpack-plugin可以生成N个页面入口
    new HtmlWebPackPlugin({
      filename: path.basename(file),
      template: file,
      favicon: path.resolve(__dirname, './src/public/icon.ico'),
      minify: !IS_DEV,
      chunks:['vendor','runtime','common', filename],
      // inject:'head'
    })
  );
});

module.exports = config;
