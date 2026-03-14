const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = __dirname;
const outputDir = __dirname; // Saving in same directory

async function convertFrames() {
    console.log('Starting conversion of 240 PNG frames to optimized WebP...');
    let successCount = 0;
    let failCount = 0;

    for (let i = 1; i <= 240; i++) {
        const frameNum = String(i).padStart(3, '0');
        const inputPath = path.join(inputDir, `ezgif-frame-${frameNum}.png`);
        const outputPath = path.join(outputDir, `ezgif-frame-${frameNum}.webp`);

        if (fs.existsSync(inputPath)) {
            try {
                // Resize to max 2560px width (1440p) to save massive space while keeping quality
                // Convert to WebP at 85% quality 
                await sharp(inputPath)
                    .resize({ width: 2560, withoutEnlargement: true })
                    .webp({ quality: 85, effort: 4 })
                    .toFile(outputPath);
                    
                successCount++;
                if (i % 20 === 0) console.log(`Processed ${i}/240 frames...`);
            } catch (err) {
                console.error(`Error processing frame ${i}:`, err.message);
                failCount++;
            }
        } else {
            console.log(`Warning: Frame ${inputPath} not found.`);
        }
    }

    console.log('\n--- Conversion Complete ---');
    console.log(`Successfully converted: ${successCount} frames`);
    console.log(`Failed: ${failCount} frames`);
    
    // Once successful, we can optionally delete the original heavy PNGs to free up the 3.6GB
    if (successCount === 240) {
        console.log('All 240 frames converted successfully! You may now delete the original .png files.');
    }
}

convertFrames();
