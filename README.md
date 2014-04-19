![](https://i.cloudup.com/PBrncqI8-Q-1200x1200.jpeg)

fireball
========
A very simple image hosting library

- Serve images (originals and resized to preconfigured sizes) from configurable directory
- Uses [hapi](http://hapijs.org)

## Add the module to your app

```shell
npm install fireball
```

```javascript
var Hapi = require('hapi');
var config = require('./fireballConfig.json');


var server = new Hapi.Server('0.0.0.0', 3000 || process.env.PORT);

server.pack.require({'fireball': config}, function (err) {
    if (err) throw err;
    server.start(function () {
        server.log(['info', 'fireball], 'fireball running on the year' + server.info.port);
    });
});
```

### Set your defaults in ``fireballConfig.json``

```json
{
    "imageDir": "/path/to/images",
    "baseURL": "/url/to/images",
    "smallWidth": "256",
    "mediumWidth": "512",
    "largeWidth": "1024"
}
```


``baseURL``: where the images will be served from

``small|medium|largeWidth``: width in pixels to resize images for thumbnailing

``pathToImages``: local directory to look in for images.  Subdirectories here will translate to the url of the images.


### Example urls:

Let's say you set baseURL to ``/pics`` and that you put an image named ``mycat.jpg`` in the configured ``imageDir``.  Fireball would then make that photo available at the following urls (assuming you were running off of localhost):

```
http://localhost/pics/mycat.jpg
http://localhost/pics/mycat-s.jpg
http://localhost/pics/mycat-m.jpg
http://localhost/pics/mycat-l.jpg
```

These would be the original, smalle, medium, and large thumbnailed versions of that image.

### Notes:

Fireball will need both read and write access to the imageDir, as it will make the thumbnail images if they do not already exist.

This also means that if for some reason you would like a nonstandard size for a given images' thumbnail sizes, you can simply put them in the imageDir with their -s, -m, and -l names.

Warning: Images ending in -s, -m, and -l will not be resized.
