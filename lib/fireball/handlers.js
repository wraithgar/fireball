var Views = require('./views');
var Handlers = function (config, next) {
    this.views = new Views(config, next);
};

Handlers.prototype.image = function (request, reply) {
    this.views.image(request.params.imagePath, function _sendPhoto(imagePath) {
        if (!imagePath) {
            return reply('404 Not found').code(404);
        }
        reply.file(imagePath.fileName);
    });
};

module.exports = Handlers;
