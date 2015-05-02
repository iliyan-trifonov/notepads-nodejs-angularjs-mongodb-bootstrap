'use strict';

module.exports = function (grunt) {

    grunt.initConfig({
        mocha_istanbul: {
            src: 'test/server/',
            options: {
                reporter: 'spec',
                bail: true,
                timeout: 12000,
                recursive: true
            }
        },
        specCheck: {
            options: {
                severity: 'warn',
                testDir: 'test/server/',
                baseDir: 'src/',
                convention: '_test.js'
            },
            files: {
                src: ['src/**/*.js', '!src/public/**/*.js', '!src/db.js']
            }
        }
    });

    grunt.loadNpmTasks('grunt-mocha-istanbul');
    grunt.loadNpmTasks('grunt-spec-check');

    grunt.registerTask('default', ['mocha_istanbul', 'specCheck']);

};
