'use strict';
var _ = require('lodash');
var _s = require('underscore.string');
var Q = require('q');
var promptly = require('promptly');
var injector = require('../helpers/injector.js');
var fs = require('fs');
var _path = require('path');

function prompter(program, store, key, prompt, defaultVal){
    return function(){
        var deferred = Q.defer();
        var validator = function(val){
            if(!_s.trim(val)){
                throw new Error('Value must not be empty');
            }
            return val;
        };

        promptly.prompt(prompt, {validator: validator, default: defaultVal || ' ', retry:false}, function(err, value){
            if(err){
                program.log.error(err.message);
                return err.retry();
            }
            store[key] = value;
            deferred.resolve();
        });

        return deferred.promise;
    };
}

function stepByStepPrompt(program){
    var store = {};
    var prompt = prompter.bind(null, program, store);
    var deferred = Q.defer();
    Q.when(prompt('name', 'App Name: ')())
        .then(prompt('directory', 'Script Directory: '))
        .then(prompt('script', 'Script Name [default=app.js]: ', 'app.js'))
        .then(prompt('command', 'Command [default=node]: ', 'node'))
        .then(prompt('log', 'Log Path [default=/var/log]: ', '/var/log'))
        .done(function(){
            var db = program.getDB();
            // store.command = store.command + ' ' + store.script;
            db.push('apps', store);
            deferred.resolve(store);
        });

    return deferred.promise;
}


module.exports = function(program){
    program
        .command('register [FullPath]')
        .description('Register a new Node.js app. Can be run without FullPath, which will enter a series of prompts.')
        .option('-n, --name [Name]', 'Application name')
        .option('-s, --script [script]', 'Script name. Defaults to "app.js"')
        .option('-c, --commandName [Command]', 'Use a custom startup commandName. Defaults to "node <script>"')
        .option('--directory <Path>', 'Absolute path to Directory in which to run')
        .option('-l, --log <Path>', 'Specify where to save logs. Defaults to "/var/log"')
        .option('-N, --noinject', 'Do not inject PID script to the app')
        .action(function(path, cmd){
            var db = program.getDB();
            //If any of these exist (through identity)
            if(!_.any([path, cmd.directory, cmd.script])) {
                stepByStepPrompt(program).done(function(options){
                    var scriptFile = _path.join(options.directory, options.script);

                    if(!cmd.noinject && fs.existsSync(scriptFile)){
                        injector.injectPid(options.name, scriptFile).fail(function(err){
                            program.error(err.message);
                        }).done(function(){
                            db.push('apps',options);
                            program.log.info('App successfully registered');
                        });
                    } else if(cmd.noinject) {
                        db.push('apps',options);
                        program.log.info('App successfully registered');
                    } else {
                        program.error('The script you attempted to register did not exist (' + scriptFile + ')');
                    }
                });
            } else {
                var nopath = false;
                if (!path) {
                    // First with an identity wins
                    path = _.find([cmd.directory, cmd.script]);
                    cmd.directory = _path.dirname(path);
                    cmd.script = _path.basename(path);
                    nopath = true;
                }
                //Compact to get rid of initial empty string and possible trailing slash
                var pathSplit = _.compact(path.split(_path.sep));
                //Case : No FullPath was provided, and not enough info could be gathere from
                if (pathSplit.length === 1 && nopath) {
                    if (cmd.directory && !cmd.script) {
                        program.error('Directory Path must be absolute (and non-root)');
                        return false;
                    } else if(cmd.script) {
                        program.error('A valid path must be provided, either through the "--directory" flag or directly');
                        return false;
                    } else {
                        //Sanity check on cmd.script : Can it be interpreted as the script's script?
                        if (_s(cmd.script).endsWith('.js')) {
                            pathSplit.push(cmd.script);
                        } else {
                            program.error('Script name could not be inferred from given information. (Try setting Name as the Script Name, or setting a Command)');
                            return false;
                        }
                    }
                }
                var options = _.defaults({
                    name: cmd.name,
                    script: cmd.script,
                    directory: cmd.directory,
                    log: cmd.log,
                    command: cmd.commandName
                }, {
                    name: _path.basename(_path.dirname(path)),
                    script: _.last(pathSplit),
                    directory: '/' + _.initial(pathSplit).join('/'),
                    log: '/var/log',
                    command: 'node'
                });

                var scriptFile = _path.join(options.directory, options.script);

                if(!cmd.noinject && fs.existsSync(scriptFile)){
                    injector.injectPid(options.name, scriptFile).fail(function(err){
                        program.error(err.message);
                    }).done(function(){
                        db.push('apps',options);
                        program.log.info('App successfully registered');
                    });
                } else if(cmd.noinject) {
                    db.push('apps',options);
                    program.log.info('App successfully registered');
                } else {
                    program.error('The script you attempted to register did not exist (' + scriptFile + ')');
                }
            }
        });
};
