// packages/client/scripts/download-assets.cjs
const fs = require('fs');
const path = require('path');
const https = require('https');

const baseModelsDir = path.join(__dirname, '../public/models');

const assets = [
    // Heroes
    { type: 'heroes', folder: 'crystal', name: 'hero.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    { type: 'heroes', folder: 'crystal_warrior', name: 'hero.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    { type: 'heroes', folder: 'crystal_mage', name: 'hero.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    { type: 'heroes', folder: 'crystal_rogue', name: 'hero.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    
    { type: 'heroes', folder: 'toxic', name: 'hero.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    { type: 'heroes', folder: 'toxic_warrior', name: 'hero.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    { type: 'heroes', folder: 'toxic_mage', name: 'hero.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    { type: 'heroes', folder: 'toxic_rogue', name: 'hero.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    
    { type: 'heroes', folder: 'druid', name: 'hero.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    { type: 'heroes', folder: 'druid_warrior', name: 'hero.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    { type: 'heroes', folder: 'druid_mage', name: 'hero.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    { type: 'heroes', folder: 'druid_rogue', name: 'hero.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    
    { type: 'heroes', folder: 'void', name: 'hero.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    { type: 'heroes', folder: 'void_warrior', name: 'hero.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    { type: 'heroes', folder: 'void_mage', name: 'hero.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    { type: 'heroes', folder: 'void_rogue', name: 'hero.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },

    // Game Items & Bonuses
    { type: 'items', folder: 'chest', name: 'model.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    { type: 'items', folder: 'repair_kit', name: 'model.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    { type: 'items', folder: 'surge_node', name: 'model.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    { type: 'items', folder: 'void_rift', name: 'model.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' },
    { type: 'items', folder: 'trap', name: 'model.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb' }
];

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (status code: ${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {}); // delete partial file on error
            reject(err);
        });
    });
}

async function run() {
    console.log('[ASSET_DOWNLOAD] Starting structured 3D assets downloads...');
    for (const asset of assets) {
        const destDir = path.join(baseModelsDir, asset.type, asset.folder);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        const destPath = path.join(destDir, asset.name);
        try {
            console.log(`[ASSET_DOWNLOAD] Downloading ${asset.type}/${asset.folder}/${asset.name} ...`);
            await downloadFile(asset.url, destPath);
            console.log(`[ASSET_DOWNLOAD] Successfully saved ${asset.type}/${asset.folder}/${asset.name}`);
        } catch (err) {
            console.error(`[ASSET_DOWNLOAD_ERROR] Failed to download ${asset.type}/${asset.folder}/${asset.name}:`, err.message);
        }
    }
    console.log('[ASSET_DOWNLOAD] Asset download process finished.');
}

run();
