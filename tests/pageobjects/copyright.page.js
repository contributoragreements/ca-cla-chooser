// copyright.page.js
const Page = require('./page')

class CopyrightPage extends Page {

    // fsfe copyright options
    get optionOutboundFsf () { return $('#outbound-option-fsfe') }
    get optionOutboundListedLicenses () { return $('#outbound-option-same-licenses') }
    get sameLicensesList () { return $('#outboundlist') }
    get sameLicensesText () { return $('#outboundlist-custom') }
    get optionOutboundLicensePolicy () { return $('#outbound-option-license-policy') }
    get fieldLicensePolicyLocation () { return $('#license-policy-location') }
    // extra options for non-fsfe
    get optionExclusiveNonExclusiveLicense () { return $('#agreement-exclusivity') }
    get optionOutboundSameOnDate () { return $('#outbound-option-same') }
    get optionOutboundNoCommitment () { return $('#outbound-option-no-commitment') }
    get optionDocumentationLicenses () { return $('#medialist') }

    async selectOutboundFsf () {
        await this.optionOutboundFsf.click()
    }
    async selectOutboundListedLicenses () {
        await this.optionOutboundListedLicenses.click()
    }
    async selectOutboundLicensePolicy () {
        await this.optionOutboundLicensePolicy.click()
    }
    async selectOutboundSameOnDate () {
        await this.optionOutboundSameOnDate.click()
    }
    async selectOutboundNoCommitment () {
        await this.optionOutboundNoCommitment.click()
    }
    async setInboundExclusiveLicense () {
        await this.optionExclusiveNonExclusiveLicense.selectByAttribute('value', 'exclusive')
    }
    async setInboundNonExclusiveLicense () {
        await this.optionExclusiveNonExclusiveLicense.selectByAttribute('value', 'non-exclusive')
    }

    // Selects a single license by value from the outboundlist multi-select
    async setOutboundListItems (outboundlicenses = 'GPL-3.0') {
        await this.sameLicensesList.selectByAttribute('value', outboundlicenses)
    }
    async setOutboundListCustom (outboundlicenses = 'The Best License Ever, TBLEL') {
        await this.sameLicensesText.setValue(outboundlicenses)
    }
    async setLicensePolicyLocation (licensePolicyLocation = 'https://sourceproject.org/license-policy') {
        await this.fieldLicensePolicyLocation.setValue(licensePolicyLocation)
    }
    async setDocumentationLicense (documentationLicense = 'CC0-1.0') {
        await this.optionDocumentationLicenses.selectByAttribute('value', documentationLicense)
    }
}

module.exports = new CopyrightPage()
