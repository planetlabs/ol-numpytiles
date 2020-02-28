/* Copyright 2020-present Planet Labs Inc.
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

import {
  applyBrightnessContrastSaturation,
  applyCurves,
  computeRanges,
  contrastStretchAverage,
  getHistogram,
  levelsToCurve,
  styleFuncs,
} from '../src/maths';

import NumpyTile from '../src/NumpyTile';
import {loadSampleTile} from './util';

const RGBA_BANDMAP = {
  r: 0,
  g: 1,
  b: 2,
  a: 3,
};

const BGRNA_BANDMAP = {
  r: 2,
  g: 1,
  b: 0,
  n: 3,
  a: 4,
};

describe('Test all the style functions', () => {
  it('does RGB', () => {
    const pixel = [100, 200, 300, 400];
    styleFuncs.rgb(pixel, RGBA_BANDMAP);
    expect(pixel).toEqual([100, 200, 300, 255]);
  });

  it('gets the same answer for a 5-band image', () => {
    const pixel = [300, 200, 100, 99, 400];
    styleFuncs.rgb(pixel, BGRNA_BANDMAP);
    expect(pixel.slice(0, 4)).toEqual([100, 200, 300, 255]);
  });

  it('does gray', () => {
    const pixel = [100, 200, 300, 255];
    styleFuncs.gray(pixel, RGBA_BANDMAP);
    expect(pixel).toEqual([200, 200, 200, 255]);
  });

  it('renders as pending', () => {
    const pixel = [100, 200, 300, 255];
    styleFuncs.pending(pixel, RGBA_BANDMAP);
    expect(pixel).toEqual([255, 255, 255, 128]);
  });

  it('does only-red', () => {
    const pixel = [100, 200, 300, 400];
    styleFuncs.onlyRed(pixel, RGBA_BANDMAP);
    expect(pixel).toEqual([100, 0, 0, 255]);
  });
});

describe('Test histogram and related functions', () => {
  let numpyTile, histogram;

  // before each test mock the numpy tile
  beforeEach(() => {
    const sampleTile = loadSampleTile();
    const fakeLoader = () => {};
    numpyTile = new NumpyTile(
      [0, 0, 0],
      0,
      'fake-tile.npy',
      'anonymous',
      fakeLoader,
      {
        numpyTile: sampleTile,
        bands: ['b', 'g', 'r', 'n', 'a'],
      }
    );

    histogram = getHistogram(numpyTile, 10000, ['b', 'g', 'r', 'n', 'a']);
  });

  it('test the histogram', () => {
    const nPixels = 256 * 256;
    // this is less a validation test and more a "does it return something"
    expect(histogram.cnt).toEqual(nPixels);
    // sanity check on the blue channel
    let sum = 0;
    for (let i = 0, ii = histogram[0].length; i < ii; i++) {
      sum += histogram[0][i];
    }
    expect(sum).toBe(nPixels);
  });

  it('compute ranges from the hsitogram', () => {
    const ranges = computeRanges(histogram, 0.25, 0.25);
    const shouldBe = [
      [54, 1077],
      [175, 1327],
      [106, 1455],
      [1506, 5460],
      [null, null],
    ];
    expect(ranges).toEqual(shouldBe);
  });

  it('computes the contrastStretchAverage', () => {
    const ranges = computeRanges(histogram, 0.25, 0.25);
    const levels = contrastStretchAverage(ranges);
    expect(levels.length).toEqual(5);
    expect(levels[0].length).toEqual(2);
    expect(levels[1]).toEqual([111, 1286]);
  });

  it('creates a curve from levels', () => {
    const ranges = computeRanges(histogram, 0.25);
    const levels = ranges.map(range => [range, [0, 10000]]);
    const curves = levels.map(levelsToCurve(10000));
    expect(curves.length).toEqual(levels.length);
    expect(curves[0].length).toEqual(10000);

    // apply the curves.
    const curveFn = applyCurves(curves, 10000);
    const before = numpyTile.getPixel(0);
    const after = before.slice();
    curveFn(after);
    expect(before).not.toEqual(after);
  });

  it('applies brightness, contrast, saturation', () => {
    // identity
    expect(
      applyBrightnessContrastSaturation(1, 0, 1)([128, 128, 128])
    ).toEqual([128, 128, 128]);
    // @todo more
  });
});
