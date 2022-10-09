const { defineConfig } = require('@vue/cli-service')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const webpack = require('webpack')


module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave:false,
  configureWebpack:{
    resolve: {
      fallback: { 
        assert: require.resolve('assert'),
        buffer: require.resolve('buffer'),
        console: require.resolve('console-browserify'),
        constants: require.resolve('constants-browserify'),
        crypto: require.resolve('crypto-browserify'),
        domain: require.resolve('domain-browser'),
        events: require.resolve('events'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
        punycode: require.resolve('punycode'),
        process: require.resolve('process/browser'),
        querystring: require.resolve('querystring-es3'),
        stream: require.resolve('stream-browserify'),
        string_decoder: require.resolve('string_decoder'),
        sys: require.resolve('util'),
        timers: require.resolve('timers-browserify'),
        tty: require.resolve('tty-browserify'),
        url: require.resolve('url'),
        util: require.resolve('util'),
        vm: require.resolve('vm-browserify'),
        zlib: require.resolve('browserify-zlib'),
      },
    },
    externals: {
      fs: require('fs')
     },
     plugins: [
          new webpack.ProvidePlugin({
                process: 'process/browser'
          }),
      ],
  
  },
  // webpack-dev-server 相关配置
  devServer: {
    // 自动打开浏览器
    open: false,
    // 设置为0.0.0.0则所有的地址均能访问
    host: '0.0.0.0',
    port: '8000',
    https: false,
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://192.168.17.108:9601/',// 汝英
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/'
        }
      }
    }
  }
})

