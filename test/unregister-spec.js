'use strict';

var expect = require('chai').expect;
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');
var suppose = require('suppose');

describe('theorem unregister', function(){
    var dbPath = path.join(__dirname, '../test-db.json');
    var cmd = ['node', path.join(__dirname, '../bin/theorem'), '--dbpath', dbPath, 'unregister'];

    beforeEach(function(){
        fs.writeFileSync(dbPath, JSON.stringify({
            apps: [{'name':'Theorem','directory':'/home/dev','script':'app.js','command':'node app.js','log':'/var/log'},{'name':'AppName','directory':'/dev','script':'app.js','command':'node','log':'/var/log'}]
        }));
    });

    afterEach(function(){
        if(fs.existsSync(dbPath)){
            fs.unlinkSync(dbPath);
        }
    });

    it('should remove the unregistered app from the DB even if the script cannot be found', function(done){
        this.timeout(5000);

        exec(cmd.concat('AppName').join(' '), function (error, stdout, stderr) {
            expect(error).to.not.exist;
            expect(stdout).to.have.string('AppName has been unregistered, however');
            fs.readFile(dbPath, function(err, data){
                if(err){
                    done(err);
                } else {
                    var dbObj = JSON.parse(data.toString());
                    expect(dbObj).to.have.property('apps').that.is.an('array').with.length(1);
                    expect(dbObj.apps[0].name).to.be.equal('Theorem');
                    done();
                }
            });
        });
    });

    describe('Reverse Injection', function(){
        // var scriptFile = path.join(__dirname, 'testMainScript.js');
        // var cmd = [path.join(__dirname, '../bin/theorem'), '--dbpath', dbPath, 'register'];

        // beforeEach(function(){
        //     fs.writeFileSync(scriptFile, '// Beginning of File');
        // });

        // afterEach(function(){
        //     fs.unlinkSync(scriptFile);
        // });


        // it('should inject the PID module into the registered script', function(done){
        //     this.timeout(5000);

        //     suppose('node', cmd.concat(['-n','AppName','-l','/var/log/theorem', '--directory', path.join(__dirname, 'testMainScript.js')]))
        //         .error(function(err){
        //             done(err);
        //         })
        //         .end(function(code){
        //             fs.readFile(scriptFile, 'utf-8', function(err, data){
        //                 if(err){
        //                     console.log(err.message);
        //                     done(err);
        //                 } else {
        //                     var scriptString = data;
        //                     expect(scriptString).to.have.string('// Beginning of File\n\n');
        //                     expect(scriptString).to.have.string('/* Theorem PID injection - Do not remove this line */ require(\'' + path.normalize(path.join(__dirname, '../helpers/pid.js')) + '\')(\'AppName\');');
        //                     done();
        //                 }
        //             });
        //         });
        // });
    });


});
