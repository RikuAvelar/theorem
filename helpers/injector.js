'use strict';
var fs = require('fs');
var path = require('path');
var Q = require('q');

module.exports = {
    injectPid: function(appName, scriptFile){
        var deferred = Q.defer();
        fs.readFile(scriptFile, {encoding: 'utf8'}, function(err, data){
            if(err){
                return deferred.reject(err);
            }
            var injectedPid = '/* Theorem PID injection - Do not remove this line */ require(\'' + path.join(__dirname, 'pid.js') + '\')(\'' + appName + '\');';
            if(data.indexOf('/* Theorem PID injection - Do not remove this line */') === -1) {
                fs.appendFile(scriptFile, '\n\n' + injectedPid, function(err){
                    if(err){
                        deferred.reject(err);
                    } else {
                        deferred.resolve();
                    }
                });
            }
        });
        return deferred.promise;
    },
    rejectPid: function(scriptFile){
        var deferred = Q.defer();
        if(typeof scriptFile !== 'string') {
            scriptFile = path.join(scriptFile.directory, scriptFile.script);
        }
        fs.readFile(scriptFile, {encoding: 'utf8'}, function(err, data){
            if(err){
                return deferred.reject(err);
            }
            var newData = data.replace(/\/\* Theorem PID injection - Do not remove this line \*\/ require\('.+\)\(.+\)/, '');
            fs.writeFile(scriptFile, newData, function(err){
                if(err){
                    deferred.reject(err);
                } else {
                    deferred.resolve();
                }
            });
        });
        return deferred.promise;
    }
};
