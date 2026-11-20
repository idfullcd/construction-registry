/* Ядро: сессия, транспорт, состояние, оптимистичные мутации, undo, тосты, тема. */
const S = {
  user:null, token:null, snap:null, trash:{}, counts:{},
  mod:'contracts', views:{}, sel:new Set(), page:{}, q:{}, filter:{}, sort:{},
  inflight:null, lastTs:0, drawer:null, pending:new Map(), online:true
};
const $ = (s,r) => (r||document).querySelector(s);
const $$ = (s,r) => Array.prototype.slice.call((r||document).querySelectorAll(s));
const val = id => { const e = document.getElementById(id); return e ? e.value : ''; };
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = v => { const n = parseFloat(String(v).replace(/\s/g,'').replace(',','.')); return isNaN(n)?0:n; };
const money = v => num(v).toLocaleString('ru-RU')+' ₽';
const short = (s,n) => { s = String(s==null?'':s); return s.length>n ? s.slice(0,n-1)+'…' : s; };
const debounce = (fn,ms) => { let t; return function(){ const a=arguments,c=this; clearTimeout(t); t=setTimeout(()=>fn.apply(c,a),ms); }; };
const raf = fn => requestAnimationFrame(fn);
const isMobile = () => window.matchMedia('(max-width: 860px)').matches;

function dstr(v){
  if(!v) return '';
  if(v instanceof Date) return v.toISOString().slice(0,10);
  const s = String(v);
  if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/); if(m) return m[3]+'-'+m[2]+'-'+m[1];
  const d = new Date(s); return isNaN(d) ? s : d.toISOString().slice(0,10);
}
function pretty(v){
  if(v === true) return 'Да'; if(v === false) return 'Нет';
  if(v instanceof Date) return dstr(v);
  const s = String(v==null?'':v);
  if(/^\d{4}-\d{2}-\d{2}T/.test(s)) return dstr(s);
  return s;
}
function daysLeft(d){ const t = new Date(dstr(d)+'T00:00:00'); if(isNaN(t)) return null; return Math.ceil((t - new Date(new Date().toDateString()))/864e5); }

/* ---------- тосты ---------- */
function toast(msg, kind, actionLabel, action){
  const host = $('#toasts'); if(!host) return;
  const el = document.createElement('div');
  el.className = 'toast '+(kind||'info');
  el.innerHTML = '<span class="toast-dot"></span><span class="toast-msg">'+esc(msg)+'</span>';
  if(actionLabel){
    const b = document.createElement('button'); b.className='toast-act'; b.textContent=actionLabel;
    b.onclick = () => { el.remove(); action && action(); };
    el.appendChild(b);
  }
  const x = document.createElement('button'); x.className='toast-x'; x.innerHTML='×'; x.onclick=()=>el.remove(); el.appendChild(x);
  host.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('in'));
  const ttl = actionLabel ? 9000 : 4200;
  setTimeout(()=>{ el.classList.remove('in'); setTimeout(()=>el.remove(),260); }, ttl);
}

/* ---------- транспорт ---------- */
async function api(action, payload, opts){
  const body = JSON.stringify(Object.assign({ action:action, token:S.token }, payload||{}));
  const ctl = new AbortController();
  const timer = setTimeout(()=>ctl.abort(), (opts&&opts.timeout)||45000);
  try{
    const res = await fetch(API_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:body, signal:ctl.signal });
    clearTimeout(timer);
    const txt = await res.text();
    let j; try{ j = JSON.parse(txt); }catch(e){ throw new Error('Некорректный ответ сервера'); }
    if(j && j.success === false) throw new Error(j.error || 'Ошибка операции');
    if(j && j.error && j.success === undefined) throw new Error(j.error);
    S.online = true; return j;
  }catch(e){
    clearTimeout(timer);
    if(String(e).indexOf('AbortError') > -1) throw new Error('Сервер не ответил за 45 с. Повторите.');
    S.online = false;
    throw new Error(e.message || 'Нет связи с сервером');
  }finally{ setNet(); }
}
function setNet(){
  const b = $('#netBadge'); if(!b) return;
  b.className = 'net '+(S.online?'ok':'bad');
  b.textContent = S.online ? 'онлайн' : 'нет связи';
}

/* ---------- снимок: stale-while-revalidate ---------- */
function readCache(){
  try{ const raw = localStorage.getItem(APP.cacheKey); if(!raw) return null; const j = JSON.parse(raw); return j && j.data ? j : null; }catch(e){ return null; }
}
function writeCache(snap){
  try{ localStorage.setItem(APP.cacheKey, JSON.stringify({ ts:snap.ts, data:snap.data, trash:snap.trash, counts:snap.counts })); }catch(e){}
}
function applySnap(snap){
  S.snap = snap.data || {}; S.trash = snap.trash || {}; S.counts = snap.counts || {}; S.lastTs = Date.now();
  Object.keys(S.snap).forEach(k => { if(Array.isArray(S.snap[k])) S.snap[k].forEach(r => { delete r.__row; }); });
  buildIndex();
}
async function fetchSnap(){
  if(S.inflight) return S.inflight;
  S.inflight = (async () => {
    const ctl = new AbortController(); const t = setTimeout(()=>ctl.abort(), 40000);
    try{
      const res = await fetch(API_URL+'?type=snapshot&_='+Date.now(), { signal:ctl.signal });
      const j = await res.json(); clearTimeout(t);
      if(!j || !j.ok) throw new Error((j&&j.error)||'Снимок недоступен');
      applySnap(j); writeCache(j); S.online = true;
      return j;
    }catch(e){ clearTimeout(t); S.online = false; throw e; }
    finally{ setNet(); S.inflight = null; }
  })();
  return S.inflight;
}
async function loadData(silent){
  if(!silent) skeleton();
  try{ await fetchSnap(); renderActive(); paintBadges(); }
  catch(e){ if(!S.snap) fail(e.message); else toast('Обновление не удалось: '+e.message,'warn'); }
}

/* ---------- индексы / поиск ---------- */
const IDX = {};
function buildIndex(){
  Object.keys(S.snap).forEach(k => {
    const rows = S.snap[k]; if(!Array.isArray(rows)) return;
    const map = new Map();
    rows.forEach(r => {
      let blob = '';
      for(const c in r){ const v = r[c]; if(v!=='' && v!=null) blob += String(v).toLowerCase()+' '; }
      r.__s = blob; map.set(String(r.__id||''), r);
    });
    IDX[k] = map;
  });
  ATT = {};
  (S.snap.attachments||[]).forEach(a => {
    const k = a['Модуль']+'::'+a['ID_Записи'];
    (ATT[k] = ATT[k] || []).push(a);
  });
}
let ATT = {};
const atts = (mod,id) => ATT[mod+'::'+id] || [];
function refLabel(mod, id){
  const m = MOD[mod]; if(!m) return id;
  const rows = S.snap[mod] || [];
  for(let i=0;i<rows.length;i++) if(String(rows[i][m.idCol]) === String(id)) return rows[i][m.titleCol] || id;
  return id;
}
function can(mod, cap){
  if(!S.user) return false;
  if(S.user.can.indexOf(cap) === -1) return false;
  if(S.user.modules === '*') return true;
  return mod ? S.user.modules.indexOf(mod) > -1 : false;
}
const visibleModules = () => MODULES.filter(m => (!m.adminOnly || S.user.role === 'Администратор') && (m.special ? (m.id==='admin' ? S.user.role==='Администратор' : true) : can(m.id,'view')));

/* ---------- мутации с оптимизмом и undo ---------- */
function localInsert(mod, rec){
  const m = MOD[mod]; if(!m) return;
  S.snap[mod] = S.snap[mod] || [];
  rec.__s = Object.keys(rec).map(k=>String(rec[k]).toLowerCase()).join(' ');
  S.snap[mod].unshift(rec); S.counts[mod] = (S.counts[mod]||0)+1;
}
function localPatch(mod, id, values){
  const m = MOD[mod], rows = S.snap[mod]||[];
  for(let i=0;i<rows.length;i++) if(String(rows[i][m.idCol]) === String(id)){ Object.assign(rows[i], values);
    rows[i].__s = Object.keys(rows[i]).map(k=>String(rows[i][k]).toLowerCase()).join(' '); return rows[i]; }
  return null;
}
function localRemove(mod, ids){
  const m = MOD[mod], set = new Set(ids.map(String));
  const rows = S.snap[mod]||[], keep = [], moved = [];
  rows.forEach(r => { if(set.has(String(r[m.idCol]))) moved.push(r); else keep.push(r); });
  S.snap[mod] = keep; S.counts[mod] = keep.length;
  S.trash[mod] = (S.trash[mod]||[]).concat(moved.map(r => ({ id:r[m.idCol], title:String(r[m.titleCol]||r[m.idCol]), module:mod })));
  return moved;
}
async function mutate(action, payload, opt){
  opt = opt || {};
  const before = opt.before ? opt.before() : null;
  if(opt.optimistic) opt.optimistic();
  if(opt.render !== false) renderActive();
  try{
    const r = await api(action, payload);
    if(opt.after) opt.after(r);
    bustLocal();
    fetchSnap().then(()=>{ renderActive(); paintBadges(); }).catch(()=>{});
    if(opt.done) toast(opt.done,'ok');
    return r;
  }catch(e){
    if(before) before();
    renderActive();
    toast(e.message,'bad');
    throw e;
  }
}
function bustLocal(){ try{ localStorage.removeItem(APP.cacheKey); }catch(e){} }

async function removeRecords(mod, ids){
  const m = MOD[mod];
  const snapshotRows = (S.snap[mod]||[]).slice();
  const snapshotTrash = (S.trash[mod]||[]).slice();
  await mutate('deleteRecords', { module:mod, ids:ids }, {
    optimistic: () => localRemove(mod, ids),
    before: () => { S.snap[mod] = snapshotRows; S.trash[mod] = snapshotTrash; S.counts[mod] = snapshotRows.length; },
    done: null
  });
  S.sel.clear();
  toast(m.title+': удалено '+ids.length,'warn','Отменить', async () => {
    try{ await api('restoreRecords',{ module:mod, ids:ids }); await fetchSnap(); renderActive(); paintBadges(); toast('Восстановлено','ok'); }
    catch(e){ toast(e.message,'bad'); }
  });
}

/* ---------- сессия ---------- */
async function login(){
  const l = val('loginInput').trim(), p = val('passwordInput');
  const err = $('#loginError'), btn = $('#loginBtn');
  err.textContent = ''; if(!l || !p){ err.textContent='Введите логин и пароль'; return; }
  btn.disabled = true; btn.classList.add('busy'); btn.textContent='Проверка…';
  try{
    const r = await api('login', { login:l, password:p });
    S.user = r.user; S.token = r.token;
    localStorage.setItem('sr_session', JSON.stringify({ user:S.user, token:S.token, at:Date.now() }));
    enterApp();
  }catch(e){ err.textContent = e.message; }
  finally{ btn.disabled=false; btn.classList.remove('busy'); btn.textContent='Войти в систему'; }
}
function logout(){
  S.user=null; S.token=null; S.snap=null; S.sel.clear();
  localStorage.removeItem('sr_session'); localStorage.removeItem(APP.cacheKey);
  $('#app').style.display='none'; $('#loginScreen').style.display='flex';
  $('#passwordInput').value='';
}
function enterApp(){
  $('#loginScreen').style.display='none'; $('#app').style.display='block';
  $('#uName').textContent = S.user.fio || S.user.login;
  $('#uRole').textContent = S.user.role;
  $('#uAvatar').textContent = initials(S.user.fio || S.user.login);
  loadViews(); buildNav(); buildMore(); buildShell();
  const cached = readCache();
  if(cached){ applySnap(cached); renderActive(); paintBadges(); }
  loadData(!cached);
}
function initials(s){ return String(s||'?').trim().split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase(); }

/* ---------- сохранённые виды ---------- */
function loadViews(){ try{ S.views = JSON.parse(localStorage.getItem(APP.viewKey)||'{}'); }catch(e){ S.views={}; } }
function saveViews(){ try{ localStorage.setItem(APP.viewKey, JSON.stringify(S.views)); }catch(e){} }

/* ---------- тема ---------- */
function initTheme(){ document.documentElement.dataset.theme = localStorage.getItem('sr_theme') || 'light'; }
function toggleTheme(){
  const n = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = n; localStorage.setItem('sr_theme', n);
  if(S.mod === 'dashboard') renderActive();
}
initTheme();

/* ---------- каркас состояний ---------- */
function skeleton(){
  const host = $('#modBody'); if(!host) return;
  host.innerHTML = '<div class="sk-wrap">'+Array.from({length:6}).map(()=>'<div class="sk-row"><span class="sk a"></span><span class="sk b"></span><span class="sk c"></span></div>').join('')+'</div>';
}
function fail(msg){
  const host = $('#modBody'); if(!host) return;
  host.innerHTML = '<div class="empty"><div class="empty-ico">⚠️</div><h3>Не удалось загрузить данные</h3><p>'+esc(msg)+'</p><button class="btn primary" onclick="loadData()">Повторить</button></div>';
}

/* ---------- экспорт ---------- */
async function exportCurrent(){
  const m = MOD[S.mod];
  if(!m || !m.sheet){ toast('Экспорт доступен в разделах с таблицей','warn'); return; }
  toast('Готовлю CSV…','info');
  try{ const r = await api('exportCsv',{ module:m.id }); window.open(r.fileUrl,'_blank'); toast('Файл готов: '+r.fileName,'ok'); }
  catch(e){ toast(e.message,'bad'); }
}

/* ---------- запуск ---------- */
window.addEventListener('DOMContentLoaded', () => {
  const raw = localStorage.getItem('sr_session');
  if(raw){
    try{
      const s = JSON.parse(raw);
      if(s && s.token && Date.now() - s.at < 216e5){ S.user = s.user; S.token = s.token; enterApp(); return; }
    }catch(e){}
  }
  $('#loginScreen').style.display='flex';
});
document.addEventListener('keydown', e => {
  if(e.key === 'Enter' && $('#loginScreen').style.display !== 'none' && document.activeElement.id === 'passwordInput'){ login(); return; }
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); const s=$('#search'); if(s){ s.focus(); s.select(); } }
  if(e.key === 'Escape'){ closeDrawer(); closeModal(); closeMore(); }
  if(e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'){ e.preventDefault(); const s=$('#search'); if(s) s.focus(); }
});
window.addEventListener('online', ()=>{ S.online=true; setNet(); });
window.addEventListener('offline', ()=>{ S.online=false; setNet(); });
