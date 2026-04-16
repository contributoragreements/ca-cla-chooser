'use strict'

const base = require('./wdio.conf.js')

exports.config = {
    ...base.config,
    specs: ['./tests/harness.js'],
    bail: 0,
    maxInstances: 1,
    capabilities: [{
        maxInstances: 1,
        browserName: 'firefox',
        acceptInsecureCerts: true,
        'moz:firefoxOptions': {
            args: ['-headless'],
        },
    }],
    mochaOpts: {
        ...base.config.mochaOpts,
        timeout: 120000,
    },
}
