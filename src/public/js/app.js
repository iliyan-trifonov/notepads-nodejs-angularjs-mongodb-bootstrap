(function (angular) {
    'use strict';

    angular.module('Nodepads', [
        'Notepads.controllers',
        'Notepads.services',
        'Notepads.vars',
        'ngRoute'
    ])
    .config(['$routeProvider', 'USER_CONTEXT', function ($routeProvider, USER_CONTEXT) {
        if (USER_CONTEXT.id) {
            $routeProvider.when('/', {
                templateUrl: '/partials/dashboard.html',
                controller: 'DashboardCtrl'
            })
            .when('/notepads/add', {
                templateUrl: '/partials/notepad.html',
                controller: 'NotepadCtrl'
            })
            .when('/notepads/:id/edit', {
                templateUrl: '/partials/notepad.html',
                controller: 'NotepadCtrl'
            })
            .when('/categories', {
                templateUrl: '/partials/categories.html',
                controller: 'CategoriesCtrl'
            })
            .when('/categories/add', {
                templateUrl: '/partials/category.html',
                controller: 'CategoryCtrl'
            })
            .when('/categories/:id/edit', {
                templateUrl: '/partials/category.html',
                controller: 'CategoryCtrl'
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
