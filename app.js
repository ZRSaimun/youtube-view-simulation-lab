(() => {
  const VIDEO_ID = 'vv6Cn16scjU';
  const $ = (s) => document.querySelector(s);
  const simEl = $('#sim-views'), realEl = $('#real-views'), statusEl = $('#api-status');
  const keyInput = $('#api-key'), canvas = $('#chart'), ctx = canvas.getContext('2d');
  const thumbnail = $('#thumbnail');
  let simulated = 0, running = false, timer = null, previous = null, genuineBaseline = null;
  let thumbnailFallback = 0;
  const points = [{ t: Date.now(), v: 0 }];
  const fmt = (n) => Math.floor(n).toLocaleString('en-US');

  async function loadMetadata() {
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${VIDEO_ID}&format=json`);
      if (!response.ok) throw new Error('Metadata unavailable');
      const data = await response.json();
      $('#video-title').textContent = data.title || `YouTube video · ${VIDEO_ID}`;
      $('#thumbnail').src = data.thumbnail_url || `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`;
      $('#thumbnail').alt = data.title ? `Thumbnail: ${data.title}` : 'YouTube video thumbnail';
      $('#player').title = data.title || 'Selected YouTube video';
    } catch (_) { /* Keep the video ID fallback. */ }
  }
  thumbnail.addEventListener('error', () => {
    if (thumbnailFallback === 0) {
      thumbnailFallback = 1;
      thumbnail.src = `https://img.youtube.com/vi/${VIDEO_ID}/mqdefault.jpg`;
      return;
    }
    const fallback = document.createElement('div');
    fallback.className = 'thumbnail-fallback';
    fallback.textContent = 'YouTube thumbnail unavailable';
    thumbnail.replaceWith(fallback);
  });
  async function refreshReal() {
    const key = keyInput.value.trim() || sessionStorage.getItem('viewlab-youtube-key') || '';
    if (!key) { statusEl.textContent = 'API KEY NOT SET'; statusEl.style.color = '#dfb36c'; return; }
    statusEl.textContent = 'FETCHING…';
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/videos');
      url.search = new URLSearchParams({ part: 'statistics', id: VIDEO_ID, key }).toString();
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error?.message || 'API request failed');
      const count = Number(data.items?.[0]?.statistics?.viewCount);
      if (!Number.isFinite(count)) throw new Error('No public view count returned for this video.');
      realEl.textContent = fmt(count);
      genuineBaseline = count;
      $('#baseline-note').textContent = `Genuine count baseline: ${fmt(count)} views · captured ${new Date().toLocaleString()}.`;
      statusEl.textContent = 'API CONNECTED'; statusEl.style.color = '#75e0bd';
    } catch (error) {
      statusEl.textContent = 'COUNT UNAVAILABLE'; statusEl.style.color = '#dfb36c';
      realEl.textContent = '—';
      $('#baseline-note').textContent = `Genuine count not recorded: ${error.message}`;
    }
  }
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr)); canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawChart();
  }
  function drawChart() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const pad = { l: 42, r: 12, t: 12, b: 25 }, cw = w-pad.l-pad.r, ch = h-pad.t-pad.b;
    const max = Math.max(1000, ...points.map(p => p.v));
    ctx.font = '10px DM Mono, monospace'; ctx.textBaseline = 'middle';
    for (let i=0; i<=4; i++) { const y=pad.t+ch*i/4; ctx.strokeStyle='#252a35';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillStyle='#767e8d';ctx.textAlign='right';ctx.fillText(short(max*(1-i/4)),pad.l-8,y); }
    if (points.length < 2 || max === 0) { ctx.fillStyle='#707887';ctx.textAlign='center';ctx.fillText('Start simulation to plot view growth',w/2,h/2); return; }
    const first=points[0].t, span=Math.max(points[points.length-1].t-first,1);
    const gradient=ctx.createLinearGradient(0,pad.t,0,h-pad.b);gradient.addColorStop(0,'rgba(197,243,106,.22)');gradient.addColorStop(1,'rgba(197,243,106,0)');
    ctx.beginPath();points.forEach((p,i)=>{const x=pad.l+(p.t-first)/span*cw,y=pad.t+ch-(p.v/max)*ch;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.lineTo(pad.l+cw,pad.t+ch);ctx.lineTo(pad.l,pad.t+ch);ctx.closePath();ctx.fillStyle=gradient;ctx.fill();
    ctx.beginPath();points.forEach((p,i)=>{const x=pad.l+(p.t-first)/span*cw,y=pad.t+ch-(p.v/max)*ch;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.strokeStyle='#c5f36a';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#767e8d';ctx.textAlign='left';ctx.fillText('START',pad.l,h-9);ctx.textAlign='right';ctx.fillText('NOW',w-pad.r,h-9);
  }
  function short(n){ if(n>=1e9)return (n/1e9).toFixed(1)+'B';if(n>=1e6)return (n/1e6).toFixed(1)+'M';if(n>=1e3)return (n/1e3).toFixed(0)+'K';return Math.round(n).toString(); }
  function setSim(value, record=true) { simulated=Math.max(0,value);simEl.textContent=fmt(simulated);if(record){const now=Date.now();points.push({t:now,v:simulated});if(points.length>600)points.splice(1,points.length-600);drawChart();} }
  function tick(now) { if(!running)return;if(previous===null)previous=now;const elapsed=Math.min((now-previous)/1000,1);previous=now;setSim(simulated+elapsed*Number($('#speed').value));timer=requestAnimationFrame(tick); }
  document.querySelectorAll('.add-btn').forEach(b=>b.addEventListener('click',()=>setSim(simulated+Number(b.dataset.add))));
  $('#start').addEventListener('click',()=>{if(running)return;running=true;previous=null;$('#run-state').textContent='● Running';$('#run-state').style.color='#75e0bd';timer=requestAnimationFrame(tick)});
  $('#stop').addEventListener('click',()=>{running=false;cancelAnimationFrame(timer);previous=null;$('#run-state').textContent='● Paused';$('#run-state').style.color='#838b9a'});
  $('#reset').addEventListener('click',()=>{running=false;cancelAnimationFrame(timer);previous=null;points.splice(0,points.length,{t:Date.now(),v:0});setSim(0,false);drawChart();$('#run-state').textContent='● Paused';$('#run-state').style.color='#838b9a'});
  $('#refresh-real').addEventListener('click',refreshReal);
  $('#save-key').addEventListener('click',()=>{const key=keyInput.value.trim();if(key)sessionStorage.setItem('viewlab-youtube-key',key);refreshReal()});
  keyInput.value=sessionStorage.getItem('viewlab-youtube-key')||'';
  window.addEventListener('resize',resizeCanvas);loadMetadata();resizeCanvas();
  // Expose read-only state for browser-based smoke checks; no simulation calls leave this page.
  window.viewLabState=()=>({simulated,realBaseline:genuineBaseline,running,points:points.length});
})();
