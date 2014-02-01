/* unregister commander component
 * To use add require('../cmds/unregister.js')(program) to your commander.js based node executable before program.parse
 */
'use strict';
var _ = require('lodash');
var injector = require('../helpers/injector.js');

module.exports = function(program) {

	program
		.command('unregister [appName]')
		.version('0.0.0')
		.description('Remove and app from the registered app list')
		.action(function(appName){
			var db = program.getDB();
            var apps = db.get('apps');
            var app = _.remove(apps, {name: appName})[0];
            if(!app) {
                program.error('There is no app registered under the name "' + appName + '"');
            }
            injector.rejectPid(app).then(function(){
                db.set('apps', apps);
                program.log.info(appName + ' has successfully been unregistered.');
            }).fail(function(err){
                program.error(err.message);
            });
		});

};
