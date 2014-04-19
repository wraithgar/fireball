var ImageWatcher = require('./imageWatcher');

function Views(config, done) {
    var self = this;
    this.config = config;

    var watcher = new ImageWatcher();

    function loadImages(images) {
        self.images = images;
    }

    watcher.on('ready', function (images) {
        loadImages(images);
        done();
    });

    watcher.on('update', loadImages);

    watcher.setup(config);
}

Views.prototype.image = function (imagePath, done) {
    done(this.images['/' + imagePath]);
};

module.exports = Views;
