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

import NumpyTile from '../src/NumpyTile';
import {loadSampleTile} from './util';

const FAKE_LOADER = () => {};
describe('NumpyTile tests', () => {
  it('creates an populated NumpyTile', () => {
    const sampleTile = loadSampleTile();
    const numpyTile = new NumpyTile(
      [0, 0, 0],
      0,
      'fake-tile.npy',
      'anonymous',
      FAKE_LOADER,
      {
        numpyTile: sampleTile,
        bands: ['b', 'g', 'r', 'n', 'a'],
      }
    );

    // count the pixels
    let n = 0;
    numpyTile.forPixel(() => n++);
    expect(n).toEqual(256 * 256);
  });

  it('creats an empty NumpyTile', () => {
    const numpyTile = new NumpyTile(
      [0, 0, 0],
      0,
      'fake-tile.npy',
      'anonymous',
      FAKE_LOADER
    );
    let n = 0;
    numpyTile.forPixel(() => n++);
    expect(n).toEqual(0);
  });

  it('gets a pixels', () => {
    const sampleTile = loadSampleTile();
    const numpyTile = new NumpyTile(
      [0, 0, 0],
      0,
      'fake-tile.npy',
      'anonymous',
      FAKE_LOADER,
      {
        numpyTile: sampleTile,
        bands: ['b', 'g', 'r', 'n', 'a'],
      }
    );

    expect(numpyTile.getPixel(1)).toEqual([430, 668, 722, 2483, 65535]);
    expect(numpyTile.getPixel(100)).toEqual([304, 553, 428, 3470, 65535]);
  });
});
