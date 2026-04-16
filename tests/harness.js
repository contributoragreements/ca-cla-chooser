'use strict'

const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')

const BASE_URL = 'http://localhost:4000'
const REFS_DIR = path.resolve(__dirname, '..', 'agreement_texts')
const REPORT_JSON = path.resolve(__dirname, '..', 'harness-report.json')
const REPORT_TEXT = path.resolve(__dirname, '..', 'harness-report.txt')
const LOGS_DIR = path.resolve(__dirname, 'logs')
const VIEWER_DATA = path.resolve(__dirname, '..', 'harness-texts.json')

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
 * opts.outboundOption — the outbound-option param for this path (e.g. 'no-commitment').
 * opts.patentOption   — the patent-option param for this path (e.g. 'Patent-Pledge'). CLA only.
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

    // 9. Reference file comparison — informational only, not failures.
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

describe('Agreement Chooser Harness', function () {
    after(function () {
        writeReports()
        saveTextLog()
        writeViewerData()
    })

    for (const wizardPath of ALL_PATHS) {
        describe(wizardPath.label, function () {
            before(async function () {
                await openPath(wizardPath)
            })

            const isFla = wizardPath.type === 'fla'

            // Individual document — open modal, read, close
            it(`${isFla ? 'FLA' : 'CLA'} individual HTML`, async function () {
                const btn      = isFla ? '#btn-html-fla-indv'   : '#btn-html-cla-indv'
                const modal    = isFla ? '#myHTML-fla'           : '#myHTML'
                const textarea = isFla ? '#embed-agreement-fla'  : '#embed-agreement'
                try {
                    const html = await getHtmlFromModal(btn, modal, textarea)
                    logText(`${wizardPath.label} / individual HTML`, html)
                    const refTxt = loadRef(wizardPath.refPrefix, 'indiv', 'txt')
                    const opts = { outboundOption: wizardPath.params['outbound-option'], patentOption: wizardPath.params['patent-option'] }
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
                    const opts = { outboundOption: wizardPath.params['outbound-option'], patentOption: wizardPath.params['patent-option'] }
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
        })
    }
})
