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

/** Client-side parser for .npy files
 *
 *  The numpy format specification is [here](http://docs.scipy.org/doc/numpy-dev/neps/npy-format.html).
 *  This code is inspired by the GIST found [here](https://gist.github.com/nvictus/88b3b5bfe587d32ac1ab519fd0009607) but has been heavily modified.
 *
 * @module NumpyLoader
 */

function asciiDecode(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function readUint16LE(buffer) {
  const view = new DataView(buffer);
  let val = view.getUint8(0);
  val |= view.getUint8(1) << 8;
  return val;
}

/** Sniff test to see if an arrayBuffer contains a Numpy arr
 *
 * @param {ArrayBuffer} buf - The array buffer to test.
 *
 * @returns {boolean} Returns true if likely a numpy array, false otherwise.
 */
export function isNumpyArr(buf) {
  const magic = asciiDecode(buf.slice(0, 6));
  return magic.slice(1, 6) === 'NUMPY';
}

/** Read an ArrayBuffer as a NumpyTile
 *
 *  @param {ArrayBuffer} buf - Numpy array to convert to Javascript typed array.
 *
 *  @returns Javascript typed array.
 */
export function fromArrayBuffer(buf) {
  if (buf.byteLength === 0) {
    return {};
  }
  // Check the magic number

  if (!isNumpyArr(buf)) {
    throw new Error('Not a NumpyTile');
  }

  const headerLength = readUint16LE(buf.slice(8, 10)),
    headerStr = asciiDecode(buf.slice(10, 10 + headerLength)),
    offsetBytes = 10 + headerLength;

  // this is a rough but working conversion of the
  //  numpy header dict to Javascript object.
  const info = JSON.parse(
    headerStr
      .toLowerCase()
      .replace(/'/g, '"')
      .replace(/\(/g, '[')
      .replace(/\),/g, ']')
  );

  // Intepret the bytes according to the specified dtype
  let data;
  if (info.descr === '|u1') {
    data = new Uint8Array(buf, offsetBytes);
  } else if (info.descr === '|i1') {
    data = new Int8Array(buf, offsetBytes);
  } else if (info.descr === '<u2') {
    data = new Uint16Array(buf, offsetBytes);
  } else if (info.descr === '<i2') {
    data = new Int16Array(buf, offsetBytes);
  } else if (info.descr === '<u4') {
    data = new Uint32Array(buf, offsetBytes);
  } else if (info.descr === '<i4') {
    data = new Int32Array(buf, offsetBytes);
  } else if (info.descr === '<f4') {
    data = new Float32Array(buf, offsetBytes);
  } else if (info.descr === '<f8') {
    data = new Float64Array(buf, offsetBytes);
  } else {
    throw new Error('unknown numeric dtype');
  }
  return {
    shape: info.shape,
    data: data,
  };
}
