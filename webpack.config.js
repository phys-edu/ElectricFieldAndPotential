const webpack = require('webpack');

module.exports = [
    {
        entry: `./src/app.ts`,
        output: {
            path: `${__dirname}/docs`,
            filename: 'bundle.js'
        },
        module: {
            rules: [
                {
                    test: /\.css/,
                    use: [
                        "style-loader",
                        { loader: "css-loader", options: { url: false } }
                    ]
                },
                {
                    test: /\.ts/,
                    use: 'ts-loader',
                }
            ]
        },
        resolve: {
            extensions:['.ts', '.js'],
        },

        mode: "development",

    },
];