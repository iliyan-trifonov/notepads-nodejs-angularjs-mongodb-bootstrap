'use strict';

//this can be put directly in config/protractor.conf.js:
require('babel/register');

require('../waitReady');

//TODO: use testing.json if the main config is not found:
var config = require('../../../config/app.conf.json'),
    User = require('../../../src/models/user'),
    connection = require('../../db_common');

describe('Notepads app', function() {

    describe('home', function () {

        beforeEach(function () {
            browser.get(config.devUrl);
        });

        it('should have a title with specific text', function() {
            expect(browser.getTitle())
                .toEqual('Notepads by Iliyan Trifonov');
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
        it('should remove the testing user from DB if exists', function (done) {
            var db = connection();
            return User.removeAsync({
                facebookId: config.testFBUser.fbId
            }).then(function () {
                db.close();
            }).then(done);
        });

        it('should redirect to the Facebook\'s login page after login is clicked', function () {
            browser.ignoreSynchronization = true;

            //element(by.css('div.jumbotron>p>a')).click();
            browser.get(config.devUrl + 'auth/facebook');

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
            expect(element(by.css('.dashboard')).waitReady()).toBeTruthy();
            browser.ignoreSynchronization = false;
        });

        it('should be on the Dashboard after logged in', function () {
            browser.get(config.devUrl);

            expect(element(by.css('.dashboard')).waitReady()).toBeTruthy();
        });

        it('should have only the sample category and the read me notepad on the dashboard', function () {
            element.all(by.css('.category')).then(function (cats) {
                expect(cats.length).toBe(1);
            });

            element.all(by.css('.notepad')).then(function (notepads) {
                expect(notepads.length).toBe(1);
            });

            expect(element(by.css('.category>h3>span:first-of-type'))
                .getText())
                .toEqual('Sample category');
            expect(element(by.css('.category>h3>small'))
                .getText())
                .toEqual('(1)');
            expect(element(by.css('.category>h3>a'))
                .getText())
                .toEqual('Add Notepad Here');
            expect(element(by.css('.notepad>.title'))
                .getText())
                .toEqual('Read me');
        });

        it('should go to the Add Notepad page with the category preselected', function () {
            element(by.css('.category>h3>a')).click();

            expect(browser.getCurrentUrl())
                .toContain('#/notepads/add/catid');

            expect(element(by.id('category'))
                .$('option:checked')
                .getText())
                .toEqual('Sample category');
        });

        it('should go to the Add Notepad page with no category preselected', function () {
            browser.get(config.devUrl);

            var addNotepadBtn = element.all(by.css('#navbar>ul>li')).get(2);

            expect(addNotepadBtn.getText())
                .toEqual('Add Notepad');

            addNotepadBtn.click();

            expect(browser.getCurrentUrl())
                .toEqual(config.devUrl + '#/notepads/add');

            expect(element(by.id('category'))
                .$('option:checked')
                .getText())
                .toEqual('Select category');
        });

        //let this test to be the last:
        it('should go to the home page after logout is clicked', function () {
            element(by.css('.logout')).click();
            expect(element(by.css('div.jumbotron>h1'))
                .getText())
                .toEqual('Welcome to Nodepads!');
        });
    });
});
