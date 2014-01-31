/* list commander component
 * To use add require('../cmds/list.js')(program) to your commander.js based node executable before program.parse
 */
'use strict';

var prettyjson = require('prettyjson');
var _ = require('lodash');

module.exports = function(program) {

	program
		.command('list')
		.version('0.0.0')
		.description('List currently registered apps')
		.action(function(/* Args here */){
			// Your code goes here
            var apps = program.getDB().get('apps');
            if(_.isEmpty(apps)){
                program.log.info('There are currently no registered apps');
            } else {
                console.log(prettyjson.render(apps));
            }
		});

};
