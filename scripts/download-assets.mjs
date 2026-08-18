import fs from 'fs';
import path from 'path';
import https from 'https';

const ASSETS_DIR = path.join(process.cwd(), 'public', 'models');

const ASSETS = [
  {
    name: 'character.glb',
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/RobotExpressive/RobotExpressive.glb'
  },
  {
    name: 'obstacle.glb',
    url: 'https://raw.githubusercontent.com/pmndrs/drei-assets/master/box.glb' // Or a simpler one
  },
  {
    name: 'parrot.glb',
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Parrot.glb'
  },
  {
    name: 'flamingo.glb',
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Flamingo.glb'
  }
];

// Helper to download file
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
          download(response.headers.location, dest).then(resolve).catch(reject);
          return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  for (const asset of ASSETS) {
    const dest = path.join(ASSETS_DIR, asset.name);
    console.log(`Downloading ${asset.name}...`);
    try {
      await download(asset.url, dest);
      console.log(`Downloaded ${asset.name}`);
    } catch (err) {
      console.error(`Failed to download ${asset.name}:`, err);
    }
  }
  
  console.log("All assets downloaded!");
}

main();
