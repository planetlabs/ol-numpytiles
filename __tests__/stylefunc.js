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

import Canvas, {ImageData} from 'canvas';
import {SampleTileInfo as TileInfo, loadSampleTile} from './util';
import {compileUserFunction, createStyleFunc, draw} from '../src/stylefunc';
import {readFileSync} from 'fs';

global.ImageData = ImageData;

describe('Test user defined functions', () => {
  it('does a basic RGB function with a shifted histogram', () => {
    const ranges = [
      [100, 1000],
      [100, 1000],
      [100, 1000],
      [100, 1000],
      [100, 1000],
    ];

    const pixel = [300, 400, 500, 100, 100];

    const funcDef = `
      red_f := 255 / (vmax[bandmap.r] - vmin[bandmap.r])
      blue_f := 255 / (vmax[bandmap.b] - vmin[bandmap.b])
      green_f := 255 / (vmax[bandmap.g] - vmin[bandmap.g])
      red := (bands[bandmap.r] - vmin[bandmap.r]) * results.red_f
      blue := (bands[bandmap.b] - vmin[bandmap.b]) * results.blue_f
      green := (bands[bandmap.g] - vmin[bandmap.g]) * results.green_f
    `;

    const bandmap = {
      r: 2,
      g: 1,
      b: 0,
      n: 3,
      a: 4,
    };

    const userFunc = compileUserFunction(funcDef, {ranges});
    userFunc(pixel, bandmap);
    expect(pixel).toEqual([113, 85, 56, 255, 100]);
  });

  it('does the other example functions', () => {
    const ranges = [
      [100, 1000],
      [100, 1000],
      [100, 1000],
      [100, 1000],
    ];

    let pixel = [300, 400, 500, 600, 100];

    const CIR = `
      red_f := 255 / (vmax[bandmap.n] - vmin[bandmap.n])
      blue_f := 255 / (vmax[bandmap.b] - vmin[bandmap.b])
      green_f := 255 / (vmax[bandmap.g] - vmin[bandmap.g])
      red := (bands[bandmap.n] - vmin[bandmap.n]) * results.red_f
      blue := (bands[bandmap.b] - vmin[bandmap.b]) * results.blue_f
      green := (bands[bandmap.g] - vmin[bandmap.g]) * results.green_f
    `;

    const CIR_ANSWER = [141, 85, 56, 255, 100];

    const NDVI = `
      r := bands[bandmap.r]
      nir := bands[bandmap.n]
      ndvi := ((results.nir - results.r) / (results.nir + results.r))  * 128 + 128
      red := 50
      green := results.ndvi
      blue := 50
    `;

    const NDVI_ANSWER = [50, 42, 50, 255, 100];

    const bandmap = {
      r: 2,
      g: 1,
      b: 0,
      n: 3,
      a: 4,
    };

    const cirFn = compileUserFunction(CIR, {ranges});
    cirFn(pixel, bandmap);
    expect(pixel).toEqual(CIR_ANSWER);

    pixel = [300, 400, 500, 100, 100];
    const ndviFn = compileUserFunction(NDVI, {ranges});
    ndviFn(pixel, bandmap);
    expect(pixel).toEqual(NDVI_ANSWER);
  });

  it('draws an RGB PNG from an analytic numpy tile', () => {
    const numpyTile = loadSampleTile();
    const canvas = new Canvas(numpyTile.shape[1], numpyTile.shape[2]);
    const styleFunc = createStyleFunc('rgb', {pixelDepth: 3000});
    draw(
      canvas,
      numpyTile,
      TileInfo.dtype,
      ['b', 'g', 'r', 'n', 'a'],
      styleFunc
    );

    const resultBuffer = canvas.toBuffer('image/png');
    const pngBuffer = Buffer.from(
      readFileSync('./__tests__/data/sample-analytic-tile-rgb.png', null).buffer
    );
    expect(Buffer.compare(resultBuffer, pngBuffer)).toEqual(0);
  });

  it('throws an error when there is not red, green, or blue', () => {
    const ranges = [];
    const failures = [
      '_red := 100\nblue := 100\ngreen := 100',
      'red := 100\n_blue := 100\ngreen := 100',
      'red := 100\nblue := 100\n_green := 100',
    ];

    failures.forEach(failMe => {
      let fn = null;
      try {
        fn = compileUserFunction(failMe, {ranges});
      } catch (err) {
        // swallow the error
      }
      if (fn !== null) {
        throw 'Failed to fail function with missing band!';
      }
    });
  });
});

describe('Test alpha channel handling in user functions', () => {
  const ranges = [
    [0, 255],
    [0, 255],
    [0, 255],
    [0, 255],
  ];
  const bandmap = {
    r: 0,
    g: 1,
    b: 2,
    a: 3,
  };

  it('Defines alpha', () => {
    const fnText = `
      red := 100
      green := 100
      blue := 100
      alpha := 128
    `;

    const fn = compileUserFunction(fnText, {ranges});
    const pixel = [0, 0, 0, 0];
    fn(pixel, bandmap);
    expect(pixel).toEqual([100, 100, 100, 128]);
  });

  it('Does not define alpha AND should be 255', () => {
    const fnText = `
      red := 100
      green := 100
      blue := 100
    `;

    const fn = compileUserFunction(fnText, {ranges});
    const pixel = [0, 0, 0, 255];
    fn(pixel, bandmap);
    expect(pixel).toEqual([100, 100, 100, 255]);
  });

  it('Does not define alpha AND should be 0', () => {
    const fnText = `
      red := 100
      green := 100
      blue := 100
    `;

    const fn = compileUserFunction(fnText, {ranges});
    const pixel = [0, 0, 0, 0];
    fn(pixel, bandmap);
    expect(pixel).toEqual([100, 100, 100, 0]);
  });
});
