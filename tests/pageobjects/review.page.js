// review.page.js
const Page = require('./page')

class ReviewPage extends Page {

    get reviewBeneficiaryName () { return $('#review-beneficiary-name') }
    get reviewProjectName () { return $('#review-project-name') }
    get reviewProjectWebsite () { return $('#review-project-website') }
    get reviewProjectEmail () { return $('#review-project-email') }
    get reviewContributorSigningProcessWebsite () { return $('#review-contributor-process-url') }
    get reviewProjectJurisdiction () { return $('#review-project-jurisdiction') }
    get reviewAgreementExclusivity () { return $('#review-agreement-exclusivity') }
    get reviewOutboundLicenses () { return $('#review-outbound-licenses') }
    get reviewDocumentationLicenses () { return $('#review-media-licenses') }
    get reviewPatentType () { return $('#review-patent-type') }
    get reviewTextFla () { return $('#review-text-fla') }
    get reviewTextFlaEntity () { return $('#review-text-fla-entity') }
    get reviewText () { return $('#review-text') }
    get reviewTextEntity () { return $('#review-text-entity') }
}

module.exports = new ReviewPage()
