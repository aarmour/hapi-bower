// Load modules

var Lab = require('lab');
var Hapi = require('hapi');

// Test shortcuts

var lab = exports.lab = Lab.script();
var before = lab.before;
var describe = lab.experiment;
var it = lab.test;
var expect = require('code').expect;

describe('Registration', function () {

    it('should register', function (done) {

        var server = new Hapi.Server().connection({ host: 'test' });

        server.register(require('../'), function () {

            var routes = server.table();
            expect(routes).to.have.length(1);
            expect(routes[0].table).to.have.length(6);
            done();
        });
    });

    it('should fail to register with bad options', function (done) {

        var server = new Hapi.Server().connection({ host: 'test' });

        server.register({
            register: require('../'),
            options: {
                database: 'bogus'
            }
        }, function (err) {

            expect(err).to.exist();
            expect(err).to.match(/"database" must be an object/);
            done();
        });
    });
});
