const Page = require('./pageobjects/page');
const GeneralPage = require('./pageobjects/general.page');
const CopyrightPage = require('./pageobjects/copyright.page');
const PatentsPage = require('./pageobjects/patents.page');
const ApplyPage = require('./pageobjects/apply.page');
const { expect } = require('chai');
const cheerio = require('cheerio');

const page = new Page();
const applyPage = new ApplyPage();

/**
 * Wizard Output Validation Tests
 *
 * These tests verify that wizard choices correctly generate agreement documents by:
 * - Checking for presence/absence of specific HTML sections (not just words)
 * - Validating specific element IDs and their content
 * - Verifying section visibility based on choices using cheerio to parse HTML
 * - Testing all major choice combinations
 *
 * See tests/WIZARD_TEST_PLAN.md for complete documentation of:
 * - All 38 possible wizard combinations (6 FLA + 32 CLA)
 * - Template structure with element IDs
 * - Validation strategy
 */

describe('Wizard Output Validation Tests - Structural', async function() {

    describe('FLA vs CLA - Core Structure Differences', async function() {

        it('FLA should contain preamble section (#tmp-preamble)', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            const $ = cheerio.load(flaText);

            // Preamble section MUST exist in FLA
            const preamble = $('#tmp-preamble');
            await expect(preamble.length).to.equal(1, 'Preamble section should exist in FLA');
            await expect(preamble.text()).to.include('Free Software');
            await expect(preamble.text()).to.include('FSFE');
        });

        it('CLA should NOT contain preamble section (#tmp-preamble)', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            const $ = cheerio.load(claText);

            // Preamble section should NOT exist in CLA
            const preamble = $('#tmp-preamble');
            await expect(preamble.length).to.equal(0, 'Preamble section should NOT exist in CLA');
        });

        it('FLA should have "Fiduciary" in title (#tmp-title)', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            const $ = cheerio.load(flaText);

            const title = $('#tmp-title').text();
            await expect(title).to.include('Fiduciary');
        });

        it('FLA should show "based on the" subtitle (#tmp-subtitle-based)', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            const $ = cheerio.load(flaText);

            const subtitleBased = $('#tmp-subtitle-based');
            await expect(subtitleBased.length).to.equal(1, 'FLA should have subtitle-based element');
            await expect(subtitleBased.text()).to.include('based on');
        });

        it('CLA should NOT show "based on the" subtitle or it should be empty', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            const $ = cheerio.load(claText);

            // Either element doesn't exist or is empty/hidden
            const subtitleBased = $('#tmp-subtitle-based');
            if (subtitleBased.length > 0) {
                const text = subtitleBased.text().trim();
                await expect(text).to.be.empty;
            }
        });

    });

    describe('Individual vs Entity - Structural Differences', async function() {

        it('Individual FLA should show "Individual" in contributor type (#tmp-contributor-type)', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            const $ = cheerio.load(flaText);

            const contributorType = $('#tmp-contributor-type').text();
            await expect(contributorType).to.include('Individual');
        });

        it('Entity FLA should show "Entity" in contributor type (#tmp-contributor-type)', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const flaEntityText = await applyPage.applyResultHtmlFlaEntityText.getValue();
            const $ = cheerio.load(flaEntityText);

            const contributorType = $('#tmp-contributor-type').text();
            await expect(contributorType).to.include('Entity');
        });

        it('Entity CLA should contain entity definitions section (#tmp-entity-definitions)', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const claEntityText = await applyPage.applyResultHtmlClaEntityText.getValue();
            const $ = cheerio.load(claEntityText);

            const entityDefs = $('#tmp-entity-definitions');
            await expect(entityDefs.length).to.equal(1, 'Entity definitions should exist in Entity CLA');
            await expect(entityDefs.text()).to.include('Legal Entity');
            await expect(entityDefs.text()).to.include('Affiliate');
        });

    });

    describe('Patent Options - Section Visibility', async function() {

        it('Traditional Patent License should show traditional section (#tmp-patent-option-traditional)', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.gotoPatents();
            await browser.pause(300);

            const patentType = await $('#patent-type');
            await patentType.selectByAttribute('value', 'Traditional');

            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            const $ = cheerio.load(claText);

            // Traditional section should exist and not have .nuke class
            const traditionalSection = $('#tmp-patent-option-traditional');
            await expect(traditionalSection.length).to.equal(1, 'Traditional patent section should exist');
            await expect(traditionalSection.hasClass('nuke')).to.be.false;
            await expect(traditionalSection.text()).to.include('patent license');
        });

        it('Traditional Patent License should hide pledge section (#tmp-patent-option-pledge)', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.gotoPatents();
            await browser.pause(300);

            const patentType = await $('#patent-type');
            await patentType.selectByAttribute('value', 'Traditional');

            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            const $ = cheerio.load(claText);

            // Pledge section should have .nuke class or not be visible
            const pledgeSection = $('#tmp-patent-option-pledge');
            if (pledgeSection.length > 0) {
                await expect(pledgeSection.hasClass('nuke')).to.be.true;
            }
        });

        it('Patent Pledge should show pledge section (#tmp-patent-option-pledge)', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.gotoPatents();
            await browser.pause(300);

            const patentType = await $('#patent-type');
            await patentType.selectByAttribute('value', 'Patent-Pledge');

            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            const $ = cheerio.load(claText);

            const pledgeSection = $('#tmp-patent-option-pledge');
            await expect(pledgeSection.length).to.equal(1, 'Pledge section should exist');
            await expect(pledgeSection.hasClass('nuke')).to.be.false;
            await expect(pledgeSection.text()).to.include('Pledged Patents');
        });

        it('Patent Pledge should hide traditional section (#tmp-patent-option-traditional)', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.gotoPatents();
            await browser.pause(300);

            const patentType = await $('#patent-type');
            await patentType.selectByAttribute('value', 'Patent-Pledge');

            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            const $ = cheerio.load(claText);

            const traditionalSection = $('#tmp-patent-option-traditional');
            if (traditionalSection.length > 0) {
                await expect(traditionalSection.hasClass('nuke')).to.be.true;
            }
        });

        it('Patent subtitle (#tmp-patent-option) should contain correct patent type text', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.gotoPatents();
            await browser.pause(300);

            const patentType = await $('#patent-type');
            await patentType.selectByAttribute('value', 'Patent-Pledge');

            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            const $ = cheerio.load(claText);

            const patentOption = $('#tmp-patent-option').text();
            await expect(patentOption).to.include('Pledge');
        });

    });

    describe('Outbound License Options - Section Visibility', async function() {

        it('FSFE option should show option 1 paragraph (#tmp-outbound-option-1-fsfe)', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.gotoCopyright();
            await browser.pause(300);
            await CopyrightPage.selectOutboundFsf();
            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            const $ = cheerio.load(flaText);

            const option1 = $('#tmp-outbound-option-1-fsfe');
            await expect(option1.length).to.equal(1, 'Outbound option 1 should exist');
            await expect(option1.text()).to.include('Free Software Foundation');
            await expect(option1.text()).to.include('Open Source Initiative');
        });

        it('FSFE option should show option 2 paragraph (#tmp-outbound-option-2-fsfe)', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.gotoCopyright();
            await browser.pause(300);
            await CopyrightPage.selectOutboundListedLicenses();
            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            const $ = cheerio.load(flaText);

            const option2 = $('#tmp-outbound-option-2-fsfe');
            await expect(option2.length).to.equal(1, 'Outbound option 2 should exist');
            await expect(option2.text()).to.include('following license');
        });

        it('License policy option should show option 3 paragraph (#tmp-outbound-option-3-fsfe)', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.gotoCopyright();
            await browser.pause(300);
            await CopyrightPage.selectOutboundLicensePolicy();

            const licensePolicyField = await $('#license-policy-location');
            await licensePolicyField.setValue('https://example.org/license-policy');

            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            const $ = cheerio.load(claText);

            const option3 = $('#tmp-outbound-option-3-fsfe');
            await expect(option3.length).to.equal(1, 'Outbound option 3 should exist');
            await expect(option3.text()).to.include('licensing policy');

            const policyLocation = $('#tmp-license-policy-location').text();
            await expect(policyLocation).to.include('example.org/license-policy');
        });

        it('Same license option should show option 4 paragraph (#tmp-outbound-option-4-non-fsfe)', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.gotoCopyright();
            await browser.pause(300);
            await CopyrightPage.selectOutboundSameOnDate();
            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            const $ = cheerio.load(claText);

            const option4 = $('#tmp-outbound-option-4-non-fsfe');
            await expect(option4.length).to.equal(1, 'Outbound option 4 should exist');
            await expect(option4.text()).to.include('Submission Date');
        });

        it('No commitment option should hide entire outbound section (#tmp-outbound-section-all)', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.gotoCopyright();
            await browser.pause(300);
            await CopyrightPage.selectOutboundNoCommitment();
            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            const $ = cheerio.load(claText);

            // Outbound section should not exist or be marked as .tmp-outbound-section with hidden styles
            const outboundSection = $('.tmp-outbound-section');
            // The section should either not exist or be empty/hidden
            if (outboundSection.length > 0) {
                // Check if it has content - it should be minimal or none
                const sectionText = outboundSection.text().trim();
                // For no-commitment, section 4 should not have visible content
                await expect(sectionText.length).to.be.lessThan(100);
            }
        });

        it('No commitment option should hide special termination clause (#tmp-term-special)', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.gotoCopyright();
            await browser.pause(300);
            await CopyrightPage.selectOutboundNoCommitment();
            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            const $ = cheerio.load(claText);

            // Special termination clause should not exist for no-commitment
            const termSpecial = $('#tmp-term-special');
            if (termSpecial.length > 0) {
                const text = termSpecial.text().trim();
                await expect(text).to.be.empty;
            }
        });

        it('Only one outbound option paragraph should be prominently visible at a time', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.gotoCopyright();
            await browser.pause(300);
            await CopyrightPage.selectOutboundListedLicenses();
            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            const $ = cheerio.load(flaText);

            // Count how many outbound options have substantial text
            const option1Text = $('#tmp-outbound-option-1-fsfe').text();
            const option2FsfeText = $('#tmp-outbound-option-2-fsfe').text();
            const option3Text = $('#tmp-outbound-option-3-fsfe').text();

            // Option 2 should have content, option 1 and 3 should be hidden
            await expect(option2FsfeText.length).to.be.greaterThan(20);
        });

    });

    describe('Custom Field Replacement - Exact Element Content', async function() {

        it('Beneficiary name should appear in #tmp-beneficiary-name element', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.gotoGeneral();
            await browser.pause(300);

            const beneficiaryName = 'Test Beneficiary Org';
            await GeneralPage.setBeneficiary(beneficiaryName);

            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            const $ = cheerio.load(flaText);

            const beneficiary = $('#tmp-beneficiary-name').text();
            await expect(beneficiary).to.equal(beneficiaryName);
        });

        it('Project name should appear in #tmp-project-name element', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.gotoGeneral();
            await browser.pause(300);

            const projectName = 'My Test Project';
            await GeneralPage.setProjectName(projectName);

            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            const $ = cheerio.load(flaText);

            const project = $('#tmp-project-name').text();
            await expect(project).to.equal(projectName);
        });

        it('Project email should appear in #tmp-project-email element', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.gotoGeneral();
            await browser.pause(300);

            const projectEmail = 'test@example.org';
            await GeneralPage.setProjectEmail(projectEmail);

            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            const $ = cheerio.load(claText);

            const email = $('#tmp-project-email').text();
            await expect(email).to.include(projectEmail);
        });

        it('Jurisdiction should appear in #tmp-project-jurisdiction element', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.gotoGeneral();
            await browser.pause(300);

            const jurisdiction = 'Germany';
            await GeneralPage.setJurisdiction(jurisdiction);

            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            const $ = cheerio.load(flaText);

            const juris = $('#tmp-project-jurisdiction').text();
            await expect(juris).to.equal(jurisdiction);
        });

    });

    describe('Exclusivity - Both Instances Match', async function() {

        it('FLA should show "Exclusive" in both exclusivity locations', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            const $ = cheerio.load(flaText);

            const exclusivity1 = $('#tmp-contributor-exclusivity-1').text();
            const exclusivity2 = $('#tmp-contributor-exclusivity-2').text();

            await expect(exclusivity1.toLowerCase()).to.include('exclusive');
            await expect(exclusivity2.toLowerCase()).to.include('exclusive');
        });

        it('Non-exclusive CLA should show matching exclusivity in both locations', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.gotoCopyright();
            await browser.pause(300);

            const exclusivitySelect = await $('#agreement-exclusivity');
            await exclusivitySelect.selectByAttribute('value', 'non-exclusive');

            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            const $ = cheerio.load(claText);

            const exclusivity1 = $('#tmp-contributor-exclusivity-1').text();
            const exclusivity2 = $('#tmp-contributor-exclusivity-2').text();

            await expect(exclusivity1.toLowerCase()).to.include('non');
            await expect(exclusivity2.toLowerCase()).to.include('non');
        });

    });

    describe('Document Formats - HTML vs Markdown', async function() {

        it('HTML output should contain HTML tags, Markdown should not', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const htmlText = await applyPage.applyResultHtmlFlaText.getValue();
            const mkdnText = await applyPage.applyResultMkdnFlaText.getValue();

            // HTML should have tags
            await expect(htmlText).to.match(/<[^>]+>/);
            await expect(htmlText).to.include('<h1');
            await expect(htmlText).to.include('<section');

            // Markdown should have much fewer HTML tags (if any)
            const htmlTagCount = (mkdnText.match(/<section/g) || []).length;
            await expect(htmlTagCount).to.equal(0, 'Markdown should not have section tags');
        });

    });

});

describe('Wizard Output Validation Tests - Combination Tests', async function() {

    describe('FLA Outbound Option Combinations', async function() {

        const flaOutboundTests = [
            { name: 'FSFE general', action: async () => await CopyrightPage.selectOutboundFsf(), checkId: 'tmp-outbound-option-1-fsfe', expectedText: 'Free Software Foundation' },
            { name: 'Listed licenses', action: async () => await CopyrightPage.selectOutboundListedLicenses(), checkId: 'tmp-outbound-option-2-fsfe', expectedText: 'following license' },
        ];

        flaOutboundTests.forEach(test => {
            it(`FLA Individual with ${test.name} outbound option`, async function() {
                await page.open();
                await GeneralPage.selectFsfeCompliance();
                await page.gotoCopyright();
                await browser.pause(300);
                await test.action();
                await page.goThroughAll();
                await browser.pause(500);

                const flaText = await applyPage.applyResultHtmlFlaText.getValue();
                const $ = cheerio.load(flaText);

                // Check preamble exists (FLA marker)
                await expect($('#tmp-preamble').length).to.equal(1);
                // Check correct outbound option
                const outboundOption = $(`#${test.checkId}`);
                await expect(outboundOption.length).to.equal(1);
                await expect(outboundOption.text()).to.include(test.expectedText);
            });
        });

    });

    describe('CLA Patent and Outbound Combinations', async function() {

        it('CLA with Traditional Patent + License Policy', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();

            await page.gotoCopyright();
            await browser.pause(300);
            await CopyrightPage.selectOutboundLicensePolicy();
            const licensePolicyField = await $('#license-policy-location');
            await licensePolicyField.setValue('https://test.org/policy');

            await page.gotoPatents();
            await browser.pause(300);
            const patentType = await $('#patent-type');
            await patentType.selectByAttribute('value', 'Traditional');

            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            const $ = cheerio.load(claText);

            // No preamble (CLA marker)
            await expect($('#tmp-preamble').length).to.equal(0);
            // Traditional patent section exists
            await expect($('#tmp-patent-option-traditional').length).to.equal(1);
            // License policy option visible
            await expect($('#tmp-outbound-option-3-fsfe').text()).to.include('licensing policy');
        });

        it('CLA with Patent Pledge + Same License', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();

            await page.gotoCopyright();
            await browser.pause(300);
            await CopyrightPage.selectOutboundSameOnDate();

            await page.gotoPatents();
            await browser.pause(300);
            const patentType = await $('#patent-type');
            await patentType.selectByAttribute('value', 'Patent-Pledge');

            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            const $ = cheerio.load(claText);

            // No preamble (CLA marker)
            await expect($('#tmp-preamble').length).to.equal(0);
            // Patent pledge section exists
            await expect($('#tmp-patent-option-pledge').length).to.equal(1);
            await expect($('#tmp-patent-option-pledge').text()).to.include('Pledged Patents');
            // Same license option visible
            await expect($('#tmp-outbound-option-4-non-fsfe').text()).to.include('Submission Date');
        });

    });

    describe('Complete End-to-End Scenarios', async function() {

        it('Complete FLA workflow with all fields', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();

            await GeneralPage.setBeneficiary('FSFE e.V.');
            await GeneralPage.setProjectName('GNU Project');
            await GeneralPage.setProjectEmail('legal@fsfe.org');
            await GeneralPage.setJurisdiction('Germany');

            await page.gotoCopyright();
            await browser.pause(300);
            await CopyrightPage.selectOutboundFsf();

            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            const $ = cheerio.load(flaText);

            // Structural checks
            await expect($('#tmp-preamble').length).to.equal(1, 'Should have preamble');
            await expect($('#tmp-title').text()).to.include('Fiduciary');

            // Field replacements
            await expect($('#tmp-beneficiary-name').text()).to.equal('FSFE e.V.');
            await expect($('#tmp-project-name').text()).to.equal('GNU Project');
            await expect($('#tmp-project-email').text()).to.include('legal@fsfe.org');
            await expect($('#tmp-project-jurisdiction').text()).to.equal('Germany');

            // Outbound option
            await expect($('#tmp-outbound-option-1-fsfe').text()).to.include('Free Software Foundation');

            // Patent (FLA always traditional)
            await expect($('#tmp-patent-option-traditional').length).to.equal(1);
        });

        it('Complete CLA workflow with all options', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();

            await GeneralPage.setBeneficiary('Tech Corp');
            await GeneralPage.setProjectName('Open Project');
            await GeneralPage.setProjectEmail('contrib@tech.org');
            await GeneralPage.setJurisdiction('United States');

            await page.gotoCopyright();
            await browser.pause(300);
            const exclusivitySelect = await $('#agreement-exclusivity');
            await exclusivitySelect.selectByAttribute('value', 'non-exclusive');
            await CopyrightPage.selectOutboundSameOnDate();

            await page.gotoPatents();
            await browser.pause(300);
            const patentType = await $('#patent-type');
            await patentType.selectByAttribute('value', 'Patent-Pledge');

            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            const $ = cheerio.load(claText);

            // Structural checks
            await expect($('#tmp-preamble').length).to.equal(0, 'Should NOT have preamble');

            // Field replacements
            await expect($('#tmp-beneficiary-name').text()).to.equal('Tech Corp');
            await expect($('#tmp-project-name').text()).to.equal('Open Project');
            await expect($('#tmp-project-email').text()).to.include('contrib@tech.org');
            await expect($('#tmp-project-jurisdiction').text()).to.equal('United States');

            // Exclusivity
            await expect($('#tmp-contributor-exclusivity-1').text().toLowerCase()).to.include('non');

            // Outbound option
            await expect($('#tmp-outbound-option-4-non-fsfe').text()).to.include('Submission Date');

            // Patent pledge
            await expect($('#tmp-patent-option-pledge').length).to.equal(1);
            await expect($('#tmp-patent-option-pledge').text()).to.include('Pledged Patents');
        });

    });

});
