// All this code is based on this PR: https://github.com/facebook/create-react-app/pull/5886/files

const restrictedGlobals = require('confusing-browser-globals')
const getCacheIdentifier = require('react-dev-utils/getCacheIdentifier')

module.exports = function override(config, webpackEnv) {
    const isEnvDevelopment = (webpackEnv === 'development')
    const isEnvProduction = (webpackEnv === 'production')

    config.module.rules.push({
        test: /\.worker\.(js|mjs|ts)$/,
        use: [
            require.resolve('worker-loader'),
            {
              loader: require.resolve('babel-loader'),
              options: {
                customize: require.resolve(
                  'babel-preset-react-app/webpack-overrides'
                ),
                // @remove-on-eject-begin
                babelrc: false,
                configFile: false,
                presets: [require.resolve('babel-preset-react-app')],
                // Make sure we have a unique cache identifier, erring on the
                // side of caution.
                // We remove this when the user ejects because the default
                // is sane and uses Babel options. Instead of options, we use
                // the react-scripts and babel-preset-react-app versions.
                cacheIdentifier: getCacheIdentifier(
                  isEnvProduction
                    ? 'production'
                    : isEnvDevelopment && 'development',
                  [
                    'babel-plugin-named-asset-import',
                    'babel-preset-react-app',
                    'react-dev-utils',
                    'react-scripts',
                  ]
                ),
                // @remove-on-eject-end
                plugins: [
                  [
                    require.resolve('babel-plugin-named-asset-import'),
                    {
                      loaderMap: {
                        svg: {
                          ReactComponent:
                            '@svgr/webpack?-prettier,-svgo![path]',
                        },
                      },
                    },
                  ],
                ],
                // This is a feature of `babel-loader` for webpack (not Babel itself).
                // It enables caching results in ./node_modules/.cache/babel-loader/
                // directory for faster rebuilds.
                cacheDirectory: true,
                cacheCompression: isEnvProduction,
                compact: isEnvProduction,
              },
            }
        ]
    })
    config.output.globalObject = "this"
    return config
}
