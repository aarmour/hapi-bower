// Load modules

var Boom = require('boom');

exports.list = function (request, reply) {

    this.database.getPackages(function (error, result) {

        if (error) {
            return reply(error);
        }

        reply(result.rows);
    });
};

exports.create = function (request, reply) {

    this.database.insertPackage(request.payload.name, request.payload.url, function (error) {

        if (error) {
            if (error.status === 403) {
                reply().code(403);
            } else {
                reply(Boom.badImplementation(error));
            }

            return;
        }

        reply().code(201);
    });
};

exports.fetch = function (request, reply) {

    this.database.getPackage(request.params.name, function (error, result) {

        if (error) {
            if (error.status === 404) {
                reply(Boom.notFound());
            } else {
                reply(Boom.badImplementation(error));
            }

            return;
        }

        reply(result);
    });
};

exports.remove = function (request, reply) {

};

exports.search = function (request, reply) {

    this.database.searchPackages(request.params.name, function (error, result) {

        reply(result.rows);
    });
};
