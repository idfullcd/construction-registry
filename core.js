const S={user:null,token:null,snap:null,trash:{},counts:{},mod:'contracts',views:{},sel:new Set(),page:{},q:{},filter:{},sort:{},
 inflight:null,lastTs:0,drawer:null,online:true,orderMode:false,dragId:null,prefs:null,queue:[],read:{},cols:{},
 pal:{open:false,idx:0,items:[]},notifOpen:false,focusRow:-1};
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>Array.prototype.slice.call((r||document).querySelectorAll(s));
const val=id=>{const e=document.getElementById(id);return e?e.value:'';};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{const n=parseFloat(String(v).replace(/\s/g,'').replace(',','.'));return isNaN(n)?0:n;};
const money=v=>num(v).toLocaleString('ru-RU')+' ₽';
const compact=v=>{const n=num(v);return n>=1e6?(n/1e6).toFixed(1)+' млн':n>=1e3?Math.round(n/1e3)+' тыс':String(Math.round(n));};
const short=(s,n)=>{s=String(s==null?'':s);return s.length>n?s.slice(0,n-1)+'…':s;};
const debounce=(fn,ms)=>{let t;return function(){const a=arguments,c=this;clearTimeout(t);t=setTimeout(()=>fn.apply(c,a),ms);};};
const isMobile=()=>window.matchMedia('(max-width: 860px)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function iso(d){const p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());}
function dstr(v){
  if(!v) return ''; if(v instanceof Date) return iso(v);
  const s=String(v); if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  const m=s.match(/^(\d{2})\.(\d{2})\.(\d{4})/); if(m) return m[3]+'-'+m[2]+'-'+m[1];
  const d=new Date(s); return isNaN(d)?s:iso(d);
}
function pretty(v){
  if(v===true) return 'Да'; if(v===false) return 'Нет';
  if(v instanceof Date) return dstr(v);
  const s=String(v==null?'':v);
  if(/^\d{4}-\d{2}-\d{2}T/.test(s)) return dstr(s);
  return s;
}
function daysLeft(d){const s=dstr(d);if(!s)return null;const t=new Date(s+'T00:00:00');if(isNaN(t))return null;return Math.ceil((t-new Date(new Date().toDateString()))/864e5);}
function hues(){return (PALETTES[S.prefs.dash.palette]||PALETTES.site).hues;}

function loadPrefs(){
  try{S.prefs=JSON.parse(localStorage.getItem(APP.prefKey)||'null');}catch(e){S.prefs=null;}
  if(!S.prefs) S.prefs=JSON.parse(JSON.stringify(PREF_DEFAULT));
  S.prefs.dash=Object.assign({},DASH_DEFAULT,S.prefs.dash||{});
  if(!DENSITY[S.prefs.density]) S.prefs.density='normal';
  applyDensity();
}
function savePrefs(){try{localStorage.setItem(APP.prefKey,JSON.stringify(S.prefs));}catch(e){}}
function applyDensity(){
  const d=DENSITY[S.prefs.density]||DENSITY.normal;
  document.documentElement.style.setProperty('--rowpad',d.row+'px');
  document.documentElement.style.setProperty('--rowfont',d.font+'px');
  document.documentElement.dataset.density=S.prefs.density;
}
function setDensity(v){S.prefs.density=v;savePrefs();applyDensity();toast('Плотность: '+({compact:'компактная',normal:'обычная',roomy:'просторная'}[v]),'ok');}
function loadRead(){try{S.read=JSON.parse(localStorage.getItem(APP.readKey)||'{}');}catch(e){S.read={};}}
function saveRead(){try{localStorage.setItem(APP.readKey,JSON.stringify(S.read));}catch(e){}}

function toast(msg,kind,actLabel,act){
  const host=$('#toasts'); if(!host) return;
  const el=document.createElement('div'); el.className='toast '+(kind||'info');
  el.innerHTML='<span class="toast-dot"></span><span class="toast-msg">'+esc(msg)+'</span>';
  if(actLabel){const b=document.createElement('button');b.className='toast-act';b.textContent=actLabel;b.onclick=()=>{el.remove();act&&act();};el.appendChild(b);}
  const x=document.createElement('button');x.className='toast-x';x.innerHTML='×';x.onclick=()=>el.remove();el.appendChild(x);
  host.appendChild(el); requestAnimationFrame(()=>el.classList.add('in'));
  setTimeout(()=>{el.classList.remove('in');setTimeout(()=>el.remove(),260);},actLabel?9000:4200);
}

const MUTATIONS=['createRecord','updateRecord','deleteRecords','restoreRecords','purgeRecords','reorder','attachFiles','deleteAttachment','addComment','addTaskReply','reviewSubmission','saveUser','removeUser','saveSettings','saveMyEmail'];
function loadQueue(){try{S.queue=JSON.parse(localStorage.getItem(APP.queueKey)||'[]');}catch(e){S.queue=[];}paintQueue();}
function saveQueue(){try{localStorage.setItem(APP.queueKey,JSON.stringify(S.queue));}catch(e){}paintQueue();}
function paintQueue(){
  const b=$('#queueBadge'); if(!b) return;
  b.textContent=S.queue.length||''; b.classList.toggle('show',S.queue.length>0);
}
async function flushQueue(){
  if(!S.queue.length||!S.token) return;
  const items=S.queue.slice(); let ok=0,fail=0;
  for(const it of items){
    try{ await rawApi(it.action,it.payload); ok++; S.queue=S.queue.filter(x=>x.id!==it.id); saveQueue(); }
    catch(e){ fail++; break; }
  }
  if(ok){ toast('Отложенных операций выполнено: '+ok,'ok'); bustLocal(); try{await fetchSnap();renderActive();paintBadges();}catch(e){} }
  if(fail) toast('Часть операций не отправлена — остались в очереди','warn');
}
async function rawApi(action,payload,opts){
  const body=JSON.stringify(Object.assign({action:action,token:S.token},payload||{}));
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),(opts&&opts.timeout)||45000);
  const res=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:body,signal:ctl.signal});
  clearTimeout(timer);
  const txt=await res.text(); let j;
  try{j=JSON.parse(txt);}catch(e){throw new Error('Некорректный ответ сервера');}
  if(j&&j.success===false) throw new Error(j.error||'Ошибка операции');
  if(j&&j.error&&j.success===undefined) throw new Error(j.error);
  return j;
}
async function api(action,payload,opts){
  try{ const j=await rawApi(action,payload,opts); S.online=true; return j; }
  catch(e){
    const net=/Failed to fetch|NetworkError|AbortError|Load failed/i.test(String(e.message||e));
    if(net){
      S.online=false;
      if(MUTATIONS.indexOf(action)>-1&&action!=='attachFiles'){
        S.queue.push({id:'q'+Date.now()+Math.random().toString(36).slice(2,6),action:action,payload:payload||{},at:Date.now()});
        saveQueue();
        throw new Error('Нет сети. Операция поставлена в очередь и выполнится при подключении.');
      }
      throw new Error('Нет связи с сервером. Проверьте сеть или VPN.');
    }
    throw new Error(e.message||'Ошибка операции');
  }finally{setNet();}
}
function setNet(){const b=$('#netBadge');if(!b)return;b.className='net '+(S.online?'ok':'bad');b.textContent=S.online?'онлайн':'нет связи';}

function readCache(){try{const j=JSON.parse(localStorage.getItem(APP.cacheKey)||'null');return j&&j.data?j:null;}catch(e){return null;}}
function writeCache(s){try{localStorage.setItem(APP.cacheKey,JSON.stringify({ts:s.ts,data:s.data,trash:s.trash,counts:s.counts}));}catch(e){}}
function bustLocal(){try{localStorage.removeItem(APP.cacheKey);}catch(e){}}
let ATT={};
function applySnap(s){
  S.snap=s.data||{};S.trash=s.trash||{};S.counts=s.counts||{};S.lastTs=Date.now();ATT={};
  Object.keys(S.snap).forEach(k=>{
    if(!Array.isArray(S.snap[k])) return;
    S.snap[k].forEach(r=>{delete r.__row;let b='';for(const c in r){const v=r[c];if(v!==''&&v!=null)b+=String(v).toLowerCase()+' ';}r.__s=b;});
  });
  (S.snap.attachments||[]).forEach(a=>{const k=a['Модуль']+'::'+a['ID_Записи'];(ATT[k]=ATT[k]||[]).push(a);});
  buildNotif();
}
async function fetchSnap(){
  if(S.inflight) return S.inflight;
  S.inflight=(async()=>{
    const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),40000);
    try{
      const res=await fetch(API_URL+'?type=snapshot&token='+encodeURIComponent(S.token||'')+'&_='+Date.now(),{signal:ctl.signal});
      const j=await res.json();clearTimeout(t);
      if(!j||!j.ok) throw new Error((j&&j.error)||'Снимок недоступен');
      applySnap(j);writeCache(j);S.online=true;return j;
    }catch(e){clearTimeout(t);S.online=false;throw e;}
    finally{setNet();S.inflight=null;}
  })();
  return S.inflight;
}
async function loadData(silent){
  if(!silent) skeleton();
  try{await fetchSnap();renderActive();paintBadges();paintNotif();}
  catch(e){
    if(/Сессия|авторизац/i.test(e.message)){toast('Сессия истекла — войдите заново','warn');setTimeout(logout,1200);return;}
    if(!S.snap) fail(e.message); else toast('Обновление не удалось: '+e.message,'warn');
  }
}
const atts=(mod,id)=>ATT[mod+'::'+id]||[];
function refLabel(mod,id){
  const m=MOD[mod]; if(!m||!id) return id||'';
  const rows=S.snap[mod]||[];
  for(let i=0;i<rows.length;i++) if(String(rows[i][m.idCol])===String(id)) return rows[i][m.titleCol]||id;
  return id;
}
function can(mod,cap){
  if(!S.user) return false;
  if(S.user.can.indexOf(cap)===-1) return false;
  if(S.user.modules==='*') return true;
  return mod?S.user.modules.indexOf(mod)>-1:false;
}
const visibleModules=()=>MODULES.filter(m=>{
  if(m.adminOnly) return S.user.role==='Администратор';
  if(m.special) return true;
  return can(m.id,'view');
});
function colsOf(m){
  const saved=S.cols[m.id];
  if(saved&&saved.length) return m.cols.filter(c=>saved.indexOf(c)>-1);
  return m.cols;
}
function localPatch(mod,id,values){
  const m=MOD[mod],rows=S.snap[mod]||[];
  for(let i=0;i<rows.length;i++) if(String(rows[i][m.idCol])===String(id)){
    Object.assign(rows[i],values);
    let b='';for(const c in rows[i]){if(c.indexOf('__')!==0){const v=rows[i][c];if(v!==''&&v!=null)b+=String(v).toLowerCase()+' ';}}
    rows[i].__s=b;return rows[i];
  }
  return null;
}
function localRemove(mod,ids){
  const m=MOD[mod],set=new Set(ids.map(String)),rows=S.snap[mod]||[],keep=[],moved=[];
  rows.forEach(r=>{if(set.has(String(r[m.idCol])))moved.push(r);else keep.push(r);});
  S.snap[mod]=keep;S.counts[mod]=keep.length;
  S.trash[mod]=(S.trash[mod]||[]).concat(moved.map(r=>({id:r[m.idCol],title:String(r[m.titleCol]||r[m.idCol]),module:mod})));
  buildNotif();return moved;
}
function safeRenderList(){const m=MOD[S.mod];if(m&&!m.special&&S.snap)renderList(m,++renderToken);}
function renderBulkSafe(){const m=MOD[S.mod];if(m&&!m.special)renderBulk(m);}
async function removeRecords(mod,ids){
  const rowsBak=(S.snap[mod]||[]).slice(),trashBak=(S.trash[mod]||[]).slice();
  localRemove(mod,ids);S.sel.clear();safeRenderList();renderBulkSafe();paintNotif();
  try{
    await api('deleteRecords',{module:mod,ids:ids});bustLocal();
    fetchSnap().then(()=>{renderActive();paintBadges();paintNotif();}).catch(()=>{});
    toast(MOD[mod].title+': удалено '+ids.length,'warn','Отменить',async()=>{
      try{await api('restoreRecords',{module:mod,ids:ids});await fetchSnap();renderActive();paintBadges();paintNotif();toast('Восстановлено','ok');}
      catch(e){toast(e.message,'bad');}
    });
  }catch(e){
    S.snap[mod]=rowsBak;S.trash[mod]=trashBak;S.counts[mod]=rowsBak.length;buildNotif();
    safeRenderList();renderBulkSafe();paintNotif();toast(e.message,'bad');
  }
}

let NOTIF=[];
function buildNotif(){
  const out=[],th=S.prefs?S.prefs.dash.threshold:14;
  const push=(kind,mod,id,title,sub,d)=>{out.push({key:mod+':'+id+':'+kind,kind:kind,mod:mod,id:id,title:title,sub:sub,days:d});};
  (S.snap.prescriptions||[]).forEach(p=>{const d=daysLeft(p['Срок_исполнения']);
    if(String(p['Статус'])!=='Исполнено'&&d!==null&&d<=th) push(d<0?'late':'soon','prescriptions',p['ID'],'Предписание '+p['Номер'],p['Тип']||'технадзор',d);});
  (S.snap.supervision||[]).forEach(p=>{const d=daysLeft(p['Срок_устранения']);
    if(String(p['Статус_устранения'])!=='Устранено'&&d!==null&&d<=th) push(d<0?'late':'soon','supervision',p['ID'],'Авторский надзор',short(p['Описание_замечания'],46),d);});
  (S.snap.personnelDocs||[]).forEach(p=>{const d=daysLeft(p['Срок_действия']);
    if(d!==null&&d<=30&&String(p['Статус'])!=='Отозван') push(d<0?'late':'soon','personnelDocs',p['ID'],p['Тип_документа'],refLabel('personnel',p['ID_Сотрудника']),d);});
  (S.snap.reminders||[]).forEach(r=>{const d=daysLeft(r['Дата']);
    if(String(r['Статус'])!=='Выполнено'&&d!==null&&d<=th) push(d<0?'late':'soon','reminders',r['ID'],r['Тип']||'Напоминание',short(r['Объект'],44),d);});
  (S.snap.tasks||[]).forEach(t=>{const d=daysLeft(t['Дедлайн']);
    if(['Выполнено','Отклонено'].indexOf(String(t['Статус']))===-1&&d!==null&&d<=th) push(d<0?'late':'soon','tasks',t['ID'],short(t['Тема'],44),'исполнитель: '+refLabel('users',t['Кому']),d);
    if(String(t['Кому'])===String(S.user.login)&&String(t['Статус'])==='Новое') push('new','tasks',t['ID'],short(t['Тема'],44),'новое задание вам',d);});
  (S.snap.submissions||[]).forEach(s=>{if(String(s['Статус'])==='На_проверке'&&can('submissions','review'))
    push('review','submissions',s['ID'],'Подача '+s['ID'],refLabel('estimateItems',s['ID_Позиции'])+' · '+s['Объём_подан'],null);});
  (S.snap.documents||[]).forEach(x=>{if(String(x['Статус_согласования'])==='Замечания')
    push('remark','documents',x['ID_Документа'],x['Тип_документа']+' №'+(x['Номер']||'—'),short(x['Наименование'],44),null);});
  (S.snap.materials||[]).forEach(x=>{const d=daysLeft(x['Срок_сертификата']);
    if(d!==null&&d<=th) push(d<0?'late':'soon','materials',x['ID'],'Сертификат: '+short(x['Наименование'],34),x['Поставщик']||'',d);});
  const rank={late:0,review:1,remark:2,soon:3,new:4};
  out.sort((a,b)=>(rank[a.kind]-rank[b.kind])||((a.days==null?999:a.days)-(b.days==null?999:b.days)));
  NOTIF=out;
}
function unreadCount(){return NOTIF.filter(n=>!S.read[n.key]).length;}
function paintNotif(){
  const b=$('#notifBadge'); if(!b) return;
  const n=unreadCount(); b.textContent=n>99?'99+':(n||''); b.classList.toggle('show',n>0);
  const bell=$('#bellBtn'); if(bell) bell.classList.toggle('ringing',NOTIF.some(x=>x.kind==='late'&&!S.read[x.key]));
}

async function login(){
  const l=val('loginInput').trim(),p=val('passwordInput'),err=$('#loginError'),btn=$('#loginBtn');
  err.textContent=''; if(!l||!p){err.textContent='Введите логин и пароль';return;}
  btn.disabled=true;btn.classList.add('busy');btn.textContent='Проверка…';
  try{
    const r=await api('login',{login:l,password:p});
    S.user=r.user;S.token=r.token;
    localStorage.setItem('sr_session',JSON.stringify({user:S.user,token:S.token,at:Date.now()}));
    enterApp();
  }catch(e){err.textContent=e.message;}
  finally{btn.disabled=false;btn.classList.remove('busy');btn.textContent='Войти в систему';}
}
function logout(){
  S.user=null;S.token=null;S.snap=null;S.sel.clear();NOTIF=[];
  localStorage.removeItem('sr_session');bustLocal();
  $('#app').style.display='none';$('#loginScreen').style.display='flex';$('#passwordInput').value='';
  closePalette();closeNotif();
}
function enterApp(){
  $('#loginScreen').style.display='none';$('#app').style.display='block';
  $('#uName').textContent=S.user.fio||S.user.login;
  $('#uRole').textContent=S.user.role;
  $('#uAvatar').textContent=initials(S.user.fio||S.user.login);
  loadPrefs();loadRead();loadQueue();loadViews();
  buildNav();buildMore();buildShell();
  const c=readCache(); if(c){applySnap(c);renderActive();paintBadges();paintNotif();}
  loadData(!c);
  if(S.queue.length) setTimeout(flushQueue,1500);
}
function initials(s){return String(s||'?').trim().split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();}
function loadViews(){try{S.views=JSON.parse(localStorage.getItem(APP.viewKey)||'{}');}catch(e){S.views={};}}
function saveViews(){try{localStorage.setItem(APP.viewKey,JSON.stringify(S.views));}catch(e){}}
function initTheme(){document.documentElement.dataset.theme=localStorage.getItem('sr_theme')||'light';}
function toggleTheme(){const n=document.documentElement.dataset.theme==='light'?'dark':'light';
  document.documentElement.dataset.theme=n;localStorage.setItem('sr_theme',n);if(S.mod==='dashboard')renderActive();}
initTheme();
function skeleton(){const h=$('#modBody');if(!h)return;
  h.innerHTML='<div class="sk-wrap">'+Array.from({length:6}).map(()=>'<div class="sk-row"><span class="sk a"></span><span class="sk b"></span><span class="sk c"></span></div>').join('')+'</div>';}
function fail(msg){const h=$('#modBody');if(!h)return;
  h.innerHTML='<div class="empty"><div class="empty-ico">⚠️</div><h3>Не удалось загрузить данные</h3><p>'+esc(msg)+'</p><button class="btn primary" onclick="loadData()">Повторить</button></div>';}
async function exportCurrent(fmt){
  const m=MOD[S.mod];
  if(!m||!m.sheet){toast('Экспорт доступен в разделах с таблицей','warn');return;}
  toast('Готовлю файл…','info');
  try{const r=await api('exportFile',{module:m.id,format:fmt||'csv'});window.open(r.fileUrl,'_blank');toast('Файл готов: '+r.fileName,'ok');}
  catch(e){toast(e.message,'bad');}
}
async function makeInventory(id){
  toast('Формирую опись PDF…','info');
  try{const r=await api('inventory',{module:'contracts',contractId:id});window.open(r.fileUrl,'_blank');toast('Опись готова','ok');}
  catch(e){toast(e.message,'bad');}
}
window.addEventListener('DOMContentLoaded',()=>{
  loadPrefs();
  const raw=localStorage.getItem('sr_session');
  if(raw){try{const s=JSON.parse(raw);
    if(s&&s.token&&Date.now()-s.at<216e5){S.user=s.user;S.token=s.token;enterApp();return;}}catch(e){}}
  $('#loginScreen').style.display='flex';
});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&$('#loginScreen').style.display!=='none'&&document.activeElement.id==='passwordInput'){login();return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette();return;}
  if(e.key==='Escape'){if(S.pal.open){closePalette();return;}if(S.notifOpen){closeNotif();return;}closeDrawer();closeModal();closeMore();return;}
  const typing=['INPUT','TEXTAREA','SELECT'].indexOf(document.activeElement.tagName)>-1;
  if(e.key==='/'&&!typing){e.preventDefault();openPalette();return;}
  if(!typing&&!S.pal.open&&!$('#modal').classList.contains('on')) tableKeys(e);
});
window.addEventListener('online',()=>{S.online=true;setNet();toast('Сеть восстановлена','ok');flushQueue();});
window.addEventListener('offline',()=>{S.online=false;setNet();toast('Нет сети — изменения будут отложены','warn');});
