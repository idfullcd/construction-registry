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
  const settings={}; (S.snap.settings||[]).forEach(s=>settings[s['Параметр']]=s['Значение']);
  const mySubs=String(S.user.subs||'').split(',').map(x=>x.trim());
  let html='<div class="kpis">'+
    '<div class="kpi" style="--k:#ff6b35"><span class="kpi-l">Пользователей</span><b class="kpi-n">'+users.length+'</b><span class="kpi-s">'+Object.keys(byRole).length+' ролей задействовано</span></div>'+
    '<div class="kpi" style="--k:#2f6df6"><span class="kpi-l">Разделов</span><b class="kpi-n">'+MODULES.filter(m=>m.sheet).length+'</b><span class="kpi-s">под управлением прав</span></div>'+
    '<div class="kpi" style="--k:#12b886"><span class="kpi-l">Файлов</span><b class="kpi-n">'+(S.snap.attachments||[]).length+'</b><span class="kpi-s">единое хранилище Drive</span></div>'+
    '<div class="kpi" style="--k:#7c5cff"><span class="kpi-l">Записей всего</span><b class="kpi-n">'+Object.keys(S.counts).reduce((a,k)=>a+(S.counts[k]||0),0)+'</b><span class="kpi-s">во всех таблицах</span></div></div>';

  html+='<section class="panel"><h3>📧 Мои уведомления</h3><div class="form">'+
    '<div class="fg"><label>Email для уведомлений</label><input id="myMail" type="email" value="'+esc(S.user.email||'')+'" placeholder="name@company.ru"></div>'+
    '<div class="fg"><label>Подписки</label><div class="checks">'+SUBS.map(s=>'<label class="chk"><input type="checkbox" class="subChk" value="'+s+'"'+(mySubs.indexOf(s)>-1?' checked':'')+'><i></i><span>'+s+'</span></label>').join('')+'</div></div>'+
    '</div><div class="panel-foot"><button class="btn primary" onclick="saveMyNotif()">Сохранить</button><button class="btn ghost" onclick="testMyMail()">🧪 Отправить тестовое письмо</button></div></section>';

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

    html+='<section class="panel"><h3>⚙️ Системные настройки</h3><div class="form">'+
      '<div class="fg wide"><label>Адрес сайта (для ссылок в письмах)</label><input id="setSite" type="text" value="'+esc(settings['Site_URL']||'')+'"></div>'+
      '<div class="fg"><label>Имя отправителя</label><input id="setSender" type="text" value="'+esc(settings['Email_Sender_Name']||'СтройРеестр')+'"></div>'+
      '<div class="fg"><label>Уведомления</label><select id="setNotif"><option'+(settings['Уведомления']==='включены'?' selected':'')+'>включены</option><option'+(settings['Уведомления']==='выключены'?' selected':'')+'>выключены</option></select></div>'+
      '</div><div class="panel-foot"><button class="btn primary" onclick="saveSysSettings()">Сохранить настройки</button>'+
      '<button class="btn ghost" onclick="installTrig()">⏱ Установить автотриггеры</button>'+
      '<button class="btn ghost" onclick="backupNow()">💾 Создать резервную копию</button>'+
      '<button class="btn ghost" onclick="hardRefresh()">⟳ Сбросить кэш</button></div></section>';
  }

  html+='<section class="panel"><h3>🩺 Диагностика</h3><div class="diag">'+
    diagRow('Версия интерфейса',APP.ver)+diagRow('API',API_URL.slice(0,58)+'…')+
    diagRow('Снимок данных',S.lastTs?new Date(S.lastTs).toLocaleString('ru-RU'):'не загружен')+
    diagRow('Кэш браузера',localStorage.getItem(APP.cacheKey)?'активен — мгновенный первый рендер':'пуст')+
    diagRow('Сессия',S.token?'токен активен (6 ч)':'нет')+
    diagRow('Роль',S.user.role)+
    diagRow('Записей в корзине',Object.keys(S.trash).reduce((a,k)=>a+S.trash[k].length,0))+
    '</div></section>';
  $('#modBody').innerHTML=html;
}
function diagRow(k,v){return '<div class="diag-i"><span>'+esc(k)+'</span><b>'+esc(String(v))+'</b></div>';}
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
  const m=val('myMail'); if(!m){toast('Укажите email','warn');return;}
  toast('Отправляю письмо…','info');
  try{await api('testEmail',{email:m});toast('Письмо отправлено на '+m,'ok');}catch(e){toast(e.message,'bad');}
}
async function saveSysSettings(){
  try{
    await api('saveSettings',{items:{'Site_URL':val('setSite'),'Email_Sender_Name':val('setSender'),'Уведомления':val('setNotif')}});
    bustLocal();await fetchSnap();renderActive();toast('Настройки сохранены','ok');
  }catch(e){toast(e.message,'bad');}
}
async function installTrig(){
  try{await api('installTriggers',{});toast('Триггеры: бэкап 23:00, дайджест 09:00','ok');}catch(e){toast(e.message,'bad');}
}
async function backupNow(){
  toast('Создаю копию таблицы…','info');
  try{const r=await api('backupNow',{});window.open(r.fileUrl,'_blank');toast('Копия создана: '+r.fileName,'ok');}catch(e){toast(e.message,'bad');}
}
async function hardRefresh(){
  bustLocal();qCache.clear();
  try{await api('refresh',{});}catch(e){}
  await loadData();toast('Кэш сброшен, данные обновлены','ok');
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
    '<div class="fg wide"><label>Подписки на уведомления</label><div class="checks">'+SUBS.map(s=>'<label class="chk"><input type="checkbox" class="uSub" value="'+s+'"'+(subs.indexOf(s)>-1?' checked':'')+'><i></i><span>'+s+'</span></label>').join('')+'</div></div>'+
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
