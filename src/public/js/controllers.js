(function (angular) {
    'use strict';

    angular.module('Notepads.controllers', [])

    .controller('MainCtrl', [
        '$scope', 'flash', '$timeout', '$window',
        function ($scope, flash, $timeout, $window) {

            $scope.flash = flash;

            //TODO: doesn't work, fix it with directive or extra var for show/hide
            if ($scope.flash.get().msg) {
                $timeout(function () {
                    $scope.flash.clear();
                }, 1E3);
            }

            $scope.cancel = function () {
                $window.history.back();
            };
        }
    ])

    .controller('IndexCtrl', [
        function () {
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

            $scope.deleteNotepad = function (id) {
                $location.path('/notepads/' + id + '/delete');
            };

            list();
        }
    ])

    .controller('NotepadCtrl', [
        '$scope', '$location', 'Api', '$routeParams', 'flash',
        function ($scope, $location, Api, $routeParams, flash) {

            var notepadId = $routeParams.id,
                // /notepads/add/catid/:cid
                catId = $routeParams.cid;

            if (!notepadId) {
                $scope.notepad = {category: '', title: '', text: ''};
                $scope.pageTitle = 'Add Notepad';
                $scope.buttonText = 'Add';
                $scope.catId = catId;
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
                        if (!$scope.notepad.category && catId) {
                            $scope.notepad.category = catId;
                        }
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
                return ($scope.notepad.category !== '' || catId) &&
                    $scope.notepad.title !== '' &&
                    $scope.notepad.text !== '';
            }
        }
    ])

    .controller('NotepadDelCtrl', [
        '$scope', '$routeParams', 'Api', 'flash', '$location',
        function ($scope, $routeParams, Api, flash, $location) {

            var notepadId = $routeParams.id;

            //TODO: check if id is given/valid

            Api.notepads.getById(notepadId)
                .success(function (notepad) {
                    $scope.title = notepad.title;
                });

            $scope.remove = function () {
                Api.notepads.remove(notepadId)
                    .success(function () {
                        flash.set({
                            msg: 'Notepad Deleted Successfully!',
                            type: 'success'
                        });
                        $location.path('/');
                    });
            };

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

    .controller('CategoryDelCtrl', [
        '$scope', '$routeParams', 'Api', 'flash', '$location',
        function ($scope, $routeParams, Api, flash, $location) {

            var catId = $routeParams.id;

            //TODO: check if id is given/valid

            Api.categories.getById(catId)
                .success(function (cat) {
                    $scope.name = cat.name;
                });

            $scope.remove = function () {
                Api.categories.remove(catId)
                    .success(function () {
                        flash.set({
                            msg: 'Category Deleted Successfully!',
                            type: 'success'
                        });
                        $location.path('/');
                    });
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
                                flash.set({
                                    msg: '',
                                    type: 'success'
                                });
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
