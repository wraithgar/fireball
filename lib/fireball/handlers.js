var Views = require('./views');
var Handlers = function (config, next) {
    this.log = config.log;
    this.views = new Views(config, next);
};

Handlers.prototype.image = function (request, reply) {
    this.views.image(request.params.imagePath, function _sendImage(imagePath) {
        if (!imagePath) {
            return reply('404 Not found').code(404);
        }
        reply.file(imagePath.fileName);
    });
};

Handlers.prototype.imageBrowser = function (request, reply) {
    this.views.imageList(request.params.imagePath, function _sendImages(context) {
        if (!context) {
            return reply.view('404');
        }
        this.log(['debug'], context);
        reply.view('images', context);
    });
};

module.exports = Handlers;
