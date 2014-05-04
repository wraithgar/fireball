/*Image processor, watches for new images too*/

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var wtchr = require('wtchr');
var walk = require('walk');
var path = require('path');
var crypto = require('crypto');
var fs = require('fs');
var gm = require('gm');
var async = require('async');
var _ = require('underscore');

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

    var saveDir = path.join(path.dirname(require.main.filename), config.saveDir);

    function rmdir(p) {
        try {
            fs.rmdirSync(p);
        } catch (e) {
            //We don't care if it wasn't empty
            if (e.code !== 'ENOTEMPTY') {
                throw e;
            }
        }
    }

    function mkdir(p) {
        try {
            fs.mkdirSync(p);
        } catch (e) {
            //We don't care if it already exists
            if (e.code !== 'EEXIST') {
                throw e;
            }
        }
    }

    function createProcessingFolder(processing) {
        mkdir(path.join(saveDir, processing.suffix));
    }
    mkdir(saveDir);

    if (config.processing) {
        config.processing.forEach(createProcessingFolder);
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

    function readFile(fileName, next) {
        var filePath = fileName.slice(imageDir.length); //Relative path filename

        function processFile(checksum) {
            var fileExt = path.extname(filePath);
            var hash1 = checksum.slice(0, 2);
            var hash2 = checksum.slice(2, 4);

            self.images[filePath] = {
                fileName: fileName,
                checksum: checksum,
                processed: []
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
                self.images[newFilePath] = {
                    filePath: newFilePath,
                    fileName: newFileName,
                    suffix: processing.suffix,
                    hash1: hash1,
                    hash2: hash2
                };
                self.images[filePath].processed.push(self.images[newFilePath]);
                fs.stat(newFileName, cacheOrProcess);

                function cacheOrProcess(err) {
                    if (!err && !config.reprocess) {
                        return done(); //File exists and we're not reprocessing
                    }
                    mkdir(path.join(saveDir, processing.suffix, hash1));
                    mkdir(path.join(saveDir, processing.suffix, hash1, hash2));

                    //Apply processing, remove exif etc, and save to saveDir
                    processor[processing.action].apply(gm(fileName), processing.params).noProfile().write(newFileName, done);
                }
            }, function (err) {
                if (err) {
                    throw err;
                }
                next();
            });
        }

        hashFile(fileName, processFile);
    }

    function fileFound(root, fileStat, next) {
        var fileName = path.join(root, fileStat.name);

        function checkFormat(err) {
            if (err) {
                return next(); //Not an image
            }
            readFile(fileName, next);
        }
        gm(fileName).format(checkFormat);
    }


    function updated() {
        self.emit('update', self.images);
    }

    function newImage(fileName, lstat) {
        function processNewImage(err) {
            if (err) {
                return; //Not an image
            }
            config.log(['debug', 'fireball'], 'watcher found a new file ' + fileName);
            readFile(fileName, updated);
        }

        if (!lstat.isFile()) {
            return;
        }
        gm(fileName).format(processNewImage);
    }

    function updateImage(fileName) {
        var oldImageData;
        var filePath = fileName.slice(imageDir.length); //Relative path filename

        function cleanStaleProcessedImages() {
            oldImageData.processed.forEach(deleteProcessedImage);
        }

        function updateDone() {
            var newImageData = self.images[filePath];
            if (!oldImageData) {
                return updated();
            }
            if (oldImageData.checksum === newImageData.checksum) {
                return updated();
            }
            updated();

            //only delete processed images if we were the only image w/ this checksum!
            if (_.where(self.images, {checksum: oldImageData.checksum}).length === 0) {
                //Give the handler time to point to the new files
                process.nextTick(cleanStaleProcessedImages);
            }
        }
        function processUpdatedImage(err) {
            if (err) {
                if (oldImageData) {
                    return deleteImage(fileName);
                }
            }
            config.log(['debug', 'fireball'], 'watcher found a changed file ' + fileName);
            readFile(fileName, updateDone);
        }

        if (self.images[filePath]) {
            //Lazy copy
            oldImageData = JSON.parse(JSON.stringify(self.images[filePath]));
        }

        gm(fileName).format(processUpdatedImage);
    }

    function deleteProcessedImage(processedFile) {
        config.log(['debug', 'fireball'], 'deleting file' + require('util').inspect(processedFile));

        fs.unlinkSync(processedFile.fileName);

        //Try to clean empty directories, it's only polite
        rmdir(path.join(saveDir, processedFile.suffix, processedFile.hash1, processedFile.hash2));
        rmdir(path.join(saveDir, processedFile.suffix, processedFile.hash1));

    }

    function deleteProcessedReference(processedFile) {
        delete self.images[processedFile.filePath];
    }

    function deleteImage(fileName) {
        var filePath = fileName.slice(imageDir.length); //Relative path filename
        if (!self.images[filePath]) {
            return; //It wasn't an image to begin with
        }
        config.log(['debug', 'fireball'], 'watcher found a deleted file ' + filePath);

        //only delete processed images if we are the only image w/ this checksum!
        if (_.where(self.images, {checksum: self.images[filePath].checksum}).length < 2) {
            self.images[filePath].processed.forEach(deleteProcessedImage);
        }
        self.images[filePath].processed.forEach(deleteProcessedReference);
        delete self.images[filePath];
        self.emit('update', self.images);
    }

    function watchFiles() {
        self.emit('ready', self.images);
        var watcher = wtchr(imageDir);
        watcher.on('create', newImage);
        watcher.on('change', updateImage);
        watcher.on('delete', deleteImage);
    }

    walker.on('file', fileFound);

    walker.on('end', watchFiles);

    walker.on('errors', function (root, nodeStatsArray) {
        throw new Error(nodeStatsArray);
    });
};

module.exports = ImageWatcher;
