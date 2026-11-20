const ROLE_LIST=['Администратор','ПТО','Бухгалтерия','Прораб','Архитектор','Дизайнер','ГАП','ГИП','Тендерный_специалист','Отдел_кадров','Снабжение'];
const ROLE_CAPS={'Администратор':['view','create','edit','delete','purge','users','export','review','settings'],
 'ПТО':['view','create','edit','delete','export','review'],'Бухгалтерия':['view','create','edit','export'],
 'Прораб':['view','create','edit','delete'],'Архитектор':['view','create','edit','delete'],'Дизайнер':['view','create','edit'],
 'ГАП':['view','create','edit','delete','export','review'],'ГИП':['view','create','edit','export','review'],
 'Тендерный_специалист':['view','create','edit','delete','export'],'Отдел_кадров':['view','create','edit','delete'],'Снабжение':['view','create','edit','delete']};
const ROLE_MODULES={'Администратор':'все разделы + настройки','ГИП':'все разделы (просмотр, правка, проверка)',
 'ПТО':'договоры, ИД, сметы, подачи, КС-2, доп. работы, тендеры, КП, подрядчики, планирование, надзор',
 'Бухгалтерия':'КС-2, состав КС-2, выплаты, подрядчики, договоры, сметы, КП','Прораб':'подачи, отчёты, наряды, численность, документы, материалы, закрытия',
 'Архитектор':'арх. проекты, чертежи, предметы охраны, надзор, КГИОП, ППР','Дизайнер':'арх. проекты, чертежи, предметы охраны, документы',
 'ГАП':'архитектура, чертежи, охрана, КГИОП, проверка подач','Тендерный_специалист':'тендеры, КП, договоры, документы',
 'Отдел_кадров':'персонал, допуски, приказы, численность','Снабжение':'материалы, документы, договоры'};
const SUBS=['Документы','Замечания','Напоминания','Договоры','Сроки'];

function renderAdmin(){
  const isAdmin=S.user.role==='Администратор';
  const users=S.snap.users||[],byRole={};
  users.forEach(u=>byRole[u['Роль']]=(byRole[u['Роль']]||0)+1);
  const settings={};(S.snap.settings||[]).forEach(s=>settings[s['Параметр']]=s['Значение']);
  const mySubs=String(S.user.subs||'').split(',').map(x=>x.trim());
  let html='<div class="kpis">'+
    '<div class="kpi" style="--k:#ff6b35"><span class="kpi-l">Пользователей</span><b class="kpi-n">'+users.length+'</b><span class="kpi-s">'+Object.keys(byRole).length+' ролей задействовано</span></div>'+
    '<div class="kpi" style="--k:#2f6df6"><span class="kpi-l">Разделов</span><b class="kpi-n">'+MODULES.filter(m=>m.sheet).length+'</b><span class="kpi-s">под управлением прав</span></div>'+
    '<div class="kpi" style="--k:#12b886"><span class="kpi-l">Файлов</span><b class="kpi-n">'+(S.snap.attachments||[]).length+'</b><span class="kpi-s">единое хранилище Drive</span></div>'+
    '<div class="kpi" style="--k:#7c5cff"><span class="kpi-l">Отложено</span><b class="kpi-n">'+S.queue.length+'</b><span class="kpi-s">операций в очереди</span></div></div>';

  html+='<section class="panel"><h3>📧 Мои уведомления</h3><div class="form">'+
    '<div class="fg"><label>Email для уведомлений</label><input id="myMail" type="email" value="'+esc(S.user.email||'')+'" placeholder="name@company.ru"></div>'+
    '<div class="fg"><label>Подписки</label><div class="checks">'+SUBS.map(s=>'<label class="chk"><input type="checkbox" class="subChk" value="'+s+'"'+(mySubs.indexOf(s)>-1?' checked':'')+'><i></i><span>'+s+'</span></label>').join('')+'</div></div>'+
    '</div><div class="panel-foot"><button class="btn primary" onclick="saveMyNotif()">Сохранить</button><button class="btn ghost" onclick="testMyMail()">🧪 Тестовое письмо</button></div></section>';

  if(S.queue.length){
    html+='<section class="panel"><h3>📤 Отложенные операции <em>'+S.queue.length+'</em></h3><div class="diag">'+
      S.queue.map(q=>'<div class="diag-i"><span>'+esc(q.action)+'</span><b>'+new Date(q.at).toLocaleTimeString('ru-RU')+'</b></div>').join('')+
      '</div><div class="panel-foot"><button class="btn primary" onclick="flushQueue()">Отправить сейчас</button><button class="btn danger" onclick="clearQueue()">Очистить очередь</button></div></section>';
  }

  if(isAdmin){
    html+='<section class="panel"><h3>👥 Учётные записи</h3><div class="tw"><table class="grid"><thead><tr><th>Логин</th><th>ФИО</th><th>Роль</th><th>Email</th><th>Подписки</th><th class="ca"></th></tr></thead><tbody>'+
      users.map(u=>'<tr><td class="cid">'+esc(u['Логин'])+'</td><td><div class="who"><span class="ava">'+esc(initials(u['ФИО']))+'</span><b>'+esc(u['ФИО'])+'</b></div></td>'+
        '<td><span class="chip '+(u['Роль']==='Администратор'?'bad':'neutral')+'">'+esc(u['Роль'])+'</span></td><td>'+esc(u['Email']||'—')+'</td>'+
        '<td class="mtxt">'+esc(short(u['Подписки']||'—',30))+'</td><td class="ca"><div class="rowacts">'+
        '<button class="btn ghost sm" onclick="openUserForm(\''+esc(u['Логин'])+'\')">✎</button>'+
        '<button class="btn danger sm"'+(u['Логин']===S.user.login?' disabled':'')+' onclick="dropUser(\''+esc(u['Логин'])+'\')">🗑</button></div></td></tr>').join('')+
      '</tbody></table></div><div class="panel-foot"><button class="btn primary" onclick="openUserForm(null)">＋ Новый пользователь</button></div></section>';

    html+='<section class="panel wide"><h3>🔐 Матрица доступа</h3><div class="tw"><table class="grid matrix"><thead><tr><th>Роль</th><th>Разделы</th><th>Просмотр</th><th>Создание</th><th>Правка</th><th>Удаление</th><th>Проверка</th><th>Экспорт</th></tr></thead><tbody>'+
      ROLE_LIST.map(r=>{const acc=ROLE_CAPS[r]||[];
        const mark=c=>acc.indexOf(c)>-1?'<span class="yes">●</span>':'<span class="no">·</span>';
        return '<tr><td><b>'+esc(r)+'</b></td><td class="mtxt">'+esc(ROLE_MODULES[r]||'—')+'</td>'+
          ['view','create','edit','delete','review','export'].map(c=>'<td class="mc">'+mark(c)+'</td>').join('')+'</tr>';}).join('')+
      '</tbody></table></div></section>';

    html+='<section class="panel"><h3>📥 Импорт CSV</h3>'+
      '<div class="form"><div class="fg"><label>Раздел назначения</label><select id="impMod">'+
      MODULES.filter(m=>m.sheet&&can(m.id,'create')).map(m=>'<option value="'+m.id+'">'+esc(m.title)+'</option>').join('')+'</select></div>'+
      '<div class="fg"><label>Разделитель</label><select id="impSep"><option value=";">точка с запятой ;</option><option value=",">запятая ,</option><option value="\t">табуляция</option></select></div>'+
      '<div class="fg wide"><label>Файл CSV или вставьте текст</label><input type="file" id="impFile" accept=".csv,.txt"><textarea id="impText" rows="5" placeholder="Первая строка — заголовки, совпадающие с названиями колонок листа"></textarea></div></div>'+
      '<div class="panel-foot"><button class="btn ghost" onclick="impPreview()">👁 Разобрать</button><button class="btn primary" id="impRun" onclick="impRun()" disabled>Импортировать</button></div>'+
      '<div id="impOut"></div></section>';

    html+='<section class="panel"><h3>⚙️ Системные настройки</h3><div class="form">'+
      '<div class="fg wide"><label>Адрес сайта (для ссылок в письмах)</label><input id="setSite" type="text" value="'+esc(settings['Site_URL']||'')+'"></div>'+
      '<div class="fg"><label>Имя отправителя</label><input id="setSender" type="text" value="'+esc(settings['Email_Sender_Name']||'СтройРеестр')+'"></div>'+
      '<div class="fg"><label>Уведомления</label><select id="setNotif"><option'+(settings['Уведомления']==='включены'?' selected':'')+'>включены</option><option'+(settings['Уведомления']==='выключены'?' selected':'')+'>выключены</option></select></div>'+
      '</div><div class="panel-foot"><button class="btn primary" onclick="saveSysSettings()">Сохранить</button>'+
      '<button class="btn ghost" onclick="installTrig()">⏱ Автотриггеры</button>'+
      '<button class="btn ghost" onclick="backupNow()">💾 Резервная копия</button>'+
      '<button class="btn ghost" onclick="hardRefresh()">⟳ Сбросить кэш</button></div></section>';
  }

  html+='<section class="panel"><h3>🩺 Диагностика</h3><div class="diag">'+
    diagRow('Версия интерфейса',APP.ver)+diagRow('API',API_URL.slice(0,58)+'…')+
    diagRow('Снимок данных',S.lastTs?new Date(S.lastTs).toLocaleString('ru-RU'):'не загружен')+
    diagRow('Кэш браузера',localStorage.getItem(APP.cacheKey)?'активен — мгновенный первый рендер':'пуст')+
    diagRow('Сессия',S.token?'токен активен (6 ч)':'нет')+
    diagRow('Роль',S.user.role)+diagRow('Плотность таблиц',S.prefs.density)+
    diagRow('Уведомлений',NOTIF.length+' / непрочитанных '+unreadCount())+
    diagRow('Записей в корзине',Object.keys(S.trash).reduce((a,k)=>a+S.trash[k].length,0))+
    '</div></section>';
  $('#modBody').innerHTML=html;
  const f=$('#impFile');
  if(f) f.onchange=()=>{const file=f.files[0];if(!file) return;
    const r=new FileReader();r.onload=e=>{$('#impText').value=String(e.target.result).replace(/^\uFEFF/,'');toast('Файл прочитан: '+file.name,'ok');};r.readAsText(file,'utf-8');};
}
function diagRow(k,v){return '<div class="diag-i"><span>'+esc(k)+'</span><b>'+esc(String(v))+'</b></div>';}
function clearQueue(){if(!confirm('Очистить очередь без выполнения?')) return;S.queue=[];saveQueue();renderActive();toast('Очередь очищена','ok');}
async function saveMyNotif(){
  const subs=$$('.subChk').filter(c=>c.checked).map(c=>c.value).join(',');
  try{
    await api('saveMyEmail',{email:val('myMail'),subs:subs});
    S.user.email=val('myMail');S.user.subs=subs;
    localStorage.setItem('sr_session',JSON.stringify({user:S.user,token:S.token,at:Date.now()}));
    bustLocal();toast('Настройки уведомлений сохранены','ok');
  }catch(e){toast(e.message,'bad');}
}
async function testMyMail(){
  const m=val('myMail');if(!m){toast('Укажите email','warn');return;}
  toast('Отправляю письмо…','info');
  try{await api('testEmail',{email:m});toast('Письмо отправлено на '+m,'ok');}catch(e){toast(e.message,'bad');}
}
async function saveSysSettings(){
  try{
    await api('saveSettings',{items:{'Site_URL':val('setSite'),'Email_Sender_Name':val('setSender'),'Уведомления':val('setNotif')}});
    bustLocal();await fetchSnap();renderActive();toast('Настройки сохранены','ok');
  }catch(e){toast(e.message,'bad');}
}
async function installTrig(){try{await api('installTriggers',{});toast('Триггеры: бэкап 23:00, дайджест 09:00','ok');}catch(e){toast(e.message,'bad');}}
async function backupNow(){
  toast('Создаю копию таблицы…','info');
  try{const r=await api('backupNow',{});window.open(r.fileUrl,'_blank');toast('Копия создана: '+r.fileName,'ok');}catch(e){toast(e.message,'bad');}
}
async function hardRefresh(){bustLocal();qCache.clear();try{await api('refresh',{});}catch(e){}await loadData();toast('Кэш сброшен, данные обновлены','ok');}

let IMP=null;
function parseCsv(text,sep){
  const rows=[];let row=[],cur='',q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){
      if(c==='"'){ if(text[i+1]==='"'){cur+='"';i++;} else q=false; }
      else cur+=c;
    } else {
      if(c==='"') q=true;
      else if(c===sep){row.push(cur);cur='';}
      else if(c==='\n'){row.push(cur);rows.push(row);row=[];cur='';}
      else if(c!=='\r') cur+=c;
    }
  }
  if(cur!==''||row.length){row.push(cur);rows.push(row);}
  return rows.filter(r=>r.some(x=>String(x).trim()!==''));
}
function impPreview(){
  const modId=val('impMod'),m=MOD[modId],text=val('impText').trim();
  let sep=val('impSep');if(sep==='\\t') sep='\t';
  if(!text){toast('Вставьте CSV или выберите файл','warn');return;}
  const rows=parseCsv(text,sep);
  if(rows.length<2){toast('Нужны заголовок и хотя бы одна строка','warn');return;}
  const head=rows[0].map(h=>h.trim());
  const known=(m.fields||[]).map(f=>f.c);
  const mapIdx=head.map(h=>known.indexOf(h)>-1?h:null);
  const matched=mapIdx.filter(Boolean).length;
  if(!matched){$('#impOut').innerHTML='<div class="empty small"><p>Ни одна колонка не совпала. Ожидаются: '+esc(known.slice(0,8).join(', '))+'…</p></div>';$('#impRun').disabled=true;IMP=null;return;}
  const data=rows.slice(1).map(r=>{const o={};mapIdx.forEach((k,i)=>{if(k) o[k]=r[i]!==undefined?r[i]:'';});return o;});
  IMP={mod:modId,rows:data};
  $('#impRun').disabled=false;
  $('#impOut').innerHTML='<div class="imp-info">Совпало колонок: <b>'+matched+'</b> из '+head.length+' · строк к импорту: <b>'+data.length+'</b>'+
    (head.length-matched?' · пропущены: '+esc(head.filter((h,i)=>!mapIdx[i]).join(', ')):'')+'</div>'+
    '<div class="tw" style="max-height:260px"><table class="grid"><thead><tr>'+mapIdx.filter(Boolean).map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+
    data.slice(0,12).map(o=>'<tr>'+mapIdx.filter(Boolean).map(c=>'<td>'+esc(short(o[c],40))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}
async function impRun(){
  if(!IMP) return;
  const m=MOD[IMP.mod],btn=$('#impRun');
  if(!confirm('Создать '+IMP.rows.length+' записей в разделе «'+m.title+'»?')) return;
  btn.disabled=true;btn.classList.add('busy');
  let ok=0,fail=0;
  for(let i=0;i<IMP.rows.length;i++){
    const values=Object.assign({},IMP.rows[i]);
    (m.fields||[]).forEach(f=>{if(f.t==='number'&&values[f.c]!==undefined&&values[f.c]!=='') values[f.c]=num(values[f.c]);});
    if(m.calc){const a=num(values[m.calc[0]]),b=num(values[m.calc[1]]);if(a&&b) values['Сумма']=a*b;}
    try{await api('createRecord',{module:IMP.mod,values:values});ok++;}
    catch(e){fail++;}
    btn.textContent='Импорт '+(i+1)+'/'+IMP.rows.length;
  }
  btn.classList.remove('busy');btn.textContent='Импортировать';btn.disabled=false;
  toast('Импорт завершён: '+ok+' создано'+(fail?', '+fail+' с ошибкой':''),fail?'warn':'ok');
  IMP=null;$('#impOut').innerHTML='';bustLocal();await fetchSnap();paintBadges();paintNotif();
}

function openUserForm(login){
  const u=login?(S.snap.users||[]).filter(x=>x['Логин']===login)[0]:null;
  const subs=u?String(u['Подписки']||'').split(',').map(x=>x.trim()):SUBS;
  $('#modalTitle').innerHTML=u?'✎ Пользователь · '+esc(login):'＋ Новый пользователь';
  $('#modalBody').innerHTML='<form class="form" onsubmit="return false">'+
    '<div class="fg"><label>Логин <em>*</em></label><input id="uLogin" type="text" value="'+esc(u?u['Логин']:'')+'"'+(u?' readonly':'')+'></div>'+
    '<div class="fg"><label>'+(u?'Новый пароль (пусто — не менять)':'Пароль <em>*</em>')+'</label><input id="uPass" type="text" placeholder="минимум 8 символов"></div>'+
    '<div class="fg wide"><label>ФИО <em>*</em></label><input id="uFio" type="text" value="'+esc(u?u['ФИО']:'')+'"></div>'+
    '<div class="fg"><label>Роль</label><select id="uRoleSel">'+ROLE_LIST.map(r=>'<option'+(u&&u['Роль']===r?' selected':'')+'>'+esc(r)+'</option>').join('')+'</select></div>'+
    '<div class="fg"><label>Email</label><input id="uMail" type="email" value="'+esc(u?u['Email']:'')+'"></div>'+
    '<div class="fg wide"><label>Доступ (описание)</label><input id="uAcc" type="text" value="'+esc(u?u['Доступ']:'')+'" placeholder="По роли"></div>'+
    '<div class="fg wide"><label>Подписки</label><div class="checks">'+SUBS.map(s=>'<label class="chk"><input type="checkbox" class="uSub" value="'+s+'"'+(subs.indexOf(s)>-1?' checked':'')+'><i></i><span>'+s+'</span></label>').join('')+'</div></div>'+
    '</form><div class="rolehint" id="roleHint"></div>';
  $('#modalFoot').innerHTML='<button class="btn ghost" onclick="closeModal()">Отмена</button><button class="btn primary" id="uSave" onclick="saveUserForm('+(u?'true':'false')+')">'+(u?'Сохранить':'Создать')+'</button>';
  const hint=()=>{const r=val('uRoleSel');$('#roleHint').innerHTML='<b>'+esc(r)+'</b> · '+esc(ROLE_MODULES[r]||'')+'<br><span>Права: '+(ROLE_CAPS[r]||[]).join(', ')+'</span>';};
  $('#uRoleSel').onchange=hint;hint();
  $('#modal').classList.add('on');document.body.classList.add('lock');
}
async function saveUserForm(isEdit){
  const login=val('uLogin').trim(),fio=val('uFio').trim(),pass=val('uPass');
  if(!login||!fio){toast('Заполните логин и ФИО','warn');return;}
  if(!isEdit&&pass.length<8){toast('Пароль минимум 8 символов','warn');return;}
  const btn=$('#uSave');btn.disabled=true;btn.classList.add('busy');
  try{
    await api('saveUser',{mode:isEdit?'edit':'create',login:login,fio:fio,password:pass,role:val('uRoleSel'),
      email:val('uMail'),access:val('uAcc')||'По роли',subs:$$('.uSub').filter(c=>c.checked).map(c=>c.value).join(',')});
    closeModal();bustLocal();await fetchSnap();renderActive();paintBadges();
    toast(isEdit?'Пользователь обновлён':'Пользователь создан','ok');
  }catch(e){toast(e.message,'bad');}
  finally{btn.disabled=false;btn.classList.remove('busy');}
}
async function dropUser(login){
  if(!confirm('Удалить пользователя '+login+'?')) return;
  try{await api('removeUser',{login:login});bustLocal();await fetchSnap();renderActive();paintBadges();toast('Пользователь удалён','ok');}
  catch(e){toast(e.message,'bad');}
}
