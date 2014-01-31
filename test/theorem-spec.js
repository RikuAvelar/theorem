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
            fs.unlinkSync(dbPath);
        }
    });

    after(function(){
        if(fs.existsSync(dbPath)){
            fs.unlinkSync(dbPath);
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
