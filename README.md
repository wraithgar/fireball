![](https://i.cloudup.com/PBrncqI8-Q-1200x1200.jpeg)

fireball
========
A very simple image hosting library

- Serve images (originals and resized to preconfigured sizes) from configurable directory
- Uses [hapi](http://hapijs.org)
- Requires either [GraphicsMagick](http://www.graphicsmagick.org/) or [ImageMagick](http://www.imagemagick.org/).  Please see [gm](https://github.com/aheckmann/gm) docs for more info
- Patterend after [bumble](https://github.com/adambrault/bumble)

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
    "baseURL": "/url/to/images",
    "imageDir": "path/to/images",
    "saveDir": "path/to/save/resized/images",
    "processing": [
        {
            "suffix": "s",
            "action": "resize",
            "params": [256, null, ">"]
        },
        {
            "suffix": "m",
            "action": "resize",
            "params": [512, null, ">"]
        },
        {
            "suffix": "l",
            "action": "resize",
            "params": [1024, null, ">"]
        }
    ]
}
```


``baseURL``: (string, optional, default=``/fireball/``) where the images will be served from

``imageDir``: (string, optional, default=``images``) local directory to look in for images.  Subdirectories here will translate to the url of the images.

``saveDir``: (string, optional, default=``fireballImages``) where to save the processed images, will be created if missing.

``processing``: (object, optional, default=see below) defines the processing to do to images, key names here are added to the url of the original image. Currently only [resize](http://aheckmann.github.com/gm/docs.html#resize) is supported.

### Default processing

By default fireball will process images into three versions: s, m, and l with scaled widths of 256, 512, and 1024px respectively.  If the original image is smaller than the processed version would be the original is kept.


### Example urls:

Let's say you set baseURL to ``/pics`` and that you put an image named ``mycat.jpg`` in the configured ``imageDir``.  Given the above example, Fireball would then make that photo available at the following urls (assuming you were running off of localhost):

```
http://localhost/pics/mycat.jpg
http://localhost/pics/mycat-s.jpg
http://localhost/pics/mycat-m.jpg
http://localhost/pics/mycat-l.jpg
```

These would be the original, 256px wide, 512px wide, and 1024px wide versions of that image.  Fireball will not increase the size of an image, if the resize is greater than the original, the original is used.
