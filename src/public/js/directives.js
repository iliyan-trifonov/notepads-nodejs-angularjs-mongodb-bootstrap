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

    .directive('loadingProgress', [
        '$interval', '$timeout',
        function ($interval, $timeout) {
            var isStarted = false;
            var runningInterval;
            var cancelInterval = function () {
                if (angular.isDefined(runningInterval)) {
                    $interval.cancel(runningInterval);
                    runningInterval = undefined;
                }
            };
            return {
                restrict: 'E',
                replace: true,
                templateUrl: '/partials/directives/loading-progress.html',
                link: function (scope, element) {
                    scope.progress = 0;
                    scope.$on('loading::show', function () {
                        isStarted = true;
                        cancelInterval();
                        scope.progress = 0;
                        //wait for a short time before showing the loading to avoid flicker on fast loads
                        $timeout(function () {
                            if (isStarted) {
                                element.removeClass('hidden');
                                runningInterval = $interval(function () {
                                    if (scope.progress >= 100) {
                                        scope.progress = 0;
                                    }
                                    scope.progress+=2;
                                }, 100);
                            }
                        }, 150);
                    });
                    scope.$on('loading::hide', function () {
                        isStarted = false;
                        cancelInterval();
                        scope.progress = 100;
                        element.addClass('hidden');
                    });
                }
            };
        }
    ])

    ;

})(angular);
