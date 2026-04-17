// general.page.js
const { $ } = require('@wdio/globals')
const Page = require('./page')

class GeneralPage extends Page {

    get btnFsfeCompliance () { return $('#fsfe-compliance') }
    get btnNonFsfeCompliance () { return $('#non-fsfe-compliance') }
    get fieldBeneficiaryName () { return $('#beneficiary-name') }
    get fieldProjectName () { return $('#project-name') }
    get fieldProjectWebsite () { return $('#project-website') }
    get fieldProjectEmail () { return $('#project-email') }
    get fieldContributorSigningProcessWebsite () { return $('#contributor-process-url') }
    get fieldJurisdiction () { return $('#project-jurisdiction') }

    // TODO Test all buttons / fields
    async selectFsfeCompliance() {
        await this.btnFsfeCompliance.click()
    }
    async selectNonFsfeCompliance() {
        await this.btnNonFsfeCompliance.click()
    }
    async setBeneficiary (benef = 'Marc Source') {
        await this.fieldBeneficiaryName.setValue(benef)
    }
    async setProjectName (projectName = 'Source Project') {
        await this.fieldProjectName.setValue(projectName)
    }
    async setProjectWebsite(projectWebsite = 'My Favourite Project') {
        await this.fieldProjectWebsite.setValue(projectWebsite)
    }
    async setProjectEmail(email = 'marc@source.com') {
        await this.fieldProjectEmail.setValue(email)
    }
    async setContributorSigningProcessWebsite(website = 'https://www.sourceproject.org/contrib/sign') {
        await this.fieldContributorSigningProcessWebsite.setValue(website)
    }
    async setJurisdiction(jurisdiction = 'Germany') {
        await this.fieldJurisdiction.setValue(jurisdiction)
    }

}

module.exports = new GeneralPage()
