'use strict';

var config = require('../../../config/app.conf.json');

require('../waitReady');

describe('Notepads app', function() {

    describe('home', function () {

        beforeEach(function () {
            //browser.get('http://notepadsjs.dev:3000/');
        });

        it('should have a title with specific text', function() {
            browser.get('http://notepadsjs.dev:3000/');
            expect(browser.getTitle()).toEqual('Notepads by Iliyan Trifonov');
        });

        it('should have a jumbotron with specific items/text', function() {
            browser.get('http://notepadsjs.dev:3000/');
            expect(element(by.css('div.jumbotron>h1'))
                .getText())
                .toEqual('Welcome to Nodepads!');
            expect(element(by.css('div.jumbotron>p:first-of-type'))
                .getText())
                .toEqual('Login with Facebook to see the full functionality.');
            expect(element(by.css('div.jumbotron>p>a'))
                .getText())
                .toEqual('Login with Facebook');
        });

    });

    describe('login/logout', function () {
        it('should redirect to the Facebook\'s login page after login is clicked', function () {
            browser.ignoreSynchronization = true;

            //element(by.css('div.jumbotron>p>a')).click();
            browser.get('http://notepadsjs.dev:3000/auth/facebook');

            var emailInput = element(by.id('email'));
            var passInput = element(by.id('pass'));
            expect(emailInput.waitReady()).toBeTruthy();
            expect(passInput.waitReady()).toBeTruthy();
        });

        it('should fill email and password fields', function () {
            var emailInput = element(by.id('email'));
            var passInput = element(by.id('pass'));
            emailInput.sendKeys(config.testFBUser.email);
            passInput.sendKeys(config.testFBUser.password);
            element(by.name('login')).click();
        });

        it('setting back the browser.ignoreSynchronization to false', function () {
            browser.ignoreSynchronization = false;
        });

        it('should be on the Dashboard after logged in', function () {
            browser.get('http://notepadsjs.dev:3000/');

            expect(element(by.css('.dashboard')).waitReady()).toBeTruthy();

            element.all(by.css('.category')).then(function (cats) {
                expect(cats.length).toBe(1);
            });

            element.all(by.css('.notepad')).then(function (notepads) {
                expect(notepads.length).toBe(1);
            });

            expect(element(by.css('.category>h3>span:first-of-type')).getText()).toEqual('Sample category');
            expect(element(by.css('.notepad>.title')).getText()).toEqual('Read me');

        });

        it('should go to the home page after logout is clicked', function () {
            element(by.css('.logout')).click();
            expect(element(by.css('div.jumbotron>h1'))
                .getText())
                .toEqual('Welcome to Nodepads!');
        });
    });
});
