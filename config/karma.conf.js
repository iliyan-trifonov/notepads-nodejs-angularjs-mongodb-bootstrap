module.exports = function(config){
    config.set({

        basePath : '../',

        files : [
            'src/public/vendor/angular/angular.js',
            'src/public/vendor/angular-route/angular-route.js',
            'src/public/vendor/angular-mocks/angular-mocks.js',
            'src/public/js/**/*.js',
            'src/public/partials/**/*.html',
            'test/client/unit/**/*.js'
        ],

        autoWatch : true,

        frameworks: ['jasmine'],

        browsers : ['Chrome'],

        plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-junit-reporter'
        ],

        junitReporter : {
            outputFile: 'test_out/unit.xml',
            suite: 'unit'
        }

    });
};
