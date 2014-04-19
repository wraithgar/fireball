var Handlers = require('./fireball/handlers');

exports.register = function (plugin, config, next) {
    var handlers;
    var home = config.baseURL;
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
        plugin.log(['info', 'fireball'], 'fireball loaded');
        next();
    });
};
