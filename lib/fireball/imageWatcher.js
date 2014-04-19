/*Image processor, watches for new images too*/

var EventEmitter = require('events').EventEmitter;
var util = require('util');
//var wtchr = require('wtchr');
var walk = require('walk');
var path = require('path');
var crypto = require('crypto');
var fs = require('fs');
var gm = require('gm');
var async = require('async');

function ImageWatcher() {
    EventEmitter.call(this);
}

function mkdir(p) {
    try {
        fs.mkdirSync(p);
    } catch (e) {
        //We don't actually care if this succeeds or fails. If it succeeds
        //great, if it fails either the directory already existed which is
        //great, or gm will throw an error the first time we try to save
        //which means we will at least see an error
    }
}
util.inherits(ImageWatcher, EventEmitter);


ImageWatcher.prototype.setup = function (config) {
    var self = this;

    self.images = {}; //Image object with image paths and data

    if (!config.imageDir) {
        throw new Error('fireball config item imageDir must be defined.');
    }

    var imageDir = path.join(path.dirname(require.main.filename), config.imageDir);

    var saveDir = path.join(path.dirname(require.main.filename), config.saveDir);


    if (config.processing) {
        config.processing.forEach(function createProcessingFolder(processing) {
            mkdir(path.join(saveDir, processing.suffix));
        });
    }

    var walker = walk.walk(imageDir);

    function hashFile(fileName, next) {
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
        var filePath = fileName.slice(imageDir.length); //Relative path filename

        function processFile(checksum) {
            var fileExt = path.extname(filePath);
            var hash1 = checksum.slice(0, 2);
            var hash2 = checksum.slice(2, 4);

            self.images[filePath] = {
                fileName: fileName
            };
            if (!config.processing) {
                return next(); //We just host images
            }
            async.each(config.processing, function applyProcessing(processing, done) {
                var newFilePath = filePath.slice(0, fileExt.length * -1) + '-' + processing.suffix + fileExt;
                var newFileName = path.join(saveDir, processing.suffix, hash1, hash2, checksum) + fileExt;
                var processor = gm();

                if (!processor[processing.action]) {
                    return done('Unrecognized gm action ' + processing.action);
                }
                config.log(['debug'], 'adding route to ' + newFilePath + ' going to ' + newFileName);
                self.images[newFilePath] = {
                    fileName: newFileName
                };
                mkdir(path.join(saveDir, processing.suffix, hash1));
                mkdir(path.join(saveDir, processing.suffix, hash1, hash2));

                config.log(['debug'], 'Converting ' + fileName + ' to ' + newFileName);
                //Apply processing, remove exif etc, and save to saveDir
                processor[processing.action].apply(gm(fileName), processing.params).noProfile().write(newFileName, done);
            }, function (err) {
                if (err) {
                    throw err;
                }
                next();
            });
        }

        hashFile(fileName, processFile);
    }

    walker.on('file', readFile);

    walker.on('end', function () {
        self.emit('ready', self.images);
    });

    walker.on('errors', function (root, nodeStatsArray) {
        throw new Error(nodeStatsArray);
    });
};

module.exports = ImageWatcher;
