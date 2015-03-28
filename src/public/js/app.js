(function (angular) {
    'use strict';

    angular.module('Nodepads', [
        'Notepads.controllers',
        'Notepads.vars',
        'ngRoute'
    ])
    .config(['$routeProvider', 'USER_CONTEXT', function ($routeProvider, USER_CONTEXT) {
        if (USER_CONTEXT.id) {
            $routeProvider.when('/', {
                templateUrl: '/partials/dashboard.html',
                controller: 'DashboardCtrl'
            });
        } else {
            $routeProvider.when('/', {
                templateUrl: '/partials/index.html',
                controller: 'IndexCtrl'
            });
        }
        $routeProvider.otherwise({ redirectTo: '/' });
    }]);
})(angular);
