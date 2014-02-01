'use strict';

var expect = require('chai').expect;
var exec = require('child_process').exec;
var path = require('path');
var db = require('../helpers/storage.js')('./test-db.json');

describe('theorem list', function(){
	var dbPath = path.join(__dirname, '../test-db.json');
	var cmd = ['node', path.join(__dirname, '../bin/theorem'), '--dbpath', dbPath, 'list'];

	beforeEach(function(){
		db.set('apps', []);
		db.push('apps', {
			name: 'AppName',
			directory: '/home/dev',
			script: 'app.js',
			command: 'node',
			log: '/var/log'
		});
	});

	it('should print a list of registered apps', function(done){
		exec(cmd.join(' '), function (error, stdout, stderr) {
			expect(error).to.not.exist;
			expect(stdout).to.have.string('name:')
				.and.have.string('AppName')
				.and.have.string('directory:')
				.and.have.string('/home/dev')
				.and.have.string('script:')
				.and.have.string('app.js')
				.and.have.string('command:')
				.and.have.string('node')
				.and.have.string('log:')
				.and.have.string('/var/log');
			done();
		});
	});

});
