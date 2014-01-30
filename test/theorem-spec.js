'use strict';

var assert = require('assert');
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');

describe('theorem bin', function(){
	var cmd = 'node '+path.join(__dirname, '../bin/theorem')+' ';
    var dbPath = '../test-db.json';
	console.log(cmd);

    before(function(){
        if(fs.existsSync(dbPath)){
            fs.unlink(dbPath);
        }
    });

	it('--help should run without errors', function(done) {
		exec(cmd+'--help', function (error, stdout, stderr) {
			assert(!error);
			done();
		});
	});

    it('--version should run without errors', function(done) {
        exec(cmd+'--version', function (error, stdout, stderr) {
            assert(!error);
            done();
        });
    });

	it('--db-path should create a new db at specified path (thus using it)', function(done) {
		exec(cmd+'--db-path', function (error, stdout, stderr) {
			assert(!error);
            assertTrue(fs.existsSync(dbPath));
			done();
		});
	});

	it('should return error on missing command', function(done) {
        this.timeout(4000);

		exec(cmd, function (error, stdout, stderr) {
			assert(error);
			assert.equal(error.code,1);
			done();
		});

	});

	it('should return error on unknown command', function(done) {
        this.timeout(4000);

		exec(cmd+'junkcmd', function (error, stdout, stderr) {
			assert(error);
			assert.equal(error.code,1);
			done();
		});
	});

});
