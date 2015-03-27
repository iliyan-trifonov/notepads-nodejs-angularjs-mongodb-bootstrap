(function (angular) {
    'use strict';

    angular.module('Notepads.controllers', [])
    .controller('IndexCtrl', [
        '$scope',
        function ($scope) {
            $scope.test = "Test";
        }
    ])
    .controller('RegCtrl', [
        '$scope',
        function ($scope) {
            $scope.test = "Register";
        }
    ]);
})(angular);
