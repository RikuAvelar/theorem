/* run commander component
 * To use add require('../cmds/run.js')(program) to your commander.js based node executable before program.parse
 */
'use strict';

module.exports = function(program) {

	program
		.command('run')
		.version('0.0.0')
		.description('Rebuild monit/supervisor config files and attempt to restart them')
		.action(function(/* Args here */){
			// Your code goes here
            var monitConf = program.config.get('monitConf');
            var supervisorConf = program.config.get('supervisorConf');
            var monit = program.config.get('monit');
            var supervisor = program.config.get('supervisor');

            if(!monitConf || !supervisorConf) {
                program.error('Config files not set. Please set the values of "monitConf" and "supervisorConf" using "theorem config"');
            }


            console.log(program.config.get('s'));
		});

};
