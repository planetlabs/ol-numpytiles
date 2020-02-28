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

import * as loadnpy from './NumpyLoader';
import NumpyTile from './NumpyTile';
import TileState from 'ol/TileState.js';
import {TileImage} from 'ol/source';
import {createXYZ, extentFromProjection} from 'ol/tilegrid';
import {getHistogram} from './maths';

// @todo - don't model alpha completely, we just need a bit mask
export function maybeAddAlpha(tile, bands) {
  if (bands.indexOf('a') >= 0) {
    return tile;
  }
  const shape = [tile.shape[0] + 1, tile.shape[1], tile.shape[2]];
  const bandSize = tile.shape[1] * tile.shape[2];
  const data = new Uint16Array(tile.data.length + bandSize);
  const bandsIn = tile.shape[0];
  const alphaOffset = (shape[0] - 1) * bandSize;
  const a = 2 ** 16 - 1;
  let F = 0;
  for (let p = 0; p < bandSize; p++) {
    let noData = true;
    for (let i = 0; i < bandsIn; i++) {
      const idx = p + i * bandSize;
      const v = tile.data[idx];
      data[idx] = v;
      noData &= v === 0;
    }
    !noData && F++;
    data[p + alphaOffset] = noData ? 0 : a;
  }
  return {shape, data};
}

export function fetchTile(url) {
  return fetch(url).then(r => {
    // TiTiler returns 404 for a "dataset out of bounds" error
    // Planet Tile Server is planning to return 204
    if (r.status === 404 || r.status === 204) {
      // this is a "blank" tile.
      return {};
    } else if (r.status === 200) {
      return r.arrayBuffer().then(buffer => {
        // This will check mime-types in case a 200 is returned
        //  along with a PNG, XML, or JSON to represent an
        //  empty image.
        return loadnpy.fromArrayBuffer(buffer);
      });
    } else {
      throw new Error('Error fetching NumpyTile');
    }
  });
}

/**
 * Map source for NumpyTile server.
 *
 */
export class NumpySource extends TileImage {
  /**
   * Create a new NumpySource
   * @param {Object} options - Options for the NumpySource
   * @param {string} options.className - A CSS class name to set to the layer element.
   * @param {array}  [options.bands=['r', 'g', 'b', 'a']] - List of bands in the tiles
   * @param {array}  [options.pixelDepth=256] - Max value per band in a pixel
   * @param {string} [options.dtype='uint8'] - Numpy dtype for each pixel value.
   */
  constructor(optArgs) {
    const args = optArgs || {};

    args.projection =
      args.projection !== undefined ? args.projection : 'EPSG:3857';

    args.tileGrid =
      args.tileGrid !== undefined
        ? args.tileGrid
        : createXYZ({
            extent: extentFromProjection(args.projection),
            maxZoom: args.maxZoom,
            minZoom: args.minZoom,
            tileSize: args.tileSize,
          });

    args.tileLoadFunction = (tile, src) => {
      tile.bands = this.getBands();
      this.loading_ = true;

      fetchTile(src)
        .then(numpyTile => {
          if (numpyTile.shape) {
            tile.numpyTile = maybeAddAlpha(numpyTile, tile.bands);
          }
          tile.setState(TileState.LOADED);
        })
        .catch(err => {
          tile.setState(TileState.ERROR);
          if (args.onLoadTileError) {
            args.onLoadTileError(err);
          }
        })
        .finally(() => {
          // if all the tiles in the tile cache are loaded
          //  fire an event.
          let nTiles = 0;
          let ready = true;
          this.getTileCacheForProjection(this.getProjection()).forEach(
            checkTile => {
              const tileState = checkTile.getState();
              if (tileState === TileState.LOADING) {
                ready = false;
              }
              nTiles += 1;
            }
          );

          if (nTiles > 0 && ready) {
            this.loading_ = false;
            this.dispatchEvent('tilesloadend');
          }
        });
    };
    args.tileClass = NumpyTile;
    super(args);

    const additionalDefaults = {
      bands: ['r', 'g', 'b', 'a'],
      pixelDepth: 256,
      dtype: 'uint8',
    };

    ['bands', 'pixelDepth', 'dtype'].forEach(opt => {
      this.set(opt, args[opt] || additionalDefaults[opt]);
    });
  }

  /**
   * @returns {array} The list of bands in order
   */
  getBands() {
    return this.get('bands');
  }

  /**
   * @returns {number} The maximum band value
   */
  getPixelDepth() {
    return this.get('pixelDepth');
  }

  getPixels(coord, size, res, z) {
    const pixels = [];
    const xx = coord[0] + size * res;
    const yy = coord[1] + size * res;
    for (let x = coord[0] - size * res; x <= xx; x += res) {
      for (let y = coord[1] - size * res; y <= yy; y += res) {
        const data = this.getTileAndData([x, y], z).data;
        data && pixels.push(data);
      }
    }
    return pixels;
  }

  getTileAndData(coord, z) {
    const xyz = this.getTileGrid().getTileCoordForCoordAndZ(coord, z);
    const extent = this.tileGrid.getTileCoordExtent(xyz);
    const tile = this.getTile(xyz[0], xyz[1], xyz[2], 1, this.getProjection());
    let data;
    if (tile.numpyTile) {
      const shape = tile.numpyTile.shape;
      const x = Math.floor(
        (255 * (coord[0] - extent[0])) / (extent[2] - extent[0])
      );
      const y =
        255 -
        Math.floor((255 * (coord[1] - extent[1])) / (extent[3] - extent[1]));
      const offset = y * shape[1] + x;
      const bandOff = tile.numpyTile.shape[1] * tile.numpyTile.shape[2];
      data = [];
      for (let i = 0; i < tile.numpyTile.shape[0]; i++) {
        data.push(tile.numpyTile.data[i * bandOff + offset]);
      }
    }
    return {tile, data};
  }

  forEachTileInExtent(extent, zoom, func) {
    const cache = this.tileCache;
    this.tileGrid.forEachTileCoord(extent, Math.floor(zoom), tc => {
      const te = this.tileGrid.getTileCoordExtent(tc);
      const key = tc.join('/');
      if (!cache.containsKey(key)) {
        return;
      }
      const tile = cache.get(key);
      if (tile) {
        tile.extent = te; // HACK
        func(tile);
      }
    });
  }

  getTileView(extent, zoom) {
    const tiles = [];
    this.forEachTileInExtent(extent, zoom, t => {
      tiles.push(t);
    });
    // sort from left to right, top to bottom
    tiles.sort(function(t1, t2) {
      if (t1.tileCoord[2] === t2.tileCoord[2]) {
        return t1.tileCoord[1] - t2.tileCoord[1];
      }
      return t1.tileCoord[2] - t2.tileCoord[2];
    });
    const corners = tiles.length && [tiles[0], tiles[tiles.length - 1]].flat();
    return {tiles, corners};
  }

  /**
   * Calculates the histogram for a given view.
   * This requires that all the tiles be loaded. `getHistogram`
   * returns a promise that when resolved ensures that all
   * the tiles in that view have been loaded and really should be
   * what is used most of the time.
   *
   * @param {ol/View.js} OpenLayer view object
   *
   * @returns {array} Histogram reprsenting each band.
   */
  calculateHistogram(view) {
    const zoom = this.tileGrid.getZForResolution(
      view.getResolution(),
      this.zDirection
    );
    const pxDepth = this.get('pixelDepth');

    // check to see if the layer is ready.
    let histogram = null;
    this.forEachTileInExtent(view.calculateExtent(), zoom, tile => {
      const tileState = tile.getState();
      if (tileState === TileState.LOADED) {
        histogram = getHistogram(tile, pxDepth, this.get('bands'), histogram);
      }
    });
    return histogram;
  }

  /**
   * Get the histogram for a view.
   * USE THIS FUNCTION TO GET A HISTOGRAM.
   * It returns a promise ensuring that all the tiles in the view
   * are loaded before calculating the histogram. If the tiles are
   * loaded there is no delay between this function and calculateHistogram.
   *
   * @param {ol/View.js} OpenLayers view object.
   * @param {boolean} When true, allow for a partial set of the tiles to be returned.
   *
   * @returns {Promise}
   */
  getHistogram(view, partial) {
    return new Promise(resolve => {
      // loading can be finished, in which case we can
      //   return the new histogram
      if (!this.loading_ || partial === true) {
        resolve(this.calculateHistogram(view));
      } else {
        // otherwise, wait for the tiles to load once and then resolve.
        this.once('tilesloadend', () => {
          resolve(this.calculateHistogram(view));
        });
      }
    });
  }
}

export default NumpySource;
