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

import ImageTile from 'ol/ImageTile';

export function eachPixel(data, bandOffs, bandsize, fn) {
  const pixel = bandOffs.map(() => 0);
  const ii = bandOffs.length;
  for (let b = 0; b < bandsize; b++) {
    for (let i = 0; i < ii; i++) {
      pixel[i] = data[b + bandOffs[i]];
    }
    // feed the dataFn the pixel
    fn(pixel, b);
  }
}

/** Tile class for rendering NumpyTile data
 */
export class NumpyTile extends ImageTile {
  constructor(
    tileCoord,
    state,
    src,
    crossOrigin,
    tileLoadFunction,
    opt_options = {}
  ) {
    super(tileCoord, state, src, crossOrigin, tileLoadFunction, opt_options);
    this.bandSize = opt_options.bandSize || 256 * 256;
    // mixin the numpy tile, undefined is fine.
    this.numpyTile = opt_options.numpyTile;
    this.bands = opt_options.bands;
  }

  /** Apply a function to each pixel in the tile.
   *
   *  @param {Function} dataFn - Function to apply to the pixels.
   *
   * @returns {array} The results of applying the function.
   */
  forPixel(dataFn) {
    // empty arrays get empty results.
    if (!this.numpyTile || !this.numpyTile.data) {
      return [];
    }
    return eachPixel(
      this.numpyTile.data,
      this.getBandOffsets(this.bands),
      this.bandSize,
      dataFn
    );
  }

  /** Get the starting position of all bands in the tile.
   *
   *  @returns {array}
   */
  getBandOffsets() {
    return this.bands.map((band, idx) => idx * this.bandSize);
  }

  /** Get an individual pixel values.
   *
   *  @param {number} idx - The pixel position
   *
   * @returns {array} Array containing band values in order.
   */
  getPixel(idx) {
    return this.bands.map(
      (b, i) => this.numpyTile.data[i * this.bandSize + idx]
    );
  }
}

export default NumpyTile;
