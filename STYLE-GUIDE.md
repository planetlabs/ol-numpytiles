# Creating style functions

## Basic RGB styles

```
{
  // regardless of the band order (r,g,b,a) or (b,g,r,n,a) the 
  //  style will return a scaled (0-255) RGBA image.
  name: 'rgb',
  options: {
    // PIXEL DEPTH is the maximum value for an individual pixel.
    // Regular images are 255, but multi-byte / 16-bit images can go up to 65,000+,
    // 12-bit images go to a max of 4096
    pixelDepth: 255,
  }
}
```

## Grayscale

```
{
  name: 'gray',
}
```

## User defined band math

The syntax for mathematic statements is provided by the [expr-eval](https://github.com/silentmatt/expr-eval) module. It features its own documentation for which mathetmatic operations are available.

NumpyLayer adds one syntax tool, the `:=` operation. Using `:=` adds that variables name to the `results` scope.

Every function will get the following variables in its scope:
 * bands - The values of the pixel (e.g. 100,54,233,255)
 * vmin - The minimum values found in each band (e.g. 10, 0, 0, 0)
 * vmax - The maximum values found in each band
 * bandmap - An object relating the name of each band with the index of in bands ({r: 0, g: 1, b: 2, a: 3})
 * results - The mutable object for the function.

For the function to work results must have `red`, `green`, and `blue` values set.

## Basic RGB function

```
red_f := 255 / (vmax[bandmap.r] - vmin[bandmap.r])
blue_f := 255 / (vmax[bandmap.b] - vmin[bandmap.b])
green_f := 255 / (vmax[bandmap.g] - vmin[bandmap.g])
red := (bands[bandmap.r] - vmin[bandmap.r]) * results.red_f
blue := (bands[bandmap.b] - vmin[bandmap.b]) * results.blue_f
green := (bands[bandmap.g] - vmin[bandmap.g]) * results.green_f
```

## CIR Example

```
red_f := 255 / (vmax[bandmap.n] - vmin[bandmap.n])
blue_f := 255 / (vmax[bandmap.b] - vmin[bandmap.b])
green_f := 255 / (vmax[bandmap.g] - vmin[bandmap.g])
red := (bands[bandmap.n] - vmin[bandmap.n]) * results.red_f
blue := (bands[bandmap.b] - vmin[bandmap.b]) * results.blue_f
green := (bands[bandmap.g] - vmin[bandmap.g]) * results.green_f
```

## NDVI Example

```
r := bands[bandmap.r]
nir := bands[bandmap.n]
ndvi := ((results.nir - results.r) / (results.nir + results.r))  * 128 + 128
red := 50
green := results.ndvi
blue := 50
```
