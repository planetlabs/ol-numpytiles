/* Copyright 2021 Planet Labs Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** @module maths
 */

/** The style functions do in-place manuplation.
 *  Javascript passes the array as reference and it
 *  is possible to just set the index to the desired
 *  value.
 */
export const styleFuncs = {
  // RGB will resolve the band order and return the RGBA pixel
  rgb: (bandValues, bandMap) => {
    const red = bandValues[bandMap.r];
    const green = bandValues[bandMap.g];
    const blue = bandValues[bandMap.b];
    bandValues[0] = red;
    bandValues[1] = green;
    bandValues[2] = blue;
    bandValues[3] = bandValues[bandMap.a] ? 255 : 0;
  },
  // gray assumes the first three bands are visual, averages them.
  gray: (bandValues, bandMap) => {
    // average the first three bands.
    let sum = bandValues.slice(0, 3).reduce((s, val) => s + val);
    sum = sum / 3;
    bandValues[0] = sum;
    bandValues[1] = sum;
    bandValues[2] = sum;
    bandValues[3] = bandValues[bandMap.a] ? 255 : 0;
  },
  // pending is like grey but with less transparency
  pending: (bandValues, bandMap) => {
    const gray = Math.min(
      255,
      0.3 * bandValues[0] + 0.6 * bandValues[1] + 0.1 * bandValues[2] + 100
    );
    bandValues[0] = gray;
    bandValues[1] = gray;
    bandValues[2] = gray;
    // half transparency.
    bandValues[3] = bandValues[bandMap.a] ? 128 : 0;
  },
  // This is used for diagnostics and only renders
  //  the red band.
  onlyRed: (bandValues, bandMap) => {
    bandValues[0] = bandValues[bandMap.r];
    bandValues[1] = 0;
    bandValues[2] = 0;
    bandValues[3] = bandValues[bandMap.a] ? 255 : 0;
  },
  // values uses the first band's value across
  // the RGB bands.
  value: (bandValues, bandMap) => {
    const v = bandValues[0];
    bandValues[0] = v;
    bandValues[1] = v;
    bandValues[2] = v;
    bandValues[3] = bandValues[bandMap.a] ? 255 : 0;
  },
};

/** Create a curve-application style function.
 *
 *  @param {array} curves - 2D Array.
 *                          First dimension is the bands,
 *                          Second dimension contains a float value for each input value.
 *
 * @returns {Function}
 */
export function applyCurves(curves, pixelDepth) {
  const max = pixelDepth - 1;
  return pix => {
    pix[0] = curves[0][pix[0]] * max;
    pix[1] = curves[1][pix[1]] * max;
    pix[2] = curves[2][pix[2]] * max;
  };
}

/** Get a histogram for an individual tile
 *
 *  @param {NumpyTile} numpyTile - The input NumpyTile to calculate.
 *  @param {number} pixelDepth - Maximum value per band.
 *  @param {array}  bands - Bands to calculate
 *  @param {array} [optAccum=undefined] - Previous histograms. When given, the two will be added together.
 *
 *  @returns {array} The new histogram
 */
export function getHistogram(numpyTile, pixelDepth, bands, optAccum) {
  const nBands = bands.length;
  const accum = optAccum || bands.map(() => new Uint32Array(pixelDepth));
  if (!optAccum) {
    accum.cnt = 0;
  }
  const alpha = nBands - 1;
  numpyTile.forPixel(px => {
    if (!px[alpha]) {
      return;
    }
    for (let i = 0; i < nBands; i++) {
      accum[i][px[i]]++;
    }
    accum.cnt++;
  });
  return accum;
}

/** Compute band ranges based on the histogram.
 *
 *  @param {array} histogram - The histogram from getHistogram
 *  @param {number} [loThreshold=0.5] - The percentage of pixels which must be collected before setting the bottom of the range.
 *  @param {number} [loThreshold=0.5] - The percentage of pixels which must be collected before setting the top of the range.
 *
 * @returns {array} In band order: [[min, max], ..., [min, max]]
 */
export function computeRanges(histogram, loThreshold = 0.5, hiThreshold = 0.5) {
  const bandRanges = [];
  const loAllocThreshold = Math.floor((loThreshold / 100) * histogram.cnt);
  const hiAllocThreshold = Math.floor((hiThreshold / 100) * histogram.cnt);
  for (let b = 0, bb = histogram.length; b < bb; b++) {
    let low = null;
    let high = null;
    let hiAlloc = 0;
    let loAlloc = 0;

    const bandLen = histogram[b].length;
    if (histogram.cnt > 0) {
      for (let i = 0; low === null && i < bandLen; i++) {
        if (histogram[b][i] > 0) {
          loAlloc += histogram[b][i];
          if (loAlloc > loAllocThreshold) {
            low = i;
          }
        }
      }
      for (let i = bandLen - 1; high === null && i >= 0; i--) {
        if (histogram[b][i] > 0) {
          hiAlloc += histogram[b][i];
          if (hiAlloc > hiAllocThreshold) {
            high = i;
          }
        }
      }
    }
    bandRanges.push([low, high]);
  }
  return bandRanges;
}

/** Average the ranges from computeRanges
 *
 *  @param {array} ranges
 *
 * @returns {array} The stretched version of the ranges.
 */
export function contrastStretchAverage(ranges) {
  const min = Math.floor((ranges[0][0] + ranges[1][0] + ranges[2][0]) / 3);
  const max = Math.floor((ranges[0][1] + ranges[1][1] + ranges[2][1]) / 3);
  const stretched = new Array(3);
  for (let i = 0, len = ranges.length; i < len; i++) {
    stretched[i] = [min, max];
  }
  return stretched;
}

/** @function Get a level to curve function
 *
 *  @param {number} pixelDepth - maximum value in a band
 *
 * @returns {Function} Style function.
 */
export const levelsToCurve = pixelDepth => {
  return inout => {
    const [input, output] = inout;
    const lo = output[0] / pixelDepth;
    const ho = output[1] / pixelDepth;
    const curve = new Float32Array(pixelDepth);
    const step = (ho - lo) / (input[1] - input[0]);
    for (let i = 0; i < pixelDepth; i++) {
      if (i < input[0]) {
        curve[i] = lo;
      } else if (i > input[1]) {
        curve[i] = ho;
      } else {
        curve[i] = lo + step * (i - input[0]);
      }
    }
    return curve;
  };
};

/** Expect the layout of the lookup table to be a 2D array of:
 *  [ [red0 ... redMax], [green0 ... greenMax], [blue0 ... blueMax]]
 *
 *  @param {array} lookupTable - As defined above.
 *  @param {array} ranges - Ranges from computeRanges
 *
 *  @returns {Function} Style function for a lookup table.
 */
export function lookupTableStyle(lookupTable, ranges) {
  const redLen = lookupTable[0].length;
  const greenLen = lookupTable[1].length;
  const blueLen = lookupTable[2].length;

  return (bands, bandmap) => {
    const redF = redLen / (ranges[bandmap.r][1] - ranges[bandmap.r][0]);
    const red =
      lookupTable[0][
        Math.floor(redF * (bands[bandmap.r] - ranges[bandmap.r][0]))
      ];

    const greenF = greenLen / (ranges[bandmap.g][1] - ranges[bandmap.g][0]);
    const green =
      lookupTable[2][
        Math.floor(greenF * (bands[bandmap.g] - ranges[bandmap.g][0]))
      ];

    const blueF = blueLen / (ranges[bandmap.b][1] - ranges[bandmap.b][0]);
    const blue =
      lookupTable[1][
        Math.floor(blueF * (bands[bandmap.b] - ranges[bandmap.b][0]))
      ];

    bands[0] = red;
    bands[1] = green;
    bands[2] = blue;
  };
}

const matMult = (a, b) => {
  const c = [];
  for (let i = 0; i < 4; i++) {
    c[i] = new Array(4);
  }
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      c[y][x] =
        b[y][0] * a[0][x] +
        b[y][1] * a[1][x] +
        b[y][2] * a[2][x] +
        b[y][3] * a[3][x];
    }
  }
  return c;
};

const prepareBCSMat = (brt, con, s) => {
  const brtm = [
    [brt, 0, 0, 0],
    [0, brt, 0, 0],
    [0, 0, brt, 0],
    [0, 0, 0, 1],
  ];
  const rwgt = 0.3086;
  const gwgt = 0.6094;
  const bwgt = 0.082;
  const a = (1.0 - s) * rwgt + s;
  const b = (1.0 - s) * rwgt;
  const c = (1.0 - s) * rwgt;
  const d = (1.0 - s) * gwgt;
  const e = (1.0 - s) * gwgt + s;
  const f = (1.0 - s) * gwgt;
  const g = (1.0 - s) * bwgt;
  const h = (1.0 - s) * bwgt;
  const i = (1.0 - s) * bwgt + s;
  const satm = [
    [a, b, c, 0.0],
    [d, e, f, 0.0],
    [g, h, i, 0.0],
    [0.0, 0.0, 0.0, 1.0],
  ];
  const conm = [
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.0],
    [con, con, con, 1.0],
  ];
  return matMult(matMult(brtm, conm), satm);
};

/** Matrix math application for brightness, contrast and saturation.
 *
 *  adopted from http://www.graficaobscura.com/matrix/index.html
 *  note: an attempt was made to use the approach taken in the webgl pixel shader
 *  but this did not yield equal results and was significantly slower in doing
 *  so...
 *  ranges + meanings:
 *  @param {number} brt - value is multiplied for each channel, i.e. 1 is identity
 *  @param {number} con - value is added for each channel, i.e. 0 is identity
 *  @param {number} sat - channels are modified but maintain luminance, -1 is complement, 0 is
 *        luminance (black/white), 1 is identity, >2 not often useful
 *
 *  @revisit as the algorithm notes, this approach expects a linear color space
 *           does this need an srgb conversion or is adequate as-is?
 *
 * @returns {Function} style function
 */
export function applyBrightnessContrastSaturation(brt, con, s) {
  const mat = prepareBCSMat(brt, con, s);
  return px => {
    const r = px[0];
    const g = px[1];
    const b = px[2];
    px[0] = r * mat[0][0] + g * mat[1][0] + b * mat[2][0] + mat[3][0];
    px[1] = r * mat[0][1] + g * mat[1][1] + b * mat[2][1] + mat[3][1];
    px[2] = r * mat[0][2] + g * mat[1][2] + b * mat[2][2] + mat[3][2];
    // note - we're taking advantage of receiver of pix using a clamped uint8
    //        to handle min/max of 0, 255
    return px;
  };
}
