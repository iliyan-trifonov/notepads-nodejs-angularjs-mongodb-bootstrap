'use strict';

var config = require('../../../config/app.conf.json');

require('../waitReady');

describe('Notepads app', function() {

    describe('home', function () {

        beforeEach(function () {
            browser.get('http://notepadsjs.dev:3000/');
        });

        it('should have a title with specific text', function() {
            expect(browser.getTitle()).toEqual('Notepads by Iliyan Trifonov');
        });

        it('should have a jumbotron with specific items/text', function() {
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
        it('should go to the Dashboard after login is clicked', function () {
            browser.ignoreSynchronization = true;

            //element(by.css('div.jumbotron>p>a')).click();
            browser.get('http://notepadsjs.dev:3000/auth/facebook');

            var emailInput = element(by.id('email'));
            var passInput = element(by.id('pass'));
            expect(emailInput.waitReady()).toBeTruthy();
            expect(passInput.waitReady()).toBeTruthy();

            emailInput.sendKeys(config.testFBUser.username);
            passInput.sendKeys(config.testFBUser.password);
            element(by.name('login')).click();

            expect(element(by.css('dashboard')).waitReady()).toBeTruthy();

            browser.ignoreSynchronization = false;
        });

        it('should go to the home page after logout is clicked', function () {

        });
    });
});
