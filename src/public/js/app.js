(function (angular) {
    'use strict';

    angular.module('Nodepads', [
        'Notepads.controllers',
        'Notepads.services',
        'Notepads.directives',
        'Notepads.vars',
        'ngRoute',
        'ngSanitize',
        'ui.bootstrap',
        'ngAnimate'
    ])
    .config([
        '$routeProvider', '$locationProvider', 'USER_CONTEXT', '$httpProvider',
        function ($routeProvider, $locationProvider, USER_CONTEXT, $httpProvider) {
            if (USER_CONTEXT && USER_CONTEXT.id) {
                $routeProvider.when('/', {
                    templateUrl: '/partials/dashboard.html',
                    controller: 'DashboardCtrl'
                })
                .when('/notepads/add', {
                    templateUrl: '/partials/notepad.html',
                    controller: 'NotepadCtrl'
                })
                .when('/notepads/add/catid/:cid', {
                    templateUrl: '/partials/notepad.html',
                    controller: 'NotepadCtrl'
                })
                .when('/notepads/:id/edit', {
                    templateUrl: '/partials/notepad.html',
                    controller: 'NotepadCtrl'
                })
                .when('/notepads/:id/delete', {
                    templateUrl: '/partials/notepad-delete.html',
                    controller: 'NotepadDelCtrl'
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
                })
                .when('/categories/:id/delete', {
                    templateUrl: '/partials/category-delete.html',
                    controller: 'CategoryDelCtrl'
                });
            } else {
                $routeProvider.when('/', {
                    templateUrl: '/partials/index.html',
                    controller: 'IndexCtrl'
                });
            }

            $routeProvider.otherwise({ redirectTo: '/' });

            $locationProvider.html5Mode(true);

            $httpProvider.interceptors.push(function() {
                return {
                    'request': function(config) {
                        config.headers['x-access-token'] = USER_CONTEXT.accessToken;
                        return config;
                    }
                };
            });
    }]);
})(angular);
