'use strict';

/* jshint undef: false, unused: false */

describe('Notepads.controllers.MainCtrl', function () {
    beforeEach(module('Notepads.controllers'));
    beforeEach(module('Notepads.services'));

    describe('MainCtrl controller', function () {
        it('should set the $scope.flash object', inject(function ($controller) {
            var $scope = {};
            var MainCtrl = $controller('MainCtrl', { $scope: $scope });
            expect($scope.flash).toBeDefined();
        }));

        it('should define a cancel() function on the scope', inject(function ($controller) {
            var $scope = {};
            var MainCtrl = $controller('MainCtrl', { $scope: $scope });
            expect($scope.cancel).toBeDefined();
            expect(typeof $scope.cancel === "function").toBe(true);
        }));
    });
});
