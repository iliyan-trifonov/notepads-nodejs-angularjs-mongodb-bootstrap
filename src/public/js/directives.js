(function (angular) {
    'use strict';

    angular.module('Notepads.directives', [])

    .directive('categoryItem', [
        function () {
            return {
                restrict: 'A',
                replace: true,
                scope: {
                    category: '='
                },
                templateUrl: '/partials/directives/category-item.html'
            };
        }
    ])

    /*.directive('loading-progress', [
        function () {
            return {
                restrict: 'E',
                scope: {

                },
                template: '<progressbar class="progress-striped active" max="100" value="70"><i>70 / 100</i></progressbar>'
            };
        }
    ])*/

    ;

})(angular);
