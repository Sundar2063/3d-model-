'use strict';
const views = ['Front', 'Back', 'Left', 'Right'];
const photos = new Map();
const $ = id => document.getElementById(id);
let modelURL = null;
let modelReady = false;
let loadTimer;
function message(text) { $('message').textContent = text; }
function updateCount() {
  $('count').textContent = `${photos.size} / 4 views`;
  $('brief').disabled = photos.size !== 4;
}
for (const view of views) {
  const card = document.createElement('div');
  card.className = 'upload';
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp'; input.id = `photo-${view}`;
  const label = document.createElement('label'); label.htmlFor = input.id;
  function emptyLabel() { label.replaceChildren(); const icon = document.createElement('span'); icon.textContent = '+'; label.append(icon, `${view} view`); }
  emptyLabel();
  const remove = document.createElement('button'); remove.className = 'remove'; remove.textContent = '×'; remove.hidden = true; remove.setAttribute('aria-label', `Remove ${view.toLowerCase()} photo`);
  function clear() { const old = photos.get(view); if (old) URL.revokeObjectURL(old.url); photos.delete(view); input.value = ''; emptyLabel(); remove.hidden = true; updateCount(); }
  remove.addEventListener('click', clear);
  input.addEventListener('change', async () => {
    const file = input.files[0]; if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) { message('Choose a JPG, PNG or WebP image smaller than 15 MB.'); input.value = ''; return; }
    const url = URL.createObjectURL(file); const img = new Image(); img.alt = `${view} photo of your subject`; img.src = url;
    try { await img.decode(); } catch { URL.revokeObjectURL(url); message('This image could not be read. Choose another file.'); input.value = ''; return; }
    // Ignore a slower decode after the user selected a replacement.
    if (input.files[0] !== file) { URL.revokeObjectURL(url); return; }
    const old = photos.get(view); if (old) URL.revokeObjectURL(old.url);
    photos.set(view, {file, url, width:img.naturalWidth, height:img.naturalHeight});
    label.replaceChildren(img); remove.hidden = false; updateCount(); message(`${view} photo ready. Photos stay in this browser tab.`);
  });
  card.append(input, label, remove); $('uploads').append(card);
}
function saveBlob(blob, name) { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
$('brief').addEventListener('click', () => {
  const brief = {version:1, name:$('project').value.trim() || 'Untitled creation', category:$('category').value, generationStatus:'backend_not_connected', textureTarget:4096, photos:views.map(view => { const p = photos.get(view); return {view, filename:p.file.name, bytes:p.file.size, width:p.width, height:p.height}; }), note:'This brief contains metadata only, not images or a generated model.'};
  saveBlob(new Blob([JSON.stringify(brief,null,2)], {type:'application/json'}), 'forma-photo-brief.json');
  message('Photo brief downloaded. It contains photo metadata; keep your original photos separately.');
});
function controls(ready) { modelReady = ready; $('rotate').disabled = !ready; $('reset').disabled = !ready; $('download').classList.toggle('disabled',!ready); $('download').setAttribute('aria-disabled',String(!ready)); if (!ready) $('download').removeAttribute('href'); }
$('model').addEventListener('change', async () => {
  const file = $('model').files[0]; if (!file) return;
  if (!file.name.toLowerCase().endsWith('.glb') || file.size > 50*1024*1024) { message('Choose a GLB file smaller than 50 MB.'); $('model').value = ''; return; }
  const header = await file.slice(0,12).arrayBuffer();
  if ($('model').files[0] !== file) return;
  if (header.byteLength < 12 || new DataView(header).getUint32(0,true) !== 0x46546c67 || new DataView(header).getUint32(4,true) !== 2 || new DataView(header).getUint32(8,true) !== file.size) { message('This file is not a valid GLB 2.0 container.'); $('model').value = ''; return; }
  clearTimeout(loadTimer); controls(false);
  if (modelURL) URL.revokeObjectURL(modelURL);
  modelURL = URL.createObjectURL(file);
  $('viewer').hidden = false; $('empty').hidden = true; $('viewer').src = modelURL;
  $('viewer').autoRotate = false; $('rotate').setAttribute('aria-pressed','false');
  $('download').download = file.name;
  $('model-info').textContent = `Loading ${file.name} · ${(file.size/1024/1024).toFixed(1)} MB`;
  message('Loading your model…');
  loadTimer = setTimeout(() => { if (!modelReady) message('Model loading is taking longer than expected. The viewer needs internet access and WebGL. Try a smaller GLB or import again.'); }, 20000);
});
$('viewer').addEventListener('load', () => { clearTimeout(loadTimer); controls(true); $('download').href = modelURL; $('model-info').textContent = 'Imported GLB · drag to orbit · pinch or scroll to zoom'; message('Model ready. This is your imported file, not a model generated from the photos.'); });
$('viewer').addEventListener('error', () => { clearTimeout(loadTimer); controls(false); $('viewer').hidden = true; $('empty').hidden = false; $('model-info').textContent = 'Import failed. Try a self-contained GLB with embedded textures.'; message('Unable to render this model. Try another GLB file.'); });
$('download').addEventListener('click', e => { if (!modelReady) e.preventDefault(); });
$('rotate').addEventListener('click', () => { $('viewer').autoRotate = !$('viewer').autoRotate; $('rotate').setAttribute('aria-pressed',String($('viewer').autoRotate)); });
$('reset').addEventListener('click', () => { $('viewer').cameraOrbit = '0deg 75deg 105%'; $('viewer').cameraTarget = 'auto auto auto'; $('viewer').fieldOfView = 'auto'; });
window.addEventListener('pagehide', () => { for (const p of photos.values()) URL.revokeObjectURL(p.url); if (modelURL) URL.revokeObjectURL(modelURL); });
