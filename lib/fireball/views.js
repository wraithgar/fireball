var ImageWatcher = require('./imageWatcher');

function Views(config, done) {
    var self = this;

    var watcher = new ImageWatcher();

    function loadImages(images, folders) {
        self.images = images;
        self.folders = folders;
    }

    watcher.on('ready', function (images, folders) {
        loadImages(images, folders);
        done();
    });

    watcher.on('update', loadImages);

    watcher.setup(config);
}

Views.prototype.image = function (imagePath, done) {
    done(this.images['/' + imagePath]);
};

Views.prototype.imageList = function (imagePath, done) {
    done({images: this.folders['/' + imagePath]});
};

module.exports = Views;
