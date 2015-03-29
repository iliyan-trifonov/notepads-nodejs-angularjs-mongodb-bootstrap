(function (angular) {
    'use strict';

    angular.module('Notepads.services', [])

        .service('Api', [
            '$http',
            function ($http) {
                var apiBase = '/api/v1';
                return {
                    notepads: {
                        list: function() {
                            return $http({
                                url: apiBase + '/notepads?insidecats=1',
                                method: 'GET',
                                cache: false
                            });
                        },
                        getById: function (id) {
                            return $http({
                                url: apiBase + '/notepads/' + id,
                                method: 'GET',
                                cache: false
                            });
                        },
                        add: function(notepad) {
                            return $http({
                                url: apiBase + '/notepads',
                                data: notepad,
                                method: 'POST',
                                cache: false
                            });
                        },
                        update: function(notepad) {
                            return $http({
                                url: apiBase + '/notepads/' + notepad._id,
                                data: notepad,
                                method: 'PUT',
                                cache: false
                            });
                        }
                    },
                    categories: {
                        list: function() {
                            return $http({
                                url: apiBase + '/categories',
                                method: 'GET',
                                cache: false
                            });
                        },
                        getById: function (id) {
                            return $http({
                                url: apiBase + '/categories/' + id,
                                method: 'GET',
                                cache: false
                            });
                        },
                        add: function(category) {
                            return $http({
                                url: apiBase + '/categories',
                                data: category,
                                method: 'POST',
                                cache: false
                            });
                        },
                        update: function(category) {
                            return $http({
                                url: apiBase + '/categories/' + category._id,
                                data: category,
                                method: 'PUT',
                                cache: false
                            });
                        }
                    }
                };
            }
        ])
        .factory('flash', [
            function () {
                var msg = {};

                return {
                    set: function (message) {
                        msg = message;
                        console.log('set new message', msg);
                    },
                    get: function () {
                        var currentMessage = msg;
                        msg = {};
                        console.log('getting new message', currentMessage);
                        return currentMessage;
                    }
                };
            }
        ]);

})(angular);
