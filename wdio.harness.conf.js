'use strict'

const fs   = require('fs')
const path = require('path')
const base = require('./wdio.conf.js')

exports.config = {
    ...base.config,
    // Each shard (FLA / CLA) runs as its own spec file in a separate worker.
    specs: ['./tests/harness-fla.js', './tests/harness-cla.js'],
    bail: 0,
    maxInstances: 2,
    capabilities: [{
        maxInstances: 2,
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

    // After both shards finish, merge their individual report files into the
    // canonical harness-report.json / harness-report.txt / harness-texts.json.
    onComplete: function () {
        const ROOT       = __dirname
        const SUFFIXES   = ['-fla', '-cla']
        const allResults = []
        const allDocs    = []
        let server       = null

        for (const suf of SUFFIXES) {
            const reportFile = path.join(ROOT, `harness-report${suf}.json`)
            const textsFile  = path.join(ROOT, `harness-texts${suf}.json`)

            if (fs.existsSync(reportFile)) {
                const data = JSON.parse(fs.readFileSync(reportFile, 'utf8'))
                allResults.push(...(data.results || []))
                if (!server) server = data.server
            }

            if (fs.existsSync(textsFile)) {
                const data = JSON.parse(fs.readFileSync(textsFile, 'utf8'))
                allDocs.push(...(data.documents || []))
            }
        }

        if (allResults.length === 0) return

        const passed  = allResults.filter(r => r.status === 'PASS').length
        const failed  = allResults.filter(r => r.status === 'FAIL').length
        const errored = allResults.filter(r => r.status === 'ERROR').length
        const generated = new Date().toISOString()

        fs.writeFileSync(path.join(ROOT, 'harness-report.json'), JSON.stringify({
            generated,
            server,
            summary: { total: allResults.length, passed, failed, errored },
            results: allResults,
        }, null, 2))

        const lines = [
            '=== Agreement Chooser Harness Report ===',
            `Generated: ${generated}`,
            `Server:    ${server}`,
            '',
            'SUMMARY',
            '-------',
            `Total:   ${allResults.length}`,
            `Passed:  ${passed}`,
            `Failed:  ${failed}`,
            `Errors:  ${errored}`,
            '',
            'RESULTS',
            '-------',
        ]
        for (const r of allResults) {
            const prefix = r.status === 'PASS' ? '[PASS]' : r.status === 'FAIL' ? '[FAIL]' : '[ERROR]'
            lines.push(`${prefix} ${r.label}`)
            for (const d of (r.details || []))   lines.push(`       ${d}`)
            for (const n of (r.infoNotes || [])) lines.push(`  [info] ${n}`)
        }
        lines.push('')
        fs.writeFileSync(path.join(ROOT, 'harness-report.txt'), lines.join('\n'))

        if (allDocs.length > 0) {
            fs.writeFileSync(path.join(ROOT, 'harness-texts.json'), JSON.stringify({
                generated,
                server,
                documents: allDocs,
            }, null, 2))
        }

        console.log(`\nMerged harness report: ${passed} passed, ${failed} failed, ${errored} errors (${allResults.length} total)`)
        console.log(`  harness-report.json / harness-report.txt written`)
    },
}
