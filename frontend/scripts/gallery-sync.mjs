#!/usr/bin/env node

/**
 * Fetches images from a Cloudinary folder and writes gallery.json to public/.
 *
 * Usage:
 *   CLOUDINARY_CLOUD_NAME=xxx CLOUDINARY_API_KEY=xxx CLOUDINARY_API_SECRET=xxx \
 *   node scripts/gallery-sync.mjs
 *
 * If no env vars are set, generates a placeholder gallery.json
 * so the frontend always has data to work with.
 */

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Folders in Cloudinary to scan (under macai/ folder), oldest → newest.
// yearLabel comes from the folder name itself (e.g. "2024-2025").
// Folders that don't exist yet are fine — they return 0 images and are skipped.
// The newest folder that actually has photos is labelled CURRENT_EVENT instead
// of its own event, so "Current Semester" moves forward automatically.
const CURRENT_EVENT = 'Current Semester';
const FOLDERS = [
  { folder: 'macai/2018-2019', event: 'Archived Moments', yearLabel: '2018-2019' },
  { folder: 'macai/2019-2020', event: 'Archived Moments', yearLabel: '2019-2020' },
  { folder: 'macai/2021-2022', event: 'Post-Pandemic', yearLabel: '2021-2022' },
  { folder: 'macai/2023-2024', event: 'Club Events', yearLabel: '2023-2024' },
  { folder: 'macai/2024-2025', event: 'Club Events', yearLabel: '2024-2025' },
  { folder: 'macai/2025-2026', event: 'Club Events', yearLabel: '2025-2026' },
  { folder: 'macai/2026-2027', event: 'Club Events', yearLabel: '2026-2027' },
];

async function fetchCloudinaryFolder(folder) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/search`;
  const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      expression: `folder:${folder} AND resource_type:image`,
      max_results: 500,
      sort_by: [{ created_at: 'desc' }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Cloudinary error for ${folder}: ${res.status}`);
  }

  const data = await res.json();
  return data.resources || [];
}

function transformImage(resource, event, yearLabel) {
  const thumbUrl = resource.secure_url.replace(
    '/upload/',
    '/upload/w_800,h_600,c_fill,q_auto,f_auto/'
  );
  const fullUrl = resource.secure_url.replace(
    '/upload/',
    '/upload/q_auto,f_auto/'
  );

  const orientation = resource.width > resource.height ? 'landscape'
    : resource.width < resource.height ? 'portrait'
    : 'square';

  return {
    id: resource.asset_id || resource.public_id,
    src: fullUrl,
    thumb: thumbUrl,
    caption: resource.context?.custom?.caption || '',
    event,
    year: yearLabel,
    width: resource.width,
    height: resource.height,
    orientation,
  };
}

function generatePlaceholders() {
  return [
    { id: '1', src: '', thumb: '', caption: 'Students collaborating at a workshop.', event: 'Workshops', year: 2025, width: 800, height: 600, orientation: 'landscape' },
    { id: '2', src: '', thumb: '', caption: 'MacHacks 2023 — team presenting their project.', event: 'MacHacks', year: 2023, width: 800, height: 600, orientation: 'landscape' },
    { id: '3', src: '', thumb: '', caption: 'CUCAI 2025 project showcase.', event: 'CUCAI', year: 2025, width: 600, height: 800, orientation: 'portrait' },
    { id: '4', src: '', thumb: '', caption: 'Keynote and networking at MacHacks.', event: 'MacHacks', year: 2023, width: 800, height: 600, orientation: 'landscape' },
    { id: '5', src: '', thumb: '', caption: 'Hands-on coding session.', event: 'Workshops', year: 2025, width: 600, height: 800, orientation: 'portrait' },
    { id: '6', src: '', thumb: '', caption: 'Award ceremony and celebration.', event: 'MacHacks', year: 2023, width: 800, height: 600, orientation: 'landscape' },
  ];
}

async function main() {
  const { writeFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const outPath = fileURLToPath(new URL('../public/gallery.json', import.meta.url));

  let images = [];

  if (CLOUD_NAME && API_KEY && API_SECRET) {
    console.log('Syncing gallery from Cloudinary...');
    const fetched = [];
    for (const entry of FOLDERS) {
      try {
        const resources = await fetchCloudinaryFolder(entry.folder);
        console.log(`  ${entry.folder}: ${resources.length} images`);
        fetched.push({ ...entry, resources });
      } catch (err) {
        console.error(`  Error fetching ${entry.folder}:`, err.message);
      }
    }

    const newest = fetched.filter((f) => f.resources.length > 0).at(-1);
    if (newest) console.log(`  "${CURRENT_EVENT}" → ${newest.folder}`);

    for (const f of fetched) {
      const event = f === newest ? CURRENT_EVENT : f.event;
      images.push(...f.resources.map((r) => transformImage(r, event, f.yearLabel)));
    }
  } else {
    console.log('No Cloudinary credentials found — writing placeholder gallery.');
    images = generatePlaceholders();
  }

  const payload = {
    syncedAt: new Date().toISOString(),
    count: images.length,
    images,
  };

  writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${outPath} (${images.length} images)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
