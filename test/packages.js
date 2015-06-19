// Load modules

var Lab = require('lab');
var Hapi = require('hapi');
var Sinon = require('sinon');

// Test shortcuts

var lab = exports.lab = Lab.script();
var before = lab.before;
var afterEach = lab.afterEach;
var describe = lab.experiment;
var it = lab.test;
var expect = require('code').expect;

describe('Packages', function () {

    var database, sandbox, server;

    before(function (done) {

        server = new Hapi.Server({ debug: false }).connection({ host: 'test' });
        database = {
            getPackages: function (callback) {},
            getPackage: function (name, callback) {},
            insertPackage: function (name, url, callback) {},
            searchPackages: function (name, callback) {}
        };
        sandbox = Sinon.sandbox.create();

        server.register({
            register: require('../'),
            options: {
                database: database
            }
        }, function (error) {

            done(error);
        });
    });

    afterEach(function (done) {

        sandbox.restore();

        done();
    });

    describe('list', function () {

        it('should return the package list', function (done) {

            var result = {
                rows: [
                    { name: 'foo', url: 'git://github.com/foocoder/foo.git', hits: '42' }
                ]
            };

            sandbox.stub(database, 'getPackages').yields(null, result);

            server.inject('/packages', function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result).to.be.an.array();
                expect(response.result).to.have.length(1);
                expect(response.result[0]).to.deep.equal(result.rows[0]);

                done();
            });
        });

        it('should return 500 when there is a database error', function (done) {

            sandbox.stub(database, 'getPackages').yields(new Error());

            server.inject('/packages', function (response) {

                expect(response.statusCode).to.equal(500);

                done();
            });
        });
    });

    describe('create', function () {

        it('should create a new package', function (done) {

            var payload = { name: 'foo', url: 'git://github.com/foocoder/foo.git' };
            sandbox.stub(database, 'insertPackage').yields(null);

            server.inject({ url: '/packages', method: 'POST', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(201);

                done();
            });
        });

        it('should return 400 when the package name is too short', function (done) {

            var payload = { name: '', url: 'git://github.com/foocoder/foo.git' };

            server.inject({ url: '/packages', method: 'POST', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(400);
                expect(response.result.message).to.match(/"name" is not allowed to be empty/);

                done();
            });
        });

        it('should return 400 when the package name is too long', function (done) {

            var payload = { name: new Array(100).join('x'), url: 'git://github.com/foocoder/foo.git' };

            server.inject({ url: '/packages', method: 'POST', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(400);
                expect(response.result.message).to.match(/"name" length must be less than or equal to [0-9]+ characters long/);

                done();
            });
        });

        it('should return 400 when the package name contains uppercase letters', function (done) {

            var payload = { name: 'ABC', url: 'git://github.com/foocoder/foo.git' };

            server.inject({ url: '/packages', method: 'POST', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(400);
                expect(response.result.message).to.match(/"name" with value "ABC" fails to match the required pattern/);

                done();
            });
        });

        ['-', '.', '_'].forEach(function (char) {

            it('should return 400 when the package name contains consecutive ' + (char === '-' ? 'dashes' : char === '.' ? 'dots' : 'underscores'), function (done) {

                var payload = { name: 'foo' + char + char + 'bar', url: 'git://github.com/foocoder/foo.git' };

                server.inject({ url: '/packages', method: 'POST', payload: payload }, function (response) {

                    expect(response.statusCode).to.equal(400);
                    expect(response.result.message).to.match(/"name" may not contain consecutive dashes, dots, or underscores/);

                    done();
                });
            });

            it('should return 400 when the package name starts with ' + (char === '-' ? 'a dash' : char === '.' ? 'a dot' : 'an underscore'), function (done) {

                var payload = { name: char + 'foo', url: 'git://github.com/foocoder/foo.git' };

                server.inject({ url: '/packages', method: 'POST', payload: payload }, function (response) {

                    expect(response.statusCode).to.equal(400);
                    expect(response.result.message).to.match(/"name" with value .* fails to match the Starts or ends with dash, dot, or underscore pattern/);

                    done();
                });
            });

            it('should return 400 when the package name ends with ' + (char === '-' ? 'a dash' : char === '.' ? 'a dot' : 'an underscore'), function (done) {

                var payload = { name: 'foo' + char, url: 'git://github.com/foocoder/foo.git' };

                server.inject({ url: '/packages', method: 'POST', payload: payload }, function (response) {

                    expect(response.statusCode).to.equal(400);
                    expect(response.result.message).to.match(/"name" with value .* fails to match the Starts or ends with dash, dot, or underscore pattern/);

                    done();
                });
            });
        });

        it('should return 400 when the package URL is invalid', function (done) {

            var payload = { name: 'foo', url: '@' };

            server.inject({ url: '/packages', method: 'POST', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(400);

                done();
            });
        });

        it('should return 403 when the package is already registered', function (done) {

            var payload = { name: 'foo', url: 'git://github.com/foocoder/foo.git' };
            sandbox.stub(database, 'insertPackage').yields({ status: 403 });

            server.inject({ url: '/packages', method: 'POST', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(403);

                done();
            });
        });

        it('should return 500 when there is a database error', function (done) {

            var payload = { name: 'foo', url: 'git://github.com/foocoder/foo.git' };
            sandbox.stub(database, 'insertPackage').yields({ status: 500 });

            server.inject({ url: '/packages', method: 'POST', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(500);

                done();
            });
        });
    });

    describe('fetch', function () {

        it('should get the package', function (done) {

            var package = { name: 'foo', url: 'git://github.com/foocoder/foo.git', hits: '42' };
            sandbox.stub(database, 'getPackage').withArgs('foo').yields(null, package);

            server.inject('/packages/foo', function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result).to.deep.equal(package);

                done();
            });
        });

        it('should return 404 when the package does not exist', function (done) {

            sandbox.stub(database, 'getPackage').yields({ status: 404 });

            server.inject('/packages/bogus', function (response) {

                expect(response.statusCode).to.equal(404);

                done();
            });
        });

        it('should return 500 when there is a database error', function (done) {

            sandbox.stub(database, 'getPackage').yields({ status: 500 });

            server.inject('/packages/foo', function (response) {

                expect(response.statusCode).to.equal(500);

                done();
            });
        });
    });

    describe('remove', function () {

        it('should remove the package when user owns the package');

        it('should return 403 when the user does not own the package');

        it('should return 500 when there is a database error');
    });

    describe('search', function () {

        it('should return matching packages', function (done) {

            var result = {
                rows: [
                    { name: 'foo', url: 'git://github.com/foocoder/foo.git' }
                ]
            };

            sandbox.stub(database, 'searchPackages').withArgs('foo').yields(null, result);

            server.inject('/packages/search/foo', function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result).to.be.an.array();
                expect(response.result[0]).to.deep.equal(result.rows[0]);

                done();
            });
        });

        it('should return 500 when there is a database error', function (done) {

            sandbox.stub(database, 'searchPackages').yields(new Error());

            server.inject('/packages/search/foo', function (response) {

                expect(response.statusCode).to.equal(500);

                done();
            });
        });
    });
});
