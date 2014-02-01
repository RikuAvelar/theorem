// Originally from FGRibreau https://gist.github.com/FGRibreau/1846952#file_pid.js
// Usage: require('./pid')('myapp');
// Automatically injected to be required in registered apps
'use strict';
var fs = require('fs');

module.exports = function(appname){
    process.title = appname;

    var PID_FILE  = '/usr/local/var/run/'+process.title+'.pid';

    fs.writeFileSync(PID_FILE, process.pid+'\n');

    process.on('uncaughtException', function(err) {
        console.error('[uncaughtException]', err);
        return process.exit(1);
    });

    process.on('SIGTERM', function() {
        console.log('SIGTERM (killed by supervisord or another process management tool)');
        return process.exit(0);
    });

    process.on('SIGINT', function() {
        console.log('SIGINT');
        return process.exit(0);
    });

    process.on('exit', function() {
        return fs.unlink(PID_FILE);
    });

};
