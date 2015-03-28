(function (angular) {
    'use strict';

    angular.module('Notepads.controllers', [])
    .controller('IndexCtrl', [
        '$scope',
        function ($scope) {
            $scope.test = "Test";
        }
    ])
    .controller('DashboardCtrl', [
        '$scope',
        function ($scope) {
            $scope.message = 'Notepads Dashboard';
        }
    ]);
})(angular);
