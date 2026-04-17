const Page = require('./pageobjects/page');
const { expect } = require('chai');
const page = new Page();


beforeEach(async function () {
    await page.open();
    await page.goThroughAll();
})

describe('Basic Page load testing', async function() {

    it('should show the right page title', async function() {
        await page.open();
        const title = await page.pageTitle;
        expect(title).to.include('Contributor License Agreement Chooser')
    });

    it('should get and log the url', async function() {
        const url = await page.pageUrl;
        expect(url).to.be.a('string').and.to.include('localhost')
    });

});

describe('Contributoragreements.org tests', async function() {
    before(async function() {
        try {
            await browser.url('https://contributoragreements.org/ca-cla-chooser/');
        } catch (e) {
            this.skip()
        }
    });

    it('should show contributoragreements title', async function () {
        const title2 = await browser.getTitle();
        expect(title2).to.equal('Contributor License Agreement Chooser');
    });

});

describe('the url and query should be correct', async function () {
    describe('without any changes (default versions)', async function () {
        it('should have the correct length', async function () {
            this.skip() // TODO: check recreate URL query string length
        });
        it('should have the correct number of parameters', async function () {
            this.skip() // TODO: check number of URL parameters
        });
        it('should have the correct parameters', async function () {
            this.skip() // TODO: check URL parameters by key and value
        });
    })
})
