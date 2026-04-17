'use strict'

process.env.HARNESS_FILTER = 'cla'
process.env.HARNESS_REPORT_SUFFIX = '-cla'

require('./harness.js')
