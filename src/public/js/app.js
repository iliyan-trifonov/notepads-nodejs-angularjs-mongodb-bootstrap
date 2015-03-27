(function (angular) {
    'use strict';

    angular.module('Nodepads', [
        'Notepads.controllers',
        'ngRoute'
    ])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: '/partials/index.html',
            controller: 'IndexCtrl'
        });
        $routeProvider.when('/register', {
            templateUrl: '/partials/register.html',
            controller: 'RegCtrl'
        });
        $routeProvider.otherwise({ redirectTo: '/' });
    }]);
})(angular);
