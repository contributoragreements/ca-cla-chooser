const Page = require('./pageobjects/page');
const { expect } = require('chai');
const page = new Page();

describe('Wizard Component Tests', async function() {

    beforeEach(async function () {
        await page.open();
    });

    describe('Wizard Initialization', async function() {

        it('should initialize the wizard with all navigation bullets visible', async function() {
            await expect(page.generalBullet).toBeDisplayed();
            await expect(page.copyrightBullet).toBeDisplayed();
            await expect(page.patentsBullet).toBeDisplayed();
            await expect(page.reviewBullet).toBeDisplayed();
            await expect(page.applyBullet).toBeDisplayed();
        });

        it('should have next and previous buttons visible', async function() {
            await expect(page.nextBtn).toBeDisplayed();
            await expect(page.previousBtn).toBeDisplayed();
        });

        it('should start on the general page by default', async function() {
            const generalBullet = await page.generalBullet;
            const parentLi = await generalBullet.parentElement();
            const classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');
        });

    });

    describe('Wizard Navigation - Sequential Flow', async function() {

        it('should navigate from general to copyright page using next button', async function() {
            await page.next();
            const copyrightBullet = await page.copyrightBullet;
            const parentLi = await copyrightBullet.parentElement();
            const classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');
        });

        it('should navigate through all pages sequentially using next button', async function() {
            // Start at general
            await page.next(); // Move to copyright
            await browser.pause(300);

            let copyrightBullet = await page.copyrightBullet;
            let parentLi = await copyrightBullet.parentElement();
            let classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');

            await page.next(); // Move to patents
            await browser.pause(300);

            let patentsBullet = await page.patentsBullet;
            parentLi = await patentsBullet.parentElement();
            classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');

            await page.next(); // Move to review
            await browser.pause(300);

            let reviewBullet = await page.reviewBullet;
            parentLi = await reviewBullet.parentElement();
            classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');

            await page.next(); // Move to apply
            await browser.pause(300);

            let applyBullet = await page.applyBullet;
            parentLi = await applyBullet.parentElement();
            classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');
        });

        it('should navigate backwards using previous button', async function() {
            await page.goThroughAll(); // Navigate to apply page
            await browser.pause(300);

            await page.previous(); // Go back to review
            await browser.pause(300);

            const reviewBullet = await page.reviewBullet;
            const parentLi = await reviewBullet.parentElement();
            const classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');
        });

        it('should navigate back from apply to general using previous button', async function() {
            await page.goThroughAll(); // Navigate to apply page

            await page.previous(); // review
            await browser.pause(200);
            await page.previous(); // patents
            await browser.pause(200);
            await page.previous(); // copyright
            await browser.pause(200);
            await page.previous(); // general
            await browser.pause(300);

            const generalBullet = await page.generalBullet;
            const parentLi = await generalBullet.parentElement();
            const classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');
        });

    });

    describe('Wizard Navigation - Direct Bullet Clicks', async function() {

        it('should navigate directly to copyright page when clicking its bullet', async function() {
            await page.gotoCopyright();
            await browser.pause(300);

            const copyrightBullet = await page.copyrightBullet;
            const parentLi = await copyrightBullet.parentElement();
            const classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');
        });

        it('should navigate directly to patents page when clicking its bullet', async function() {
            await page.gotoPatents();
            await browser.pause(300);

            const patentsBullet = await page.patentsBullet;
            const parentLi = await patentsBullet.parentElement();
            const classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');
        });

        it('should navigate directly to review page when clicking its bullet', async function() {
            await page.gotoReview();
            await browser.pause(300);

            const reviewBullet = await page.reviewBullet;
            const parentLi = await reviewBullet.parentElement();
            const classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');
        });

        it('should navigate directly to apply page when clicking its bullet', async function() {
            await page.gotoApply();
            await browser.pause(300);

            const applyBullet = await page.applyBullet;
            const parentLi = await applyBullet.parentElement();
            const classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');
        });

        it('should allow navigation back to general page after visiting other pages', async function() {
            await page.gotoApply();
            await browser.pause(300);
            await page.gotoGeneral();
            await browser.pause(300);

            const generalBullet = await page.generalBullet;
            const parentLi = await generalBullet.parentElement();
            const classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');
        });

    });

    describe('Wizard Navigation - Mixed Navigation', async function() {

        it('should handle mixed navigation (bullets and buttons)', async function() {
            await page.next(); // copyright
            await browser.pause(200);
            await page.gotoPatents(); // jump to patents
            await browser.pause(200);
            await page.previous(); // back to copyright
            await browser.pause(200);
            await page.gotoReview(); // jump to review
            await browser.pause(300);

            const reviewBullet = await page.reviewBullet;
            const parentLi = await reviewBullet.parentElement();
            const classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');
        });

        it('should navigate non-sequentially using bullets', async function() {
            await page.gotoApply();
            await browser.pause(200);
            await page.gotoGeneral();
            await browser.pause(200);
            await page.gotoReview();
            await browser.pause(200);
            await page.gotoCopyright();
            await browser.pause(300);

            const copyrightBullet = await page.copyrightBullet;
            const parentLi = await copyrightBullet.parentElement();
            const classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');
        });

    });

    describe('Wizard State Management', async function() {

        it('should maintain only one active tab at a time', async function() {
            await page.gotoCopyright();
            await browser.pause(300);

            const generalBullet = await page.generalBullet;
            const generalParentLi = await generalBullet.parentElement();
            const generalClasses = await generalParentLi.getAttribute('class');

            const copyrightBullet = await page.copyrightBullet;
            const copyrightParentLi = await copyrightBullet.parentElement();
            const copyrightClasses = await copyrightParentLi.getAttribute('class');

            await expect(generalClasses).to.not.include('active');
            await expect(copyrightClasses).to.include('active');
        });

        it('should properly activate tab when navigating forward', async function() {
            await page.gotoGeneral();
            await browser.pause(200);

            for (let i = 0; i < 3; i++) {
                await page.next();
                await browser.pause(200);
            }

            const reviewBullet = await page.reviewBullet;
            const parentLi = await reviewBullet.parentElement();
            const classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');
        });

        it('should deactivate previous tab when moving to next tab', async function() {
            await page.gotoGeneral();
            await browser.pause(300);

            const generalBullet = await page.generalBullet;
            let generalParentLi = await generalBullet.parentElement();
            let generalClasses = await generalParentLi.getAttribute('class');
            await expect(generalClasses).to.include('active');

            await page.next();
            await browser.pause(300);

            generalParentLi = await generalBullet.parentElement();
            generalClasses = await generalParentLi.getAttribute('class');
            await expect(generalClasses).to.not.include('active');
        });

    });

    describe('Wizard Tab Visibility', async function() {

        it('should show general tab content when on general page', async function() {
            await page.gotoGeneral();
            await browser.pause(300);

            const generalTab = await $('#general');
            const isDisplayed = await generalTab.isDisplayed();
            await expect(isDisplayed).to.be.true;
        });

        it('should show copyright tab content when on copyright page', async function() {
            await page.gotoCopyright();
            await browser.pause(300);

            const copyrightTab = await $('#copyright');
            const isDisplayed = await copyrightTab.isDisplayed();
            await expect(isDisplayed).to.be.true;
        });

        it('should show patents tab content when on patents page', async function() {
            await page.gotoPatents();
            await browser.pause(300);

            const patentsTab = await $('#patents');
            const isDisplayed = await patentsTab.isDisplayed();
            await expect(isDisplayed).to.be.true;
        });

        it('should show review tab content when on review page', async function() {
            await page.gotoReview();
            await browser.pause(300);

            const reviewTab = await $('#review');
            const isDisplayed = await reviewTab.isDisplayed();
            await expect(isDisplayed).to.be.true;
        });

        it('should show apply tab content when on apply page', async function() {
            await page.gotoApply();
            await browser.pause(300);

            const applyTab = await $('#apply');
            const isDisplayed = await applyTab.isDisplayed();
            await expect(isDisplayed).to.be.true;
        });

        it('should hide previous tab content when navigating to next tab', async function() {
            await page.gotoGeneral();
            await browser.pause(300);

            const generalTab = await $('#general');
            let generalDisplayed = await generalTab.isDisplayed();
            await expect(generalDisplayed).to.be.true;

            await page.next();
            await browser.pause(300);

            generalDisplayed = await generalTab.isDisplayed();
            await expect(generalDisplayed).to.be.false;
        });

    });

    describe('Wizard Navigation Bounds', async function() {

        it('should not break when clicking next on the last page', async function() {
            await page.goThroughAll(); // Navigate to apply (last page)
            await browser.pause(300);

            // Try clicking next on last page (should not break)
            await page.next();
            await browser.pause(300);

            // Should still be on apply page
            const applyBullet = await page.applyBullet;
            const parentLi = await applyBullet.parentElement();
            const classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');
        });

        it('should not break when clicking previous on the first page', async function() {
            await page.gotoGeneral();
            await browser.pause(300);

            // Try clicking previous on first page (should not break)
            await page.previous();
            await browser.pause(300);

            // Should still be on general page
            const generalBullet = await page.generalBullet;
            const parentLi = await generalBullet.parentElement();
            const classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');
        });

    });

    describe('Wizard Bullet Link Structure', async function() {

        it('should have correct href for general bullet', async function() {
            const generalBullet = await page.generalBullet;
            const href = await generalBullet.getAttribute('href');
            await expect(href).to.include('#general');
        });

        it('should have correct href for copyright bullet', async function() {
            const copyrightBullet = await page.copyrightBullet;
            const href = await copyrightBullet.getAttribute('href');
            await expect(href).to.include('#copyright');
        });

        it('should have correct href for patents bullet', async function() {
            const patentsBullet = await page.patentsBullet;
            const href = await patentsBullet.getAttribute('href');
            await expect(href).to.include('#patents');
        });

        it('should have correct href for review bullet', async function() {
            const reviewBullet = await page.reviewBullet;
            const href = await reviewBullet.getAttribute('href');
            await expect(href).to.include('#review');
        });

        it('should have correct href for apply bullet', async function() {
            const applyBullet = await page.applyBullet;
            const href = await applyBullet.getAttribute('href');
            await expect(href).to.include('#apply');
        });

    });

    describe('Wizard Complete Flow', async function() {

        it('should successfully complete entire wizard flow forward and backward', async function() {
            // Go forward through all pages
            await page.gotoGeneral();
            await browser.pause(200);
            await page.gotoCopyright();
            await browser.pause(200);
            await page.gotoPatents();
            await browser.pause(200);
            await page.gotoReview();
            await browser.pause(200);
            await page.gotoApply();
            await browser.pause(300);

            let applyBullet = await page.applyBullet;
            let parentLi = await applyBullet.parentElement();
            let classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');

            // Go backward through all pages
            await page.gotoReview();
            await browser.pause(200);
            await page.gotoPatents();
            await browser.pause(200);
            await page.gotoCopyright();
            await browser.pause(200);
            await page.gotoGeneral();
            await browser.pause(300);

            const generalBullet = await page.generalBullet;
            parentLi = await generalBullet.parentElement();
            classNames = await parentLi.getAttribute('class');
            await expect(classNames).to.include('active');
        });

    });

});
