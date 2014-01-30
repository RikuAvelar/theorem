'use strict';
var _ = require('lodash');
var _s = require('underscore.string');
var db = require('../helpers/storage.js')();
var Q = require('q');
var promptly = require('promptly');

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
            store.command = store.command + ' ' + store.script;
            db.push('apps', store);
            deferred.resolve();
        });

    return deferred.promise;
}


module.exports = function(program){
    program
        .command('register [FullPath]')
        .description('Register a new Node.js app')
        .option('-n, --name [Name]', 'Script Name, doubles as Process Name when command is set through FullPath or "-c" flag')
        .option('-c, --command [Command]', 'Use a custom startup command. Defaults to "node <script>"')
        .option('-d, --directory <Path>', 'Absolute path to Directory in which to run')
        .option('-l, --log <Path>', 'Specify where to save logs. Defaults to "/var/log"')
        .action(function(path, cmd){
            //If any of these exist (through identity)
            if(!_.any([path, cmd.path, cmd.name])) {
                stepByStepPrompt(program);
            } else {
                var nopath = false;
                if (!path) {
                    // First with an identity wins
                    path = _.find([cmd.path, cmd.name]);
                    nopath = true;
                }
                //Compact to get rid of initial empty string and possible trailing slash
                var pathSplit = _.compact(path.split('/'));
                //Case : No FullPath was provided, and not enough info could be gathere from
                if (pathSplit.length === 1 && nopath) {
                    if (cmd.path && !cmd.name) {
                        program.error('Directory Path must be absolute (and non-root)');
                        return false;
                    } else if(cmd.name) {
                        program.error('A valid path must be provided, either through the "-d" flag or directly');
                        return false;
                    } else {
                        //Sanity check on cmd.name : Can it be interpreted as the script's name?
                        if (_s(cmd.name).endsWith('.js')) {
                            pathSplit.push(cmd.name);
                        } else if (cmd.command) {
                            pathSplit.push(_.last(cmd.command.split(' ')));
                        } else {
                            program.error('Script name could not be inferred from given information. (Try setting Name as the Script Name, or setting a Command)');
                            return false;
                        }
                    }
                }
                var options = _.defaults({
                    name: cmd.name,
                    directory: cmd.directory,
                    log: cmd.log,
                    command: cmd.command
                }, {
                    name: _.last(pathSplit),
                    directory: '/' + _.initial(pathSplit).join('/'),
                    log: '/var/log/theorem',
                    command: 'node ' + _.last(pathSplit)
                });

                db.push('apps',options);
            }
        });
};
