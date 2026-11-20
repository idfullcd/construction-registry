/* Навигация, списки, формы, drawer, файлы, массовые операции, спец-разделы. */
let renderToken = 0;

function buildNav(){
  const host = $('#navGroups'); host.innerHTML = '';
  GROUPS.forEach(([g,label]) => {
    const mods = visibleModules().filter(m => m.group === g);
    if(!mods.length) return;
    const box = document.createElement('section'); box.className = 'nav-group';
    box.innerHTML = '<div class="nav-label">'+esc(label)+'</div>';
    const row = document.createElement('div'); row.className = 'nav-row';
    mods.forEach(m => {
      const b = document.createElement('button');
      b.className = 'tab'+(m.id===S.mod?' on':''); b.dataset.mod = m.id;
      b.innerHTML = '<span class="tab-ico">'+m.icon+'</span><span>'+esc(m.title)+'</span><span class="tab-n" data-badge="'+m.id+'"></span>';
      b.onclick = () => setModule(m.id);
      row.appendChild(b);
    });
    box.appendChild(row); host.appendChild(box);
  });
  const first = visibleModules()[0];
  if(!MOD[S.mod] || visibleModules().indexOf(MOD[S.mod]) === -1) S.mod = first ? first.id : 'dashboard';
}
function paintBadges(){
  $$('[data-badge]').forEach(el => {
    const id = el.dataset.badge, m = MOD[id];
    let n = 0;
    if(id === 'trash'){ n = Object.keys(S.trash).reduce((a,k)=>a+S.trash[k].length,0); }
    else if(m && !m.special){ n = (S.snap[m.id]||[]).length; }
    el.textContent = n ? n : '';
    el.classList.toggle('show', !!n);
    if(id === 'submissions'){
      const p = (S.snap.submissions||[]).filter(r => String(r['Статус'])==='На_проверке').length;
      el.textContent = p||''; el.classList.toggle('hot', p>0); el.classList.toggle('show', p>0);
    }
  });
  const ts = $('#syncTime'); if(ts) ts.textContent = S.lastTs ? new Date(S.lastTs).toLocaleTimeString('ru-RU') : '—';
}
function buildMore(){
  const host = $('#moreBody'); host.innerHTML='';
  GROUPS.forEach(([g,label]) => {
    const mods = visibleModules().filter(m => m.group === g); if(!mods.length) return;
    const s = document.createElement('div'); s.className='more-group';
    s.innerHTML = '<div class="more-label">'+esc(label)+'</div>';
    const grid = document.createElement('div'); grid.className='more-grid';
    mods.forEach(m => {
      const b=document.createElement('button'); b.className='more-item';
      b.innerHTML='<span>'+m.icon+'</span><b>'+esc(m.title)+'</b>';
      b.onclick=()=>{ setModule(m.id); closeMore(); };
      grid.appendChild(b);
    });
    s.appendChild(grid); host.appendChild(s);
  });
}
function openMore(){ $('#moreSheet').classList.add('on'); document.body.classList.add('lock'); }
function closeMore(){ $('#moreSheet').classList.remove('on'); document.body.classList.remove('lock'); }

function buildShell(){
  $('#modHost').innerHTML =
    '<div class="mod-head"><div><h1 id="modTitle">—</h1><div class="mod-sub" id="modSub"></div></div>'+
    '<div class="mod-actions" id="modActions"></div></div>'+
    '<div class="toolbar" id="toolbar"></div>'+
    '<div class="bulk" id="bulkBar"></div>'+
    '<div id="modBody"></div>';
  $('#modBody').addEventListener('click', onBodyClick);
  $('#toolbar').addEventListener('click', onToolbarClick);
  $('#toolbar').addEventListener('input', onToolbarInput);
  $('#toolbar').addEventListener('change', onToolbarChange);
  $('#bulkBar').addEventListener('click', onBulkClick);
  $('#modActions').addEventListener('click', onActionsClick);
}
function setModule(id){
  if(!MOD[id]) return;
  S.mod = id; S.sel.clear();
  $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.mod === id));
  $$('.mnav-item').forEach(t => t.classList.toggle('on', t.dataset.mod === id));
  renderActive();
  window.scrollTo({ top:0, behavior:'smooth' });
}

function renderActive(){
  const m = MOD[S.mod]; if(!m) return;
  const tok = ++renderToken;
  $('#modTitle').innerHTML = '<span class="mh-ico">'+m.icon+'</span>'+esc(m.title);
  const rows = m.special ? null : (S.snap[m.id]||[]);
  $('#modSub').textContent = m.special ? specialSub(m) : (rows.length+' записей · лист «'+m.sheet+'»');
  $('#modActions').innerHTML =
    (m.sheet && can(m.id,'create') ? '<button class="btn primary" data-a="new">＋ Создать</button>' : '')+
    (m.sheet && can(m.id,'export') ? '<button class="btn ghost" data-a="export">⤓ CSV</button>' : '')+
    '<button class="btn ghost" data-a="refresh">⟳ Обновить</button>';
  if(m.special){ $('#toolbar').innerHTML=''; $('#bulkBar').innerHTML=''; renderSpecial(m, tok); return; }
  renderToolbar(m); renderBulk(m); renderList(m, tok);
}
function specialSub(m){
  if(m.special==='dashboard') return 'Сводка по всем разделам';
  if(m.special==='progress') return 'Выполнение и подача КС-2 параллельно';
  if(m.special==='calendar') return 'События по месяцам';
  if(m.special==='trash') return Object.keys(S.trash).reduce((a,k)=>a+S.trash[k].length,0)+' записей в корзине';
  if(m.special==='admin') return 'Пользователи, роли и доступ';
  return (S.snap[m.source]||[]).length+' записей';
}

/* ---------- toolbar ---------- */
function renderToolbar(m){
  const v = S.views[m.id] && S.views[m.id].active ? S.views[m.id].list[S.views[m.id].active] : null;
  if(v && !S.q[m.id] && !S.filter[m.id]){ S.q[m.id]=v.q||''; S.filter[m.id]=v.status||''; S.sort[m.id]=v.sort||null; }
  const statuses = m.statuses || [];
  const names = Object.keys((S.views[m.id]||{}).list||{});
  $('#toolbar').innerHTML =
    '<div class="tb-search"><span>🔍</span><input id="search" placeholder="Поиск по разделу  /" value="'+esc(S.q[m.id]||')+'"></div>'+
    (statuses.length ? '<select id="fStatus" class="tb-sel"><option value="">Все статусы</option>'+statuses.map(s=>'<option'+(S.filter[m.id]===s?' selected':'')+'>'+esc(s)+'</option>').join('')+'</select>' : '')+
    '<select id="fSort" class="tb-sel"><option value="">Сортировка</option>'+m.cols.map(c=>'<option value="'+esc(c)+'"'+((S.sort[m.id]||{}).col===c?' selected':'')+'>по «'+esc(c)+'»</option>').join('')+'</select>'+
    '<button class="btn ghost sm" data-a="dir">'+(((S.sort[m.id]||{}).dir||'desc')==='desc'?'↓ убыв.':'↑ возр.')+'</button>'+
    '<div class="tb-views"><select id="fView" class="tb-sel"><option value="">Виды…</option>'+names.map(n=>'<option'+(((S.views[m.id]||{}).active===n)?' selected':'')+'>'+esc(n)+'</option>').join('')+'</select>'+
    '<button class="btn ghost sm" data-a="saveview" title="Сохранить текущий вид">💾</button>'+
    (names.length?'<button class="btn ghost sm" data-a="delview" title="Удалить вид">🗑</button>':'')+'</div>'+
    '<span class="tb-count" id="tbCount"></span>';
}
function onToolbarInput(e){
  if(e.target.id === 'search'){
    const m = MOD[S.mod]; S.q[m.id] = e.target.value; S.page[m.id] = 1;
    debouncedList();
  }
}
const debouncedList = debounce(()=>{ const m=MOD[S.mod]; if(m&&!m.special) renderList(m, ++renderToken); }, 170);
function onToolbarChange(e){
  const m = MOD[S.mod];
  if(e.target.id === 'fStatus'){ S.filter[m.id] = e.target.value; S.page[m.id]=1; renderList(m, ++renderToken); }
  if(e.target.id === 'fSort'){ S.sort[m.id] = { col:e.target.value, dir:(S.sort[m.id]||{}).dir||'desc' }; renderToolbar(m); renderList(m, ++renderToken); }
  if(e.target.id === 'fView'){
    const n = e.target.value; S.views[m.id] = S.views[m.id]||{list:{}};
    S.views[m.id].active = n||null;
    const v = n ? S.views[m.id].list[n] : null;
    S.q[m.id] = v?v.q:''; S.filter[m.id] = v?v.status:''; S.sort[m.id] = v?v.sort:null;
    saveViews(); renderToolbar(m); renderList(m, ++renderToken);
  }
}
function onToolbarClick(e){
  const a = e.target.closest('[data-a]'); if(!a) return;
  const m = MOD[S.mod];
  if(a.dataset.a === 'dir'){ const s = S.sort[m.id]||{col:m.cols[0],dir:'desc'}; s.dir = s.dir==='desc'?'asc':'desc'; S.sort[m.id]=s; renderToolbar(m); renderList(m,++renderToken); }
  if(a.dataset.a === 'saveview'){
    const n = prompt('Название вида:', 'Мой вид'); if(!n) return;
    S.views[m.id] = S.views[m.id]||{list:{}}; S.views[m.id].list[n] = { q:S.q[m.id]||'', status:S.filter[m.id]||'', sort:S.sort[m.id]||null };
    S.views[m.id].active = n; saveViews(); renderToolbar(m); toast('Вид «'+n+'» сохранён','ok');
  }
  if(a.dataset.a === 'delview'){
    const n = (S.views[m.id]||{}).active; if(!n){ toast('Выберите вид для удаления','warn'); return; }
    delete S.views[m.id].list[n]; S.views[m.id].active=null; saveViews(); renderToolbar(m); toast('Вид удалён','ok');
  }
}
function onActionsClick(e){
  const a = e.target.closest('[data-a]'); if(!a) return;
  if(a.dataset.a === 'new') openForm(MOD[S.mod], null);
  if(a.dataset.a === 'export') exportCurrent();
  if(a.dataset.a === 'refresh') loadData();
}

/* ---------- выборка ---------- */
const qCache = new Map();
function selectRows(m){
  const rows = S.snap[m.id]||[];
  const q = (S.q[m.id]||'').trim().toLowerCase();
  const f = S.filter[m.id]||'';
  const s = S.sort[m.id];
  const key = m.id+'|'+q+'|'+f+'|'+(s?s.col+s.dir:'')+'|'+rows.length+'|'+S.lastTs;
  if(qCache.has(key)) return qCache.get(key);
  let out = rows;
  if(q) out = out.filter(r => (r.__s||'').indexOf(q) > -1);
  if(f && m.statusCol) out = out.filter(r => String(r[m.statusCol]) === f);
  if(s && s.col){
    const dir = s.dir==='asc'?1:-1;
    out = out.slice().sort((a,b) => {
      const x=a[s.col], y=b[s.col], nx=parseFloat(x), ny=parseFloat(y);
      if(!isNaN(nx)&&!isNaN(ny)) return (nx-ny)*dir;
      return String(x||'').localeCompare(String(y||''),'ru')*dir;
    });
  }
  if(qCache.size > 60) qCache.clear();
  qCache.set(key,out); return out;
}
function statusKind(v){
  const s = String(v||'');
  if(/Согласован|Подтверждено|Выполнено|Закрыто|Победа|Принято|Оплачена|Доставлено|Активен|Действует|Работает|Согласовано|Исполнено|Утвержд|Сдан|Проведена/.test(s)) return 'ok';
  if(/проверке|разработке|согласовании|работе|пути|Подана|Выдан|Заказан|Ожидает|Новое|Отпуск|Подготовка|Мониторинг|Активно|Запланировано|Учтено|Принят/.test(s)) return 'warn';
  if(/Замечания|Отклонен|Отказ|Просрочен|Утерян|Выговор|Уволен|Отмен/.test(s)) return 'bad';
  return 'neutral';
}
function cell(m,c,r){
  let v = r[c];
  if(c === m.statusCol) return '<span class="chip '+statusKind(v)+'">'+esc(pretty(v)||'—')+'</span>';
  if(m.money === c || /Сумма|цена|Цена/.test(c)) return '<b class="num">'+(v?money(v):'—')+'</b>';
  if(/^Дата|Дедлайн|Срок/.test(c)) return '<span class="dt">'+esc(dstr(v)||'—')+'</span>';
  if(c === 'ID_Договора') return '<span class="ref">'+esc(short(refLabel('contracts',v),26))+'</span>';
  if(c === 'ID_Позиции') return '<span class="ref">'+esc(short(refLabel('estimateItems',v),28))+'</span>';
  if(c === 'ID_Сметы') return '<span class="ref">'+esc(short(refLabel('estimates',v),24))+'</span>';
  if(c === 'ID_Проекта') return '<span class="ref">'+esc(short(refLabel('architecture',v),24))+'</span>';
  if(c === 'ID_Подрядчика') return '<span class="ref">'+esc(short(refLabel('contractors',v),24))+'</span>';
  if(c === 'Кому') return '<span class="ref">'+esc(short(refLabel('users',v),22))+'</span>';
  if(c === 'Приоритет') return '<span class="chip '+(/Срочный/.test(v)?'bad':/Высокий/.test(v)?'warn':'neutral')+'">'+esc(v||'—')+'</span>';
  if(c === 'Закрыто_объём'){
    const t=num(r['Количество']), d=num(v), p=t?Math.min(100,Math.round(d/t*100)):0;
    return '<div class="mini"><div class="mini-bar"><i style="width:'+p+'%"></i></div><span>'+d+'/'+t+'</span></div>';
  }
  if(m.avatar === c) return '<div class="who"><span class="ava">'+esc(initials(v))+'</span><b>'+esc(v||'—')+'</b></div>';
  return esc(short(pretty(v),64)||'—');
}
function renderList(m, tok){
  if(tok !== renderToken) return;
  const rows = selectRows(m);
  const page = S.page[m.id]||1, lim = page*APP.page;
  const slice = rows.slice(0,lim);
  const cnt = $('#tbCount'); if(cnt) cnt.textContent = rows.length+' из '+(S.snap[m.id]||[]).length;
  if(!rows.length){
    $('#modBody').innerHTML = '<div class="empty"><div class="empty-ico">'+m.icon+'</div><h3>Ничего не найдено</h3><p>'+
      ((S.q[m.id]||S.filter[m.id]) ? 'Измените поиск или сбросьте фильтр.' : 'Создайте первую запись — она сразу появится в таблице и в Google Таблице.')+'</p>'+
      ((S.q[m.id]||S.filter[m.id]) ? '<button class="btn ghost" onclick="resetFilters()">Сбросить фильтры</button>' :
       (can(m.id,'create')?'<button class="btn primary" onclick="openForm(MOD[\''+m.id+'\'],null)">＋ Создать</button>':''))+'</div>';
    return;
  }
  const mob = isMobile();
  let html;
  if(mob){
    html = '<div class="cards">'+slice.map(r => {
      const id = r[m.idCol], on = S.sel.has(String(id));
      return '<article class="rcard'+(on?' sel':'')+'" data-id="'+esc(id)+'">'+
        '<div class="rcard-top"><label class="cb"><input type="checkbox" data-a="sel" data-id="'+esc(id)+'"'+(on?' checked':'')+'><i></i></label>'+
        '<button class="rcard-title" data-a="open" data-id="'+esc(id)+'">'+esc(r[m.titleCol]||id)+'</button>'+
        (m.statusCol?'<span class="chip '+statusKind(r[m.statusCol])+'">'+esc(r[m.statusCol]||'—')+'</span>':'')+'</div>'+
        '<div class="rcard-grid">'+m.cols.filter(c=>c!==m.titleCol&&c!==m.statusCol).slice(0,4).map(c=>'<div><span>'+esc(c)+'</span>'+cell(m,c,r)+'</div>').join('')+'</div>'+
        '<div class="rcard-foot"><span class="fid">'+esc(id)+'</span>'+
        (atts(m.id,id).length?'<span class="fcount">📎 '+atts(m.id,id).length+'</span>':'')+
        '<span class="grow"></span>'+
        (can(m.id,'edit')?'<button class="btn ghost sm" data-a="edit" data-id="'+esc(id)+'">✎</button>':'')+
        (can(m.id,'delete')?'<button class="btn danger sm" data-a="del" data-id="'+esc(id)+'">🗑</button>':'')+'</div></article>';
    }).join('')+'</div>';
  } else {
    const allOn = slice.length && slice.every(r => S.sel.has(String(r[m.idCol])));
    html = '<div class="tw"><table class="grid"><thead><tr>'+
      '<th class="cbs"><label class="cb"><input type="checkbox" data-a="selall"'+(allOn?' checked':'')+'><i></i></label></th>'+
      '<th class="cid">ID</th>'+m.cols.map(c=>'<th data-a="sort" data-col="'+esc(c)+'" class="sortable'+(((S.sort[m.id]||{}).col===c)?' act':'')+'">'+esc(c)+(((S.sort[m.id]||{}).col===c)?(((S.sort[m.id]||{}).dir==='asc')?' ↑':' ↓'):'')+'</th>').join('')+
      '<th class="cf">📎</th><th class="ca"></th></tr></thead><tbody>'+
      slice.map(r => {
        const id = r[m.idCol], on = S.sel.has(String(id));
        return '<tr class="'+(on?'sel':'')+'" data-id="'+esc(id)+'">'+
          '<td class="cbs"><label class="cb"><input type="checkbox" data-a="sel" data-id="'+esc(id)+'"'+(on?' checked':'')+'><i></i></label></td>'+
          '<td class="cid"><button class="idbtn" data-a="open" data-id="'+esc(id)+'">'+esc(id)+'</button></td>'+
          m.cols.map(c=>'<td>'+cell(m,c,r)+'</td>').join('')+
          '<td class="cf">'+(atts(m.id,id).length?'<span class="fcount">'+atts(m.id,id).length+'</span>':'<span class="dim">—</span>')+'</td>'+
          '<td class="ca"><div class="rowacts">'+
            '<button class="btn ghost sm" data-a="open" data-id="'+esc(id)+'" title="Карточка">👁</button>'+
            (can(m.id,'edit')?'<button class="btn ghost sm" data-a="edit" data-id="'+esc(id)+'" title="Изменить">✎</button>':'')+
            (can(m.id,'delete')?'<button class="btn danger sm" data-a="del" data-id="'+esc(id)+'" title="Удалить">🗑</button>':'')+
          '</div></td></tr>';
      }).join('')+'</tbody></table></div>';
  }
  if(rows.length > lim) html += '<div class="more-row"><button class="btn ghost" data-a="more">Показать ещё '+(Math.min(APP.page,rows.length-lim))+' из '+(rows.length-lim)+'</button></div>';
  $('#modBody').innerHTML = html;
}
function resetFilters(){ const m=MOD[S.mod]; S.q[m.id]=''; S.filter[m.id]=''; S.page[m.id]=1; renderToolbar(m); renderList(m,++renderToken); }
let lastSelIndex = -1;
function onBodyClick(e){
  const m = MOD[S.mod], t = e.target.closest('[data-a]'); if(!t) return;
  const a = t.dataset.a, id = t.dataset.id;
  if(a === 'more'){ S.page[m.id]=(S.page[m.id]||1)+1; renderList(m,++renderToken); return; }
  if(a === 'sort'){ const c=t.dataset.col, s=S.sort[m.id]||{}; S.sort[m.id]={col:c,dir:s.col===c&&s.dir==='desc'?'asc':'desc'}; renderToolbar(m); renderList(m,++renderToken); return; }
  if(a === 'sel'){
    const rows = selectRows(m).slice(0,(S.page[m.id]||1)*APP.page);
    const idx = rows.findIndex(r=>String(r[m.idCol])===String(id));
    if(e.shiftKey && lastSelIndex>-1){ const [a1,b1]=[Math.min(lastSelIndex,idx),Math.max(lastSelIndex,idx)];
      for(let i=a1;i<=b1;i++) S.sel.add(String(rows[i][m.idCol])); }
    else { S.sel.has(String(id)) ? S.sel.delete(String(id)) : S.sel.add(String(id)); }
    lastSelIndex = idx; renderBulk(m); renderList(m,++renderToken); return;
  }
  if(a === 'selall'){
    const rows = selectRows(m).slice(0,(S.page[m.id]||1)*APP.page);
    const all = rows.every(r=>S.sel.has(String(r[m.idCol])));
    rows.forEach(r => all ? S.sel.delete(String(r[m.idCol])) : S.sel.add(String(r[m.idCol])));
    renderBulk(m); renderList(m,++renderToken); return;
  }
  if(a === 'open') return openDrawer(m, id);
  if(a === 'edit') return openForm(m, findRec(m,id));
  if(a === 'del'){ if(confirm('Удалить запись '+id+'? Её можно будет вернуть из корзины.')) removeRecords(m.id,[id]); }
}
function findRec(m,id){ return (S.snap[m.id]||[]).filter(r=>String(r[m.idCol])===String(id))[0]||null; }
function renderBulk(m){
  const n = S.sel.size, bar = $('#bulkBar');
  if(!n){ bar.innerHTML=''; bar.classList.remove('on'); return; }
  bar.classList.add('on');
  bar.innerHTML = '<b>'+n+'</b> выбрано'+
    (can(m.id,'delete')?'<button class="btn danger sm" data-a="bdel">🗑 Удалить</button>':'')+
    (can(m.id,'edit') && m.statusCol ? '<select id="bulkStatus" class="tb-sel"><option value="">Статус…</option>'+m.statuses.map(s=>'<option>'+esc(s)+'</option>').join('')+'</select><button class="btn ghost sm" data-a="bstatus">Применить</button>':'')+
    '<button class="btn ghost sm" data-a="bclear">Снять выделение</button>';
}
async function onBulkClick(e){
  const t = e.target.closest('[data-a]'); if(!t) return;
  const m = MOD[S.mod], ids = Array.from(S.sel);
  if(t.dataset.a === 'bclear'){ S.sel.clear(); renderBulk(m); renderList(m,++renderToken); }
  if(t.dataset.a === 'bdel'){ if(confirm('Удалить '+ids.length+' записей?')) await removeRecords(m.id, ids); }
  if(t.dataset.a === 'bstatus'){
    const v = val('bulkStatus'); if(!v){ toast('Выберите статус','warn'); return; }
    const patch = {}; patch[m.statusCol]=v;
    const backup = ids.map(id => ({ id:id, old:(findRec(m,id)||{})[m.statusCol] }));
    ids.forEach(id => localPatch(m.id,id,patch)); renderList(m,++renderToken);
    try{
      for(const id of ids) await api('updateRecord',{ module:m.id, id:id, values:patch });
      toast('Статус обновлён: '+ids.length,'ok'); S.sel.clear(); renderBulk(m);
      await fetchSnap(); renderActive(); paintBadges();
    }catch(err){ backup.forEach(b => { const p={}; p[m.statusCol]=b.old; localPatch(m.id,b.id,p); }); renderList(m,++renderToken); toast(err.message,'bad'); }
  }
}

/* ---------- форма create / edit ---------- */
let formCtx = null;
function fieldHtml(m,f,rec){
  const id = 'f_'+f.c, v = rec ? rec[f.c] : '';
  const req = f.req ? ' <em>*</em>' : '';
  let inp;
  if(f.t === 'textarea') inp = '<textarea id="'+id+'" rows="3">'+esc(pretty(v))+'</textarea>';
  else if(f.t === 'select') inp = '<select id="'+id+'"><option value="">—</option>'+f.o.map(o=>'<option'+(String(v)===o?' selected':'')+'>'+esc(o)+'</option>').join('')+'</select>';
  else if(f.type === 'ref'){
    const rows = S.snap[f.ref]||[];
    inp = '<select id="'+id+'"><option value="">— не выбрано —</option>'+rows.map(r=>{
      const rid = r[f.refId], lab = r[f.refLabel]||rid;
      return '<option value="'+esc(rid)+'"'+(String(v)===String(rid)?' selected':'')+'>'+esc(short(lab,60))+' · '+esc(rid)+'</option>';
    }).join('')+'</select>';
  }
  else if(f.t === 'date') inp = '<input id="'+id+'" type="date" value="'+esc(dstr(v))+'">';
  else if(f.t === 'number') inp = '<input id="'+id+'" type="number" step="any" value="'+esc(v===''||v==null?'':num(v))+'">';
  else inp = '<input id="'+id+'" type="'+(f.t==='email'?'email':'text')+'" value="'+esc(pretty(v))+'">';
  return '<div class="fg'+(f.wide?' wide':'')+'"><label for="'+id+'">'+esc(f.l)+req+'</label>'+inp+'</div>';
}
function openForm(m, rec){
  if(!m || !m.fields) return;
  formCtx = { mod:m.id, id: rec ? rec[m.idCol] : null };
  const isEdit = !!rec;
  if(isEdit && !can(m.id,'edit')){ toast('Нет прав на изменение','warn'); return; }
  if(!isEdit && !can(m.id,'create')){ toast('Нет прав на создание','warn'); return; }
  $('#modalTitle').innerHTML = (isEdit?'✎ ':'＋ ')+esc(m.title)+(isEdit?' · '+esc(rec[m.idCol]):'');
  $('#modalBody').innerHTML =
    '<form class="form" id="recForm" onsubmit="return false">'+m.fields.map(f=>fieldHtml(m,f,rec)).join('')+
    (m.calc?'<div class="calc-note">Сумма считается автоматически: количество × цена.</div>':'')+
    '</form>'+
    (isEdit ? '' : '<div class="drop" id="newDrop"><input type="file" id="newFiles" multiple hidden><div class="drop-in"><b>📎 Файлы можно приложить сразу</b><span>PDF, DOC, XLS, JPG, PNG · до 10 МБ каждый</span><button class="btn ghost sm" type="button" onclick="document.getElementById(\'newFiles\').click()">Выбрать файлы</button><div id="newFileList" class="flist"></div></div></div>');
  $('#modalFoot').innerHTML =
    '<button class="btn ghost" onclick="closeModal()">Отмена</button>'+
    '<button class="btn primary" id="saveBtn" onclick="submitForm()">'+(isEdit?'Сохранить изменения':'Создать запись')+'</button>';
  $('#modal').classList.add('on'); document.body.classList.add('lock');
  if(!isEdit){
    const inp = $('#newFiles');
    inp.onchange = () => {
      $('#newFileList').innerHTML = Array.from(inp.files).map(f=>'<span class="fchip">'+esc(f.name)+' <i>'+(f.size/1024).toFixed(0)+' КБ</i></span>').join('');
    };
  }
  setTimeout(()=>{ const first = $('#recForm input, #recForm select, #recForm textarea'); if(first) first.focus(); },60);
}
function closeModal(){ $('#modal').classList.remove('on'); document.body.classList.remove('lock'); formCtx=null; }
async function submitForm(){
  if(!formCtx) return;
  const m = MOD[formCtx.mod], values = {};
  for(const f of m.fields){
    const e = document.getElementById('f_'+f.c); if(!e) continue;
    let v = e.value;
    if(f.t === 'number') v = v === '' ? '' : num(v);
    if(f.req && (v === '' || v == null)){ e.classList.add('bad'); e.focus(); toast('Заполните «'+f.l+'»','warn'); return; }
    e.classList.remove('bad'); values[f.c] = v;
  }
  if(m.calc){ const a=num(values[m.calc[0]]), b=num(values[m.calc[1]]); if(a&&b) values['Сумма']=a*b; }
  const btn = $('#saveBtn'); btn.disabled=true; btn.classList.add('busy'); btn.textContent='Сохраняю…';
  try{
    if(formCtx.id){
      const id = formCtx.id, prev = Object.assign({}, findRec(m,id));
      localPatch(m.id,id,values); renderList(m,++renderToken);
      await api('updateRecord',{ module:m.id, id:id, values:values });
      toast('Изменения сохранены','ok');
      closeModal(); await fetchSnap(); renderActive(); paintBadges();
      if(S.drawer && S.drawer.id===id) openDrawer(m,id);
    } else {
      const r = await api('createRecord',{ module:m.id, values:values });
      const files = $('#newFiles') ? Array.from($('#newFiles').files) : [];
      if(files.length) await uploadTo(m.id, r.id, files, true);
      toast('Создано: '+r.id,'ok');
      closeModal(); await fetchSnap(); renderActive(); paintBadges(); openDrawer(m, r.id);
    }
  }catch(e){ toast(e.message,'bad'); }
  finally{ if(btn){ btn.disabled=false; btn.classList.remove('busy'); btn.textContent = formCtx&&formCtx.id?'Сохранить изменения':'Создать запись'; } }
}

/* ---------- drawer ---------- */
function openDrawer(m, id){
  const r = findRec(m,id); if(!r){ toast('Запись не найдена','warn'); return; }
  S.drawer = { mod:m.id, id:id };
  $('#drawerTitle').innerHTML = '<span class="dh-ico">'+m.icon+'</span><div><b>'+esc(r[m.titleCol]||id)+'</b><span>'+esc(m.title)+' · '+esc(id)+'</span></div>';
  const list = (m.fields||[]).map(f => ({ l:f.l, v:r[f.c], f:f }));
  const extra = Object.keys(r).filter(k => k.indexOf('__')!==0 && k!=='Удалено' && (m.fields||[]).every(f=>f.c!==k) && k!==m.idCol);
  let body = '<div class="dgrid">'+list.map(x =>
    '<div class="dcell'+(x.f&&x.f.wide?' wide':'')+'"><span>'+esc(x.l)+'</span><div>'+
    (x.f&&x.f.c===m.statusCol ? '<span class="chip '+statusKind(x.v)+'">'+esc(pretty(x.v)||'—')+'</span>' :
     x.f&&x.f.type==='ref' ? '<b>'+esc(refLabel(x.f.ref,x.v)||'—')+'</b>' :
     (m.money===x.f.c||/Сумма|Цена/.test(x.f.c)) && x.v!=='' ? '<b class="num">'+money(x.v)+'</b>' :
     '<b>'+esc(pretty(x.v)||'—')+'</b>')+'</div></div>').join('')+'</div>';
  if(extra.length) body += '<div class="dextra"><div class="dsub">Служебные поля</div>'+extra.map(k=>'<div class="drow"><span>'+esc(k)+'</span><b>'+esc(short(pretty(r[k]),80)||'—')+'</b></div>').join('')+'</div>';
  if(m.review && String(r['Статус'])==='На_проверке' && can('submissions','review')){
    body += '<div class="review"><div class="dsub">Проверка объёма</div>'+
      '<div class="review-row"><label>Подтвердить объём</label><input id="revVol" type="number" step="any" value="'+esc(num(r['Объём_подан']))+'"></div>'+
      '<div class="review-row"><label>Комментарий</label><textarea id="revCom" rows="2" placeholder="Причина корректировки или отказа"></textarea></div>'+
      '<div class="review-acts"><button class="btn ok" onclick="doReview(\''+esc(id)+'\',\'Подтверждено\')">✓ Подтвердить</button>'+
      '<button class="btn warn" onclick="doReview(\''+esc(id)+'\',\'Отредактировано\')">✎ Скорректировать</button>'+
      '<button class="btn danger" onclick="doReview(\''+esc(id)+'\',\'Отклонено\')">✕ Отклонить</button></div></div>';
  }
  if(m.id==='estimateItems'){
    const t=num(r['Количество']), d=num(r['Закрыто_объём']), p=t?Math.min(100,Math.round(d/t*100)):0;
    body += '<div class="dblock"><div class="dsub">Закрытие объёма</div><div class="big-bar"><i style="width:'+p+'%"></i><span>'+d+' / '+t+' '+esc(r['Ед_изм']||'')+' · '+p+'%</span></div></div>';
  }
  if(m.id==='tasks'){
    const reps = (S.snap.taskReplies||[]).filter(x=>String(x['ID_Задания'])===String(id));
    body += '<div class="dblock"><div class="dsub">Переписка ('+reps.length+')</div>'+
      (reps.length?reps.map(x=>'<div class="msg"><b>'+esc(refLabel('users',x['От_кого']))+'</b><i>'+esc(pretty(x['Время']))+'</i><p>'+esc(x['Текст'])+'</p></div>').join(''):'<p class="dim">Ответов пока нет.</p>')+'</div>';
  }
  body += '<div class="dblock"><div class="dsub">Файлы записи</div><div id="dFiles">'+filesHtml(m.id,id)+'</div>'+
    (can(m.id,'edit')?'<div class="drop sm" id="dDrop"><input type="file" id="dFileInput" multiple hidden><div class="drop-in"><b>Перетащите файлы сюда</b><span>или</span><button class="btn ghost sm" onclick="document.getElementById(\'dFileInput\').click()">Выбрать файлы</button></div></div>':'')+'</div>';
  $('#drawerBody').innerHTML = body;
  $('#drawerFoot').innerHTML =
    (can(m.id,'edit')?'<button class="btn primary" onclick="openForm(MOD[\''+m.id+'\'],findRec(MOD[\''+m.id+'\'],\''+esc(id)+'\'))">✎ Редактировать</button>':'')+
    (can(m.id,'delete')?'<button class="btn danger" onclick="drawerDelete()">🗑 Удалить</button>':'')+
    '<button class="btn ghost" onclick="closeDrawer()">Закрыть</button>';
  $('#drawer').classList.add('on'); $('#scrim').classList.add('on'); document.body.classList.add('lock');
  const inp = $('#dFileInput');
  if(inp){
    inp.onchange = () => uploadTo(m.id,id,Array.from(inp.files));
    const dz = $('#dDrop');
    ['dragenter','dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('hot'); }));
    ['dragleave','drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('hot'); }));
    dz.addEventListener('drop', e => { if(e.dataTransfer.files.length) uploadTo(m.id,id,Array.from(e.dataTransfer.files)); });
  }
}
function closeDrawer(){ $('#drawer').classList.remove('on'); $('#scrim').classList.remove('on'); document.body.classList.remove('lock'); S.drawer=null; }
function drawerDelete(){
  if(!S.drawer) return; const d=S.drawer;
  if(confirm('Удалить '+d.id+'?')){ closeDrawer(); removeRecords(d.mod,[d.id]); }
}
function filesHtml(mod,id){
  const list = atts(mod,id);
  if(!list.length) return '<p class="dim">Файлов нет.</p>';
  return '<div class="files">'+list.map(f =>
    '<div class="file"><span class="fico">'+fileIcon(f['Имя_файла'])+'</span>'+
    '<div class="fmeta"><b>'+esc(f['Имя_файла'])+'</b><i>'+(num(f['Размер'])/1024).toFixed(0)+' КБ · '+esc(pretty(f['Дата']))+' · '+esc(f['Кто_загрузил']||'')+'</i></div>'+
    '<a class="btn ghost sm" href="'+esc(f['Ссылка'])+'" target="_blank" rel="noopener">Открыть</a>'+
    '<a class="btn ghost sm" href="https://drive.google.com/uc?export=download&id='+esc(f['FileID'])+'" target="_blank" rel="noopener">⤓</a>'+
    (can(mod,'edit')?'<button class="btn danger sm" onclick="dropFile(\''+esc(f['ID'])+'\')">×</button>':'')+'</div>').join('')+'</div>';
}
function fileIcon(n){
  const s=String(n||'').toLowerCase();
  if(/\.(jpg|jpeg|png|gif|webp|heic)$/.test(s)) return '🖼';
  if(/\.pdf$/.test(s)) return '📕';
  if(/\.(doc|docx)$/.test(s)) return '📘';
  if(/\.(xls|xlsx|csv)$/.test(s)) return '📗';
  if(/\.(dwg|dxf)$/.test(s)) return '📐';
  if(/\.(zip|rar|7z)$/.test(s)) return '🗜';
  return '📄';
}
function b64(file){
  return new Promise((res,rej) => { const r=new FileReader(); r.onload=e=>res(String(e.target.result).split(',')[1]); r.onerror=()=>rej(new Error('Не удалось прочитать '+file.name)); r.readAsDataURL(file); });
}
async function uploadTo(mod,id,files,quiet){
  const ok = files.filter(f => f.size <= 10*1024*1024);
  const skipped = files.length - ok.length;
  if(skipped) toast(skipped+' файл(ов) больше 10 МБ — пропущены','warn');
  if(!ok.length) return;
  const holder = quiet ? null : $('#dFiles');
  if(holder) holder.insertAdjacentHTML('afterbegin','<div class="uploading" id="upBar"><i></i><span>Загрузка '+ok.length+' файл(ов)…</span></div>');
  try{
    const payload = [];
    for(const f of ok) payload.push({ fileName:f.name, mimeType:f.type||'application/octet-stream', fileData:await b64(f) });
    const r = await api('attachFiles',{ module:mod, recordId:String(id), files:payload }, { timeout:120000 });
    ATT[mod+'::'+id] = (ATT[mod+'::'+id]||[]).concat(r.attachments||[]);
    (S.snap.attachments = S.snap.attachments||[]).push.apply(S.snap.attachments, r.attachments||[]);
    if(!quiet){ $('#dFiles').innerHTML = filesHtml(mod,id); toast('Загружено файлов: '+ok.length,'ok'); }
    renderList(MOD[mod], ++renderToken);
  }catch(e){ if(holder){ const b=$('#upBar'); if(b) b.remove(); } toast(e.message,'bad'); }
}
async function dropFile(fid){
  if(!confirm('Удалить файл?')) return;
  try{
    await api('deleteAttachment',{ id:fid });
    Object.keys(ATT).forEach(k => ATT[k] = ATT[k].filter(f => String(f['ID'])!==String(fid)));
    S.snap.attachments = (S.snap.attachments||[]).filter(f => String(f['ID'])!==String(fid));
    if(S.drawer) $('#dFiles').innerHTML = filesHtml(S.drawer.mod,S.drawer.id);
    renderList(MOD[S.mod], ++renderToken); toast('Файл удалён','ok');
  }catch(e){ toast(e.message,'bad'); }
}
async function doReview(id,status){
  const v = num(val('revVol')), c = val('revCom');
  if(status==='Отклонено' && !c){ toast('Укажите причину отказа','warn'); return; }
  try{
    await api('reviewSubmission',{ id:id, status:status, volume:v, comment:c });
    toast('Подача '+status.toLowerCase()+' · объём '+(status==='Отклонено'?0:v),'ok');
    closeDrawer(); await fetchSnap(); renderActive(); paintBadges();
  }catch(e){ toast(e.message,'bad'); }
}

/* ---------- спец-разделы ---------- */
function renderSpecial(m, tok){
  if(m.special==='dashboard') return renderDashboard(tok);
  if(m.special==='progress') return renderProgressShell();
  if(m.special==='calendar') return renderCalendar();
  if(m.special==='trash') return renderTrash();
  if(m.special==='audit') return renderAudit(m);
  if(m.special==='admin') return renderAdmin();
}
function renderDashboard(tok){
  const c = S.counts, snap = S.snap;
  const totalDocs = (snap.documents||[]).length;
  const noOrig = (snap.documents||[]).filter(d=>String(d['Статус_оригинала'])==='Только скан').length;
  const pend = (snap.submissions||[]).filter(s=>String(s['Статус'])==='На_проверке').length;
  const over = (snap.prescriptions||[]).filter(p=>String(p['Статус'])!=='Исполнено' && daysLeft(p['Срок_исполнения'])!==null && daysLeft(p['Срок_исполнения'])<0).length;
  const soon = (snap.reminders||[]).filter(r=>String(r['Статус'])!=='Выполнено' && daysLeft(r['Дата'])!==null && daysLeft(r['Дата'])<=7).length;
  const ks2sum = (snap.ks2||[]).reduce((a,k)=>a+num(k['Общая_сумма']),0);
  const contractsSum = (snap.contracts||[]).reduce((a,k)=>a+num(k['Сумма']),0);
  const kpi = [
    ['Договоры', c.contracts||0, money(contractsSum),'#ff6b35'],
    ['Документы', totalDocs, noOrig+' без оригинала','#2f6df6'],
    ['На проверке', pend, 'подачи объёмов','#f59f00'],
    ['КС-2', c.ks2||0, money(ks2sum),'#12b886'],
    ['Просрочено', over, 'предписания','#e8437f'],
    ['Сроки ≤7 дней', soon, 'напоминания','#7c5cff']
  ];
  const byCat = {};
  (snap.documents||[]).forEach(d => { const k=d['Категория']||'Другое'; byCat[k]=(byCat[k]||0)+1; });
  const byStatus = {};
  (snap.documents||[]).forEach(d => { const k=d['Статус_согласования']||'—'; byStatus[k]=(byStatus[k]||0)+1; });
  const top = (snap.contracts||[]).slice().sort((a,b)=>num(b['Сумма'])-num(a['Сумма'])).slice(0,6);
  const maxTop = top.length?num(top[0]['Сумма']):1;
  const activity = (snap.actions||[]).slice(0,10);
  if(tok!==renderToken) return;
  $('#modBody').innerHTML =
    '<div class="kpis">'+kpi.map(k=>'<div class="kpi" style="--k:'+k[3]+'"><span class="kpi-l">'+esc(k[0])+'</span><b class="kpi-n">'+k[1]+'</b><span class="kpi-s">'+esc(k[2])+'</span></div>').join('')+'</div>'+
    '<div class="dash-grid">'+
      '<section class="panel"><h3>Документы по категориям</h3>'+donut(byCat)+'</section>'+
      '<section class="panel"><h3>Статусы согласования</h3>'+bars(byStatus)+'</section>'+
      '<section class="panel wide"><h3>Крупнейшие договоры</h3><div class="hbars">'+
        (top.length?top.map((t,i)=>'<div class="hbar"><span class="hb-l">'+esc(short(t['Контрагент'],30))+'</span><div class="hb-t"><i style="width:'+Math.max(4,num(t['Сумма'])/maxTop*100)+'%;background:'+CHART_HUES[i%CHART_HUES.length]+'"></i></div><b>'+money(t['Сумма'])+'</b></div>').join(''):'<p class="dim">Договоров пока нет.</p>')+
      '</div></section>'+
      '<section class="panel"><h3>Последние действия</h3><div class="feed">'+
        (activity.length?activity.map(a=>'<div class="feed-i"><span class="fd-dot"></span><div><b>'+esc(a['Действие'])+'</b><i>'+esc(a['Пользователь'])+' · '+esc(pretty(a['Дата']))+'</i><p>'+esc(short(a['Объект'],40))+'</p></div></div>').join(''):'<p class="dim">Журнал пуст.</p>')+
      '</div></section>'+
      '<section class="panel"><h3>Требуют внимания</h3><div class="feed">'+attentionList()+'</div></section>'+
    '</div>';
}
function attentionList(){
  const out = [];
  (S.snap.prescriptions||[]).forEach(p => { const d=daysLeft(p['Срок_исполнения']); if(String(p['Статус'])!=='Исполнено' && d!==null && d<=3) out.push(['⚠️','Предписание '+p['Номер'], d<0?('просрочено '+Math.abs(d)+' дн.'):('осталось '+d+' дн.'),'prescriptions']); });
  (S.snap.reminders||[]).forEach(r => { const d=daysLeft(r['Дата']); if(String(r['Статус'])!=='Выполнено' && d!==null && d<=7) out.push(['⏰',r['Тип']+' · '+short(r['Объект'],26), d<0?('просрочено '+Math.abs(d)+' дн.'):('через '+d+' дн.'),'reminders']); });
  (S.snap.tasks||[]).forEach(t => { const d=daysLeft(t['Дедлайн']); if(['Выполнено','Отклонено'].indexOf(String(t['Статус']))===-1 && d!==null && d<=3) out.push(['📨',short(t['Тема'],30), d<0?('просрочено '+Math.abs(d)+' дн.'):('дедлайн через '+d+' дн.'),'tasks']); });
  if(!out.length) return '<p class="dim">Просрочек и близких сроков нет.</p>';
  return out.slice(0,12).map(x=>'<button class="att-i" onclick="setModule(\''+x[3]+'\')"><span>'+x[0]+'</span><div><b>'+esc(x[1])+'</b><i>'+esc(x[2])+'</i></div><em>→</em></button>').join('');
}
function donut(obj){
  const keys = Object.keys(obj); if(!keys.length) return '<p class="dim">Нет данных.</p>';
  const total = keys.reduce((a,k)=>a+obj[k],0);
  let acc = 0, segs = '';
  keys.forEach((k,i) => {
    const frac = obj[k]/total, len = frac*276.46;
    segs += '<circle r="44" cx="60" cy="60" fill="none" stroke="'+CHART_HUES[i%8]+'" stroke-width="16" stroke-dasharray="'+len.toFixed(2)+' 276.46" stroke-dashoffset="'+(-acc).toFixed(2)+'" transform="rotate(-90 60 60)"><title>'+esc(k)+': '+obj[k]+'</title></circle>';
    acc += len;
  });
  return '<div class="donut-wrap"><svg viewBox="0 0 120 120" class="donut">'+segs+
    '<text x="60" y="57" text-anchor="middle" class="dn">'+total+'</text><text x="60" y="72" text-anchor="middle" class="dl">всего</text></svg>'+
    '<ul class="legend">'+keys.map((k,i)=>'<li><i style="background:'+CHART_HUES[i%8]+'"></i><span>'+esc(k)+'</span><b>'+obj[k]+'</b><em>'+Math.round(obj[k]/total*100)+'%</em></li>').join('')+'</ul></div>';
}
function bars(obj){
  const keys = Object.keys(obj); if(!keys.length) return '<p class="dim">Нет данных.</p>';
  const max = Math.max.apply(null,keys.map(k=>obj[k]));
  return '<div class="vbars">'+keys.map((k,i)=>'<div class="vbar"><b>'+obj[k]+'</b><div class="vb-t"><i style="height:'+Math.max(6,obj[k]/max*100)+'%;background:'+CHART_HUES[i%8]+'"></i></div><span>'+esc(short(k,14))+'</span></div>').join('')+'</div>';
}
function renderProgressShell(){
  const opts = (S.snap.contracts||[]).map(c=>'<option value="'+esc(c['ID_Договора'])+'">'+esc(c['Контрагент'])+' · №'+esc(c['Номер_Договора'])+'</option>').join('');
  $('#modBody').innerHTML = '<div class="panel"><div class="pg-pick"><label>Договор</label><select id="pgContract"><option value="">— выберите договор —</option>'+opts+'</select><button class="btn primary" onclick="loadProgress()">Показать</button></div><div id="pgOut"><p class="dim">Выберите договор, чтобы увидеть две параллельные шкалы: выполнение работ и подачу КС-2.</p></div></div>';
  $('#pgContract').onchange = loadProgress;
}
async function loadProgress(){
  const id = val('pgContract'); const out = $('#pgOut');
  if(!id){ out.innerHTML='<p class="dim">Выберите договор.</p>'; return; }
  out.innerHTML = '<div class="sk-wrap"><div class="sk-row"><span class="sk a"></span><span class="sk b"></span><span class="sk c"></span></div></div>';
  try{
    const r = await api('progress',{ contractId:id });
    const s = r.summary;
    const pct = (a,b) => b?Math.min(100,a/b*100):0;
    out.innerHTML =
      '<div class="pg-sum">'+
      [['Объём по смете',s.total,''],['Выполнено',s.done,money(s.doneAmount)],['На проверке',s.review,''],['Осталось',s.rest,''],['Подано КС-2',s.billed,money(s.billedAmount)],['Не подано КС-2',s.unbilled,'']]
        .map((x,i)=>'<div class="pgs" style="--k:'+CHART_HUES[i%8]+'"><span>'+x[0]+'</span><b>'+(+x[1]).toFixed(2).replace(/\.00$/,'')+'</b><i>'+esc(x[2]||'')+'</i></div>').join('')+'</div>'+
      (r.positions.length ? r.positions.map(p =>
        '<div class="pg-row"><div class="pg-head"><b>'+esc(p.name)+'</b><span>'+esc(p.section||'')+' · '+esc(p.unit||'')+' · '+money(p.amount)+'</span></div>'+
        '<div class="pg-line"><label>Выполнение</label><div class="stack">'+
          '<i class="s-ok" style="width:'+pct(p.done,p.total)+'%" title="Подтверждено: '+p.done+'">'+(pct(p.done,p.total)>9?p.done:'')+'</i>'+
          '<i class="s-warn" style="width:'+pct(p.review,p.total)+'%" title="На проверке: '+p.review+'">'+(pct(p.review,p.total)>9?p.review:'')+'</i>'+
          '<i class="s-rest" style="width:'+pct(p.rest,p.total)+'%" title="Осталось: '+p.rest+'">'+(pct(p.rest,p.total)>9?p.rest:'')+'</i>'+
        '</div><em>'+p.done+' / '+p.total+'</em></div>'+
        '<div class="pg-line"><label>КС-2</label><div class="stack">'+
          '<i class="s-bill" style="width:'+pct(p.billed,p.total)+'%" title="Подано: '+p.billed+'">'+(pct(p.billed,p.total)>9?p.billed:'')+'</i>'+
          '<i class="s-rest" style="width:'+pct(p.unbilled,p.total)+'%" title="Не подано: '+p.unbilled+'">'+(pct(p.unbilled,p.total)>9?p.unbilled:'')+'</i>'+
        '</div><em>'+p.billed+' / '+p.total+'</em></div></div>').join('')
        : '<p class="dim">У договора нет позиций сметы. Добавьте их в разделе «Позиции смет».</p>')+
      '<div class="legend-row"><span><i class="s-ok"></i>подтверждено</span><span><i class="s-warn"></i>на проверке</span><span><i class="s-bill"></i>подано КС-2</span><span><i class="s-rest"></i>остаток</span></div>'+
      (r.ks2.length?'<div class="dsub" style="margin-top:14px">Акты КС-2 ('+r.ks2.length+')</div><div class="tw"><table class="grid"><thead><tr><th>ID</th><th>Номер</th><th>Дата</th><th>Сумма</th><th>Статус</th></tr></thead><tbody>'+
        r.ks2.map(k=>'<tr><td class="cid">'+esc(k.id)+'</td><td>'+esc(k.number)+'</td><td>'+esc(dstr(k.date))+'</td><td><b class="num">'+money(k.amount)+'</b></td><td><span class="chip '+statusKind(k.status)+'">'+esc(k.status)+'</span></td></tr>').join('')+'</tbody></table></div>':'');
  }catch(e){ out.innerHTML = '<div class="empty"><div class="empty-ico">⚠️</div><p>'+esc(e.message)+'</p></div>'; }
}
let calDate = new Date();
function renderCalendar(){
  const y = calDate.getFullYear(), mo = calDate.getMonth();
  const first = new Date(y,mo,1), last = new Date(y,mo+1,0), off = (first.getDay()+6)%7;
  const ev = S.snap.calendar||[], rem = S.snap.reminders||[];
  const today = new Date().toISOString().slice(0,10);
  let cells = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=>'<div class="cal-dow">'+d+'</div>').join('');
  for(let i=0;i<off;i++) cells += '<div class="cal-cell off"></div>';
  for(let d=1;d<=last.getDate();d++){
    const ds = y+'-'+String(mo+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const dayEv = ev.filter(e=>dstr(e['Дата'])===ds), dayRem = rem.filter(r=>dstr(r['Дата'])===ds);
    cells += '<div class="cal-cell'+(ds===today?' today':'')+'"><b>'+d+'</b>'+
      dayEv.map((e,i)=>'<button class="cal-ev" style="--k:'+CHART_HUES[i%8]+'" onclick="openDrawer(MOD.calendar,\''+esc(e['ID'])+'\')">'+esc(short(e['Тип'],12))+'</button>').join('')+
      dayRem.map(r=>'<span class="cal-rem">⏰ '+esc(short(r['Объект'],12))+'</span>').join('')+'</div>';
  }
  $('#modBody').innerHTML = '<div class="panel"><div class="cal-head"><button class="btn ghost sm" onclick="calShift(-1)">←</button><h3>'+
    calDate.toLocaleDateString('ru-RU',{month:'long',year:'numeric'})+'</h3><button class="btn ghost sm" onclick="calShift(1)">→</button>'+
    '<button class="btn ghost sm" onclick="calToday()">Сегодня</button>'+
    (can('calendar','create')?'<button class="btn primary sm" onclick="openForm(MOD.calendar,null)">＋ Событие</button>':'')+'</div>'+
    '<div class="cal-grid">'+cells+'</div></div>';
}
function calShift(n){ calDate.setMonth(calDate.getMonth()+n); renderCalendar(); }
function calToday(){ calDate = new Date(); renderCalendar(); }
function renderTrash(){
  const keys = Object.keys(S.trash).filter(k=>S.trash[k].length);
  if(!keys.length){ $('#modBody').innerHTML='<div class="empty"><div class="empty-ico">🗑️</div><h3>Корзина пуста</h3><p>Удалённые записи попадают сюда и могут быть восстановлены.</p></div>'; return; }
  $('#modBody').innerHTML = keys.map(k => {
    const m = MOD[k]||{title:k,icon:'📄'};
    return '<section class="panel"><h3>'+m.icon+' '+esc(m.title)+' <em>'+S.trash[k].length+'</em></h3><div class="trash-list">'+
      S.trash[k].map(r=>'<div class="trash-i"><b>'+esc(r.title)+'</b><span>'+esc(r.id)+'</span>'+
        (can(k,'delete')?'<button class="btn ok sm" onclick="trashRestore(\''+k+'\',\''+esc(r.id)+'\')">↺ Вернуть</button>':'')+
        (can(k,'purge')?'<button class="btn danger sm" onclick="trashPurge(\''+k+'\',\''+esc(r.id)+'\')">✕ Навсегда</button>':'')+
      '</div>').join('')+'</div></section>';
  }).join('');
}
async function trashRestore(mod,id){
  try{ await api('restoreRecords',{module:mod,ids:[id]}); await fetchSnap(); renderActive(); paintBadges(); toast('Восстановлено: '+id,'ok'); }
  catch(e){ toast(e.message,'bad'); }
}
async function trashPurge(mod,id){
  if(!confirm('Удалить '+id+' НАВСЕГДА? Действие необратимо.')) return;
  try{ await api('purgeRecords',{module:mod,ids:[id]}); await fetchSnap(); renderActive(); paintBadges(); toast('Удалено навсегда','ok'); }
  catch(e){ toast(e.message,'bad'); }
}
function renderAudit(m){
  const rows = (S.snap[m.source]||[]).slice(0,400);
  if(!rows.length){ $('#modBody').innerHTML='<div class="empty"><div class="empty-ico">📜</div><h3>Пока пусто</h3><p>Действия появятся здесь автоматически.</p></div>'; return; }
  $('#modBody').innerHTML = '<div class="tw"><table class="grid"><thead><tr>'+m.cols.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+
    rows.map(r=>'<tr>'+m.cols.map(c=>'<td>'+esc(short(pretty(r[c]),90))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}
window.addEventListener('resize', debounce(()=>{ const m=MOD[S.mod]; if(m&&!m.special&&S.snap) renderList(m,++renderToken); },220));
