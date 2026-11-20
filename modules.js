let renderToken=0, lastSelIndex=-1;
const qCache=new Map();

function buildNav(){
  const host=$('#navGroups'); host.innerHTML='';
  GROUPS.forEach(([g,label])=>{
    const mods=visibleModules().filter(m=>m.group===g); if(!mods.length) return;
    const box=document.createElement('section'); box.className='nav-group';
    box.innerHTML='<div class="nav-label">'+esc(label)+'</div>';
    const row=document.createElement('div'); row.className='nav-row';
    mods.forEach(m=>{
      const b=document.createElement('button');
      b.className='tab'+(m.id===S.mod?' on':''); b.dataset.mod=m.id;
      b.innerHTML='<span class="tab-ico">'+m.icon+'</span><span>'+esc(m.title)+'</span><span class="tab-n" data-badge="'+m.id+'"></span>';
      b.onclick=()=>setModule(m.id); row.appendChild(b);
    });
    box.appendChild(row); host.appendChild(box);
  });
  const vis=visibleModules();
  if(!MOD[S.mod]||vis.indexOf(MOD[S.mod])===-1) S.mod=vis.length?vis[0].id:'dashboard';
}
function paintBadges(){
  $$('[data-badge]').forEach(el=>{
    const id=el.dataset.badge,m=MOD[id]; let n=0,hot=false;
    if(id==='trash') n=Object.keys(S.trash).reduce((a,k)=>a+S.trash[k].length,0);
    else if(id==='submissions'){n=(S.snap.submissions||[]).filter(r=>String(r['Статус'])==='На_проверке').length;hot=n>0;}
    else if(m&&!m.special) n=(S.snap[m.id]||[]).length;
    el.textContent=n||''; el.classList.toggle('show',!!n); el.classList.toggle('hot',hot);
  });
  const ts=$('#syncTime'); if(ts) ts.textContent=S.lastTs?new Date(S.lastTs).toLocaleTimeString('ru-RU'):'—';
}
function buildMore(){
  const host=$('#moreBody'); host.innerHTML='';
  GROUPS.forEach(([g,label])=>{
    const mods=visibleModules().filter(m=>m.group===g); if(!mods.length) return;
    const s=document.createElement('div'); s.className='more-group';
    s.innerHTML='<div class="more-label">'+esc(label)+'</div>';
    const grid=document.createElement('div'); grid.className='more-grid';
    mods.forEach(m=>{const b=document.createElement('button');b.className='more-item';
      b.innerHTML='<span>'+m.icon+'</span><b>'+esc(m.title)+'</b>';
      b.onclick=()=>{setModule(m.id);closeMore();};grid.appendChild(b);});
    s.appendChild(grid); host.appendChild(s);
  });
}
function openMore(){$('#moreSheet').classList.add('on');document.body.classList.add('lock');}
function closeMore(){$('#moreSheet').classList.remove('on');if(!$('#modal').classList.contains('on')&&!$('#drawer').classList.contains('on'))document.body.classList.remove('lock');}
function buildShell(){
  $('#modHost').innerHTML='<div class="mod-head"><div><h1 id="modTitle">—</h1><div class="mod-sub" id="modSub"></div></div><div class="mod-actions" id="modActions"></div></div>'+
    '<div class="toolbar" id="toolbar"></div><div class="bulk" id="bulkBar"></div><div id="modBody"></div>';
  $('#modBody').addEventListener('click',onBodyClick);
  $('#modBody').addEventListener('dragstart',onDragStart);
  $('#modBody').addEventListener('dragover',onDragOver);
  $('#modBody').addEventListener('drop',onDrop);
  $('#modBody').addEventListener('dragend',onDragEnd);
  $('#toolbar').addEventListener('click',onToolbarClick);
  $('#toolbar').addEventListener('input',onToolbarInput);
  $('#toolbar').addEventListener('change',onToolbarChange);
  $('#bulkBar').addEventListener('click',onBulkClick);
  $('#modActions').addEventListener('click',onActionsClick);
}
function setModule(id){
  if(!MOD[id]) return;
  S.mod=id;S.sel.clear();S.orderMode=false;lastSelIndex=-1;
  $$('.tab').forEach(t=>t.classList.toggle('on',t.dataset.mod===id));
  $$('.mnav-item').forEach(t=>t.classList.toggle('on',t.dataset.mod===id));
  renderActive(); window.scrollTo({top:0,behavior:'smooth'});
}
function renderActive(){
  const m=MOD[S.mod]; if(!m) return;
  const tok=++renderToken;
  $('#modTitle').innerHTML='<span class="mh-ico">'+m.icon+'</span>'+esc(m.title);
  $('#modSub').textContent=m.special?specialSub(m):((S.snap[m.id]||[]).length+' записей · лист «'+m.sheet+'»');
  $('#modActions').innerHTML=
    (m.sheet&&can(m.id,'create')?'<button class="btn primary" data-a="new">＋ Создать</button>':'')+
    (m.sheet&&can(m.id,'export')?'<button class="btn ghost" data-a="xls">⤓ Excel</button><button class="btn ghost" data-a="csv">⤓ CSV</button>':'')+
    '<button class="btn ghost" data-a="refresh">⟳</button>';
  if(m.special){$('#toolbar').innerHTML='';$('#bulkBar').innerHTML='';renderSpecial(m,tok);return;}
  renderToolbar(m);renderBulk(m);renderList(m,tok);
}
function specialSub(m){
  if(m.special==='dashboard') return 'Сводка · '+Object.keys(MOD).filter(k=>MOD[k].sheet).length+' разделов под контролем';
  if(m.special==='progress') return 'Выполнение работ и подача КС-2 параллельно';
  if(m.special==='calendar') return 'События и напоминания по месяцам';
  if(m.special==='trash') return Object.keys(S.trash).reduce((a,k)=>a+S.trash[k].length,0)+' записей в корзине';
  if(m.special==='admin') return 'Пользователи, роли, уведомления, резервные копии';
  return (S.snap[m.source]||[]).length+' записей';
}
function renderToolbar(m){
  const v=(S.views[m.id]&&S.views[m.id].active)?S.views[m.id].list[S.views[m.id].active]:null;
  if(v&&!S.q[m.id]&&!S.filter[m.id]){S.q[m.id]=v.q||'';S.filter[m.id]=v.status||'';S.sort[m.id]=v.sort||null;}
  const statuses=m.statuses||[], names=Object.keys((S.views[m.id]||{}).list||{});
  const q=S.q[m.id]||'';
  const sortCol=(S.sort[m.id]||{}).col||'';
  $('#toolbar').innerHTML=
    '<div class="tb-search"><span>🔍</span><input id="search" placeholder="Поиск по разделу   /" value="'+esc(q)+'"></div>'+
    (statuses.length?'<select id="fStatus" class="tb-sel"><option value="">Все статусы</option>'+statuses.map(s=>'<option'+(S.filter[m.id]===s?' selected':'')+'>'+esc(s)+'</option>').join('')+'</select>':'')+
    '<select id="fSort" class="tb-sel"><option value="">Сортировка</option>'+m.cols.map(c=>'<option value="'+esc(c)+'"'+(sortCol===c?' selected':'')+'>по «'+esc(c)+'»</option>').join('')+'</select>'+
    '<button class="btn ghost sm" data-a="dir">'+(((S.sort[m.id]||{}).dir||'desc')==='desc'?'↓':'↑')+'</button>'+
    (m.orderCol?'<button class="btn '+(S.orderMode?'warn':'ghost')+' sm" data-a="order">⇅ Порядок</button>':'')+
    '<div class="tb-views"><select id="fView" class="tb-sel"><option value="">Виды…</option>'+names.map(n=>'<option'+(((S.views[m.id]||{}).active===n)?' selected':'')+'>'+esc(n)+'</option>').join('')+'</select>'+
    '<button class="btn ghost sm" data-a="saveview" title="Сохранить вид">💾</button>'+
    (names.length?'<button class="btn ghost sm" data-a="delview" title="Удалить вид">🗑</button>':'')+'</div>'+
    '<span class="tb-count" id="tbCount"></span>';
}
const debouncedList=debounce(()=>{const m=MOD[S.mod];if(m&&!m.special)renderList(m,++renderToken);},170);
function onToolbarInput(e){if(e.target.id==='search'){const m=MOD[S.mod];S.q[m.id]=e.target.value;S.page[m.id]=1;debouncedList();}}
function onToolbarChange(e){
  const m=MOD[S.mod];
  if(e.target.id==='fStatus'){S.filter[m.id]=e.target.value;S.page[m.id]=1;renderList(m,++renderToken);}
  if(e.target.id==='fSort'){S.sort[m.id]={col:e.target.value,dir:(S.sort[m.id]||{}).dir||'desc'};renderToolbar(m);renderList(m,++renderToken);}
  if(e.target.id==='fView'){
    const n=e.target.value; S.views[m.id]=S.views[m.id]||{list:{}}; S.views[m.id].active=n||null;
    const v=n?S.views[m.id].list[n]:null;
    S.q[m.id]=v?v.q:'';S.filter[m.id]=v?v.status:'';S.sort[m.id]=v?v.sort:null;
    saveViews();renderToolbar(m);renderList(m,++renderToken);
  }
}
function onToolbarClick(e){
  const t=e.target.closest('[data-a]'); if(!t) return; const m=MOD[S.mod];
  if(t.dataset.a==='dir'){const s=S.sort[m.id]||{col:m.cols[0],dir:'desc'};s.dir=s.dir==='desc'?'asc':'desc';S.sort[m.id]=s;renderToolbar(m);renderList(m,++renderToken);}
  if(t.dataset.a==='order'){
    S.orderMode=!S.orderMode;
    if(S.orderMode){S.sort[m.id]={col:m.orderCol,dir:'asc'};S.q[m.id]='';S.filter[m.id]='';toast('Режим порядка: перетаскивайте строки','info');}
    renderToolbar(m);renderList(m,++renderToken);
  }
  if(t.dataset.a==='saveview'){
    const n=prompt('Название вида:','Мой вид'); if(!n) return;
    S.views[m.id]=S.views[m.id]||{list:{}};
    S.views[m.id].list[n]={q:S.q[m.id]||'',status:S.filter[m.id]||'',sort:S.sort[m.id]||null};
    S.views[m.id].active=n;saveViews();renderToolbar(m);toast('Вид «'+n+'» сохранён','ok');
  }
  if(t.dataset.a==='delview'){
    const n=(S.views[m.id]||{}).active; if(!n){toast('Выберите вид','warn');return;}
    delete S.views[m.id].list[n];S.views[m.id].active=null;saveViews();renderToolbar(m);toast('Вид удалён','ok');
  }
}
function onActionsClick(e){
  const t=e.target.closest('[data-a]'); if(!t) return;
  if(t.dataset.a==='new') openForm(MOD[S.mod],null);
  if(t.dataset.a==='csv') exportCurrent('csv');
  if(t.dataset.a==='xls') exportCurrent('xls');
  if(t.dataset.a==='refresh') loadData();
}
function selectRows(m){
  const rows=S.snap[m.id]||[], q=(S.q[m.id]||'').trim().toLowerCase(), f=S.filter[m.id]||'', s=S.sort[m.id];
  const key=m.id+'|'+q+'|'+f+'|'+(s?s.col+s.dir:'')+'|'+rows.length+'|'+S.lastTs;
  if(qCache.has(key)) return qCache.get(key);
  let out=rows;
  if(q) out=out.filter(r=>(r.__s||'').indexOf(q)>-1);
  if(f&&m.statusCol) out=out.filter(r=>String(r[m.statusCol])===f);
  if(s&&s.col){
    const dir=s.dir==='asc'?1:-1;
    out=out.slice().sort((a,b)=>{
      const x=a[s.col],y=b[s.col],nx=parseFloat(x),ny=parseFloat(y);
      if(!isNaN(nx)&&!isNaN(ny)&&String(x).trim()!==''&&String(y).trim()!=='') return (nx-ny)*dir;
      return String(x||'').localeCompare(String(y||''),'ru')*dir;
    });
  }
  if(qCache.size>60) qCache.clear();
  qCache.set(key,out); return out;
}
function statusKind(v){
  const s=String(v||'');
  if(/Согласован|Подтверждено|Выполнено|Закрыто|Победа|Принято|Оплачена|Доставлено|Активен|Действует|Работает|Согласовано|Исполнено|Утвержд|Сдан|Проведена|Устранено|Отличное|Удовлетвор/.test(s)) return 'ok';
  if(/проверке|разработке|согласовании|рассмотрении|работе|пути|Подана|Подано|Выдан|Заказан|Ожидает|Новое|Отпуск|Подготовка|Мониторинг|Активно|Запланировано|Учтено|Принят|Истекает|Требует/.test(s)) return 'warn';
  if(/Замечания|Отклонен|Отказ|Просрочен|Утерян|Выговор|Уволен|Отмен|Аварийное|Утрачено|Не_устранено|Отозван/.test(s)) return 'bad';
  return 'neutral';
}
function cell(m,c,r){
  const v=r[c];
  if(c===m.statusCol) return '<span class="chip '+statusKind(v)+'">'+esc(pretty(v)||'—')+'</span>';
  if(/^(Сумма|Общая_сумма|Наша_цена|Начальная_цена|Цена|Сумма_договорная|Сумма_закрытая)$/.test(c)) return '<b class="num">'+(v!==''&&v!=null?money(v):'—')+'</b>';
  if(/^Дата|Дедлайн|Срок/.test(c)){
    const d=daysLeft(v);
    if(m.deadline===c&&d!==null&&d<=3&&!/Выполнено|Исполнено|Устранено|Закрыто/.test(String(r[m.statusCol])))
      return '<span class="dt '+(d<0?'late':'soon')+'">'+esc(dstr(v))+' <i>'+(d<0?Math.abs(d)+' дн. назад':d+' дн.')+'</i></span>';
    return '<span class="dt">'+esc(dstr(v)||'—')+'</span>';
  }
  if(c==='ID_Договора') return '<span class="ref">'+esc(short(refLabel('contracts',v),26)||'—')+'</span>';
  if(c==='ID_Позиции') return '<span class="ref">'+esc(short(refLabel('estimateItems',v),28)||'—')+'</span>';
  if(c==='ID_Сметы') return '<span class="ref">'+esc(short(refLabel('estimates',v),24)||'—')+'</span>';
  if(c==='ID_Проекта') return '<span class="ref">'+esc(short(refLabel('architecture',v),24)||'—')+'</span>';
  if(c==='ID_Подрядчика') return '<span class="ref">'+esc(short(refLabel('contractors',v),24)||'—')+'</span>';
  if(c==='ID_Сотрудника') return '<span class="ref">'+esc(short(refLabel('personnel',v),24)||'—')+'</span>';
  if(c==='ID_КС2') return '<span class="ref">'+esc(short(refLabel('ks2',v),20)||'—')+'</span>';
  if(c==='Кому') return '<span class="ref">'+esc(short(refLabel('users',v),22)||'—')+'</span>';
  if(c==='Приоритет') return '<span class="chip '+(/Срочный/.test(v)?'bad':/Высокий/.test(v)?'warn':'neutral')+'">'+esc(v||'—')+'</span>';
  if(c==='Согласовано_КГИОП'||c==='Подтверждение') return (v===true||String(v)==='true')?'<span class="chip ok">Да</span>':'<span class="chip neutral">Нет</span>';
  if(c==='Закрыто_объём'){
    const t=num(r['Количество']||r['Договорной_объём']),d=num(v),p=t?Math.min(100,Math.round(d/t*100)):0;
    return '<div class="mini"><div class="mini-bar"><i style="width:'+p+'%"></i></div><span>'+d+'/'+t+'</span></div>';
  }
  if(m.avatar===c) return '<div class="who"><span class="ava">'+esc(initials(v))+'</span><b>'+esc(v||'—')+'</b></div>';
  return esc(short(pretty(v),64)||'—');
}
function renderList(m,tok){
  if(tok!==renderToken) return;
  const rows=selectRows(m),page=S.page[m.id]||1,lim=page*APP.page,slice=rows.slice(0,lim);
  const cnt=$('#tbCount'); if(cnt) cnt.textContent=rows.length+' из '+(S.snap[m.id]||[]).length;
  if(!rows.length){
    $('#modBody').innerHTML='<div class="empty"><div class="empty-ico">'+m.icon+'</div><h3>Ничего не найдено</h3><p>'+
      ((S.q[m.id]||S.filter[m.id])?'Измените запрос или сбросьте фильтр.':'Создайте первую запись — она сразу появится здесь и в Google Таблице.')+'</p>'+
      ((S.q[m.id]||S.filter[m.id])?'<button class="btn ghost" onclick="resetFilters()">Сбросить фильтры</button>':
       (can(m.id,'create')?'<button class="btn primary" onclick="openForm(MOD[\''+m.id+'\'],null)">＋ Создать</button>':''))+'</div>';
    return;
  }
  const drag=S.orderMode&&can(m.id,'edit');
  let html;
  if(isMobile()){
    html='<div class="cards">'+slice.map(r=>{
      const id=r[m.idCol],on=S.sel.has(String(id));
      return '<article class="rcard'+(on?' sel':'')+'" data-id="'+esc(id)+'">'+
        '<div class="rcard-top"><label class="cb"><input type="checkbox" data-a="sel" data-id="'+esc(id)+'"'+(on?' checked':'')+'><i></i></label>'+
        '<button class="rcard-title" data-a="open" data-id="'+esc(id)+'">'+esc(short(r[m.titleCol]||id,60))+'</button>'+
        (m.statusCol?'<span class="chip '+statusKind(r[m.statusCol])+'">'+esc(short(r[m.statusCol],16)||'—')+'</span>':'')+'</div>'+
        '<div class="rcard-grid">'+m.cols.filter(c=>c!==m.titleCol&&c!==m.statusCol).slice(0,4).map(c=>'<div><span>'+esc(c)+'</span>'+cell(m,c,r)+'</div>').join('')+'</div>'+
        '<div class="rcard-foot"><span class="fid">'+esc(id)+'</span>'+
        (atts(m.id,id).length?'<span class="fcount">📎 '+atts(m.id,id).length+'</span>':'')+'<span class="grow"></span>'+
        (can(m.id,'edit')?'<button class="btn ghost sm" data-a="edit" data-id="'+esc(id)+'">✎</button>':'')+
        (can(m.id,'delete')?'<button class="btn danger sm" data-a="del" data-id="'+esc(id)+'">🗑</button>':'')+'</div></article>';
    }).join('')+'</div>';
  } else {
    const allOn=slice.length&&slice.every(r=>S.sel.has(String(r[m.idCol])));
    html=(drag?'<div class="drag-hint">⇅ Перетащите строки, чтобы задать порядок. Он сохранится в смете и на графике прогресса.</div>':'')+
      '<div class="tw"><table class="grid'+(drag?' dragging':'')+'"><thead><tr>'+
      (drag?'<th class="cdh"></th>':'')+
      '<th class="cbs"><label class="cb"><input type="checkbox" data-a="selall"'+(allOn?' checked':'')+'><i></i></label></th>'+
      '<th class="cid">ID</th>'+m.cols.map(c=>'<th data-a="sort" data-col="'+esc(c)+'" class="sortable'+(((S.sort[m.id]||{}).col===c)?' act':'')+'">'+esc(c)+(((S.sort[m.id]||{}).col===c)?(((S.sort[m.id]||{}).dir==='asc')?' ↑':' ↓'):'')+'</th>').join('')+
      '<th class="cf">📎</th><th class="ca"></th></tr></thead><tbody>'+
      slice.map(r=>{
        const id=r[m.idCol],on=S.sel.has(String(id));
        return '<tr class="'+(on?'sel':'')+'" data-id="'+esc(id)+'"'+(drag?' draggable="true"':'')+'>'+
          (drag?'<td class="cdh"><span class="dh">⠿</span></td>':'')+
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
  if(rows.length>lim) html+='<div class="more-row"><button class="btn ghost" data-a="more">Показать ещё '+Math.min(APP.page,rows.length-lim)+' из '+(rows.length-lim)+'</button></div>';
  $('#modBody').innerHTML=html;
}
function resetFilters(){const m=MOD[S.mod];S.q[m.id]='';S.filter[m.id]='';S.page[m.id]=1;renderToolbar(m);renderList(m,++renderToken);}
function findRec(m,id){return (S.snap[m.id]||[]).filter(r=>String(r[m.idCol])===String(id))[0]||null;}
function onBodyClick(e){
  const m=MOD[S.mod],t=e.target.closest('[data-a]'); if(!t) return;
  const a=t.dataset.a,id=t.dataset.id;
  if(a==='more'){S.page[m.id]=(S.page[m.id]||1)+1;renderList(m,++renderToken);return;}
  if(a==='sort'){const c=t.dataset.col,s=S.sort[m.id]||{};S.sort[m.id]={col:c,dir:s.col===c&&s.dir==='desc'?'asc':'desc'};renderToolbar(m);renderList(m,++renderToken);return;}
  if(a==='sel'){
    const rows=selectRows(m).slice(0,(S.page[m.id]||1)*APP.page);
    const idx=rows.findIndex(r=>String(r[m.idCol])===String(id));
    if(e.shiftKey&&lastSelIndex>-1){const a1=Math.min(lastSelIndex,idx),b1=Math.max(lastSelIndex,idx);
      for(let i=a1;i<=b1;i++) S.sel.add(String(rows[i][m.idCol]));}
    else{S.sel.has(String(id))?S.sel.delete(String(id)):S.sel.add(String(id));}
    lastSelIndex=idx;renderBulk(m);renderList(m,++renderToken);return;
  }
  if(a==='selall'){
    const rows=selectRows(m).slice(0,(S.page[m.id]||1)*APP.page);
    const all=rows.every(r=>S.sel.has(String(r[m.idCol])));
    rows.forEach(r=>all?S.sel.delete(String(r[m.idCol])):S.sel.add(String(r[m.idCol])));
    renderBulk(m);renderList(m,++renderToken);return;
  }
  if(a==='open') return openDrawer(m,id);
  if(a==='edit') return openForm(m,findRec(m,id));
  if(a==='del'){if(confirm('Удалить запись '+id+'? Её можно вернуть из корзины.')) removeRecords(m.id,[id]);}
}
function onDragStart(e){
  if(!S.orderMode) return;
  const tr=e.target.closest('tr[data-id]'); if(!tr) return;
  S.dragId=tr.dataset.id; tr.classList.add('drag-src');
  e.dataTransfer.effectAllowed='move'; try{e.dataTransfer.setData('text/plain',S.dragId);}catch(x){}
}
function onDragOver(e){
  if(!S.orderMode||!S.dragId) return;
  e.preventDefault();
  const tr=e.target.closest('tr[data-id]'); if(!tr||tr.dataset.id===S.dragId) return;
  $$('.grid tr.drop-target').forEach(x=>x.classList.remove('drop-target'));
  tr.classList.add('drop-target');
}
function onDragEnd(){S.dragId=null;$$('.drag-src,.drop-target').forEach(x=>x.classList.remove('drag-src','drop-target'));}
async function onDrop(e){
  if(!S.orderMode||!S.dragId) return;
  e.preventDefault();
  const tr=e.target.closest('tr[data-id]'); const m=MOD[S.mod];
  const from=S.dragId; onDragEnd();
  if(!tr||tr.dataset.id===from) return;
  const rows=selectRows(m).slice();
  const fi=rows.findIndex(r=>String(r[m.idCol])===String(from));
  const ti=rows.findIndex(r=>String(r[m.idCol])===String(tr.dataset.id));
  if(fi<0||ti<0) return;
  const moved=rows.splice(fi,1)[0]; rows.splice(ti,0,moved);
  rows.forEach((r,i)=>{r[m.orderCol]=i+1;r.__s=null;});
  qCache.clear(); renderList(m,++renderToken);
  try{
    await api('reorder',{module:m.id,ids:rows.map(r=>r[m.idCol])});
    bustLocal(); toast('Порядок сохранён','ok');
    fetchSnap().then(()=>{renderActive();paintBadges();}).catch(()=>{});
  }catch(err){toast(err.message,'bad');loadData();}
}
function renderBulk(m){
  const n=S.sel.size,bar=$('#bulkBar');
  if(!n){bar.innerHTML='';bar.classList.remove('on');return;}
  bar.classList.add('on');
  bar.innerHTML='<b>'+n+'</b> выбрано'+
    (can(m.id,'delete')?'<button class="btn danger sm" data-a="bdel">🗑 Удалить</button>':'')+
    (can(m.id,'edit')&&m.statusCol?'<select id="bulkStatus" class="tb-sel"><option value="">Статус…</option>'+m.statuses.map(s=>'<option>'+esc(s)+'</option>').join('')+'</select><button class="btn ghost sm" data-a="bstatus">Применить</button>':'')+
    '<button class="btn ghost sm" data-a="bclear">Снять</button>';
}
async function onBulkClick(e){
  const t=e.target.closest('[data-a]'); if(!t) return;
  const m=MOD[S.mod],ids=Array.from(S.sel);
  if(t.dataset.a==='bclear'){S.sel.clear();renderBulk(m);renderList(m,++renderToken);}
  if(t.dataset.a==='bdel'){if(confirm('Удалить '+ids.length+' записей?')) await removeRecords(m.id,ids);}
  if(t.dataset.a==='bstatus'){
    const v=val('bulkStatus'); if(!v){toast('Выберите статус','warn');return;}
    const patch={};patch[m.statusCol]=v;
    const bak=ids.map(id=>({id:id,old:(findRec(m,id)||{})[m.statusCol]}));
    ids.forEach(id=>localPatch(m.id,id,patch)); qCache.clear(); renderList(m,++renderToken);
    try{
      for(const id of ids) await api('updateRecord',{module:m.id,id:id,values:patch});
      toast('Статус обновлён: '+ids.length,'ok');S.sel.clear();renderBulk(m);
      bustLocal(); await fetchSnap(); renderActive(); paintBadges();
    }catch(err){bak.forEach(b=>{const p={};p[m.statusCol]=b.old;localPatch(m.id,b.id,p);});qCache.clear();renderList(m,++renderToken);toast(err.message,'bad');}
  }
}
function fieldHtml(m,f,rec){
  const id='f_'+f.c,v=rec?rec[f.c]:'';
  const req=f.req?' <em>*</em>':'';
  let inp;
  if(f.t==='textarea') inp='<textarea id="'+id+'" rows="3">'+esc(pretty(v))+'</textarea>';
  else if(f.t==='select') inp='<select id="'+id+'"><option value="">—</option>'+f.o.map(o=>'<option'+(String(v)===String(o)?' selected':'')+'>'+esc(o)+'</option>').join('')+'</select>';
  else if(f.type==='ref'){
    const rows=S.snap[f.ref]||[];
    inp='<select id="'+id+'"><option value="">— не выбрано —</option>'+rows.map(r=>{
      const rid=r[f.refId],lab=r[f.refLabel]||rid;
      return '<option value="'+esc(rid)+'"'+(String(v)===String(rid)?' selected':'')+'>'+esc(short(lab,58))+' · '+esc(rid)+'</option>';
    }).join('')+'</select>';
  }
  else if(f.t==='date') inp='<input id="'+id+'" type="date" value="'+esc(dstr(v))+'">';
  else if(f.t==='number') inp='<input id="'+id+'" type="number" step="any" value="'+esc(v===''||v==null?'':num(v))+'">';
  else inp='<input id="'+id+'" type="'+(f.t==='email'?'email':'text')+'" value="'+esc(pretty(v))+'">';
  return '<div class="fg'+(f.wide?' wide':'')+'"><label for="'+id+'">'+esc(f.l)+req+'</label>'+inp+'</div>';
}
let formCtx=null;
function openForm(m,rec){
  if(!m||!m.fields) return;
  const isEdit=!!rec;
  if(isEdit&&!can(m.id,'edit')){toast('Нет прав на изменение','warn');return;}
  if(!isEdit&&!can(m.id,'create')){toast('Нет прав на создание','warn');return;}
  formCtx={mod:m.id,id:isEdit?rec[m.idCol]:null};
  $('#modalTitle').innerHTML=(isEdit?'✎ ':'＋ ')+esc(m.title)+(isEdit?' · '+esc(rec[m.idCol]):'');
  $('#modalBody').innerHTML='<form class="form" id="recForm" onsubmit="return false">'+m.fields.map(f=>fieldHtml(m,f,rec)).join('')+
    (m.calc?'<div class="calc-note">Сумма рассчитывается автоматически: количество × цена.</div>':'')+'</form>'+
    (isEdit?'':'<div class="drop" id="newDrop"><input type="file" id="newFiles" multiple hidden><div class="drop-in"><b>📎 Файлы можно приложить сразу</b><span>PDF, DOC, XLS, JPG, PNG, DWG · до 10 МБ каждый</span><button class="btn ghost sm" type="button" onclick="document.getElementById(\'newFiles\').click()">Выбрать файлы</button><div id="newFileList" class="flist"></div></div></div>');
  $('#modalFoot').innerHTML='<button class="btn ghost" onclick="closeModal()">Отмена</button><button class="btn primary" id="saveBtn" onclick="submitForm()">'+(isEdit?'Сохранить изменения':'Создать запись')+'</button>';
  $('#modal').classList.add('on');document.body.classList.add('lock');
  if(!isEdit){const inp=$('#newFiles');
    inp.onchange=()=>{$('#newFileList').innerHTML=Array.from(inp.files).map(f=>'<span class="fchip">'+esc(f.name)+' <i>'+(f.size/1024).toFixed(0)+' КБ</i></span>').join('');};}
  setTimeout(()=>{const f=$('#recForm input, #recForm select, #recForm textarea');if(f)f.focus();},60);
}
function closeModal(){$('#modal').classList.remove('on');if(!$('#drawer').classList.contains('on'))document.body.classList.remove('lock');formCtx=null;}
async function submitForm(){
  if(!formCtx) return;
  const m=MOD[formCtx.mod],values={};
  for(const f of m.fields){
    const e=document.getElementById('f_'+f.c); if(!e) continue;
    let v=e.value; if(f.t==='number') v=v===''?'':num(v);
    if(f.req&&(v===''||v==null)){e.classList.add('bad');e.focus();toast('Заполните «'+f.l+'»','warn');return;}
    e.classList.remove('bad'); values[f.c]=v;
  }
  if(m.calc){const a=num(values[m.calc[0]]),b=num(values[m.calc[1]]);if(a&&b) values['Сумма']=a*b;}
  const btn=$('#saveBtn');btn.disabled=true;btn.classList.add('busy');
  try{
    if(formCtx.id){
      const id=formCtx.id,bak=Object.assign({},findRec(m,id));
      localPatch(m.id,id,values);qCache.clear();safeRenderList();
      await api('updateRecord',{module:m.id,id:id,values:values});
      toast('Изменения сохранены','ok');closeModal();bustLocal();
      await fetchSnap();renderActive();paintBadges();
      if(S.drawer&&S.drawer.id===id) openDrawer(MOD[S.drawer.mod],id);
    } else {
      const r=await api('createRecord',{module:m.id,values:values});
      const nf=$('#newFiles'),files=nf?Array.from(nf.files):[];
      if(files.length) await uploadTo(m.id,r.id,files,true);
      toast('Создано: '+r.id,'ok');closeModal();bustLocal();
      await fetchSnap();renderActive();paintBadges();openDrawer(m,r.id);
    }
  }catch(e){toast(e.message,'bad');loadData(true);}
  finally{if(btn){btn.disabled=false;btn.classList.remove('busy');}}
}
function openDrawer(m,id){
  const r=findRec(m,id); if(!r){toast('Запись не найдена','warn');return;}
  S.drawer={mod:m.id,id:id};
  $('#drawerTitle').innerHTML='<span class="dh-ico">'+m.icon+'</span><div style="min-width:0"><b>'+esc(short(r[m.titleCol]||id,54))+'</b><span>'+esc(m.title)+' · '+esc(id)+'</span></div>';
  let body='<div class="dgrid">'+(m.fields||[]).map(f=>
    '<div class="dcell'+(f.wide?' wide':'')+'"><span>'+esc(f.l)+'</span><div>'+
    (f.c===m.statusCol?'<span class="chip '+statusKind(r[f.c])+'">'+esc(pretty(r[f.c])||'—')+'</span>':
     f.type==='ref'?'<b>'+esc(refLabel(f.ref,r[f.c])||'—')+'</b>':
     /^(Сумма|Общая_сумма|Цена|Наша_цена|Начальная_цена|Сумма_договорная)$/.test(f.c)&&r[f.c]!==''?'<b class="num">'+money(r[f.c])+'</b>':
     '<b>'+esc(pretty(r[f.c])||'—')+'</b>')+'</div></div>').join('')+'</div>';
  const extra=Object.keys(r).filter(k=>k.indexOf('__')!==0&&k!=='Удалено'&&k!==m.idCol&&(m.fields||[]).every(f=>f.c!==k));
  if(extra.length) body+='<div class="dextra"><div class="dsub">Служебные поля</div>'+extra.map(k=>'<div class="drow"><span>'+esc(k)+'</span><b>'+esc(short(pretty(r[k]),80)||'—')+'</b></div>').join('')+'</div>';
  if(m.review&&String(r['Статус'])==='На_проверке'&&can('submissions','review')){
    body+='<div class="review"><div class="dsub">Проверка объёма</div>'+
      '<div class="review-row"><label>Подтвердить объём</label><input id="revVol" type="number" step="any" value="'+esc(num(r['Объём_подан']))+'"></div>'+
      '<div class="review-row"><label>Комментарий</label><textarea id="revCom" rows="2" placeholder="Причина корректировки или отказа"></textarea></div>'+
      '<div class="review-acts"><button class="btn ok" onclick="doReview(\''+esc(id)+'\',\'Подтверждено\')">✓ Подтвердить</button>'+
      '<button class="btn warn" onclick="doReview(\''+esc(id)+'\',\'Отредактировано\')">✎ Скорректировать</button>'+
      '<button class="btn danger" onclick="doReview(\''+esc(id)+'\',\'Отклонено\')">✕ Отклонить</button></div></div>';
  }
  if(m.id==='estimateItems'||m.id==='contractorWorks'){
    const t=num(r['Количество']||r['Договорной_объём']),d=num(r['Закрыто_объём']),p=t?Math.min(100,Math.round(d/t*100)):0;
    body+='<div class="dblock"><div class="dsub">Закрытие объёма</div><div class="big-bar"><i style="width:'+p+'%"></i><span>'+d+' / '+t+' '+esc(r['Ед_изм']||'')+' · '+p+'%</span></div>'+
      (can('closures','create')?'<button class="btn ok sm" style="margin-top:10px" onclick="quickClosure(\''+m.id+'\',\''+esc(id)+'\')">＋ Закрыть объём</button>':'')+'</div>';
  }
  if(m.summary) body+='<div class="dblock"><div class="dsub">Финансовая сводка</div><div id="dSummary"><p class="dim">Загрузка…</p></div></div>';
  if(m.children&&MOD[m.children]){
    const kids=(S.snap[m.children]||[]).filter(x=>String(x[m.childKey])===String(id));
    const cm=MOD[m.children];
    body+='<div class="dblock"><div class="dsub">'+esc(cm.title)+' ('+kids.length+')</div>'+
      (kids.length?'<div class="kids">'+kids.slice(0,25).map(k=>'<button class="kid" onclick="openDrawer(MOD[\''+m.children+'\'],\''+esc(k[cm.idCol])+'\')"><span>'+cm.icon+'</span><b>'+esc(short(k[cm.titleCol]||k[cm.idCol],40))+'</b>'+(k[cm.statusCol]?'<i class="chip '+statusKind(k[cm.statusCol])+'">'+esc(short(k[cm.statusCol],14))+'</i>':'')+'</button>').join('')+'</div>':'<p class="dim">Связанных записей нет.</p>')+
      (can(m.children,'create')?'<button class="btn ghost sm" style="margin-top:9px" onclick="openChildForm(\''+m.children+'\',\''+esc(m.childKey)+'\',\''+esc(id)+'\')">＋ Добавить</button>':'')+'</div>';
  }
  if(m.replies){
    const reps=(S.snap.taskReplies||[]).filter(x=>String(x['ID_Задания'])===String(id));
    body+='<div class="dblock"><div class="dsub">Переписка ('+reps.length+')</div><div id="dReplies">'+
      (reps.length?reps.map(x=>'<div class="msg"><b>'+esc(refLabel('users',x['От_кого']))+'</b><i>'+esc(pretty(x['Время']))+'</i><p>'+esc(x['Текст'])+'</p></div>').join(''):'<p class="dim">Ответов пока нет.</p>')+'</div>'+
      '<div class="reply-box"><textarea id="replyText" rows="2" placeholder="Написать ответ…"></textarea><button class="btn primary sm" onclick="sendReply(\''+esc(id)+'\')">Отправить</button></div></div>';
  }
  body+='<div class="dblock"><div class="dsub">Комментарии</div><div id="dComments">'+commentsHtml(m.id,id)+'</div>'+
    '<div class="reply-box"><textarea id="comText" rows="2" placeholder="Комментарий к записи…"></textarea><button class="btn ghost sm" onclick="sendComment(\''+m.id+'\',\''+esc(id)+'\')">Добавить</button></div></div>';
  body+='<div class="dblock"><div class="dsub">Файлы записи</div><div id="dFiles">'+filesHtml(m.id,id)+'</div>'+
    (can(m.id,'edit')?'<div class="drop sm" id="dDrop"><input type="file" id="dFileInput" multiple hidden><div class="drop-in"><b>Перетащите файлы сюда</b><span>или</span><button class="btn ghost sm" onclick="document.getElementById(\'dFileInput\').click()">Выбрать файлы</button></div></div>':'')+'</div>';
  $('#drawerBody').innerHTML=body;
  $('#drawerFoot').innerHTML=
    (m.inventory?'<button class="btn ghost" onclick="makeInventory(\''+esc(id)+'\')">📄 Опись PDF</button>':'')+
    (can(m.id,'edit')?'<button class="btn primary" onclick="editFromDrawer()">✎ Редактировать</button>':'')+
    (can(m.id,'delete')?'<button class="btn danger" onclick="drawerDelete()">🗑 Удалить</button>':'')+
    '<button class="btn ghost" onclick="closeDrawer()">Закрыть</button>';
  $('#drawer').classList.add('on');$('#scrim').classList.add('on');document.body.classList.add('lock');
  const inp=$('#dFileInput');
  if(inp){
    inp.onchange=()=>uploadTo(m.id,id,Array.from(inp.files));
    const dz=$('#dDrop');
    ['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('hot');}));
    ['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('hot');}));
    dz.addEventListener('drop',e=>{if(e.dataTransfer.files.length) uploadTo(m.id,id,Array.from(e.dataTransfer.files));});
  }
  if(m.summary) loadSummary(m,id);
}
function editFromDrawer(){if(!S.drawer)return;const m=MOD[S.drawer.mod];openForm(m,findRec(m,S.drawer.id));}
function closeDrawer(){$('#drawer').classList.remove('on');$('#scrim').classList.remove('on');if(!$('#modal').classList.contains('on'))document.body.classList.remove('lock');S.drawer=null;}
function drawerDelete(){if(!S.drawer)return;const d=S.drawer;if(confirm('Удалить '+d.id+'?')){closeDrawer();removeRecords(d.mod,[d.id]);}}
function openChildForm(childId,key,val_){
  const cm=MOD[childId]; if(!cm) return;
  openForm(cm,null);
  setTimeout(()=>{const e=document.getElementById('f_'+key);if(e){e.value=val_;e.disabled=true;}},80);
}
async function loadSummary(m,id){
  try{
    const r=await api(m.summary,{contractorId:id});
    const s=r.summary,host=$('#dSummary'); if(!host) return;
    host.innerHTML='<div class="pg-sum">'+
      [['Договор',s.totalContract],['Закрыто',s.totalClosed],['Авансы',s.totalAdvances],['Выплачено',s.totalPaid],['Баланс',s.totalBalance]]
      .map((x,i)=>'<div class="pgs" style="--k:'+(i===4?(x[1]>=0?'#12b886':'#e03131'):CHART_HUES[i%8])+'"><span>'+x[0]+'</span><b>'+money(x[1])+'</b></div>').join('')+'</div>'+
      (r.works.length?'<div class="kids" style="margin-top:10px">'+r.works.map(w=>'<div class="kid static"><span>🔨</span><b>'+esc(short(w['Вид_работ'],34))+'</b><i>'+num(w['Закрыто_объём'])+'/'+num(w['Договорной_объём'])+' '+esc(w['Ед_изм']||'')+'</i></div>').join('')+'</div>':'');
  }catch(e){const h=$('#dSummary');if(h)h.innerHTML='<p class="dim">'+esc(e.message)+'</p>';}
}
function commentsHtml(mod,id){
  const list=(S.snap.comments||[]).filter(c=>String(c['Модуль'])===mod&&String(c['ID_Записи'])===String(id));
  if(!list.length) return '<p class="dim">Комментариев нет.</p>';
  return list.map(c=>'<div class="msg"><b>'+esc(c['Пользователь'])+'</b><i>'+esc(pretty(c['Дата']))+'</i><p>'+esc(c['Текст'])+'</p></div>').join('');
}
async function sendComment(mod,id){
  const t=val('comText').trim(); if(!t){toast('Введите комментарий','warn');return;}
  try{
    const r=await api('addComment',{module:mod,recordId:id,text:t});
    (S.snap.comments=S.snap.comments||[]).push(r.comment);
    $('#dComments').innerHTML=commentsHtml(mod,id);$('#comText').value='';
    bustLocal();toast('Комментарий добавлен','ok');
  }catch(e){toast(e.message,'bad');}
}
async function sendReply(taskId){
  const t=val('replyText').trim(); if(!t){toast('Введите ответ','warn');return;}
  try{
    const r=await api('addTaskReply',{taskId:taskId,text:t});
    (S.snap.taskReplies=S.snap.taskReplies||[]).push(r.reply);
    const reps=(S.snap.taskReplies||[]).filter(x=>String(x['ID_Задания'])===String(taskId));
    $('#dReplies').innerHTML=reps.map(x=>'<div class="msg"><b>'+esc(refLabel('users',x['От_кого']))+'</b><i>'+esc(pretty(x['Время']))+'</i><p>'+esc(x['Текст'])+'</p></div>').join('');
    $('#replyText').value='';bustLocal();toast('Ответ отправлен','ok');
    fetchSnap().then(()=>{paintBadges();}).catch(()=>{});
  }catch(e){toast(e.message,'bad');}
}
function quickClosure(srcMod,id){
  const r=findRec(MOD[srcMod],id); if(!r) return;
  openForm(MOD.closures,null);
  setTimeout(()=>{
    const set=(k,v)=>{const e=document.getElementById('f_'+k);if(e){e.value=v;e.disabled=true;}};
    set('Тип_закрытия',srcMod==='estimateItems'?'ПТО':'Подрядчик');
    if(srcMod==='estimateItems') set('ID_Позиции',id); else set('ID_Работы_подрядчика',id);
    const rest=num(r['Количество']||r['Договорной_объём'])-num(r['Закрыто_объём']);
    const v=document.getElementById('f_Объём'); if(v) v.value=Math.max(0,rest);
    const c=document.getElementById('f_Комментарий'); if(c) c.value='Закрытие по '+id;
  },80);
}
function filesHtml(mod,id){
  const list=atts(mod,id);
  if(!list.length) return '<p class="dim">Файлов нет.</p>';
  return '<div class="files">'+list.map(f=>
    '<div class="file"><span class="fico">'+fileIcon(f['Имя_файла'])+'</span><div class="fmeta"><b>'+esc(f['Имя_файла'])+'</b>'+
    '<i>'+(num(f['Размер'])/1024).toFixed(0)+' КБ · '+esc(pretty(f['Дата']))+' · '+esc(f['Кто_загрузил']||'')+'</i></div>'+
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
function b64(file){return new Promise((res,rej)=>{const r=new FileReader();
  r.onload=e=>res(String(e.target.result).split(',')[1]);r.onerror=()=>rej(new Error('Не удалось прочитать '+file.name));r.readAsDataURL(file);});}
async function uploadTo(mod,id,files,quiet){
  const ok=files.filter(f=>f.size<=10*1024*1024),skip=files.length-ok.length;
  if(skip) toast(skip+' файл(ов) больше 10 МБ — пропущены','warn');
  if(!ok.length) return;
  if(!quiet&&$('#dFiles')) $('#dFiles').insertAdjacentHTML('afterbegin','<div class="uploading" id="upBar"><i></i><span>Загрузка '+ok.length+' файл(ов)…</span></div>');
  try{
    const payload=[];
    for(const f of ok) payload.push({fileName:f.name,mimeType:f.type||'application/octet-stream',fileData:await b64(f)});
    const r=await api('attachFiles',{module:mod,recordId:String(id),files:payload},{timeout:120000});
    const added=r.attachments||[];
    ATT[mod+'::'+id]=(ATT[mod+'::'+id]||[]).concat(added);
    S.snap.attachments=(S.snap.attachments||[]).concat(added);
    if(!quiet&&S.drawer&&$('#dFiles')) $('#dFiles').innerHTML=filesHtml(S.drawer.mod,S.drawer.id);
    bustLocal();safeRenderList();
    toast('Загружено файлов: '+ok.length,'ok');
  }catch(e){const b=$('#upBar');if(b)b.remove();toast(e.message,'bad');}
}
async function dropFile(fid){
  if(!confirm('Удалить файл?')) return;
  try{
    await api('deleteAttachment',{id:fid});
    Object.keys(ATT).forEach(k=>ATT[k]=ATT[k].filter(f=>String(f['ID'])!==String(fid)));
    S.snap.attachments=(S.snap.attachments||[]).filter(f=>String(f['ID'])!==String(fid));
    if(S.drawer&&$('#dFiles')) $('#dFiles').innerHTML=filesHtml(S.drawer.mod,S.drawer.id);
    bustLocal();safeRenderList();toast('Файл удалён','ok');
  }catch(e){toast(e.message,'bad');}
}
async function doReview(id,status){
  const v=num(val('revVol')),c=val('revCom');
  if(status==='Отклонено'&&!c){toast('Укажите причину отказа','warn');return;}
  try{
    await api('reviewSubmission',{id:id,status:status,volume:v,comment:c});
    toast('Подача '+status.toLowerCase()+' · объём '+(status==='Отклонено'?0:v),'ok');
    closeDrawer();bustLocal();await fetchSnap();renderActive();paintBadges();
  }catch(e){toast(e.message,'bad');}
}
function renderSpecial(m,tok){
  if(m.special==='dashboard') return renderDashboard(tok);
  if(m.special==='progress') return renderProgressShell();
  if(m.special==='calendar') return renderCalendar();
  if(m.special==='trash') return renderTrash();
  if(m.special==='audit') return renderAudit(m);
  if(m.special==='admin') return renderAdmin();
}
function renderDashboard(tok){
  const snap=S.snap,c=S.counts;
  const docs=snap.documents||[];
  const noOrig=docs.filter(d=>String(d['Статус_оригинала'])==='Только скан').length;
  const pend=(snap.submissions||[]).filter(s=>String(s['Статус'])==='На_проверке').length;
  const over=(snap.prescriptions||[]).filter(p=>String(p['Статус'])!=='Исполнено'&&daysLeft(p['Срок_исполнения'])!==null&&daysLeft(p['Срок_исполнения'])<0).length;
  const soon=(snap.reminders||[]).filter(r=>String(r['Статус'])!=='Выполнено'&&daysLeft(r['Дата'])!==null&&daysLeft(r['Дата'])<=7).length;
  const pdocs=(snap.personnelDocs||[]).filter(d=>daysLeft(d['Срок_действия'])!==null&&daysLeft(d['Срок_действия'])<=30).length;
  const pres=(snap.preservation||[]).filter(p=>/Требует|Аварийное|Утрачено/.test(String(p['Статус_сохранности']))).length;
  const ks2sum=(snap.ks2||[]).reduce((a,k)=>a+num(k['Общая_сумма']),0);
  const csum=(snap.contracts||[]).reduce((a,k)=>a+num(k['Сумма']),0);
  const kpi=[['Договоры',c.contracts||0,money(csum),'#ff6b35'],['Документы',docs.length,noOrig+' без оригинала','#2f6df6'],
    ['На проверке',pend,'подачи объёмов','#f59f00'],['КС-2',c.ks2||0,money(ks2sum),'#12b886'],
    ['Просрочено',over,'предписания','#e8437f'],['Предметы охраны',pres,'требуют работ','#7c5cff'],
    ['Допуски ≤30 дн.',pdocs,'персонал','#00b8d9'],['Сроки ≤7 дн.',soon,'напоминания','#e03131']];
  const byCat={},byStatus={};
  docs.forEach(d=>{const k=d['Категория']||'Другое';byCat[k]=(byCat[k]||0)+1;});
  docs.forEach(d=>{const k=d['Статус_согласования']||'—';byStatus[k]=(byStatus[k]||0)+1;});
  const top=(snap.contracts||[]).slice().sort((a,b)=>num(b['Сумма'])-num(a['Сумма'])).slice(0,6);
  const maxTop=top.length?num(top[0]['Сумма']):1;
  if(tok!==renderToken) return;
  $('#modBody').innerHTML='<div class="kpis">'+kpi.map(k=>'<div class="kpi" style="--k:'+k[3]+'"><span class="kpi-l">'+esc(k[0])+'</span><b class="kpi-n">'+k[1]+'</b><span class="kpi-s">'+esc(k[2])+'</span></div>').join('')+'</div>'+
    '<div class="dash-grid">'+
    '<section class="panel"><h3>Документы по категориям</h3>'+donut(byCat)+'</section>'+
    '<section class="panel"><h3>Статусы согласования</h3>'+bars(byStatus)+'</section>'+
    '<section class="panel wide"><h3>Крупнейшие договоры</h3><div class="hbars">'+
      (top.length?top.map((t,i)=>'<button class="hbar" onclick="openDrawer(MOD.contracts,\''+esc(t['ID_Договора'])+'\')"><span class="hb-l">'+esc(short(t['Контрагент'],30))+'</span><div class="hb-t"><i style="width:'+Math.max(4,num(t['Сумма'])/maxTop*100)+'%;background:'+CHART_HUES[i%8]+'"></i></div><b>'+money(t['Сумма'])+'</b></button>').join(''):'<p class="dim">Договоров пока нет.</p>')+'</div></section>'+
    '<section class="panel"><h3>Требуют внимания</h3><div class="feed">'+attentionList()+'</div></section>'+
    '<section class="panel"><h3>Последние действия</h3><div class="feed">'+
      ((snap.actions||[]).length?(snap.actions||[]).slice(0,10).map(a=>'<div class="feed-i"><span class="fd-dot"></span><div><b>'+esc(a['Действие'])+'</b><i>'+esc(a['Пользователь'])+' · '+esc(pretty(a['Дата']))+'</i><p>'+esc(short(a['Объект'],40))+'</p></div></div>').join(''):'<p class="dim">Журнал пуст.</p>')+'</div></section>'+
    '</div>';
}
function attentionList(){
  const out=[];
  (S.snap.prescriptions||[]).forEach(p=>{const d=daysLeft(p['Срок_исполнения']);if(String(p['Статус'])!=='Исполнено'&&d!==null&&d<=3)out.push(['⚠️','Предписание '+p['Номер'],d<0?('просрочено '+Math.abs(d)+' дн.'):('осталось '+d+' дн.'),'prescriptions',p['ID']]);});
  (S.snap.supervision||[]).forEach(p=>{const d=daysLeft(p['Срок_устранения']);if(String(p['Статус_устранения'])!=='Устранено'&&d!==null&&d<=7)out.push(['🔍','Авторский надзор',d<0?('просрочено '+Math.abs(d)+' дн.'):('осталось '+d+' дн.'),'supervision',p['ID']]);});
  (S.snap.personnelDocs||[]).forEach(p=>{const d=daysLeft(p['Срок_действия']);if(d!==null&&d<=30)out.push(['🪪',p['Тип_документа']+' · '+refLabel('personnel',p['ID_Сотрудника']),d<0?('просрочен '+Math.abs(d)+' дн.'):('истекает через '+d+' дн.'),'personnelDocs',p['ID']]);});
  (S.snap.reminders||[]).forEach(r=>{const d=daysLeft(r['Дата']);if(String(r['Статус'])!=='Выполнено'&&d!==null&&d<=7)out.push(['⏰',r['Тип']+' · '+short(r['Объект'],24),d<0?('просрочено '+Math.abs(d)+' дн.'):('через '+d+' дн.'),'reminders',r['ID']]);});
  (S.snap.tasks||[]).forEach(t=>{const d=daysLeft(t['Дедлайн']);if(['Выполнено','Отклонено'].indexOf(String(t['Статус']))===-1&&d!==null&&d<=3)out.push(['📨',short(t['Тема'],28),d<0?('просрочено '+Math.abs(d)+' дн.'):('дедлайн через '+d+' дн.'),'tasks',t['ID']]);});
  if(!out.length) return '<p class="dim">Просрочек и близких сроков нет.</p>';
  return out.slice(0,14).map(x=>'<button class="att-i" onclick="openDrawer(MOD[\''+x[3]+'\',\''+esc(x[4])+'\')"><span>'+x[0]+'</span><div><b>'+esc(x[1])+'</b><i>'+esc(x[2])+'</i></div><em>→</em></button>').join('');
}
function donut(obj){
  const keys=Object.keys(obj); if(!keys.length) return '<p class="dim">Нет данных.</p>';
  const total=keys.reduce((a,k)=>a+obj[k],0); let acc=0,segs='';
  keys.forEach((k,i)=>{const len=obj[k]/total*276.46;
    segs+='<circle r="44" cx="60" cy="60" fill="none" stroke="'+CHART_HUES[i%8]+'" stroke-width="16" stroke-dasharray="'+len.toFixed(2)+' 276.46" stroke-dashoffset="'+(-acc).toFixed(2)+'" transform="rotate(-90 60 60)"><title>'+esc(k)+': '+obj[k]+'</title></circle>';
    acc+=len;});
  return '<div class="donut-wrap"><svg viewBox="0 0 120 120" class="donut">'+segs+'<text x="60" y="57" text-anchor="middle" class="dn">'+total+'</text><text x="60" y="72" text-anchor="middle" class="dl">всего</text></svg>'+
    '<ul class="legend">'+keys.map((k,i)=>'<li><i style="background:'+CHART_HUES[i%8]+'"></i><span>'+esc(k)+'</span><b>'+obj[k]+'</b><em>'+Math.round(obj[k]/total*100)+'%</em></li>').join('')+'</ul></div>';
}
function bars(obj){
  const keys=Object.keys(obj); if(!keys.length) return '<p class="dim">Нет данных.</p>';
  const max=Math.max.apply(null,keys.map(k=>obj[k]));
  return '<div class="vbars">'+keys.map((k,i)=>'<div class="vbar"><b>'+obj[k]+'</b><div class="vb-t"><i style="height:'+Math.max(6,obj[k]/max*100)+'%;background:'+CHART_HUES[i%8]+'"></i></div><span>'+esc(short(k,14))+'</span></div>').join('')+'</div>';
}
function renderProgressShell(){
  const opts=(S.snap.contracts||[]).map(c=>'<option value="'+esc(c['ID_Договора'])+'">'+esc(c['Контрагент'])+' · №'+esc(c['Номер_Договора'])+'</option>').join('');
  $('#modBody').innerHTML='<div class="panel"><div class="pg-pick"><div><label>Договор</label><select id="pgContract"><option value="">— выберите договор —</option>'+opts+'</select></div><button class="btn primary" onclick="loadProgress()">Показать</button></div><div id="pgOut"><p class="dim">Выберите договор — увидите две параллельные шкалы по каждой позиции: подтверждённое выполнение и подачу КС-2.</p></div></div>';
  $('#pgContract').onchange=loadProgress;
}
async function loadProgress(){
  const id=val('pgContract'),out=$('#pgOut');
  if(!id){out.innerHTML='<p class="dim">Выберите договор.</p>';return;}
  out.innerHTML='<div class="sk-wrap"><div class="sk-row"><span class="sk a"></span><span class="sk b"></span><span class="sk c"></span></div><div class="sk-row"><span class="sk a"></span><span class="sk b"></span><span class="sk c"></span></div></div>';
  try{
    const r=await api('progress',{contractId:id}),s=r.summary;
    const pct=(a,b)=>b?Math.min(100,a/b*100):0;
    const fmt=n=>(+n).toFixed(2).replace(/\.00$/,'');
    out.innerHTML='<div class="pg-sum">'+
      [['Объём по смете',s.total,''],['Выполнено',s.done,money(s.doneAmount)],['На проверке',s.review,''],['Осталось',s.rest,''],['Подано КС-2',s.billed,money(s.billedAmount)],['Не подано',s.unbilled,'']]
      .map((x,i)=>'<div class="pgs" style="--k:'+CHART_HUES[i%8]+'"><span>'+x[0]+'</span><b>'+fmt(x[1])+'</b><i>'+esc(x[2]||'')+'</i></div>').join('')+'</div>'+
      (r.positions.length?r.positions.map(p=>
        '<div class="pg-row"><div class="pg-head"><b>'+esc(p.name)+'</b><span>'+esc(p.section||'')+' · '+esc(p.unit||'')+' · '+money(p.amount)+'</span></div>'+
        '<div class="pg-line"><label>Выполнение</label><div class="stack">'+
          '<i class="s-ok" style="width:'+pct(p.done,p.total)+'%" title="Подтверждено: '+p.done+'">'+(pct(p.done,p.total)>9?fmt(p.done):'')+'</i>'+
          '<i class="s-warn" style="width:'+pct(p.review,p.total)+'%" title="На проверке: '+p.review+'">'+(pct(p.review,p.total)>9?fmt(p.review):'')+'</i>'+
          '<i class="s-rest" style="width:'+pct(p.rest,p.total)+'%" title="Осталось: '+p.rest+'">'+(pct(p.rest,p.total)>9?fmt(p.rest):'')+'</i>'+
        '</div><em>'+fmt(p.done)+' / '+fmt(p.total)+'</em></div>'+
        '<div class="pg-line"><label>КС-2</label><div class="stack">'+
          '<i class="s-bill" style="width:'+pct(p.billed,p.total)+'%" title="Подано: '+p.billed+'">'+(pct(p.billed,p.total)>9?fmt(p.billed):'')+'</i>'+
          '<i class="s-rest" style="width:'+pct(p.unbilled,p.total)+'%" title="Не подано: '+p.unbilled+'">'+(pct(p.unbilled,p.total)>9?fmt(p.unbilled):'')+'</i>'+
        '</div><em>'+fmt(p.billed)+' / '+fmt(p.total)+'</em></div></div>').join('')
        :'<p class="dim">У договора нет позиций сметы. Добавьте их в разделе «Позиции смет».</p>')+
      '<div class="legend-row"><span><i class="s-ok"></i>подтверждено</span><span><i class="s-warn"></i>на проверке</span><span><i class="s-bill"></i>подано КС-2</span><span><i class="s-rest"></i>остаток</span></div>'+
      (r.ks2.length?'<div class="dsub" style="margin-top:16px">Акты КС-2 ('+r.ks2.length+')</div><div class="tw"><table class="grid"><thead><tr><th>ID</th><th>Номер</th><th>Дата</th><th>Сумма</th><th>Статус</th></tr></thead><tbody>'+
        r.ks2.map(k=>'<tr><td class="cid">'+esc(k.id)+'</td><td>'+esc(k.number)+'</td><td class="dt">'+esc(dstr(k.date))+'</td><td><b class="num">'+money(k.amount)+'</b></td><td><span class="chip '+statusKind(k.status)+'">'+esc(k.status)+'</span></td></tr>').join('')+'</tbody></table></div>':'');
  }catch(e){out.innerHTML='<div class="empty"><div class="empty-ico">⚠️</div><p>'+esc(e.message)+'</p></div>';}
}
let calDate=new Date();
function renderCalendar(){
  const y=calDate.getFullYear(),mo=calDate.getMonth();
  const first=new Date(y,mo,1),last=new Date(y,mo+1,0),off=(first.getDay()+6)%7;
  const ev=S.snap.calendar||[],rem=S.snap.reminders||[],today=new Date().toISOString().slice(0,10);
  let cells=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=>'<div class="cal-dow">'+d+'</div>').join('');
  for(let i=0;i<off;i++) cells+='<div class="cal-cell off"></div>';
  for(let d=1;d<=last.getDate();d++){
    const ds=y+'-'+String(mo+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const de=ev.filter(e=>dstr(e['Дата'])===ds),dr=rem.filter(r=>dstr(r['Дата'])===ds);
    cells+='<div class="cal-cell'+(ds===today?' today':'')+'"><b>'+d+'</b>'+
      de.map((e,i)=>'<button class="cal-ev" style="--k:'+CHART_HUES[i%8]+'" onclick="openDrawer(MOD.calendar,\''+esc(e['ID'])+'\')">'+esc(short(e['Тип'],12))+'</button>').join('')+
      dr.map(r=>'<button class="cal-rem" onclick="openDrawer(MOD.reminders,\''+esc(r['ID'])+'\')">⏰ '+esc(short(r['Объект'],12))+'</button>').join('')+'</div>';
  }
  $('#modBody').innerHTML='<div class="panel"><div class="cal-head"><button class="btn ghost sm" onclick="calShift(-1)">←</button><h3>'+
    calDate.toLocaleDateString('ru-RU',{month:'long',year:'numeric'})+'</h3><button class="btn ghost sm" onclick="calShift(1)">→</button>'+
    '<button class="btn ghost sm" onclick="calToday()">Сегодня</button>'+
    (can('calendar','create')?'<button class="btn primary sm" onclick="openForm(MOD.calendar,null)">＋ Событие</button>':'')+'</div><div class="cal-grid">'+cells+'</div></div>';
}
function calShift(n){calDate.setMonth(calDate.getMonth()+n);renderCalendar();}
function calToday(){calDate=new Date();renderCalendar();}
function renderTrash(){
  const keys=Object.keys(S.trash).filter(k=>S.trash[k].length);
  if(!keys.length){$('#modBody').innerHTML='<div class="empty"><div class="empty-ico">🗑️</div><h3>Корзина пуста</h3><p>Удалённые записи попадают сюда и могут быть восстановлены.</p></div>';return;}
  $('#modBody').innerHTML=keys.map(k=>{
    const m=MOD[k]||{title:k,icon:'📄'};
    return '<section class="panel"><h3>'+m.icon+' '+esc(m.title)+' <em>'+S.trash[k].length+'</em></h3><div class="trash-list">'+
      S.trash[k].map(r=>'<div class="trash-i"><b>'+esc(r.title)+'</b><span>'+esc(r.id)+'</span>'+
        (can(k,'delete')?'<button class="btn ok sm" onclick="trashRestore(\''+k+'\',\''+esc(r.id)+'\')">↺ Вернуть</button>':'')+
        (can(k,'purge')?'<button class="btn danger sm" onclick="trashPurge(\''+k+'\',\''+esc(r.id)+'\')">✕ Навсегда</button>':'')+'</div>').join('')+'</div></section>';
  }).join('');
}
async function trashRestore(mod,id){
  try{await api('restoreRecords',{module:mod,ids:[id]});bustLocal();await fetchSnap();renderActive();paintBadges();toast('Восстановлено: '+id,'ok');}
  catch(e){toast(e.message,'bad');}
}
async function trashPurge(mod,id){
  if(!confirm('Удалить '+id+' НАВСЕГДА? Действие необратимо.')) return;
  try{await api('purgeRecords',{module:mod,ids:[id]});bustLocal();await fetchSnap();renderActive();paintBadges();toast('Удалено навсегда','ok');}
  catch(e){toast(e.message,'bad');}
}
function renderAudit(m){
  const rows=(S.snap[m.source]||[]).slice(0,400);
  if(!rows.length){$('#modBody').innerHTML='<div class="empty"><div class="empty-ico">📜</div><h3>Пока пусто</h3><p>Действия появятся здесь автоматически.</p></div>';return;}
  $('#modBody').innerHTML='<div class="tw"><table class="grid"><thead><tr>'+m.cols.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+
    rows.map(r=>'<tr>'+m.cols.map(c=>'<td>'+esc(short(pretty(r[c]),90))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}
window.addEventListener('resize',debounce(()=>{const m=MOD[S.mod];if(m&&!m.special&&S.snap)renderList(m,++renderToken);},220));
