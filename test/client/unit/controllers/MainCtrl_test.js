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

        it('should clear the flash message if exists', inject(function ($controller, $timeout) {
            var $scope = {};
            var flash = {
                get: function () {
                    return {msg: 'a message'};
                },
                clear: function () {
                    //
                }
            };
            spyOn(flash, "get").and.callThrough();
            spyOn(flash, "clear");
            var MainCtrl = $controller('MainCtrl', { $scope: $scope, flash: flash });
            expect(flash.get).toHaveBeenCalled();
            $timeout.flush();
            expect(flash.clear).toHaveBeenCalled();
        }));

        it('should define a cancel() function on the scope', inject(function ($controller) {
            var $scope = {};
            var MainCtrl = $controller('MainCtrl', { $scope: $scope });
            expect($scope.cancel).toBeDefined();
            expect(typeof $scope.cancel === "function").toBe(true);
        }));

        it('cancel should call window.history.back', inject(function ($controller) {
            var $scope = {};
            var $window = {
                history: {
                    back: function () {
                        //
                    }
                }
            };
            spyOn($window.history, "back");
            var MainCtrl = $controller('MainCtrl', { $scope: $scope, $window: $window });
            $scope.cancel();
            expect($window.history.back).toHaveBeenCalled();
        }));
    });
});
