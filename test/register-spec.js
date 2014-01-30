'use strict';

var assert = require('assert');
var exec = require('child_process').exec;
var path = require('path');

describe('theorem register', function(){
	var cmd = 'node '+path.join(__dirname, '../bin/theorem')+' register ';
	console.log(cmd);

	/*if('should enter prompt mode if not enough info is sent', function(done){

		var prompt = exec(cmd, function (error, stdout, stderr) {
			assert(!error);
			//if(stdout)
			done();
		});
	});*/

	it('should return error on missing params', function(done) {
        this.timeout(4000);

		exec(cmd, function (error, stdout, stderr) {
			assert(error);
			assert.equal(error.code,1);
			done();
		});

	});

});
