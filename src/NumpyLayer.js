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

import CanvasTileLayerRenderer from 'ol/renderer/canvas/TileLayer';
import TileLayer from 'ol/layer/Tile';
import {createStyleFunc, draw, drawArray} from './stylefunc';

/** Canvas renderer for a NumpyLayer
 */
class NumpyTileCanvasRenderer extends CanvasTileLayerRenderer {
  /** Convert the tile to a canvas.
   *
   *  @param {NumpyTile} - Tile with a numpyTile member.
   *
   * @returns {Canvas}
   */
  getTileImage(tile) {
    if (!tile.numpyTile) {
      return null;
    }
    if (tile.canvas) {
      return tile.canvas;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    tile.canvas = canvas;
    const layer = this.getLayer();
    const {dtype, bands} = layer.getSource().getProperties();
    const {style} = layer.getProperties();
    draw(tile.canvas, tile.numpyTile, dtype, bands, style);
    return tile.canvas;
  }
}

/** OpenLayers Layer class for rendering NumpyLayer content.
 */
export class NumpyLayer extends TileLayer {
  /** Create a new NumpyLayer
   *
   * @param {Object} options
   * @param {string} [options.className='ol-layer'] A CSS class name to set to the layer element.
   * @param {number} [options.opacity=1] Opacity (0, 1).
   * @param {boolean} [options.visible=true] Visibility.
   * @param {ol/Extent} [options.extent] The bounding extent for layer rendering.  The layer will not be
   * rendered outside of this extent.
   * @param {number} [options.zIndex] The z-index for layer rendering.  At rendering time, the layers
   * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
   * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
   * method was used.
   * @param {number} [options.minResolution] The minimum resolution (inclusive) at which this layer will be
   * visible.
   * @param {number} [options.maxResolution] The maximum resolution (exclusive) below which this layer will
   * be visible.
   * @param {number} [options.preload=0] Preload. Load low-resolution tiles up to `preload` levels. `0`
   * means no preloading.
   * @param {NumpySource} [options.source] Source for this layer.
   * @param {ol/PluggableMap.js} [options.map] Sets the layer as overlay on a map. The map will not manage
   * this layer in its layers collection, and the layer will be rendered on top. This is useful for
   * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
   * use {@link module:ol/Map#addLayer}.
   * @param {boolean} [options.useInterimTilesOnError=true] Use interim tiles on error.
   * @param {class} [options.workerClass=undefined] WebWorker class that implements rendering.
   * @param {number} [options.maxWorkers=navigator.hardwareCurency] Number of WebWorkers to load if given workerClass.
   * @param {function} [options.style=undefined] Style create with createStyleFunc
   */
  constructor(options) {
    super(options);
    // setup the workers if they are available.
    this.workers = [];
    if (options.workerClass) {
      // allow the app to control the max number of works
      const nWorkers = options.maxWorkers || navigator.hardwareConcurrency;
      for (let i = 0, ii = nWorkers || 1; i < ii; i++) {
        const worker =
          typeof options.workerClass === 'string'
            ? new Worker(options.workerClass)
            : new options.workerClass();
        worker.onmessage = this.onWorkerMessage.bind(this);
        this.workers.push(worker);
      }
    }

    // flag to when to use the worker.
    this.useWorker_ = this.workers.length > 0;

    // set the style
    if (options.style) {
      this.updateStyle(options.style);
    }
  }

  /** Ensure the new style def sets the layer style and all the workers.
   *
   *  @param {Object} styleDef - valid NumpyLayer style object.
   */
  updateStyle(styleDef) {
    this.set('style', createStyleFunc(styleDef.name, styleDef.options));
    for (let i = 0, ii = this.workers.length; i < ii; i++) {
      this.workers[i].postMessage({
        type: 'SET_STYLE',
        style: styleDef,
      });
    }
  }

  createRenderer() {
    return new NumpyTileCanvasRenderer(this);
  }

  changeSource(args) {
    const src = this.getSource();
    src.setProperties(args);
    src.setUrl(args.url);
  }

  /** Change the style for the layer.
   *  This call ensures the workers are updated and the layer is redrawn.
   *
   *  @param {Object} styleDef - valid NumpyLayer style object.
   */
  setStyle(styleDef) {
    this.updateStyle(styleDef);
    this.redraw();
  }

  redraw() {
    const style = this.get('style');
    const bands = this.getSource().get('bands');
    if (!this.getVisible() || !style) {
      return;
    }

    const tc = this.getSource().tileCache;
    const keys = tc.getKeys();

    while (keys.length > 0) {
      if (this.useWorker_) {
        this.workers.forEach(w => {
          const key = keys.pop();
          let t = null;
          try {
            t = tc.get(key);
          } catch (err) {
            // swallow the not found error.
          }

          if (t && t.numpyTile && t.canvas) {
            w.postMessage({key, data: t.numpyTile.data, bands});
          }
        });
      } else {
        const key = keys.pop();
        let t = null;
        try {
          t = tc.get(key);
        } catch (err) {
          // swallow the not found error.
        }

        if (t && t.numpyTile && t.canvas) {
          const res = drawArray(style, t.numpyTile.data, bands);
          const ctx = t.canvas.getContext('2d');
          const imgData = ctx.createImageData(256, 256);
          imgData.data.set(res);
          ctx.putImageData(imgData, 0, 0);
        }
      }
    }
  }

  /** Handle the feedback from a render-worker.
   *
   *  @param message - Message from the worker.
   */
  onWorkerMessage(message) {
    const src = this.getSource();
    const tc = src.tileCache;

    let target = null;
    try {
      target = tc.get(message.data.key);
    } catch (e) {
      // swallow the not found error.
    }

    // ensure the target has a canvas defined.
    // it is possible to get an offscreen tile with no canvas.
    if (target && target.canvas) {
      const ctx = target.canvas.getContext('2d');
      const imgData = ctx.createImageData(256, 256);
      imgData.data.set(message.data.results);
      ctx.putImageData(imgData, 0, 0);
      src.changed();
    }
  }
}

export default NumpyLayer;
