/*jshint indent:2 */

'use strict';

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: require('./package.json'),
    jshint: {
      options:{
        jshintrc: true
      },
      cmds: ['cmds/*.js'],
      test: ['test/*-spec.js'],
      helpers: ['helpers/*.js'],
      grunftile: ['Gruntfile.js']
    },
    mochaTest: {
      options:{
        reporter: 'spec'
      },
      src: ['test/*-spec.js']
    },
    watch: {
      all: {
        files: ['cmds/*.js', 'test/*-spec.js', 'helpers/*.js'],
        tasks: ['jshint', 'mochaTest']
      }
    }
  });

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', ['jshint', 'mochaTest', 'watch']);

};
