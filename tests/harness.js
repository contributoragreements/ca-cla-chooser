'use strict'

const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')

const BASE_URL = 'http://localhost:4000'
const REFS_DIR = path.resolve(__dirname, '..', 'agreement_texts_new')
const LOGS_DIR = path.resolve(__dirname, 'logs')

// When running parallel shards, each shard sets these env vars so its output
// files don't collide with those of the other shard.  The wdio.harness.conf.js
// onComplete hook merges the shard files into the canonical report afterwards.
const REPORT_SUFFIX = process.env.HARNESS_REPORT_SUFFIX || ''
const FILTER_TYPE   = process.env.HARNESS_FILTER          // 'fla' | 'cla' | undefined = all

const REPORT_JSON = path.resolve(__dirname, '..', `harness-report${REPORT_SUFFIX}.json`)
const REPORT_TEXT = path.resolve(__dirname, '..', `harness-report${REPORT_SUFFIX}.txt`)
const VIEWER_DATA = path.resolve(__dirname, '..', `harness-texts${REPORT_SUFFIX}.json`)

// Set SAVE_TEXTS=1 to write the full generated document text to tests/logs/<date>.log
const SAVE_TEXTS = process.env.SAVE_TEXTS === '1'

// ---- Path definitions -------------------------------------------------------

const FLA_OUTBOUND = [
    { label: 'fsfe',           param: 'fsfe',           refNum: 1 },
    { label: 'same-licenses',  param: 'same-licenses',  refNum: 2 },
    { label: 'license-policy', param: 'license-policy', refNum: 3 },
]

const CLA_OUTBOUND = [
    { label: 'fsfe',           param: 'fsfe',           refNum: 1 },
    { label: 'same-licenses',  param: 'same-licenses',  refNum: 2 },
    { label: 'license-policy', param: 'license-policy', refNum: 3 },
    { label: 'same',           param: 'same',           refNum: 4 },
    { label: 'no-commitment',  param: 'no-commitment',  refNum: 5 },
]

const EXCLUSIVITY = [
    { label: 'exclusive',     param: 'exclusive',     refKey: 'excl' },
    { label: 'non-exclusive', param: 'non-exclusive', refKey: 'nonexcl' },
]

const PATENT = [
    { label: 'Traditional',   param: 'Traditional',   refKey: 'patlic' },
    { label: 'Patent-Pledge', param: 'Patent-Pledge', refKey: 'patpledge' },
]

const ALL_PATHS = []

for (const outbound of FLA_OUTBOUND) {
    ALL_PATHS.push({
        label: `FLA / outbound:${outbound.label}`,
        type: 'fla',
        params: {
            'fsfe-compliance': 'fsfe-compliance',
            'outbound-option': outbound.param,
        },
        refPrefix: `fla-outbound${outbound.refNum}`,
    })
}

for (const outbound of CLA_OUTBOUND) {
    for (const excl of EXCLUSIVITY) {
        for (const patent of PATENT) {
            ALL_PATHS.push({
                label: `CLA / outbound:${outbound.label} / ${excl.label} / patent:${patent.label}`,
                type: 'cla',
                params: {
                    'fsfe-compliance': 'non-fsfe-compliance',
                    'outbound-option': outbound.param,
                    'agreement-exclusivity': excl.param,
                    'patent-option': patent.param,
                },
                refPrefix: `cla-${excl.refKey}-outbound${outbound.refNum}-${patent.refKey}`,
            })
        }
    }
}

// Extra paths to verify URL round-trip for optional fields

// medialist: documentation license
ALL_PATHS.push({
    label: 'CLA / outbound:same-licenses / exclusive / patent:Traditional / medialist:GFDL-1.1',
    type: 'cla',
    params: {
        'fsfe-compliance': 'non-fsfe-compliance',
        'outbound-option': 'same-licenses',
        'agreement-exclusivity': 'exclusive',
        'patent-option': 'Traditional',
        'medialist': 'GFDL-1.1',
    },
    refPrefix: null,
})

// outboundlist: specific permitted outbound licenses (single value avoids join spacing issues)
ALL_PATHS.push({
    label: 'CLA / outbound:same-licenses / exclusive / patent:Traditional / outboundlist:GPL-2.0',
    type: 'cla',
    params: {
        'fsfe-compliance': 'non-fsfe-compliance',
        'outbound-option': 'same-licenses',
        'agreement-exclusivity': 'exclusive',
        'patent-option': 'Traditional',
        'outboundlist': 'GPL-2.0',
    },
    refPrefix: null,
})

// license-policy-location: URL of the licensing policy
ALL_PATHS.push({
    label: 'CLA / outbound:license-policy / exclusive / patent:Traditional / with-policy-url',
    type: 'cla',
    params: {
        'fsfe-compliance': 'non-fsfe-compliance',
        'outbound-option': 'license-policy',
        'agreement-exclusivity': 'exclusive',
        'patent-option': 'Traditional',
        'license-policy-location': 'https://example.org/license-policy',
    },
    refPrefix: null,
})

// general fields: beneficiary-name and project-name
ALL_PATHS.push({
    label: 'FLA / outbound:fsfe / with-general-fields',
    type: 'fla',
    params: {
        'fsfe-compliance': 'fsfe-compliance',
        'outbound-option': 'fsfe',
        'beneficiary-name': 'FSFE e.V.',
        'project-name': 'Reuse',
    },
    refPrefix: null,
})

// ---- Reference file helpers -------------------------------------------------

function loadRef(refPrefix, variant, ext) {
    // variant = 'indiv' | 'entity'
    const p = path.join(REFS_DIR, `${refPrefix}-${variant}.${ext}`)
    if (!fs.existsSync(p)) return null
    return fs.readFileSync(p, 'utf8')
}

/** Extract normalised sentences / phrases from a plain-text reference file. */
function extractKeyPhrases(txt) {
    return txt
        .split(/\n+/)
        .map(l => l.trim())
        .filter(l => l.length > 40)
        .slice(0, 20)
}

// ---- Document validation ----------------------------------------------------

/**
 * Checks the HTML content of a generated agreement textarea against the
 * structure of the current (updated) agreement-template-unified.html.
 * Returns { status, issues[], infoNotes[] }.
 *
 * opts.outboundOption  — the outbound-option param for this path (e.g. 'no-commitment').
 * opts.patentOption    — the patent-option param for this path (e.g. 'Patent-Pledge'). CLA only.
 * opts.expectedParams  — full wizardPath.params object; used to validate the recreate URL.
 *
 * NOTE: the reference .txt files in agreement_texts/ were generated from the
 * old template (pre-legal-changes branch). They are used here as informational
 * notes only; differences against them are expected and not counted as failures.
 */
function validateHtml(html, refTxt, opts) {
    const issues = []
    const infoNotes = []
    const $ = cheerio.load(html)
    const bodyText = $.root().text()

    // 1. Title: now <h1 id="tmp-title"> in the updated template
    const titleEl = $('h1#tmp-title, h2#tmp-title')
    if (titleEl.length === 0) {
        issues.push('Missing title element (#tmp-title)')
    } else if (titleEl.text().trim() === '') {
        issues.push('Title element (#tmp-title) is empty')
    }

    // 2. Subtitle must be present and non-empty
    const subtitleEl = $('#tmp-subtitle')
    if (subtitleEl.length === 0 || subtitleEl.text().trim() === '') {
        issues.push('Missing or empty subtitle (#tmp-subtitle)')
    }

    // 3. Required unnumbered section headings (new template removes numbers)
    for (const section of ['Definitions', 'License grant', 'Disclaimer', 'Term', 'Miscellaneous']) {
        if (!bodyText.includes(section)) {
            issues.push(`Missing section: "${section}"`)
        }
    }

    // 4. Signing section
    if ($('#tmp-signing').length === 0 && !bodyText.includes('Date:')) {
        issues.push('Missing signing section')
    }

    // 5. New template content: section numbers must be gone
    // Old numbered headings like "1. Definitions", "8.2", "9.1" should no longer appear
    if (/\b1\.\s+Definitions/i.test(bodyText)) {
        issues.push('Old numbered section heading found: "1. Definitions" (should be unnumbered in new template)')
    }
    if (/\bSection\s+8\.2\b/.test(bodyText)) {
        issues.push('Old cross-reference found: "Section 8.2" (should be "Section \\"Term\\"" in new template)')
    }
    if (/\bsection\s+3\.1\b/i.test(bodyText)) {
        issues.push('Old cross-reference found: "section 3.1" (should be named reference in new template)')
    }

    // 6. Disclaimer: old all-caps form should be replaced
    if (bodyText.includes('THE CONTRIBUTION IS PROVIDED')) {
        issues.push('Old all-caps Disclaimer text found (should be replaced in new template)')
    }

    // 7. New paragraph: "We may, but are under no obligation to" should be present
    // Not applicable for no-commitment outbound option, which intentionally removes
    // the entire outbound section. For outbound:same this check still applies —
    // the paragraph should be there, but is missing due to a pre-existing
    // case-fallthrough bug in chooser.js (case 'same': falls through to 'no-commitment').
    if (opts && opts.outboundOption !== 'no-commitment') {
        if (!bodyText.includes('We may, but are under no obligation to')) {
            issues.push('Missing new outbound paragraph: "We may, but are under no obligation to..."')
        }
    }

    // 8. Patent option sections: correct one present, wrong one absent. CLA only.
    if (opts && opts.patentOption) {
        const traditionalEl = $('#tmp-patent-option-traditional')
        const pledgeEl      = $('#tmp-patent-option-pledge')
        if (opts.patentOption === 'Traditional') {
            if (traditionalEl.length === 0)
                issues.push('Traditional patent section (#tmp-patent-option-traditional) missing for patent:Traditional')
            if (pledgeEl.length > 0)
                issues.push('Pledge patent section (#tmp-patent-option-pledge) present but should be absent for patent:Traditional')
        } else if (opts.patentOption === 'Patent-Pledge') {
            if (pledgeEl.length === 0)
                issues.push('Pledge patent section (#tmp-patent-option-pledge) missing for patent:Patent-Pledge')
            if (traditionalEl.length > 0)
                issues.push('Traditional patent section (#tmp-patent-option-traditional) present but should be absent for patent:Patent-Pledge')
        }
    }

    // 9. Recreate URL: key params must round-trip correctly.
    if (opts && opts.expectedParams) {
        const recreateHref = $('section.recreate a').first().attr('href') || ''
        if (!recreateHref) {
            issues.push('Recreate URL missing from document')
        } else {
            let urlParams
            try {
                urlParams = new URLSearchParams(recreateHref.split('?')[1] || '')
            } catch (e) {
                urlParams = null
                issues.push('Recreate URL could not be parsed: ' + recreateHref.slice(0, 80))
            }
            if (urlParams) {
                // Check no placeholder text leaked into the URL
                if (recreateHref.includes('____________________'))
                    issues.push('Recreate URL contains emptyField placeholder (____________________)')
                // Check these params round-trip exactly
                const CHECK_EXACT = [
                    'fsfe-compliance', 'outbound-option', 'agreement-exclusivity',
                    'patent-option', 'medialist', 'beneficiary-name', 'project-name',
                    'license-policy-location',
                ]
                for (const key of CHECK_EXACT) {
                    if (!(key in opts.expectedParams)) continue
                    const expected = opts.expectedParams[key]
                    const actual   = urlParams.get(key)
                    if (actual !== expected)
                        issues.push(`Recreate URL param "${key}": expected "${expected}", got "${actual}"`)
                }
                // outboundlist: compare as sorted sets (the app joins with ", " on save)
                if ('outboundlist' in opts.expectedParams) {
                    const normalize = v => (v || '').split(',').map(s => s.trim()).filter(Boolean).sort().join(',')
                    if (normalize(urlParams.get('outboundlist')) !== normalize(opts.expectedParams['outboundlist']))
                        issues.push(`Recreate URL param "outboundlist": expected "${opts.expectedParams['outboundlist']}", got "${urlParams.get('outboundlist')}"`)
                }
            }
        }
    }

    // 10. Content presence: values from params must appear in the document body.
    if (opts && opts.expectedParams) {
        const ep = opts.expectedParams
        const normBody = bodyText.replace(/\s+/g, ' ')
        const checkPresent = (value, label) => {
            if (value && !normBody.includes(value))
                issues.push(`Expected "${value}" (${label}) not found in document body`)
        }
        checkPresent(ep['beneficiary-name'], 'beneficiary-name')
        checkPresent(ep['project-name'],     'project-name')
        checkPresent(ep['license-policy-location'], 'license-policy-location')
        // outboundlist: each selected license should appear in the outbound section
        if (ep['outboundlist']) {
            for (const lic of ep['outboundlist'].split(',').map(s => s.trim()).filter(Boolean))
                checkPresent(lic, 'outboundlist entry')
        }
        // medialist: the license name should appear in the documentation license paragraph
        if (ep['medialist']) {
            for (const lic of ep['medialist'].split(',').map(s => s.trim()).filter(Boolean))
                checkPresent(lic, 'medialist entry')
        }
    }

    // 11. Reference file comparison — informational only, not failures (outdated reference files).
    // The reference files predate the legal-changes rewrite so differences are expected.
    if (refTxt) {
        const missing = []
        for (const phrase of extractKeyPhrases(refTxt)) {
            const normPhrase = phrase.replace(/\s+/g, ' ')
            const normBody = bodyText.replace(/\s+/g, ' ')
            if (!normBody.includes(normPhrase)) {
                missing.push(phrase.slice(0, 80))
            }
        }
        if (missing.length > 0) {
            infoNotes.push(`${missing.length} phrase(s) from outdated reference not found (expected — template was rewritten):`)
            missing.slice(0, 5).forEach(p => infoNotes.push(`  ~ "${p}"`))
            if (missing.length > 5) infoNotes.push(`  ~ ...and ${missing.length - 5} more`)
        }
    }

    return { status: issues.length === 0 ? 'PASS' : 'FAIL', issues, infoNotes }
}

// ---- Result collection ------------------------------------------------------

const collectedResults = []
const textLog = []   // populated when SAVE_TEXTS=1
const viewerDocs = []

function record(label, status, details, infoNotes) {
    collectedResults.push({ label, status, details: details || [], infoNotes: infoNotes || [] })
}

function logText(label, text) {
    if (SAVE_TEXTS) textLog.push({ label, text })
}

function saveTextLog() {
    if (!SAVE_TEXTS || textLog.length === 0) return
    fs.mkdirSync(LOGS_DIR, { recursive: true })
    const stamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '')
    const logPath = path.join(LOGS_DIR, `${stamp}.log`)
    const lines = [
        '=== Agreement Chooser Generated Text Log ===',
        `Date:   ${new Date().toISOString()}`,
        `Server: ${BASE_URL}`,
        `Paths:  ${textLog.length} document(s)`,
        '',
    ]
    for (const entry of textLog) {
        lines.push(`${'='.repeat(72)}`)
        lines.push(`  ${entry.label}`)
        lines.push(`${'='.repeat(72)}`)
        lines.push(entry.text)
        lines.push('')
    }
    fs.writeFileSync(logPath, lines.join('\n'))
    console.log(`\nText log written to:\n  ${logPath}`)
}

function extractRecreateUrl(html) {
    const $ = cheerio.load(html)
    return $('section.recreate a').first().attr('href') || null
}

function collectViewerDoc(label, variant, html, status) {
    viewerDocs.push({ label, variant, html, status, recreateUrl: extractRecreateUrl(html) })
}

function writeViewerData() {
    fs.writeFileSync(VIEWER_DATA, JSON.stringify({
        generated: new Date().toISOString(),
        server: BASE_URL,
        documents: viewerDocs,
    }, null, 2))
    console.log(`\nViewer data written to:\n  ${VIEWER_DATA}`)
}

// ---- Navigation helpers -----------------------------------------------------

async function openPath(wizardPath) {
    const qs = new URLSearchParams(wizardPath.params).toString()
    await browser.url(`${BASE_URL}/?${qs}`)
    for (const id of ['#generalBullet', '#copyrightBullet', '#patentsBullet', '#reviewBullet', '#applyBullet']) {
        const el = await $(id)
        await el.waitForClickable({ timeout: 5000 })
        await el.click()
        await browser.pause(200)
    }
}

async function getTextareaValue(selector) {
    const el = await $(selector)
    await el.waitForExist({ timeout: 5000 })
    return el.getValue()
}

/**
 * Click an HTML modal button, wait for the Bootstrap modal to open (Bootstrap 2
 * adds class "in" when the modal is visible), read the textarea content, then
 * close the modal before continuing. This avoids reading from hidden modals where
 * getValue() returns empty or stale content.
 */
async function getHtmlFromModal(btnSelector, modalSelector, textareaSelector) {
    const btn = await $(btnSelector)
    await btn.waitForClickable({ timeout: 5000 })
    await btn.click()
    // Wait for Bootstrap 2 to add the "in" class (modal fully visible)
    const modal = await $(modalSelector)
    await modal.waitForDisplayed({ timeout: 5000 })
    const textarea = await $(textareaSelector)
    await textarea.waitForExist({ timeout: 5000 })
    const value = await textarea.getValue()
    // Close modal via the dismiss button inside it
    const closeBtn = await $(`${modalSelector} [data-dismiss="modal"]`)
    await closeBtn.click()
    await modal.waitForDisplayed({ timeout: 5000, reverse: true })
    return value
}

async function getLinkHref(selector) {
    const el = await $(selector)
    await el.waitForExist({ timeout: 5000 })
    return el.getAttribute('href')
}

// ---- Report writing ---------------------------------------------------------

function writeReports() {
    const passed  = collectedResults.filter(r => r.status === 'PASS').length
    const failed  = collectedResults.filter(r => r.status === 'FAIL').length
    const errored = collectedResults.filter(r => r.status === 'ERROR').length

    fs.writeFileSync(REPORT_JSON, JSON.stringify({
        generated: new Date().toISOString(),
        server: BASE_URL,
        summary: { total: collectedResults.length, passed, failed, errored },
        results: collectedResults,
    }, null, 2))

    const lines = [
        '=== Agreement Chooser Harness Report ===',
        `Generated: ${new Date().toISOString()}`,
        `Server:    ${BASE_URL}`,
        '',
        'SUMMARY',
        '-------',
        `Total:   ${collectedResults.length}`,
        `Passed:  ${passed}`,
        `Failed:  ${failed}`,
        `Errors:  ${errored}`,
        '',
        'RESULTS',
        '-------',
    ]

    for (const r of collectedResults) {
        const prefix = r.status === 'PASS' ? '[PASS]' : r.status === 'FAIL' ? '[FAIL]' : '[ERROR]'
        lines.push(`${prefix} ${r.label}`)
        for (const d of r.details) {
            lines.push(`       ${d}`)
        }
        for (const n of (r.infoNotes || [])) {
            lines.push(`  [info] ${n}`)
        }
    }

    lines.push('')
    fs.writeFileSync(REPORT_TEXT, lines.join('\n'))
    console.log(`\nReports written to:\n  ${REPORT_JSON}\n  ${REPORT_TEXT}`)
    console.log(`Summary: ${passed} passed, ${failed} failed, ${errored} errors out of ${collectedResults.length} checks\n`)
}

// ---- Test suite -------------------------------------------------------------

const ACTIVE_PATHS = FILTER_TYPE
    ? ALL_PATHS.filter(p => p.type === FILTER_TYPE)
    : ALL_PATHS

describe('Agreement Chooser Harness', function () {
    after(function () {
        writeReports()
        saveTextLog()
        writeViewerData()
    })

    for (const wizardPath of ACTIVE_PATHS) {
        describe(wizardPath.label, function () {
            before(async function () {
                await openPath(wizardPath)
            })

            const isFla = wizardPath.type === 'fla'

            // Shared recreate URL, set by the individual HTML test and used by the round-trip test
            let storedRecreateUrl = null

            // Individual document — open modal, read, close
            it(`${isFla ? 'FLA' : 'CLA'} individual HTML`, async function () {
                const btn      = isFla ? '#btn-html-fla-indv'   : '#btn-html-cla-indv'
                const modal    = isFla ? '#myHTML-fla'           : '#myHTML'
                const textarea = isFla ? '#embed-agreement-fla'  : '#embed-agreement'
                try {
                    const html = await getHtmlFromModal(btn, modal, textarea)
                    storedRecreateUrl = extractRecreateUrl(html)
                    logText(`${wizardPath.label} / individual HTML`, html)
                    const refTxt = loadRef(wizardPath.refPrefix, 'indiv', 'txt')
                    const opts = { outboundOption: wizardPath.params['outbound-option'], patentOption: wizardPath.params['patent-option'], expectedParams: wizardPath.params }
                    const { status, issues, infoNotes } = validateHtml(html, refTxt, opts)
                    collectViewerDoc(wizardPath.label, 'individual', html, status)
                    const details = refTxt ? issues : ['(no reference txt — structural check only)', ...issues]
                    record(`${wizardPath.label} / individual HTML`, status, details, infoNotes)
                    if (status === 'FAIL') throw new Error(issues[0])
                } catch (e) {
                    const knownPrefix = ['Missing', 'Empty', 'Old ', 'Old all-caps']
                    if (!knownPrefix.some(p => e.message.startsWith(p))) {
                        record(`${wizardPath.label} / individual HTML`, 'ERROR', [e.message])
                    }
                    throw e
                }
            })

            // Entity document — open modal, read, close
            it(`${isFla ? 'FLA' : 'CLA'} entity HTML`, async function () {
                const btn      = isFla ? '#btn-html-fla-entity'        : '#btn-html-cla-entity'
                const modal    = isFla ? '#myHTML-fla-entity'           : '#myHTML-entity'
                const textarea = isFla ? '#embed-agreement-fla-entity'  : '#embed-agreement-entity'
                try {
                    const html = await getHtmlFromModal(btn, modal, textarea)
                    logText(`${wizardPath.label} / entity HTML`, html)
                    const refTxt = loadRef(wizardPath.refPrefix, 'entity', 'txt')
                    const opts = { outboundOption: wizardPath.params['outbound-option'], patentOption: wizardPath.params['patent-option'], expectedParams: wizardPath.params }
                    const { status, issues, infoNotes } = validateHtml(html, refTxt, opts)
                    collectViewerDoc(wizardPath.label, 'entity', html, status)
                    const details = refTxt ? issues : ['(no reference txt — structural check only)', ...issues]
                    record(`${wizardPath.label} / entity HTML`, status, details, infoNotes)
                    if (status === 'FAIL') throw new Error(issues[0])
                } catch (e) {
                    const knownPrefix = ['Missing', 'Empty', 'Old ', 'Old all-caps']
                    if (!knownPrefix.some(p => e.message.startsWith(p))) {
                        record(`${wizardPath.label} / entity HTML`, 'ERROR', [e.message])
                    }
                    throw e
                }
            })

            // Markdown individual
            it(`${isFla ? 'FLA' : 'CLA'} individual Markdown`, async function () {
                const selector = isFla ? '#embed-agreement-fla-mkdn' : '#embed-agreement-mkdn'
                try {
                    const md = await getTextareaValue(selector)
                    logText(`${wizardPath.label} / individual Markdown`, md)
                    const issues = []
                    if (!md || md.trim().length === 0) issues.push('Markdown document is empty')
                    else if (!md.includes('#') && !md.includes('##')) issues.push('No Markdown headings found')
                    const status = issues.length === 0 ? 'PASS' : 'FAIL'
                    const refMd = loadRef(wizardPath.refPrefix, 'indiv', 'md')
                    if (!refMd) issues.unshift('(no reference md file)')
                    record(`${wizardPath.label} / individual Markdown`, status, issues)
                    if (status === 'FAIL') throw new Error(issues[0])
                } catch (e) {
                    if (e.message !== 'Markdown document is empty' && e.message !== 'No Markdown headings found') {
                        record(`${wizardPath.label} / individual Markdown`, 'ERROR', [e.message])
                    }
                    throw e
                }
            })

            // Markdown entity
            it(`${isFla ? 'FLA' : 'CLA'} entity Markdown`, async function () {
                const selector = isFla ? '#embed-agreement-fla-entity-mkdn' : '#embed-agreement-entity-mkdn'
                try {
                    const md = await getTextareaValue(selector)
                    logText(`${wizardPath.label} / entity Markdown`, md)
                    const issues = []
                    if (!md || md.trim().length === 0) issues.push('Markdown document is empty')
                    else if (!md.includes('#') && !md.includes('##')) issues.push('No Markdown headings found')
                    const status = issues.length === 0 ? 'PASS' : 'FAIL'
                    const refMd = loadRef(wizardPath.refPrefix, 'entity', 'md')
                    if (!refMd) issues.unshift('(no reference md file)')
                    record(`${wizardPath.label} / entity Markdown`, status, issues)
                    if (status === 'FAIL') throw new Error(issues[0])
                } catch (e) {
                    if (e.message !== 'Markdown document is empty' && e.message !== 'No Markdown headings found') {
                        record(`${wizardPath.label} / entity Markdown`, 'ERROR', [e.message])
                    }
                    throw e
                }
            })

            // Link individual
            it(`${isFla ? 'FLA' : 'CLA'} individual link`, async function () {
                const selector = isFla ? '#btn-link-fla-indv' : '#btn-link-cla-indv'
                try {
                    const href = await getLinkHref(selector)
                    const issues = []
                    if (!href || href === '#') issues.push(`Link href not set (got: "${href}")`)
                    else if (!href.includes('fsfe-compliance') && !href.includes('outbound-option')) {
                        issues.push(`Link does not contain expected query params: ${href.slice(0, 100)}`)
                    }
                    const status = issues.length === 0 ? 'PASS' : 'FAIL'
                    record(`${wizardPath.label} / individual link`, status, issues)
                    if (status === 'FAIL') throw new Error(issues[0])
                } catch (e) {
                    if (!e.message.startsWith('Link')) {
                        record(`${wizardPath.label} / individual link`, 'ERROR', [e.message])
                    }
                    throw e
                }
            })

            // Link entity
            it(`${isFla ? 'FLA' : 'CLA'} entity link`, async function () {
                const selector = isFla ? '#btn-link-fla-entity' : '#btn-link-cla-entity'
                try {
                    const href = await getLinkHref(selector)
                    const issues = []
                    if (!href || href === '#') issues.push(`Link href not set (got: "${href}")`)
                    else if (!href.includes('fsfe-compliance') && !href.includes('outbound-option')) {
                        issues.push(`Link does not contain expected query params: ${href.slice(0, 100)}`)
                    }
                    const status = issues.length === 0 ? 'PASS' : 'FAIL'
                    record(`${wizardPath.label} / entity link`, status, issues)
                    if (status === 'FAIL') throw new Error(issues[0])
                } catch (e) {
                    if (!e.message.startsWith('Link')) {
                        record(`${wizardPath.label} / entity link`, 'ERROR', [e.message])
                    }
                    throw e
                }
            })

            // Recreate URL round-trip: load the URL from the generated document and verify
            // that each wizard page restores the correct selection / field value.
            it('recreate URL round-trip', async function () {
                if (!storedRecreateUrl) {
                    record(`${wizardPath.label} / recreate URL round-trip`, 'ERROR',
                        ['No recreate URL available — individual HTML test may have failed'])
                    this.skip()
                    return
                }

                const issues  = []
                const params   = wizardPath.params
                let recorded   = false

                try {
                    await browser.url(storedRecreateUrl)
                    await (await $('#generalBullet')).waitForClickable({ timeout: 5000 })

                    // ---- General page ----
                    await (await $('#generalBullet')).click()
                    await browser.pause(300)

                    // FLA / CLA button active state
                    if (params['fsfe-compliance'] === 'fsfe-compliance') {
                        const cls = await (await $('#fsfe-compliance')).getAttribute('class')
                        if (!cls || !cls.includes('active'))
                            issues.push('FLA button (#fsfe-compliance) not active after recreate load')
                    } else {
                        const cls = await (await $('#non-fsfe-compliance')).getAttribute('class')
                        if (!cls || !cls.includes('active'))
                            issues.push('CLA button (#non-fsfe-compliance) not active after recreate load')
                    }

                    if (params['beneficiary-name']) {
                        const val = await (await $('#beneficiary-name')).getValue()
                        if (val !== params['beneficiary-name'])
                            issues.push(`beneficiary-name: expected "${params['beneficiary-name']}", got "${val}"`)
                    }

                    if (params['project-name']) {
                        const val = await (await $('#project-name')).getValue()
                        if (val !== params['project-name'])
                            issues.push(`project-name: expected "${params['project-name']}", got "${val}"`)
                    }

                    // ---- Copyright page ----
                    await (await $('#copyrightBullet')).click()
                    await browser.pause(300)

                    // Exclusivity section visibility: FLA shows info text, CLA shows dropdown
                    if (isFla) {
                        if (!await (await $('#agreement-exclusivity-fsfe')).isDisplayed())
                            issues.push('FLA exclusivity info (#agreement-exclusivity-fsfe) not visible')
                        if (await (await $('#agreement-exclusivity-non-fsfe')).isDisplayed())
                            issues.push('CLA exclusivity select (#agreement-exclusivity-non-fsfe) visible but should be hidden for FLA')
                    } else {
                        if (!await (await $('#agreement-exclusivity-non-fsfe')).isDisplayed())
                            issues.push('CLA exclusivity select (#agreement-exclusivity-non-fsfe) not visible')
                        if (await (await $('#agreement-exclusivity-fsfe')).isDisplayed())
                            issues.push('FLA exclusivity info (#agreement-exclusivity-fsfe) visible but should be hidden for CLA')
                        if (params['agreement-exclusivity']) {
                            const val = await (await $('#agreement-exclusivity')).getValue()
                            if (val !== params['agreement-exclusivity'])
                                issues.push(`agreement-exclusivity: expected "${params['agreement-exclusivity']}", got "${val}"`)
                        }
                    }

                    const outboundRadioMap = {
                        'fsfe':           '#outbound-option-fsfe',
                        'same-licenses':  '#outbound-option-same-licenses',
                        'license-policy': '#outbound-option-license-policy',
                        'same':           '#outbound-option-same',
                        'no-commitment':  '#outbound-option-no-commitment',
                    }
                    const radioSel = outboundRadioMap[params['outbound-option']]
                    if (radioSel) {
                        const checked = await (await $(radioSel)).isSelected()
                        if (!checked)
                            issues.push(`outbound-option radio "${params['outbound-option']}" (${radioSel}) not checked`)
                    }

                    if (params['license-policy-location']) {
                        const val = await (await $('#license-policy-location')).getValue()
                        if (val !== params['license-policy-location'])
                            issues.push(`license-policy-location: expected "${params['license-policy-location']}", got "${val}"`)
                    }

                    if (params['outboundlist']) {
                        const expected = params['outboundlist'].split(',').map(s => s.trim()).filter(Boolean)
                        const opts = await $$('#outboundlist option')
                        const selected = []
                        for (const opt of opts) {
                            if (await opt.isSelected()) selected.push(await opt.getValue())
                        }
                        for (const lic of expected) {
                            if (!selected.includes(lic))
                                issues.push(`outboundlist: "${lic}" not selected (selected: [${selected.join(', ')}])`)
                        }
                    }

                    if (params['medialist']) {
                        const expected = params['medialist'].split(',').map(s => s.trim()).filter(Boolean)
                        const opts = await $$('#medialist option')
                        const selected = []
                        for (const opt of opts) {
                            if (await opt.isSelected()) selected.push(await opt.getValue())
                        }
                        for (const lic of expected) {
                            if (!selected.includes(lic))
                                issues.push(`medialist: "${lic}" not selected (selected: [${selected.join(', ')}])`)
                        }
                    }

                    // ---- Patent page ----
                    await (await $('#patentsBullet')).click()
                    await browser.pause(300)

                    // Patent section visibility: FLA shows info text, CLA shows dropdown
                    if (isFla) {
                        if (!await (await $('#patent-type-fsfe')).isDisplayed())
                            issues.push('FLA patent info (#patent-type-fsfe) not visible')
                        if (await (await $('#patent-type-non-fsfe')).isDisplayed())
                            issues.push('CLA patent select (#patent-type-non-fsfe) visible but should be hidden for FLA')
                    } else {
                        if (!await (await $('#patent-type-non-fsfe')).isDisplayed())
                            issues.push('CLA patent select (#patent-type-non-fsfe) not visible')
                        if (await (await $('#patent-type-fsfe')).isDisplayed())
                            issues.push('FLA patent info (#patent-type-fsfe) visible but should be hidden for CLA')
                        if (params['patent-option']) {
                            const val = await (await $('#patent-type')).getValue()
                            if (val !== params['patent-option'])
                                issues.push(`patent-type: expected "${params['patent-option']}", got "${val}"`)
                        }
                    }

                    // ---- Review page ----
                    await (await $('#reviewBullet')).click()
                    await browser.pause(300)

                    // Ensure all page-processing functions have run regardless of
                    // whether onTabClick fired correctly for each bullet navigation.
                    await browser.execute(() => testAllPages())
                    await browser.pause(100)

                    if (params['beneficiary-name']) {
                        const txt = await (await $('#review-beneficiary-name')).getText()
                        if (!txt.includes(params['beneficiary-name']))
                            issues.push(`review-beneficiary-name: expected "${params['beneficiary-name']}", got "${txt}"`)
                    }

                    if (params['project-name']) {
                        const txt = await (await $('#review-project-name')).getText()
                        if (!txt.includes(params['project-name']))
                            issues.push(`review-project-name: expected "${params['project-name']}", got "${txt}"`)
                    }

                    // FLA is always Exclusive; CLA takes the param value, defaulting to exclusive
                    const expectedExclusivity = (params['agreement-exclusivity'] === 'non-exclusive')
                        ? 'Non-Exclusive' : 'Exclusive'
                    const exclReviewTxt = await (await $('#review-agreement-exclusivity')).getText()
                    if (!exclReviewTxt.includes(expectedExclusivity))
                        issues.push(`review-agreement-exclusivity: expected "${expectedExclusivity}", got "${exclReviewTxt}"`)

                    // Outbound licenses summary: non-empty for all options except
                    // same-licenses without a specific outboundlist (user hasn't chosen yet).
                    const outboundReviewTxt = await (await $('#review-outbound-licenses')).getText()
                    const sameLicensesNoList = params['outbound-option'] === 'same-licenses' && !params['outboundlist']
                    if (!sameLicensesNoList && (!outboundReviewTxt || outboundReviewTxt.trim() === ''))
                        issues.push('review-outbound-licenses: empty in review summary')

                    if (params['medialist']) {
                        const mediaReviewTxt = await (await $('#review-media-licenses')).getText()
                        for (const lic of params['medialist'].split(',').map(s => s.trim()).filter(Boolean)) {
                            if (!mediaReviewTxt.includes(lic))
                                issues.push(`review-media-licenses: "${lic}" not found (got: "${mediaReviewTxt}")`)
                        }
                    }

                    // Patent type review cell shows the human-readable name from the dictionary
                    const patentParam = params['patent-option'] || 'Traditional'
                    const expectedPatent = patentParam === 'Patent-Pledge'
                        ? 'Patent Pledge' : 'Traditional Patent License'
                    const patentReviewTxt = await (await $('#review-patent-type')).getText()
                    if (!patentReviewTxt.includes(expectedPatent))
                        issues.push(`review-patent-type: expected "${expectedPatent}", got "${patentReviewTxt}"`)

                    const status = issues.length === 0 ? 'PASS' : 'FAIL'
                    record(`${wizardPath.label} / recreate URL round-trip`, status, issues)
                    recorded = true
                    if (status === 'FAIL') throw new Error(issues[0])
                } catch (e) {
                    if (!recorded)
                        record(`${wizardPath.label} / recreate URL round-trip`, 'ERROR', [e.message])
                    throw e
                }
            })
        })
    }
})
