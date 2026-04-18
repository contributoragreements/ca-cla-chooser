// patents.page.js
const Page = require('./page')

class PatentsPage extends Page {

    // The patent type select (CLA only — for FLA a static info text is shown instead)
    get patentLicenseType () { return $('#patent-type') }

    async selectTraditionalPatentLicense () {
        await this.patentLicenseType.selectByVisibleText('Traditional Patent License')
    }
    async selectPatentPledge () {
        await this.patentLicenseType.selectByVisibleText('Identified Patent Pledge')
    }
}

module.exports = new PatentsPage()
