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

