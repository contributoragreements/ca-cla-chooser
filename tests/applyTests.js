//applyTests.js

const ApplyPage = require('./pageobjects/apply.page')
const { expect } = require('chai');
const applyPage = new ApplyPage()

describe('texts should exist', async function() {

    beforeEach(async function() {
        await applyPage.open();
        await applyPage.goThroughAll();
    });

    it('the fla html textarea should contain text', async function() {
        const text = await applyPage.applyResultHtmlFlaText.getValue();
        expect(text).to.be.a('string').and.not.equal('')
    })

    it('the fla html textarea should have a non-zero length', async function() {
        const text = await applyPage.applyResultHtmlFlaText.getValue();
        expect(text.length).to.be.greaterThan(0)
    })
});
