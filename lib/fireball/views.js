var ImageWatcher = require('./imageWatcher');

function Views(config, done) {
    var self = this;
    this.config = config;

    var watcher = new ImageWatcher();

    function loadImages(images) {
        self.images = images;
        self.config.log(['debug', 'fireball'], 'images ' + require('util').inspect(images));
    }

    watcher.on('ready', function (images) {
        loadImages(images);
        done();
    });

    watcher.on('update', loadImages);

    watcher.setup(config);
}

Views.prototype.image = function (imagePath, done) {
    this.config.log(['debug', 'fireball'], 'Serving image ' + imagePath);
    done(this.images['/' + imagePath]);
};

module.exports = Views;
