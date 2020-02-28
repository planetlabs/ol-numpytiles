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

import {fromArrayBuffer} from '../src/NumpyLoader';
import {readFileSync} from 'fs';

/* This is broken out so it can be used in other tests
 * which require loading the tile.
 */
export const loadSampleTile = (analytic = true) => {
  const tileName = analytic
    ? 'sample-analytic-tile.npy'
    : 'sample-rgb-tile.npy';
  const buffer = readFileSync(`./__tests__/data/${tileName}`, null).buffer;
  return fromArrayBuffer(buffer);
};

/* Prevent needing to duplicate this data in vairous
 * tests.
 */
export const SampleTileInfo = {
  dtype: 'uint16',
  bands: ['r', 'g', 'b', 'n', 'a'],
};
