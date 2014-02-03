var expect = require('chai').expect;
var path = require('path');
var fs = require('fs');

describe('Storage Module', function(){
	'use strict';
	var storage;
	var dbPath = path.join(__dirname, '../test-db.json');

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

	it('Should act as a singleton', function(){
		var firstStorage = require('../helpers/storage.js')(dbPath);
		var secondStorage = require('../helpers/storage.js')();

		expect(secondStorage).to.be.equal(firstStorage);

		storage = secondStorage;
	});

	it('Should initialize an empty array', function(){
		var storage = require('../helpers/storage.js')(dbPath);

		expect(storage.get('apps')).to.be.an('array');
	});

	it('Should be able to push values to an array', function(){
		var storage = require('../helpers/storage.js')(dbPath);
		storage.set('apps', []);
		storage.push('apps', 2);
		expect(storage.get('apps')).to.be.an('array').and.to.have.length(1).and.to.have.deep.property('0', 2);
	});

	it('Should be able to transmute values into arrays when pushed to', function(){
		var storage = require('../helpers/storage.js')(dbPath);
		storage.set('apps', 3);
		storage.push('apps', 2);
		expect(storage.get('apps')).to.be.an('array').and.to.have.length(2).and.to.include.members([3,2]);
	});

	after(function(){
		if(fs.exists(dbPath)){
			fs.unlinkSync(dbPath);
		}
	});
});
