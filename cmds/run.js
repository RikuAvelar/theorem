/* run commander component
 * To use add require('../cmds/run.js')(program) to your commander.js based node executable before program.parse
 */
'use strict';

var Q = require('q');
var fs = require('fs');
var _ = require('lodash');
var path = require('path');

function injectIntoMonit(conf, apps, program){
    var deferred = Q.defer();

    program.log.debug('Beginning Monit config generation.');

    var generateSingleConf = function(app){
        return '# ' + app.name + ' Config' + '\n' +
        'with pidfile /usr/local/var/run/' + app.name + '.pid' + '\n' +
        '  start program = "/usr/bin/supervisorctl start ' + app.name + '"\n' +
        '  stop program = "/usr/bin/supervisorctl stop ' + app.name + '"\n' +
        '  if 10 restarts within 10 cycles\n' +
        '    then timeout\n\n';
    };

    fs.readFile(conf, function(err, data){
        if(err) {
            deferred.reject(err);
        } else {
            var content = data.toString();
            var theoremConf = _.reduce(apps, function(generated, app){
                return generateSingleConf(generated) + generateSingleConf(app);
            });
            var targetInjectionRegex = /### Automatically generated by Theorem ###[^]+### End of Theorem Config ###/;

            program.log.debug('Successfully read config file. Content : \n' + content);
            program.log.debug('Generated new config: \n' + theoremConf);

            if(content.match(targetInjectionRegex)) {
                content = content.replace(targetInjectionRegex, '### Automatically generated by Theorem ###\n\n' + theoremConf + '### End of Theorem Config ###');
            } else {
                content += '\n\n' + '### Automatically generated by Theorem ###\n\n' + theoremConf + '### End of Theorem Config ###';
            }


            fs.writeFile(conf, content, function(err){
                if(err){
                    deferred.reject(err);
                } else {
                    program.log.debug('Successfully updated configuration');
                    deferred.resolve();
                }
            });
        }
    });

    return deferred.promise;
}

function injectIntoSupervisor(conf, apps, program){
    var deferred = Q.defer();

    program.log.debug('Beginning Supervisor config generation.');

    var generateSingleConf = function(app){
        return '; ' + app.name + ' Config' + ';\n' +
        '[program:' + app.name + ']\n' +
        'command=' + app.command + ' ' + app.script + ' ;\n' +
        'directory=' + app.directory + ' ;\n' +
        'process_name=' + app.name + ' ;\n' +
        'autorestart=true ;\n' +
        'startsecs=1 ;\n' +
        'stopwaitsecs=10 ;\n' +
        'stdout_logfile=' + path.join(app.log, app.name) + '.log ;\n' +
        'stderr_logfile=' + path.join(app.log, app.name) + '.err.log ;\n\n';
    };

    fs.readFile(conf, function(err, data){
        if(err) {
            deferred.reject(err);
        } else {
            var content = data.toString();
            var theoremConf = _.reduce(apps, function(generated, app){
                return generateSingleConf(generated) + generateSingleConf(app);
            });
            var targetInjectionRegex = /; ### Automatically generated by Theorem ###[^]+; ### End of Theorem Config ###/;

            program.log.debug('Successfully read config file. Content : \n' + content);
            program.log.debug('Generated new config: \n' + theoremConf);

            if(content.match(targetInjectionRegex)) {
                content = content.replace(targetInjectionRegex, '; ### Automatically generated by Theorem ###\n\n' + theoremConf + '; ### End of Theorem Config ###');
            } else {
                content += '\n\n' + '; ### Automatically generated by Theorem ###\n\n' + theoremConf + '; ### End of Theorem Config ###';
            }

            program.log.debug('Merged config file: \n\n' + content);

            fs.writeFile(conf, content, function(err){
                if(err){
                    deferred.reject(err);
                } else {
                    program.log.debug('Successfully updated configuration');
                    deferred.resolve();
                }
            });
        }
    });

    return deferred.promise;
}

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
            var apps = program.getDB().get('apps');
            var error = null;

            if(_.isEmpty(apps)) {
                program.error('There are currently no apps registered. Aborting...');
            }

            if(!monitConf || !supervisorConf) {
                program.error('Config files not set. Please set the values of "monitConf" and "supervisorConf" using "theorem config"');
            }

            Q.when(injectIntoMonit(monitConf, apps, program), injectIntoSupervisor(supervisorConf, apps, program)).fail(function(err){
                // Do not force quit process, it could cause problems because of async writing
                program.log.error(err.message);
                error = err;
            }).then(function(){
                program.log.info('Configuration has successfully been generated.');
                if(monit && supervisor) {
                    program.log.info('Theorem does not currently support auto restart of monit or supervisor. Please restart them now');
                } else {
                    program.log.info('Please restart monit and supervisor in order to complete the process.');
                }
            }).finally(function(){
                if(error) {
                    process.exit(1);
                }
            });
		});

};
