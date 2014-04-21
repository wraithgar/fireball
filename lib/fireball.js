var Handlers = require('./fireball/handlers');
var _ = require('underscore');
var defaults = {
    imageBrowser: false,
    saveDir: 'fireballImages',
    imageDir: 'images',
    baseURL: '/fireball/',
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
    var handlers, home;
    _.defaults(config, defaults);
    home = config.baseURL;
    config.log = plugin.log;
    handlers = new Handlers(config, function setRoutes() {
        plugin.bind(handlers);
        plugin.route({
            method: 'get',
            path: home + '{imagePath*}',
            config: {
                handler: handlers.image,
                description: 'fireball image',
                tags: ['fireball']
            }
        });
        if (config.imageBrowser) {
            config.log(['debug'], 'fireball adding image browser');
            plugin.route({
                method: 'get',
                path: home,
                config: {
                    handler: handlers.imageBrowser,
                    description: 'fireball image browser',
                    tags: ['fireball']
                }
            });
        }
        plugin.log(['info', 'fireball'], 'fireball loaded');
        next();
    });
};
