/*
 * Copyright 2021 Planet Labs Inc.
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

import 'ol/ol.css';
import NumpyLayer from '../src/NumpyLayer';
import NumpySource from '../src/NumpySource';
import OSM from 'ol/source/OSM';
import TileImageLayer from 'ol/layer/Tile';
import View from 'ol/View';
import olMap from 'ol/Map';
import {fromLonLat} from 'ol/proj';

const numpySource = new NumpySource({
  url:
    'https://api.cogeo.xyz/cog/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?url=https%3A%2F%2Fopendata.digitalglobe.com%2Fevents%2Fmauritius-oil-spill%2Fpost-event%2F2020-08-12%2F105001001F1B5B00%2F105001001F1B5B00.tif&format=npy',
  /* These are the source defaults but copied here
   * to make experimentation easier.
   */
  dtype: 'uint8',
  bands: ['r', 'g', 'b', 'a'],
  pixelDepth: 256,
});

const numpyLayer = new NumpyLayer({
  source: numpySource,
  style: {
    name: 'rgb',
    options: {
      pixelDepth: numpySource.get('pixelDepth'),
    },
  },
});

const changeButton = value => {
  const buttons = document
    .getElementById('color-funcs')
    .getElementsByClassName('button');
  for (let i = 0, ii = buttons.length; i < ii; i++) {
    const button = buttons[i];
    button.className =
      button.value === value ? 'button button-primary' : 'button';
  }
};

const changeStyle = evt => {
  const styleName = evt.target.value;
  changeButton(styleName);

  const style = {
    name: 'rgb',
    options: {
      pixelDepth: numpySource.get('pixelDepth'),
    },
  };
  numpySource.set('bands', ['r', 'g', 'b', 'a']);

  if (styleName === 'gray') {
    style.name = 'gray';
  } else if (styleName === 'red') {
    style.name = 'onlyRed';
  } else if (styleName === 'bgr') {
    // swap the source band-order
    numpySource.set('bands', ['b', 'g', 'r', 'a']);
  }

  numpyLayer.setStyle(style);
};

function init() {
  new olMap({
    target: document.getElementById('map'),
    layers: [
      new TileImageLayer({
        source: new OSM(),
      }),
      numpyLayer,
    ],
    view: new View({
      center: fromLonLat([57.75213430160109, -20.403673802342773]),
      zoom: 13,
    }),
  });

  const buttons = document
    .getElementById('color-funcs')
    .getElementsByClassName('button');
  for (let i = 0, ii = buttons.length; i < ii; i++) {
    buttons[i].addEventListener('click', changeStyle);
  }
}

init();
