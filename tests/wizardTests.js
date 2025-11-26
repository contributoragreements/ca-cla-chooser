const Page = require('./pageobjects/page');
const GeneralPage = require('./pageobjects/general.page');
const CopyrightPage = require('./pageobjects/copyright.page');
const PatentsPage = require('./pageobjects/patents.page');
const ApplyPage = require('./pageobjects/apply.page');
const { expect } = require('chai');

const page = new Page();
const applyPage = new ApplyPage();

describe('Wizard Output Validation Tests', async function() {

    describe('FLA (Fiduciary License Agreement) vs CLA (Contributor License Agreement)', async function() {

        it('should generate FLA text when FSFE compliance is selected', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            await expect(flaText).to.include('Fiduciary');
            await expect(flaText).to.not.be.empty;
        });

        it('should generate FLA entity text when FSFE compliance is selected', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const flaEntityText = await applyPage.applyResultHtmlFlaEntityText.getValue();
            await expect(flaEntityText).to.include('Fiduciary');
            await expect(flaEntityText).to.not.be.empty;
        });

        it('should generate CLA text when non-FSFE compliance is selected', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            await expect(claText).to.not.include('Fiduciary');
            await expect(claText).to.include('Contributor License Agreement');
            await expect(claText).to.not.be.empty;
        });

        it('should generate CLA entity text when non-FSFE compliance is selected', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const claEntityText = await applyPage.applyResultHtmlClaEntityText.getValue();
            await expect(claEntityText).to.not.include('Fiduciary');
            await expect(claEntityText).to.include('Contributor License Agreement');
            await expect(claEntityText).to.not.be.empty;
        });

    });

    describe('Outbound License Options in Generated Text', async function() {

        it('should include FSFE license text when FSFE outbound option is selected', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.gotoCopyright();
            await browser.pause(300);
            await CopyrightPage.selectOutboundFsf();
            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            await expect(flaText).to.include('Free Software Foundation');
        });

        it('should include license policy text when license policy option is selected', async function() {
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
            await expect(claText).to.include('license-policy');
        });

        it('should include same license text when same licenses option is selected', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.gotoCopyright();
            await browser.pause(300);
            await CopyrightPage.selectOutboundListedLicenses();
            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            // Should contain text about specific licenses
            await expect(flaText).to.not.be.empty;
            await expect(flaText.length).to.be.greaterThan(1000);
        });

        it('should include no commitment text when no commitment option is selected', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.gotoCopyright();
            await browser.pause(300);
            await CopyrightPage.selectOutboundNoCommitment();
            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            await expect(claText).to.include('no commitment');
        });

    });

    describe('Patent Options in Generated Text', async function() {

        it('should include Traditional Patent License text when traditional option is selected', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.gotoPatents();
            await browser.pause(300);

            const patentType = await $('#patent-type');
            await patentType.selectByAttribute('value', 'Traditional');

            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            await expect(claText).to.include('patent');
        });

        it('should include Patent Pledge text when patent pledge option is selected', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.gotoPatents();
            await browser.pause(300);

            const patentType = await $('#patent-type');
            await patentType.selectByAttribute('value', 'Patent-Pledge');

            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            await expect(claText).to.include('pledge');
        });

    });

    describe('Custom Project Information in Generated Text', async function() {

        it('should include project name in generated FLA text', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.gotoGeneral();
            await browser.pause(300);

            const projectName = 'Test Project Name';
            await GeneralPage.setProjectName(projectName);

            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            await expect(flaText).to.include(projectName);
        });

        it('should include beneficiary name in generated FLA text', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.gotoGeneral();
            await browser.pause(300);

            const beneficiaryName = 'Test Beneficiary Name';
            await GeneralPage.setBeneficiary(beneficiaryName);

            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            await expect(flaText).to.include(beneficiaryName);
        });

        it('should include project email in generated CLA text', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.gotoGeneral();
            await browser.pause(300);

            const projectEmail = 'test@example.org';
            await GeneralPage.setProjectEmail(projectEmail);

            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            await expect(claText).to.include(projectEmail);
        });

        it('should include jurisdiction in generated text', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.gotoGeneral();
            await browser.pause(300);

            const jurisdiction = 'Germany';
            await GeneralPage.setJurisdiction(jurisdiction);

            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            await expect(flaText).to.include(jurisdiction);
        });

    });

    describe('Individual vs Entity Agreement Types', async function() {

        it('should generate different text for individual vs entity FLA', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const flaIndividualText = await applyPage.applyResultHtmlFlaText.getValue();
            const flaEntityText = await applyPage.applyResultHtmlFlaEntityText.getValue();

            // They should be different
            await expect(flaIndividualText).to.not.equal(flaEntityText);
            // Both should contain Fiduciary
            await expect(flaIndividualText).to.include('Fiduciary');
            await expect(flaEntityText).to.include('Fiduciary');
            // Entity version should have entity-specific text
            await expect(flaEntityText).to.include('Entity');
        });

        it('should generate different text for individual vs entity CLA', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const claIndividualText = await applyPage.applyResultHtmlClaText.getValue();
            const claEntityText = await applyPage.applyResultHtmlClaEntityText.getValue();

            // They should be different
            await expect(claIndividualText).to.not.equal(claEntityText);
            // Both should contain Contributor License Agreement
            await expect(claIndividualText).to.include('Contributor License Agreement');
            await expect(claEntityText).to.include('Contributor License Agreement');
            // Entity version should have entity-specific text
            await expect(claEntityText).to.include('Entity');
        });

    });

    describe('Document Format Options', async function() {

        it('should generate both HTML and Markdown formats for FLA', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const htmlText = await applyPage.applyResultHtmlFlaText.getValue();
            const mkdnText = await applyPage.applyResultMkdnFlaText.getValue();

            await expect(htmlText).to.not.be.empty;
            await expect(mkdnText).to.not.be.empty;
            // HTML should contain HTML tags
            await expect(htmlText).to.include('<');
            // Markdown should not have as many HTML tags (or different format)
            await expect(mkdnText).to.not.equal(htmlText);
        });

        it('should generate both HTML and Markdown formats for CLA', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const htmlText = await applyPage.applyResultHtmlClaText.getValue();
            const mkdnText = await applyPage.applyResultMkdnClaText.getValue();

            await expect(htmlText).to.not.be.empty;
            await expect(mkdnText).to.not.be.empty;
            // HTML should contain HTML tags
            await expect(htmlText).to.include('<');
            // Markdown should be different from HTML
            await expect(mkdnText).to.not.equal(htmlText);
        });

    });

    describe('Complete Workflow Output Validation', async function() {

        it('should generate complete FLA with all custom fields and options', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();

            // Set all custom fields
            await GeneralPage.setBeneficiary('FSFE e.V.');
            await GeneralPage.setProjectName('GNU Test Project');
            await GeneralPage.setProjectEmail('legal@fsfe.org');
            await GeneralPage.setJurisdiction('Germany');

            await page.gotoCopyright();
            await browser.pause(300);
            await CopyrightPage.selectOutboundFsf();

            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();

            // Verify all fields appear in output
            await expect(flaText).to.include('FSFE e.V.');
            await expect(flaText).to.include('GNU Test Project');
            await expect(flaText).to.include('legal@fsfe.org');
            await expect(flaText).to.include('Germany');
            await expect(flaText).to.include('Fiduciary');
            await expect(flaText).to.include('Free Software Foundation');
        });

        it('should generate complete CLA with all custom fields and options', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();

            // Set all custom fields
            await GeneralPage.setBeneficiary('Test Organization');
            await GeneralPage.setProjectName('Open Source Test');
            await GeneralPage.setProjectEmail('admin@test.org');
            await GeneralPage.setJurisdiction('United States');

            await page.gotoCopyright();
            await browser.pause(300);
            await CopyrightPage.selectOutboundSameOnDate();

            await page.gotoPatents();
            await browser.pause(300);
            const patentType = await $('#patent-type');
            await patentType.selectByAttribute('value', 'Traditional');

            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();

            // Verify all fields appear in output
            await expect(claText).to.include('Test Organization');
            await expect(claText).to.include('Open Source Test');
            await expect(claText).to.include('admin@test.org');
            await expect(claText).to.include('United States');
            await expect(claText).to.include('Contributor License Agreement');
            await expect(claText).to.not.include('Fiduciary');
        });

    });

    describe('Agreement Exclusivity in Output', async function() {

        it('should reflect exclusive license in FLA output', async function() {
            await page.open();
            await GeneralPage.selectFsfeCompliance();
            await page.goThroughAll();
            await browser.pause(500);

            const flaText = await applyPage.applyResultHtmlFlaText.getValue();
            await expect(flaText).to.include('exclusive');
        });

        it('should reflect selected exclusivity option in CLA output', async function() {
            await page.open();
            await GeneralPage.selectNonFsfeCompliance();
            await page.gotoCopyright();
            await browser.pause(300);

            const exclusivitySelect = await $('#agreement-exclusivity');
            await exclusivitySelect.selectByAttribute('value', 'exclusive');

            await page.goThroughAll();
            await browser.pause(500);

            const claText = await applyPage.applyResultHtmlClaText.getValue();
            await expect(claText).to.include('exclusive');
        });

    });

});
