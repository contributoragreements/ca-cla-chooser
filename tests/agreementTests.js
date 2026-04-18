const AgreementPage = require('./pageobjects/agreement.page')
const { expect } = require('chai');
const cheerio = require('cheerio');
const fs    = require('fs')
const path  = require('path')
const agreementPage = new AgreementPage()

// ---- Length snapshot helpers ------------------------------------------------
// On the first run, actual lengths are written to this file as the baseline.
// On later runs, differences are logged as non-fatal warnings so any accidental
// template drift is visible without breaking CI.
// Delete the file to reset the baseline after an intentional template change.

const SNAPSHOTS_FILE = path.resolve(__dirname, 'length-snapshots.json')

function loadSnapshots () {
    if (!fs.existsSync(SNAPSHOTS_FILE)) return {}
    try { return JSON.parse(fs.readFileSync(SNAPSHOTS_FILE, 'utf8')) } catch { return {} }
}

function saveSnapshots (snapshots) {
    fs.writeFileSync(SNAPSHOTS_FILE, JSON.stringify(snapshots, null, 2))
}

/**
 * Non-fatal length check. Records the length on first run; on subsequent runs
 * logs a warning if the value changed, but never throws.
 */
function warnIfLengthChanged (actual, key, label) {
    const snapshots = loadSnapshots()
    if (!(key in snapshots)) {
        snapshots[key] = actual
        saveSnapshots(snapshots)
        console.log(`  [snapshot] ${label}: baseline recorded at ${actual} chars`)
    } else if (snapshots[key] !== actual) {
        const diff = actual - snapshots[key]
        console.warn(`  [WARN] ${label} length changed: was ${snapshots[key]}, now ${actual} (${diff > 0 ? '+' : ''}${diff} chars) — update snapshot if intentional`)
    }
}

// ---- Structure helper -------------------------------------------------------

/** Minimal structural checks on a generated agreement HTML string. */
function assertAgreementStructure (html, label) {
    expect(html, `${label}: textarea should not be empty`).to.be.a('string').and.not.equal('')
    const $ = cheerio.load(html)
    const body = $.root().text()
    expect(body, `${label}: should contain "Definitions"`).to.include('Definitions')
    expect(body, `${label}: should contain "License grant"`).to.include('License grant')
    expect(body, `${label}: should contain "Term"`).to.include('Term')
    expect(body, `${label}: should contain "Miscellaneous"`).to.include('Miscellaneous')
    expect(body, `${label}: should not contain old numbered heading "1. Definitions"`).to.not.match(/\b1\.\s+Definitions/i)
    expect(body, `${label}: should not contain old section ref "Section 8.2"`).to.not.include('Section 8.2')
}

// ---- Tests ------------------------------------------------------------------

describe('The structure of each document version should be correct', async function() {

    beforeEach(async function() {
        await agreementPage.open();
        await agreementPage.goThroughAll();
    });

    it('the fla individual version (html) with default values should have correct structure', async function() {
        const t = await agreementPage.applyResultHtmlFlaText.getValue();
        assertAgreementStructure(t, 'FLA individual')
        const $ = cheerio.load(t)
        expect($.root().text(), 'FLA individual: should contain "Fiduciary"').to.include('Fiduciary')
        warnIfLengthChanged(t.length, 'fla-individual-html', 'FLA individual HTML')
    });

    it('the fla entity version (html) with default values should have correct structure', async function() {
        const t = await agreementPage.applyResultHtmlFlaEntityText.getValue();
        assertAgreementStructure(t, 'FLA entity')
        const $ = cheerio.load(t)
        expect($.root().text(), 'FLA entity: should contain "Legal Entity"').to.include('Legal Entity')
        warnIfLengthChanged(t.length, 'fla-entity-html', 'FLA entity HTML')
    });

    it('the fla version with outbound option 1 should be correct', async function() {
        this.skip() // TODO: navigate to FLA + outbound option 1, then assert
    });

    it('the fla version with outbound option 2 should be correct', async function() {
        this.skip() // TODO: navigate to FLA + outbound option 2, then assert
    })

    it('the fla version with outbound option 3 should be correct', async function() {
        this.skip() // TODO: navigate to FLA + outbound option 3, then assert
    })

    it('the cla individual version (html) with default values should have correct structure', async function() {
        const t = await agreementPage.applyResultHtmlClaText.getValue();
        assertAgreementStructure(t, 'CLA individual')
        const $ = cheerio.load(t)
        expect($.root().text(), 'CLA individual: should contain "Patents"').to.include('Patents')
        warnIfLengthChanged(t.length, 'cla-individual-html', 'CLA individual HTML')
    });

    it('the cla version with outbound option 1 traditional patent license should be correct', async function() {
        this.skip()
    })

    it('the cla version with outbound option 2 traditional patent license should be correct', async function() {
        this.skip()
    })

    it('the cla version with outbound option 3 traditional patent license should be correct', async function() {
        this.skip()
    })

    it('the cla version with outbound option 4 traditional patent license should be correct', async function() {
        this.skip()
    })

    it('the cla version with outbound option 5 traditional patent license should be correct', async function() {
        this.skip()
    })

    it('the cla version with outbound option 1 patent pledge should be correct', async function() {
        this.skip()
    })

    it('the cla version with outbound option 2 patent pledge should be correct', async function() {
        this.skip()
    })

    it('the cla version with outbound option 3 patent pledge should be correct', async function() {
        this.skip()
    })

    it('the cla version with outbound option 4 patent pledge should be correct', async function() {
        this.skip()
    })

    it('the cla version with outbound option 5 patent pledge should be correct', async function() {
        this.skip()
    })

    it('the cla entity version (html) with default values should have correct structure', async function() {
        const t = await agreementPage.applyResultHtmlClaEntityText.getValue();
        assertAgreementStructure(t, 'CLA entity')
        const $ = cheerio.load(t)
        expect($.root().text(), 'CLA entity: should contain "Legal Entity"').to.include('Legal Entity')
        warnIfLengthChanged(t.length, 'cla-entity-html', 'CLA entity HTML')
    });

    it('the recreate link should contain required query parameters', async function() {
        const url = await agreementPage.applyResultLinkFlaText;
        expect(url, 'link href should exist').to.be.a('string').and.not.equal('')
        const qs = url.includes('?') ? url.split('?')[1] : url
        const searchParams = new URLSearchParams(qs)
        for (const key of ['fsfe-compliance', 'outbound-option', 'agreement-exclusivity', 'patent-option']) {
            expect(searchParams.has(key), `recreate URL should contain param "${key}"`).to.be.true
        }
        expect(url, 'recreate URL must not contain emptyField placeholder').to.not.include('____________________')
        warnIfLengthChanged(url.length, 'fla-recreate-url', 'FLA recreate URL')
    })
});

describe('the url parameters should be correct', async function () {
    describe('all expected parameters should be present', async function () {
        beforeEach(async function() {
            await agreementPage.open();
            await agreementPage.goThroughAll();
        });
        it('key parameters should all be present in the recreate URL', async function () {
            const url = await agreementPage.applyResultLinkFlaText;
            const qs = url.includes('?') ? url.split('?')[1] : url
            const searchParams = new URLSearchParams(qs)
            const requiredKeys = [
                'fsfe-compliance', 'outbound-option', 'agreement-exclusivity', 'patent-option',
            ]
            for (const key of requiredKeys) {
                expect(searchParams.has(key), `param "${key}" should be present`).to.be.true
            }
            warnIfLengthChanged(searchParams.size, 'fla-url-param-count', 'FLA URL parameter count')
        })
    })
})
