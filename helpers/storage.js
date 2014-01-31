'use strict';
var dbInstance;

function db(jsonFile){
	var _ = require('lodash');
	var path = require('path');
	var jsonStore = require('json-store');
	var dbPath = path.resolve(path.join(__dirname, '..'), jsonFile || '.theorem.db.json');

	var storage = jsonStore(dbPath);

	if(!storage.get('apps')) {
		storage.set('apps', []);
	}

	storage.dbPath = dbPath;

	storage.push = function(pushTo, val){
		var array = storage.get(pushTo);
		if(!_.isArray(array)){
			console.log('Value was not array, transmuting it.');
			array = [array];
		}
		array.push(val);
		storage.set(pushTo, array);
		return storage;
	};

	return storage;
}

module.exports = function(jsonFile){
	if(!dbInstance) {
		dbInstance = db(jsonFile);
	}
	return dbInstance;
};