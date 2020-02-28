import {readFileSync, writeFileSync} from 'fs';
import {fromArrayBuffer} from '../src/NumpyLoader';
import {draw, createStyleFunc} from '../src/stylefunc';
import Canvas from 'canvas';

// Shim the browser ImageData object.
import {ImageData} from 'canvas';
global.ImageData = ImageData;

const loadTile = (filename) => {
  const buffer = readFileSync(filename, null).buffer;
  return fromArrayBuffer(buffer);
};

const usageAndParse = () => {
  if (process.argv.length < 4 || process.argv.indexOf('--help') >= 0) {
    console.log('Usage:');
    console.log('npm run npy2png -- intile.npy outfile.png [JSON style definition]');
    console.log('');
    process.exit(0);
  }

  if (process.argv[5]) {
    return JSON.parse(argv[5]);
  }
  return {};
};

const main = () => {
  // will die if the usage is wrong
  const styleDef = usageAndParse();

  const numpyTile = loadTile(process.argv[2]);

  // 4 band vs 5 band imagery.
  const analytic = numpyTile.shape[0] === 5;

  // Basic tile metadata.
  const tileInfo = {
    dtype: analytic ? 'uint8' : 'uint16',
    bands: analytic ? ['b', 'g', 'r', 'n', 'a'] :['r', 'g', 'b', 'a'],
    pixelDepth: analytic ? 3000 : 255,
  };

  // create a target canvas
  const canvas = new Canvas(numpyTile.shape[1], numpyTile.shape[2]);

  const styleName = 'rgb';
  const styleOptions = styleDef.options = {
    pixelDepth: tileInfo.pixelDepth,
    readBands: tileInfo.bands,
  };

  const styleFunc = createStyleFunc(styleName, styleOptions);
  draw(canvas, numpyTile, tileInfo.dtype, tileInfo.bands, styleFunc);

  //const pngblob = canvas.toBlob();
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(process.argv[3], buffer);
};

main();
