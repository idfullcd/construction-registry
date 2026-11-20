/* Администрирование: пользователи, роли, матрица доступа, диагностика. */
const ROLE_LIST = ['Администратор','ПТО','Бухгалтерия','Прораб','Архитектор','Дизайнер','ГАП','ГИП','Тендерный_специалист','Отдел_кадров','Снабжение'];
const ROLE_MODULES = {
  'Администратор':'все разделы', 'ГИП':'все разделы (просмотр, правка, проверка)',
  'ПТО':'договоры, ИД, сметы, подачи, КС-2, доп. работы, тендеры, КП, подрядчики, планирование',
  'Бухгалтерия':'КС-2, выплаты, подрядчики, договоры, сметы, КП',
  'Прораб':'подачи объёмов, отчёты, наряды, численность, документы, материалы',
  'Архитектор':'арх. проекты, чертежи, предписания, согласования, ППР',
  'Дизайнер':'арх. проекты, чертежи, документы',
  'ГАП':'архитектура, чертежи, согласования, проверка подач',
  'Тендерный_специалист':'тендеры, КП, договоры, документы',
  'Отдел_кадров':'персонал, приказы, численность, документы',
  'Снабжение':'материалы, документы, договоры'
};
function renderAdmin(){
  if(S.user.role !== 'Администратор'){
    $('#modBody').innerHTML = '<div class="empty"><div class="empty-ico">🔒</div><h3>Раздел закрыт</h3><p>Администрирование доступно только роли «Администратор».</p></div>';
    return;
  }
  const users = S.snap.users||[];
  const byRole = {}; users.forEach(u => byRole[u['Роль']] = (byRole[u['Роль']]||0)+1);
  $('#modBody').innerHTML =
    '<div class="kpis">'+
      '<div class="kpi" style="--k:#ff6b35"><span class="kpi-l">Пользователей</span><b class="kpi-n">'+users.length+'</b><span class="kpi-s">активных учётных записей</span></div>'+
      '<div class="kpi" style="--k:#2f6df6"><span class="kpi-l">Ролей задействовано</span><b class="kpi-n">'+Object.keys(byRole).length+'</b><span class="kpi-s">из '+ROLE_LIST.length+' доступных</span></div>'+
      '<div class="kpi" style="--k:#12b886"><span class="kpi-l">Разделов</span><b class="kpi-n">'+MODULES.filter(m=>m.sheet).length+'</b><span class="kpi-s">под управлением прав</span></div>'+
      '<div class="kpi" style="--k:#7c5cff"><span class="kpi-l">Файлов</span><b class="kpi-n">'+(S.snap.attachments||[]).length+'</b><span class="kpi-s">в едином хранилище</span></div>'+
    '</div>'+
    '<section class="panel"><h3>Учётные записи</h3><div class="tw"><table class="grid"><thead><tr>'+
      '<th>Логин</th><th>ФИО</th><th>Роль</th><th>Email</th><th>Доступ</th><th class="ca"></th></tr></thead><tbody>'+
      users.map(u=>'<tr><td class="cid">'+esc(u['Логин'])+'</td>'+
        '<td><div class="who"><span class="ava">'+esc(initials(u['ФИО']))+'</span><b>'+esc(u['ФИО'])+'</b></div></td>'+
        '<td><span class="chip '+(u['Роль']==='Администратор'?'bad':'neutral')+'">'+esc(u['Роль'])+'</span></td>'+
        '<td>'+esc(u['Email']||'—')+'</td><td>'+esc(short(u['Доступ']||'По роли',28))+'</td>'+
        '<td class="ca"><div class="rowacts">'+
          '<button class="btn ghost sm" onclick="openUserForm(\''+esc(u['Логин'])+'\')">✎</button>'+
          '<button class="btn danger sm"'+(u['Логин']===S.user.login?' disabled':'')+' onclick="dropUser(\''+esc(u['Логин'])+'\')">🗑</button>'+
        '</div></td></tr>').join('')+
    '</tbody></table></div><div class="panel-foot"><button class="btn primary" onclick="openUserForm(null)">＋ Новый пользователь</button></div></section>'+
    '<section class="panel wide"><h3>Матрица доступа по ролям</h3><div class="tw"><table class="grid matrix"><thead><tr><th>Роль</th><th>Разделы</th><th>Просмотр</th><th>Создание</th><th>Правка</th><th>Удаление</th><th>Проверка</th><th>Экспорт</th></tr></thead><tbody>'+
      ROLE_LIST.map(r=>{
        const acc = ROLE_CAPS[r]||[];
        const mark = c => acc.indexOf(c)>-1 ? '<span class="yes">●</span>' : '<span class="no">·</span>';
        return '<tr><td><b>'+esc(r)+'</b></td><td class="mtxt">'+esc(ROLE_MODULES[r]||'—')+'</td>'+
          ['view','create','edit','delete','review','export'].map(c=>'<td class="mc">'+mark(c)+'</td>').join('')+'</tr>';
      }).join('')+
    '</tbody></table></div></section>'+
    '<section class="panel"><h3>Диагностика</h3><div class="diag">'+
      diagRow('API', API_URL.slice(0,64)+'…')+
      diagRow('Снимок данных', S.lastTs?new Date(S.lastTs).toLocaleString('ru-RU'):'не загружен')+
      diagRow('Кэш браузера', localStorage.getItem(APP.cacheKey)?'активен (мгновенный первый рендер)':'пуст')+
      diagRow('Сессия', S.token?'токен активен':'нет')+
      diagRow('Записей в корзине', Object.keys(S.trash).reduce((a,k)=>a+S.trash[k].length,0))+
    '</div><div class="panel-foot"><button class="btn ghost" onclick="hardRefresh()">⟳ Сбросить кэш и перезагрузить данные</button></div></section>';
}
const ROLE_CAPS = {
  'Администратор':['view','create','edit','delete','review','export'],
  'ПТО':['view','create','edit','delete','review','export'],
  'Бухгалтерия':['view','create','edit','export'],
  'Прораб':['view','create','edit','delete'],
  'Архитектор':['view','create','edit'],
  'Дизайнер':['view','create','edit'],
  'ГАП':['view','create','edit','delete','review','export'],
  'ГИП':['view','create','edit','review','export'],
  'Тендерный_специалист':['view','create','edit','delete','export'],
  'Отдел_кадров':['view','create','edit','delete'],
  'Снабжение':['view','create','edit','delete']
};
function diagRow(k,v){ return '<div class="diag-i"><span>'+esc(k)+'</span><b>'+esc(String(v))+'</b></div>'; }
async function hardRefresh(){
  localStorage.removeItem(APP.cacheKey); qCache.clear();
  try{ await api('refresh',{}); }catch(e){}
  await loadData(); toast('Кэш сброшен, данные обновлены','ok');
}
function openUserForm(login){
  const u = login ? (S.snap.users||[]).filter(x=>x['Логин']===login)[0] : null;
  $('#modalTitle').innerHTML = u ? '✎ Пользователь · '+esc(login) : '＋ Новый пользователь';
  $('#modalBody').innerHTML =
    '<form class="form" onsubmit="return false">'+
    '<div class="fg"><label>Логин <em>*</em></label><input id="uLogin" type="text" value="'+esc(u?u['Логин']:'')+'"'+(u?' readonly':'')+'></div>'+
    '<div class="fg"><label>'+(u?'Новый пароль (пусто — не менять)':'Пароль <em>*</em>')+'</label><input id="uPass" type="text" placeholder="минимум 8 символов"></div>'+
    '<div class="fg wide"><label>ФИО <em>*</em></label><input id="uFio" type="text" value="'+esc(u?u['ФИО']:'')+'"></div>'+
    '<div class="fg"><label>Роль</label><select id="uRoleSel">'+ROLE_LIST.map(r=>'<option'+(u&&u['Роль']===r?' selected':'')+'>'+esc(r)+'</option>').join('')+'</select></div>'+
    '<div class="fg"><label>Email</label><input id="uMail" type="email" value="'+esc(u?u['Email']:'')+'"></div>'+
    '<div class="fg wide"><label>Доступ (описание)</label><input id="uAcc" type="text" value="'+esc(u?u['Доступ']:'')+'" placeholder="По роли"></div>'+
    '</form><div class="rolehint" id="roleHint"></div>';
  $('#modalFoot').innerHTML = '<button class="btn ghost" onclick="closeModal()">Отмена</button><button class="btn primary" id="uSave" onclick="saveUserForm('+(u?'true':'false')+')">'+(u?'Сохранить':'Создать')+'</button>';
  const hint = () => { $('#roleHint').innerHTML = '<b>'+esc(val('uRoleSel'))+'</b> · '+esc(ROLE_MODULES[val('uRoleSel')]||'')+'<br><span>Права: '+(ROLE_CAPS[val('uRoleSel')]||[]).join(', ')+'</span>'; };
  $('#uRoleSel').onchange = hint; hint();
  $('#modal').classList.add('on'); document.body.classList.add('lock');
}
async function saveUserForm(isEdit){
  const login = val('uLogin').trim(), fio = val('uFio').trim(), pass = val('uPass');
  if(!login || !fio){ toast('Заполните логин и ФИО','warn'); return; }
  if(!isEdit && pass.length < 8){ toast('Пароль минимум 8 символов','warn'); return; }
  const btn = $('#uSave'); btn.disabled=true; btn.classList.add('busy');
  try{
    await api('saveUser',{ mode:isEdit?'edit':'create', login:login, fio:fio, password:pass, role:val('uRoleSel'), email:val('uMail'), access:val('uAcc')||'По роли' });
    closeModal(); await fetchSnap(); renderActive(); paintBadges(); toast(isEdit?'Пользователь обновлён':'Пользователь создан','ok');
  }catch(e){ toast(e.message,'bad'); }
  finally{ btn.disabled=false; btn.classList.remove('busy'); }
}
async function dropUser(login){
  if(!confirm('Удалить пользователя '+login+'?')) return;
  try{ await api('removeUser',{ login:login }); await fetchSnap(); renderActive(); paintBadges(); toast('Пользователь удалён','ok'); }
  catch(e){ toast(e.message,'bad'); }
}
