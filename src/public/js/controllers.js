(function (angular) {
    'use strict';

    angular.module('Notepads.controllers', [])

    .controller('MainCtrl', [
        '$scope', 'flash',
        function ($scope, flash) {
            $scope.flash = flash;
        }
    ])

    .controller('IndexCtrl', [
        '$scope',
        function ($scope) {
            //...
        }
    ])

    .controller('DashboardCtrl', [
        '$scope', 'Api', '$location',
        function ($scope, Api, $location) {
            function list() {
                Api.notepads.list()
                    .success(function (categories) {
                        $scope.categories = categories;
                    });
            }

            $scope.editNotepad = function (id) {
                $location.path('/notepads/' + id + '/edit');
            };

            list();
        }
    ])
    .controller('NotepadCtrl', [
        '$scope', '$location', 'Api', '$routeParams', 'flash',
        function ($scope, $location, Api, $routeParams, flash) {

            var notepadId = $routeParams.id;

            if (!notepadId) {
                $scope.notepad = {category: '', title: '', text: ''};
                $scope.pageTitle = 'Add Notepad';
                $scope.buttonText = 'Add';
            } else {
                Api.notepads.getById(notepadId)
                    .success(function (notepad) {
                        $scope.notepad = notepad;
                    });
                $scope.pageTitle = 'Edit Notepad';
                $scope.buttonText = 'Update';
            }

            Api.categories.list()
                .success(function (categories) {
                    $scope.categories = categories;
                });

            $scope.addEditNotepad = function () {
                if (!checkNotepadValues()) {
                    $scope.alert = 'Please provide category, title and text!';
                    $scope.alertType = 'danger';
                } else {
                    $scope.alert = '';
                    if (!notepadId) {
                        Api.notepads.add($scope.notepad)
                            .success(function () {
                                flash.set({
                                    msg: 'Notepad Added Successfully!',
                                    type: 'success'
                                });
                                $location.path('/');
                            });
                    } else {
                        Api.notepads.update($scope.notepad)
                            .success(function () {
                                flash.set({
                                    msg: 'Notepad Updated Successfully!',
                                    type: 'success'
                                });
                                $location.path('/');
                            });
                    }
                }
            };
            function checkNotepadValues() {
                return $scope.notepad.category !== '' &&
                    $scope.notepad.title !== '' &&
                    $scope.notepad.text !== '';
            }
        }
    ])
    .controller('CategoriesCtrl', [
        '$scope', 'Api', '$location',
        function ($scope, Api, $location) {
            Api.categories.list()
                .success(function (categories) {
                    $scope.categories = categories;
                });

            $scope.addCategory = function () {
                $location.path('/categories/add');
            };
        }
    ])
    .controller('CategoryCtrl', [
        '$scope', 'Api', '$location', '$routeParams',
        function ($scope, Api, $location, $routeParams) {

            var catId = $routeParams.id;

            if (!catId) {
                $scope.category = {name: ''};
                $scope.pageTitle = 'Add Category';
                $scope.buttonText = 'Add';
            } else {
                Api.categories.getById(catId)
                    .success(function (category) {
                        $scope.category = category;
                    });
                $scope.pageTitle = 'Edit Category';
                $scope.buttonText = 'Update';
            }

            function checkCatValues() {
                return $scope.category.name !== '';
            }

            $scope.addEditCategory = function () {
                if (!checkCatValues()) {
                    $scope.alert = 'Please provide a name!';
                } else {
                    $scope.alert = '';
                    if (catId) {
                        Api.categories.update($scope.category)
                            .success(function () {
                                $location.path('/categories');
                                $scope.$broadcast('categoryupdated');
                            });
                    } else {
                        Api.categories.add($scope.category)
                            .success(function () {
                                $location.path('/categories');
                                $scope.$broadcast('categoryupdated');
                            });
                    }
                }
            };

        }
    ]);
})(angular);
