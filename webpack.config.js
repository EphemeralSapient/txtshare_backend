const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    mode: 'production', // Use 'development' for better debugging experience during development
    entry: './src/app.js', // Entry point for your application
    target: 'node', // Ensures Webpack compiles for Node.js environment
    externals: [nodeExternals()], // Exclude node_modules from the bundle
    output: {
        path: path.resolve(__dirname, 'dist'), // Output directory
        filename: 'bundle.js', // Output bundle file name
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/, // Exclude node_modules from transpilation
                use: {
                    loader: 'babel-loader', // Transpile JavaScript using Babel
                    options: {
                        presets: ['@babel/preset-env'], // Use latest ECMAScript features
                    },
                },
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(), // Clean the output directory before each build
        // new CopyWebpackPlugin({
        //     patterns: [
        //         { from: 'src/config', to: 'config' }, // Copy configuration files
        //     ],
        // }),
    ],
    resolve: {
        extensions: ['.js'], // Resolve .js files without specifying extensions
    },
    optimization: {
        minimize: true, // Minimize the output bundle for smaller size
        splitChunks: {
            chunks: 'all', // Optimize module sharing across the project
        },
    },
    stats: {
        warnings: false, // Hide warnings in the output
    },
    devtool: 'source-map', // Generate source maps for easier debugging
};
