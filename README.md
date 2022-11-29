# OpenLayers NumpyTiles support

OpenLayers support for the [NumpyTiles specification.](https://github.com/planetlabs/numpytiles-spec/)

## Developing locally

After cloning the repository, run build, and use `npm link`. Example below:

```
$ npm install
$ npm run build
$ cd dist/
$ npm link
$ cd [to your project]
$ npm link @planet/ol-numpytiles
```

## Including in a project

OpenLayers now supports DataTile Sources. The NumpyLoader can be used
in conjunction with that in order to create full bitdepth raster layers.

```
import NumpyLoader from "@planet/ol-numpytiles"
```


## Publishing

Please only publish the `dist/` directory.

```
$ npm publish ./dist/
```

## Demo!

[Live demo is available from OpenLayers!](https://openlayers.org/en/latest/examples/numpytile.html)

The demo can be run locally using `npm start`.
