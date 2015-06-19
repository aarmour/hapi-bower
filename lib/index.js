// Load modules

var Joi = require('joi');

// Declare internals

var internals = {
    options: Joi.object({
        database: Joi.alternatives().try(Joi.object(), Joi.func())
    })
};

exports.register = function (server, options, next) {

    var validateOptions = internals.options.validate(options);
    if (validateOptions.error) {
        return next(validateOptions.error);
    }

    server.bind(options);

    var status = require('./status');
    var packages = require('./packages');
    server.route([
        {
            path: '/status',
            method: 'GET',
            config: {
                handler: status.fetch
            }
        },
        {
            path: '/packages',
            method: 'GET',
            config: {
                handler: packages.list
            }
        },
        {
            path: '/packages',
            method: 'POST',
            config: {
                handler: packages.create,
                validate: {
                    payload: function (value, options, next) {

                        var schema = {
                            name: Joi.string().min(1).max(50).regex(/^[a-z0-9._-]*$/).regex(/^[^._-].*[^._-]$/, 'Starts or ends with dash, dot, or underscore'),
                            url: Joi.string().uri()
                        };

                        var result = Joi.validate(value, schema, options);

                        if (result.error) {
                            return next(result.error);
                        }

                        // Additional validations

                        // Consecutive dashes, dots, or underscores
                        if (value.name.match(/[._-]{2,}/)) {
                            return next(new Error('"name" may not contain consecutive dashes, dots, or underscores'));
                        }

                        next();
                    }
                }
            }
        },
        {
            path: '/packages/{name}',
            method: 'GET',
            config: {
                handler: packages.fetch
            }
        },
        {
            path: '/packages/{name}',
            method: 'DELETE',
            config: {
                handler: packages.remove
            }
        },
        {
            path: '/packages/search/{name}',
            method: 'GET',
            config: {
                handler: packages.search
            }
        }
    ]);
    next();
};

exports.register.attributes = {

  pkg: require('../package.json')
};
