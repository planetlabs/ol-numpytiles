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

```
import {NumpyLayer, NumpySource} from "@planet/ol-numpytiles/ol"
```


## Publishing

Please only publish the `dist/` directory.

```
$ npm publish ./dist/
```

## Worker optimisation

The Layer rendering performance can be improved by using WebWorkers.
To use it, the NumpyWorker needs imported the project and passed to the NumpyLayer.

*Based on using the webpack worker-loader module.*

```
import NumpyWorker from 'worker-loader!@planet/ol-numpytiles/worker';
...
const numpySource = new NumpySource();
numpySource.set('bands', ['r', 'g', 'b', 'a']);
numpySource.set('dtype', 'uint8');
numpySource.set('pixelDepth', 256);

const numpyLayer = new NumpyLayer({
  source: numpySource,
  workerClass: NumpyWorker,
  style: {
    name: 'rgb',
  },
});
```

## Demo!

[Live demo available here!](https://planetlabs.github.io/ol-numpytiles/)

The demo can be run locally using `npm start`.
