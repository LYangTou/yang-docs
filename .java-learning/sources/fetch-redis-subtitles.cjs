// Public course metadata and subtitle acquisition; no browser cookies or credentials.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

async function main() {
  const root = __dirname;
  const player = await (await fetch('https://s1.hdslb.com/bfs/static/player/main/core.b28ada96.js')).text();
  const block = player.match(/P\.url="\/\/api\.bilibili\.com\/x\/v2\/subtitle\/web\/view";var O=(\[\[.*?\]\]),L=/s)?.[1];
  if (!block) throw new Error('Public player subtitle format changed');
  const strings = Array.from(block.matchAll(/(['"])((?:\\.|(?!\1).)*)\1/g), m => m[2].replace(/\\(['"\\])/g, '$1'));
  const pairs = [[strings[0], strings[1]], [strings[2], strings[3]]];
  const metadata = await (await fetch('https://api.bilibili.com/x/web-interface/view?bvid=BV1cr4y1671t')).json();
  if (metadata.code !== 0) throw new Error(JSON.stringify(metadata));
  const pages = metadata.data.pages.filter(p => p.page >= 44 && p.page <= 51);
  const nav = await (await fetch('https://api.bilibili.com/x/web-interface/nav')).json();
  const wbi = nav.data.wbi_img;
  const rawKey = [wbi.img_url,wbi.sub_url].map(u => u.split('/').pop().split('.')[0]).join('');
  const permutation = [46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52];
  const mixinKey = permutation.map(i=>rawKey[i]).join('').slice(0,32);
  await fs.writeFile(path.join(root, 'redis-p44-p51-metadata.json'), JSON.stringify(pages, null, 2));
  for (const p of pages) {
    try { await fs.access(path.join(root, `redis-p${p.page}.json`)); console.log(`P${p.page}: existing transcript retained`); continue; } catch {}
    const params = new URLSearchParams({oid:String(p.cid), pid:String(metadata.data.aid), context_ext:JSON.stringify({video_type:1}), type:'1', cur_production_type:'0', preferred_language:'ai-zh', playlist_switch:'0', web_location:'1315873', 'x-bili-device-req-json':JSON.stringify({platform:'web',device:'pc',mobi_app:'web_cn'}), 'x-bili-locale-json':JSON.stringify({c_locale:{language:'zh',script:'Hans'},always_translate:false})});
    params.set('wts', String(Math.floor(Date.now()/1000)));
    const canonical = Array.from(params).sort(([a],[b])=>a.localeCompare(b,'en')).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v.replace(/[!'()*]/g,''))}`).join('&');
    const signature = crypto.createHash('md5').update(canonical+mixinKey).digest('hex');
    let data;
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(`https://api.bilibili.com/x/v2/subtitle/web/view?${canonical}&w_rid=${signature}`);
      data = Buffer.from(await response.arrayBuffer()).toString('utf8');
      if (data.includes('//subtitle.bilibili.com/')) break;
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    const encoded = data.match(/\/\/subtitle\.bilibili\.com\/([^?]+)\?auth_key=([^\x00-\x20]+)/);
    if (!encoded) throw new Error(`P${p.page}: no subtitle asset: ${data.slice(0,500)}`);
    let assetPath;
    for (const [prefix, key] of pairs) {
      const decoded = decodeURIComponent(encoded[1]);
      const secret = key + 'bilibili';
      const plain = Array.from(decoded, (c, i) => String.fromCharCode(c.charCodeAt(0) ^ secret.charCodeAt(i % secret.length))).join('');
      if (plain.startsWith(prefix)) { assetPath = plain.slice(prefix.length); break; }
    }
    if (!assetPath) throw new Error(`P${p.page}: unable to decode public subtitle URL`);
    // Protobuf field follows auth_key; the asset token is restricted to ASCII hex and separators.
    const auth = encoded[2].match(/^\d+-[a-f0-9]+-\d+-[a-f0-9]{32}/)[0];
    const url = `https://aisubtitle.hdslb.com${assetPath.startsWith('/') ? '' : '/'}${assetPath}?auth_key=${auth}`;
    const result = await fetch(url);
    if (!result.ok) throw new Error(`P${p.page}: ${result.status}`);
    const subtitle = await result.json();
    await fs.writeFile(path.join(root, `redis-p${p.page}.json`), JSON.stringify({page:p.page, title:p.part, duration:p.duration, basis:'Public Bilibili AI Chinese subtitle; verify identifiers against frames', body:subtitle.body}, null, 2));
    console.log(`P${p.page} ${p.part}: ${subtitle.body.length} cues, ${p.duration}s`);
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
