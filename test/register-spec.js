'use strict';

var expect = require('chai').expect;
// var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');
var suppose = require('suppose');

describe('theorem register', function(){
    var dbPath = path.join(__dirname, '../test-db.json');
    var cmd = [path.join(__dirname, '../bin/theorem'), '--noinject', '--dbpath', dbPath, 'register'];

    before(function(){
        if(fs.existsSync(dbPath)){
            fs.unlink(dbPath);
        }
    });

    afterEach(function(){
        if(fs.existsSync(dbPath)){
            fs.unlink(dbPath);
        }
    });

    it('should enter prompt mode if not enough info is sent', function(done){
        this.timeout(5000);

        suppose('node', cmd)
            .on('App Name: ').respond('AppName\n')
            .on('Script Directory: ').respond('/home/dev\n')
            .on('Script Name [default=app.js]: ').respond('app.js\n')
            .on('Command [default=node]: ').respond('node\n')
            .on('Log Path [default=/var/log]: ').respond('/var/log\n')
            .error(function(err){
                done(err);
            })
            .end(function(code){
                expect(code).to.be.equal(0);
                fs.readFile(dbPath, function(err, data){
                    if(err){
                        done(err);
                    } else {
                        var dbObj = JSON.parse(data.toString());
                        expect(dbObj).to.have.property('apps').that.is.an('array').with.length(1);
                        expect(dbObj.apps[0]).to.contain.keys('name', 'script', 'directory', 'command', 'log');
                        expect(dbObj.apps[0].name).to.be.equal('AppName');
                        expect(dbObj.apps[0].directory).to.be.equal('/home/dev');
                        expect(dbObj.apps[0].script).to.be.equal('app.js');
                        expect(dbObj.apps[0].command).to.be.equal('node');
                        expect(dbObj.apps[0].log).to.be.equal('/var/log');
                        done();
                    }
                });
            });
    });

    it('should accept a full path and figure things out from there', function(done){
        this.timeout(5000);

        suppose('node', cmd.concat('/home/dev/theorem/app.js'))
            .error(function(err){
                done(err);
            })
            .end(function(code){
                expect(code).to.be.equal(0);
                fs.readFile(dbPath, function(err, data){
                    if(err){
                        done(err);
                    } else {
                        var dbObj = JSON.parse(data.toString());
                        expect(dbObj).to.have.property('apps').that.is.an('array').with.length(1);
                        expect(dbObj.apps[0]).to.contain.keys('name', 'directory', 'command', 'log');
                        expect(dbObj.apps[0].script).to.be.equal('app.js');
                        expect(dbObj.apps[0].name).to.be.equal('theorem');
                        expect(dbObj.apps[0].directory).to.be.equal('/home/dev/theorem');
                        expect(dbObj.apps[0].command).to.be.equal('node');
                        expect(dbObj.apps[0].log).to.be.equal('/var/log');
                        done();
                    }
                });
            });
    });

    it('should be able to accept a full path as well as additional options to overwrite it', function(done){
        this.timeout(5000);

        suppose('node', cmd.concat(['-n','AppName','-l','/var/log/theorem','/home/dev/app.js']))
            .error(function(err){
                done(err);
            })
            .end(function(code){
                fs.readFile(dbPath, function(err, data){
                    if(err){
                        done(err);
                    } else {
                        var dbObj = JSON.parse(data.toString());
                        expect(dbObj).to.have.property('apps').that.is.an('array').with.length(1);
                        expect(dbObj.apps[0]).to.contain.keys('name', 'directory', 'command', 'log');
                        expect(dbObj.apps[0].name).to.be.equal('AppName');
                        expect(dbObj.apps[0].script).to.be.equal('app.js');
                        expect(dbObj.apps[0].directory).to.be.equal('/home/dev');
                        expect(dbObj.apps[0].command).to.be.equal('node');
                        expect(dbObj.apps[0].log).to.be.equal('/var/log/theorem');
                        done();
                    }
                });
            });
    });

    it('should be able to accept no full path, yet deduce enough information from additional options to not enter prompt', function(done){
        this.timeout(5000);

        suppose('node', cmd.concat(['-n','AppName','-l','/var/log/theorem', '--directory', '/home/dev/app.js']))
            .error(function(err){
                done(err);
            })
            .end(function(code){
                fs.readFile(dbPath, function(err, data){
                    if(err){
                        done(err);
                    } else {
                        var dbObj = JSON.parse(data.toString());
                        expect(dbObj).to.have.property('apps').that.is.an('array').with.length(1);
                        expect(dbObj.apps[0]).to.contain.keys('name', 'directory', 'command', 'log');
                        expect(dbObj.apps[0].name).to.be.equal('AppName');
                        expect(dbObj.apps[0].script).to.be.equal('app.js');
                        expect(dbObj.apps[0].directory).to.be.equal('/home/dev');
                        expect(dbObj.apps[0].command).to.be.equal('node');
                        expect(dbObj.apps[0].log).to.be.equal('/var/log/theorem');
                        done();
                    }
                });
            });
    });

    describe('Injection', function(){
        var scriptFile = path.join(__dirname, 'testMainScript.js');
        var cmd = [path.join(__dirname, '../bin/theorem'), '--dbpath', dbPath, 'register'];

        beforeEach(function(){
            fs.writeFileSync(scriptFile, '// Beginning of File');
        });

        afterEach(function(){
            fs.unlinkSync(scriptFile);
        });


        it('should inject the PID module into the registered script', function(done){
            this.timeout(5000);

            suppose('node', cmd.concat(['-n','AppName','-l','/var/log/theorem', '--directory', path.join(__dirname, 'testMainScript.js')]))
                .error(function(err){
                    done(err);
                })
                .end(function(code){
                    fs.readFile(scriptFile, 'utf-8', function(err, data){
                        if(err){
                            console.log(err.message);
                            done(err);
                        } else {
                            var scriptString = data;
                            expect(scriptString).to.have.string('// Beginning of File\n\n');
                            expect(scriptString).to.have.string('/* Theorem PID injection - Do not remove this line */ require(\'' + path.normalize(path.join(__dirname, '../helpers/pid.js')) + '\')(\'AppName\');');
                            done();
                        }
                    });
                });
        });
    });


});
