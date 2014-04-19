var EventEmitter = require('events').EventEmitter;
var util = require('util');
var wtchr = require('wtchr');
var walk = require('walk');
var path = require('path');
var crypto = require('crypto');
var fs = require('fs');

function ImageWatcher() {
    EventEmitter.call(this);
}

util.inherits(ImageWatcher, EventEmitter);


ImageWatcher.prototype.setup = function (config) {
    var self = this;

    self.images = {}; //Image object with image paths and data

    if (!config.imageDir) {
        throw new Error('fireball config item imageDir must be defined.');
    }

    var imageDir = path.join(path.dirname(require.main.filename), config.imageDir);

    var walker = walk.walk(imageDir);

    function hashFile(fileName, next) { //TODO lib this
        var hash = crypto.createHash('md5');
        function hashData(data) {
            hash.update(data);
        }

        function hashError(err) {
            throw err;
        }

        function hashDone() {
            var checksum = hash.digest('hex');
            next(checksum);
        }

        var s = fs.ReadStream(fileName);
        s.on('data', hashData);
        s.on('end', hashDone);
        s.on('error', hashError);
    }

    function readFile(root, fileStat, next) {
        var fileName = path.join(root, fileStat.name);
        var filePath = fileName.slice(imageDir.length); //Where to serve the file
        config.log(['debug', 'fireball'], 'Processing file ' + fileName);

        function processFile(checksum) {
            //For now we don't care about the checksum, that's for where
            //to keep the resized version
            config.log(['debug', 'fireball'], 'file sum ' + fileName + ' ' + checksum);
            self.images[filePath] = {
                checksum: checksum,
                fileName: fileName
            };
            next();
        }

        hashFile(fileName, processFile);
    }

    walker.on('file', readFile);

    walker.on('end', function () {
        //Wait for directories to all be done too dang.
        self.emit('ready', self.images);
    });

    walker.on('errors', function (root, nodeStatsArray, next) {
        throw new Error(nodeStatsArray);
    });
};

module.exports = ImageWatcher;
