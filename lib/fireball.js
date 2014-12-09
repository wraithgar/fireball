var Handlers = require('./fireball/handlers');
var defaults = require('amp-defaults');
var defaultConfig = {
    cache: 60 * 60 * 1000,
    saveDir: 'fireballImages',
    imageDir: 'images',
    baseURL: '/fireball/',
    reprocess: false,
    processing: [
        {
            suffix: 's',
            action: 'resize',
            params: [256, null, '>']
        },
        {
            suffix: 'm',
            action: 'resize',
            params: [512, null, '>']
        },
        {
            suffix: 'l',
            action: 'resize',
            params: [1024, null, '>']
        }
    ]
};

exports.register = function (plugin, config, next) {
    var handlers;
    defaults(config, defaultConfig);
    config.log = plugin.log;
    handlers = new Handlers(config, function setRoutes() {
        var home = config.baseURL;
        plugin.bind(handlers);
        plugin.route({
            method: 'get',
            path: home + '{imagePath*}',
            config: {
                handler: handlers.image,
                description: 'fireball image',
                cache: {expiresIn: config.cache},
                tags: ['fireball']
            }
        });
        plugin.log(['info', 'fireball'], 'fireball loaded');
        next();
    });
};

exports.register.attributes = {
    pkg: require('../package.json')
};
