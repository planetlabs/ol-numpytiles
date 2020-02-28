## Modules

<dl>
<dt><a href="#module_NumpyLoader">NumpyLoader</a></dt>
<dd><p>Client-side parser for .npy files</p>
<p> The numpy format specification is <a href="http://docs.scipy.org/doc/numpy-dev/neps/npy-format.html">here</a>.
 This code is inspired by the GIST found <a href="https://gist.github.com/nvictus/88b3b5bfe587d32ac1ab519fd0009607">here</a> but has been heavily modified.</p>
</dd>
<dt><a href="#module_maths">maths</a></dt>
<dd></dd>
<dt><a href="#module_ol">ol</a></dt>
<dd><p>This is really an index file used to import the Layer and Source
in a convenient fashion for a typical OpenLayers project.</p>
<p>Exports NumpyLayer and NumpySource.</p>
</dd>
<dt><a href="#module_stylefunc">stylefunc</a></dt>
<dd><p>Collection of functions used for styling tile data.</p>
</dd>
<dt><a href="#module_worker">worker</a></dt>
<dd><p>Very basic wrapper around createStyleFunc which workerizes it.</p>
<p>Example usage:</p>
<pre><code>  import NumpyWorker from &#39;worker-loader!@planet/ol-numpytiles/worker&#39;;
  import {NumpyLayer, NumpySource} from &#39;@planet/ol-numpytiles/ol&#39;;

  const numpySource = new NumpySource();
  const numpyLayer = new NumpyLayer({
    source: numpySource,
    workerClass: NumpyWorker,
    maxWorkers: 2,
  });</code></pre>
</dd>
</dl>

## Classes

<dl>
<dt><a href="#NumpySource">NumpySource</a></dt>
<dd><p>Map source for NumpyTile server.</p>
</dd>
<dt><a href="#NumpyTile">NumpyTile</a></dt>
<dd><p>Tile class for rendering NumpyTile data</p>
</dd>
</dl>

<a name="module_NumpyLoader"></a>

## NumpyLoader
Client-side parser for .npy files

 The numpy format specification is [here](http://docs.scipy.org/doc/numpy-dev/neps/npy-format.html).
 This code is inspired by the GIST found [here](https://gist.github.com/nvictus/88b3b5bfe587d32ac1ab519fd0009607) but has been heavily modified.


* [NumpyLoader](#module_NumpyLoader)
    * [.isNumpyArr(buf)](#module_NumpyLoader.isNumpyArr) ⇒ <code>boolean</code>
    * [.fromArrayBuffer(buf)](#module_NumpyLoader.fromArrayBuffer) ⇒

<a name="module_NumpyLoader.isNumpyArr"></a>

### NumpyLoader.isNumpyArr(buf) ⇒ <code>boolean</code>
Sniff test to see if an arrayBuffer contains a Numpy arr

**Kind**: static method of [<code>NumpyLoader</code>](#module_NumpyLoader)  
**Returns**: <code>boolean</code> - Returns true if likely a numpy array, false otherwise.  

| Param | Type | Description |
| --- | --- | --- |
| buf | <code>ArrayBuffer</code> | The array buffer to test. |

<a name="module_NumpyLoader.fromArrayBuffer"></a>

### NumpyLoader.fromArrayBuffer(buf) ⇒
Read an ArrayBuffer as a NumpyTile

**Kind**: static method of [<code>NumpyLoader</code>](#module_NumpyLoader)  
**Returns**: Javascript typed array.  

| Param | Type | Description |
| --- | --- | --- |
| buf | <code>ArrayBuffer</code> | Numpy array to convert to Javascript typed array. |

<a name="module_maths"></a>

## maths

* [maths](#module_maths)
    * _static_
        * [.styleFuncs](#module_maths.styleFuncs)
        * [.applyCurves(curves)](#module_maths.applyCurves) ⇒ <code>function</code>
        * [.getHistogram(numpyTile, pixelDepth, bands, [optAccum])](#module_maths.getHistogram) ⇒ <code>array</code>
        * [.computeRanges(histogram, [loThreshold], [loThreshold])](#module_maths.computeRanges) ⇒ <code>array</code>
        * [.contrastStretchAverage(ranges)](#module_maths.contrastStretchAverage) ⇒ <code>array</code>
        * [.lookupTableStyle(lookupTable, ranges)](#module_maths.lookupTableStyle) ⇒ <code>function</code>
        * [.applyBrightnessContrastSaturation(brt, con, sat)](#module_maths.applyBrightnessContrastSaturation) ⇒ <code>function</code>
    * _inner_
        * [~Get a level to curve function(pixelDepth)](#module_maths..Get a level to curve function) ⇒ <code>function</code>

<a name="module_maths.styleFuncs"></a>

### maths.styleFuncs
The style functions do in-place manuplation.
 Javascript passes the array as reference and it
 is possible to just set the index to the desired
 value.

**Kind**: static constant of [<code>maths</code>](#module_maths)  
<a name="module_maths.applyCurves"></a>

### maths.applyCurves(curves) ⇒ <code>function</code>
Create a curve-application style function.

**Kind**: static method of [<code>maths</code>](#module_maths)  

| Param | Type | Description |
| --- | --- | --- |
| curves | <code>array</code> | 2D Array.                          First dimension is the bands,                          Second dimension contains a float value for each input value. |

<a name="module_maths.getHistogram"></a>

### maths.getHistogram(numpyTile, pixelDepth, bands, [optAccum]) ⇒ <code>array</code>
Get a histogram for an individual tile

**Kind**: static method of [<code>maths</code>](#module_maths)  
**Returns**: <code>array</code> - The new histogram  

| Param | Type | Description |
| --- | --- | --- |
| numpyTile | [<code>NumpyTile</code>](#NumpyTile) | The input NumpyTile to calculate. |
| pixelDepth | <code>number</code> | Maximum value per band. |
| bands | <code>array</code> | Bands to calculate |
| [optAccum] | <code>array</code> | Previous histograms. When given, the two will be added together. |

<a name="module_maths.computeRanges"></a>

### maths.computeRanges(histogram, [loThreshold], [loThreshold]) ⇒ <code>array</code>
Compute band ranges based on the histogram.

**Kind**: static method of [<code>maths</code>](#module_maths)  
**Returns**: <code>array</code> - In band order: [[min, max], ..., [min, max]]  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| histogram | <code>array</code> |  | The histogram from getHistogram |
| [loThreshold] | <code>number</code> | <code>0.5</code> | The percentage of pixels which must be collected before setting the bottom of the range. |
| [loThreshold] | <code>number</code> | <code>0.5</code> | The percentage of pixels which must be collected before setting the top of the range. |

<a name="module_maths.contrastStretchAverage"></a>

### maths.contrastStretchAverage(ranges) ⇒ <code>array</code>
Average the ranges from computeRanges

**Kind**: static method of [<code>maths</code>](#module_maths)  
**Returns**: <code>array</code> - The stretched version of the ranges.  

| Param | Type |
| --- | --- |
| ranges | <code>array</code> | 

<a name="module_maths.lookupTableStyle"></a>

### maths.lookupTableStyle(lookupTable, ranges) ⇒ <code>function</code>
Expect the layout of the lookup table to be a 2D array of:
 [ [red0 ... redMax], [green0 ... greenMax], [blue0 ... blueMax]]

**Kind**: static method of [<code>maths</code>](#module_maths)  
**Returns**: <code>function</code> - Style function for a lookup table.  

| Param | Type | Description |
| --- | --- | --- |
| lookupTable | <code>array</code> | As defined above. |
| ranges | <code>array</code> | Ranges from computeRanges |

<a name="module_maths.applyBrightnessContrastSaturation"></a>

### maths.applyBrightnessContrastSaturation(brt, con, sat) ⇒ <code>function</code>
Matrix math application for brightness, contrast and saturation.

 adopted from http://www.graficaobscura.com/matrix/index.html
 note: an attempt was made to use the approach taken in the webgl pixel shader
 but this did not yield equal results and was significantly slower in doing
 so...
 ranges + meanings:

**Kind**: static method of [<code>maths</code>](#module_maths)  
**Returns**: <code>function</code> - style function  
**Revisit**: as the algorithm notes, this approach expects a linear color space
          does this need an srgb conversion or is adequate as-is?  

| Param | Type | Description |
| --- | --- | --- |
| brt | <code>number</code> | value is multiplied for each channel, i.e. 1 is identity |
| con | <code>number</code> | value is added for each channel, i.e. 0 is identity |
| sat | <code>number</code> | channels are modified but maintain luminance, -1 is complement, 0 is        luminance (black/white), 1 is identity, >2 not often useful |

<a name="module_maths..Get a level to curve function"></a>

### maths~Get a level to curve function(pixelDepth) ⇒ <code>function</code>
**Kind**: inner method of [<code>maths</code>](#module_maths)  
**Returns**: <code>function</code> - Style function.  

| Param | Type | Description |
| --- | --- | --- |
| pixelDepth | <code>number</code> | maximum value in a band |

<a name="module_ol"></a>

## ol
This is really an index file used to import the Layer and Source
in a convenient fashion for a typical OpenLayers project.

Exports NumpyLayer and NumpySource.

<a name="module_stylefunc"></a>

## stylefunc
Collection of functions used for styling tile data.


* [stylefunc](#module_stylefunc)
    * [.createStyleFunc(funcName, options)](#module_stylefunc.createStyleFunc) ⇒ <code>function</code>
    * [.processData(data, bandsize, bandOffset, bandMap, rgbaFunc)](#module_stylefunc.processData)
    * [.drawArray(rgbaFunc, data)](#module_stylefunc.drawArray)
    * [.draw(canvas, npyTile, dtype, bands, rgbaFunc)](#module_stylefunc.draw)

<a name="module_stylefunc.createStyleFunc"></a>

### stylefunc.createStyleFunc(funcName, options) ⇒ <code>function</code>
Primary function for creating a new style function

**Kind**: static method of [<code>stylefunc</code>](#module_stylefunc)  
**Returns**: <code>function</code> - The style function.  

| Param | Type | Description |
| --- | --- | --- |
| funcName | <code>string</code> | The basic rendering function for the data                   Valid values are: rgb, lut, grey, onlyRed, pending, value |
| options | <code>Object</code> |  |
| [options.ranges] | <code>array</code> | 2D array of [[minValue, maxValue], ...] in band order. |
| [options.lut] | <code>array</code> | Used for lookup table styling. 2D array of [[0, .., max], ...] in band order, uses 0-255 as the output values. |
| [options.curves] | <code>array</code> | 2D array of [[min, ..., max], ...] in band order, uses 0-1 floating point values to curve the data. |
| [options.pixelDepth] | <code>number</code> | The maximum value for an individual band in a pixel. |
| [options.bcs] | <code>array</code> | [brightness, contrast, saturation]. A value of 1 is the identity all others shift the coloration based on a Brightness, Contrast, Saturation matrix. |

<a name="module_stylefunc.processData"></a>

### stylefunc.processData(data, bandsize, bandOffset, bandMap, rgbaFunc)
Flattens the numpy data and runs the style function against it.

**Kind**: static method of [<code>stylefunc</code>](#module_stylefunc)  

| Param | Description |
| --- | --- |
| data | Numpy tile data. |
| bandsize | The size of the band (nominally 256 * 256) |
| bandOffset | The 0-th location for each band. |
| bandMap | An object mapping the band-names to band indexes |
| rgbaFunc | A function which inputs the pixel data and sets rgba values. |

<a name="module_stylefunc.drawArray"></a>

### stylefunc.drawArray(rgbaFunc, data)
Converts the band-sorted numpy tile into a flat-ImageData like array.

**Kind**: static method of [<code>stylefunc</code>](#module_stylefunc)  

| Param | Description |
| --- | --- |
| rgbaFunc | Function to take in all bands and set them to rgba |
| data | The data portion of the numpytile |

<a name="module_stylefunc.draw"></a>

### stylefunc.draw(canvas, npyTile, dtype, bands, rgbaFunc)
Draw the numpy data.

**Kind**: static method of [<code>stylefunc</code>](#module_stylefunc)  

| Param | Description |
| --- | --- |
| canvas | A canvas on which to draw. |
| npyTile | The numpy tile. |
| dtype | The data-type (uint16, byte) in the numpy tile. |
| bands | Order of the bands as they are laid out in the numpy tile. |
| rgbaFunc | A function which computes RGBA from the data. |

<a name="module_worker"></a>

## worker
Very basic wrapper around createStyleFunc which workerizes it.

Example usage:
 
```
  import NumpyWorker from 'worker-loader!@planet/ol-numpytiles/worker';
  import {NumpyLayer, NumpySource} from '@planet/ol-numpytiles/ol';

  const numpySource = new NumpySource();
  const numpyLayer = new NumpyLayer({
    source: numpySource,
    workerClass: NumpyWorker,
    maxWorkers: 2,
  });
```

