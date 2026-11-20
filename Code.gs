/* ==========================================================================
   СТРОЙРЕЕСТР · Backend v4.1
   ЗАПУСК: setupSheets() → Развернуть → Веб-приложение (Я / Все) → Новая версия
   ========================================================================== */
const SHEET_ID='1AjWdX9ezcd89CUl6xqOoJquu6jC0-jut';
const ROOT_FOLDER='1so2UcvCuLQO-Tp9ef0lNjhs5STBT7GWh';
const SITE_URL='https://idfullcd.github.io/construction-registry/';
const SALT='STROYREESTR::2026::v41';
const CACHE_KEY='snap_v41', CACHE_TTL=90;

const M={
 contracts:{s:'Договоры',id:'ID_Договора',p:'ДОГ',t:'Контрагент',st:'Действует',dt:'Дата_Договора',link:'Ссылка_на_папку'},
 documents:{s:'Документы',id:'ID_Документа',p:'ДОК',t:'Наименование',st:'Загружен',dt:'Дата'},
 submissions:{s:'Подачи_объёмов',id:'ID',p:'ПДВ',t:'ID_Позиции',st:'На_проверке',dt:'Дата_подачи'},
 ks2:{s:'КС-2',id:'ID',p:'КС2',t:'Номер_КС2',st:'В_работе',dt:'Дата_составления'},
 ks2Items:{s:'КС-2_Состав',id:'ID',p:'КПЗ',t:'Наименование',st:'Включено',mul:['Сумма','Количество','Цена']},
 additional:{s:'Дополнительные_работы',id:'ID',p:'ДР',t:'Наименование',st:'Подана',dt:'Дата_подачи',mul:['Сумма','Количество','Цена']},
 estimates:{s:'Сметы',id:'ID_Сметы',p:'СМ',t:'Название',st:'Активна'},
 estimateItems:{s:'Сметные_позиции',id:'ID_Позиции',p:'ПОЗ',t:'Наименование',st:'Не начато',mul:['Сумма','Количество','Цена'],order:'Порядок'},
 closures:{s:'Закрытия_объёмов',id:'ID',p:'ЗКР',t:'Комментарий',st:'Проведено',dt:'Дата'},
 tenders:{s:'Тендеры',id:'ID',p:'ТНД',t:'Название',st:'Подготовка',dt:'Дата_публикации'},
 kp:{s:'Коммерческие_предложения',id:'ID',p:'КП',t:'Номер_КП',st:'В_разработке',dt:'Дата'},
 contractors:{s:'Подрядчики',id:'ID',p:'ПРД',t:'Название',st:'Активен',dt:'Дата_создания'},
 contractorWorks:{s:'Работы_подрядчиков',id:'ID',p:'РПР',t:'Вид_работ',st:'В работе',mul:['Сумма_договорная','Договорной_объём','Цена_за_ед']},
 payments:{s:'Выплаты_подрядчикам',id:'ID',p:'ВПЛ',t:'Основание',st:'Проведена',dt:'Дата'},
 personnel:{s:'Персонал',id:'ID',p:'ПРС',t:'ФИО',st:'Работает',dt:'Дата_приёма'},
 personnelDocs:{s:'Документы_персонала',id:'ID',p:'ДПР',t:'Тип_документа',st:'Активен',dt:'Дата_выдачи'},
 orders:{s:'Приказы',id:'ID',p:'ПРК',t:'Номер',st:'Действует',dt:'Дата'},
 workforce:{s:'Численность',id:'ID',p:'ЧСН',t:'Профессия',st:'Учтено',dt:'Дата'},
 tasks:{s:'Задания',id:'ID',p:'ЗДЧ',t:'Тема',st:'Новое',dt:'Дата_создания'},
 ppr:{s:'Организация_работ',id:'ID',p:'ППР',t:'Название',st:'В_разработке',dt:'Дата'},
 prescriptions:{s:'Предписания',id:'ID',p:'ПРДП',t:'Номер',st:'Открыто',dt:'Дата'},
 approvals:{s:'Согласования',id:'ID',p:'СГЛ',t:'Название',st:'На_согласовании',dt:'Дата_обращения'},
 kgiop:{s:'Согласования_КГИОП',id:'ID',p:'КГП',t:'Номер_письма',st:'Подано',dt:'Дата_обращения'},
 daily:{s:'Ежедневные_отчёты',id:'ID',p:'ЕО',t:'Прораб',st:'Принят',dt:'Дата'},
 workorders:{s:'Наряды-задания',id:'ID',p:'НРД',t:'Номер',st:'Выдан',dt:'Дата'},
 materials:{s:'Материалы',id:'ID',p:'МАТ',t:'Наименование',st:'Заказан',dt:'Дата_поставки'},
 reminders:{s:'Напоминания',id:'ID',p:'НАП',t:'Объект',st:'Активно',dt:'Дата'},
 calendar:{s:'События_календаря',id:'ID',p:'СОБ',t:'Объект',st:'Запланировано',dt:'Дата'},
 architecture:{s:'Архитектурные_проекты',id:'ID_Проекта',p:'АРХ',t:'Название',st:'В_разработке',dt:'Дата_создания',link:'Ссылка_на_папку'},
 drawings:{s:'Чертежи',id:'ID_Чертежа',p:'ЧРТ',t:'Название',st:'В_работе',dt:'Дата'},
 preservation:{s:'Предметы_охраны',id:'ID',p:'ПРХ',t:'Название',st:'Удовлетворительное'},
 supervision:{s:'Авторский_надзор',id:'ID',p:'АН',t:'Описание_замечания',st:'Не_устранено',dt:'Дата'},
 objects:{s:'Справочник_Объекты',id:'ID',p:'ОБЪ',t:'Название',st:'Активен',dt:'Дата_начала'}
};

const HEADERS={
 'Договоры':['ID_Договора','ID_Объекта','Контрагент','Номер_Договора','Дата_Договора','Предмет','Сумма','Статус','Ответственный','Ссылка_на_папку','Иконка','Удалено'],
 'Документы':['ID_Документа','ID_Договора','Дата','Категория','Тип_документа','Наименование','Номер','Статус','Ответственный','Ссылка_на_файл','Примечание','FileID','Время_загрузки','Статус_согласования','Срок_действия','Объект_ответственный','Статус_оригинала','Ревизия','Удалено'],
 'Подачи_объёмов':['ID','ID_Договора','ID_Позиции','Кто_подал','Объём_подан','Дата_подачи','Статус','Кто_проверил','Дата_проверки','Комментарий_проверяющего','Скорректированный_объём','Удалено'],
 'КС-2':['ID','ID_Договора','Номер_КС2','Дата_составления','Период_работ','Общая_сумма','Статус','Подписант_от_исполнителя','Подписант_от_заказчика','Дата_подписания','Ссылка_на_файл','FileID','Удалено'],
 'КС-2_Состав':['ID','ID_КС2','ID_Позиции','Наименование','Ед_изм','Количество','Цена','Сумма','Статус','Удалено'],
 'Дополнительные_работы':['ID','ID_Договора','Наименование','Обоснование','Ед_изм','Количество','Цена','Сумма','Статус','Дата_подачи','Дата_согласования','Кто_подал','Кто_согласовал','Удалено'],
 'Сметы':['ID_Сметы','ID_Договора','Название','Общая_сумма','Статус','Удалено'],
 'Сметные_позиции':['ID_Позиции','ID_Сметы','Раздел','Номер','Наименование','Ед_изм','Количество','Цена','Сумма','Закрыто_объём','Статус','ID_Подрядчика','ID_Работы_подрядчика','Порядок','Удалено'],
 'Закрытия_объёмов':['ID','ID_Позиции','ID_Работы_подрядчика','Тип_закрытия','Кем_закрыто','Объём','Дата','Комментарий','Статус','Удалено'],
 'Тендеры':['ID','Название','Заказчик','Номер_извещения','Дата_публикации','Дата_подачи','Начальная_цена','Наша_цена','Статус','Ответственный','Примечание','Удалено'],
 'Коммерческие_предложения':['ID','ID_Договора','Номер_КП','Дата','Заказчик','Объект','Сумма','Статус','Версия','Автор','Ссылка_на_файл','FileID','Удалено'],
 'Подрядчики':['ID','Название','ИНН','Контактное_лицо','Телефон','Email','Статус','Дата_создания','Примечание','Удалено'],
 'Работы_подрядчиков':['ID','ID_Подрядчика','ID_Договора','Вид_работ','Раздел','Ед_изм','Договорной_объём','Цена_за_ед','Сумма_договорная','Закрыто_объём','Сумма_закрытая','Дата_начала','Дата_окончания','Статус','Удалено'],
 'Выплаты_подрядчикам':['ID','ID_Подрядчика','ID_Работы_подрядчика','Тип','Сумма','Дата','Основание','Комментарий','Подтверждение','Статус','Удалено'],
 'Персонал':['ID','ФИО','Должность','Табельный_номер','Дата_рождения','Паспорт','ИНН','СНИЛС','Телефон','Email','Дата_приёма','Дата_увольнения','Статус','Размер_одежды','Размер_обуви','Удалено'],
 'Документы_персонала':['ID','ID_Сотрудника','Тип_документа','Номер','Дата_выдачи','Срок_действия','Орган','Статус','Удалено'],
 'Приказы':['ID','Номер','Дата','Тип','Сотрудник','Содержание','Ссылка','FileID','Статус','Удалено'],
 'Численность':['ID','ID_Договора','Дата','Профессия','Количество','ФИО_мастера','Примечание','Статус','Удалено'],
 'Организация_работ':['ID','ID_Договора','Тип','Название','Номер','Версия','Статус','Разработал','Согласовал','Утвердил','Ссылка','FileID','Дата','Удалено'],
 'Предписания':['ID','ID_Договора','Тип','Номер','Дата','От_кого','Содержание','Срок_исполнения','Статус','Исполнитель','Дата_исполнения','Ссылка','FileID','Удалено'],
 'Согласования':['ID','ID_Договора','Тип','Название','С_кем_согласуется','Номер_письма','Дата_обращения','Дата_ответа','Статус','Результат','Ссылка','FileID','Удалено'],
 'Согласования_КГИОП':['ID','ID_Проекта','ID_Договора','Дата_обращения','Номер_письма','Описание','Статус','Дата_ответа','Результат','Примечания','Удалено'],
 'Ежедневные_отчёты':['ID','ID_Договора','Дата','Прораб','Погода','Численность','Выполнено','Простой','Проблемы','Ссылка','FileID','Статус','Удалено'],
 'Наряды-задания':['ID','ID_Договора','Номер','Дата','Бригада','Вид_работ','Объём','Выдано','Сдал','Статус','Ссылка','FileID','Удалено'],
 'Материалы':['ID','ID_Договора','Наименование','Поставщик','Количество','Ед.изм','Статус','Дата_поставки','Сертификат','Срок_сертификата','Удалено'],
 'Напоминания':['ID','Тип','Объект','Описание','Дата','Статус','Ответственный','Удалено'],
 'События_календаря':['ID','Дата','Тип','Объект','Описание','Ответственный','Статус','Удалено'],
 'Задания':['ID','От_кого','Кому','Тема','Описание','Дедлайн','Приоритет','Статус','Дата_создания','ID_Договора','Прогресс','Дата_завершения','Удалено'],
 'Задания_Ответы':['ID','ID_Задания','От_кого','Текст','Файлы','Время','Удалено'],
 'Архитектурные_проекты':['ID_Проекта','ID_Договора','Название','Тип','Автор','Дата_создания','Версия','Статус','Ссылка_на_папку','Примечание','Удалено'],
 'Чертежи':['ID_Чертежа','ID_Проекта','Шифр','Название','Масштаб','Лист','Версия','Статус','Формат','Ссылка_на_файл','FileID','Автор','Дата','Привязка_оси','Привязка_помещение','Удалено'],
 'Предметы_охраны':['ID','ID_Проекта','Название','Тип','Местоположение','Описание','Статус_сохранности','Меры_по_сохранению','Согласовано_КГИОП','Статус','Удалено'],
 'Авторский_надзор':['ID','ID_Проекта','Дата','Автор','Описание_замечания','Статус_устранения','Ответственный_исполнитель','Срок_устранения','Дата_устранения','Статус','Удалено'],
 'Справочник_Объекты':['ID','Название','Адрес','Заказчик','Тип_объекта','Статус','Дата_начала','Дата_окончания','Примечание','Удалено'],
 'Пользователи':['Логин','Пароль','ФИО','Роль','Доступ','Email','Подписки_на_уведомления','Разрешения','Удалено'],
 'Журнал_действий':['Дата','Пользователь','Действие','Объект','Детали'],
 'История_изменений':['ID','Дата','Пользователь','Действие','Сущность','ID_записи','Старые_значения','Новые_значения','Комментарий'],
 'Комментарии':['ID','Модуль','ID_Записи','Пользователь','Текст','Дата','Удалено'],
 'Файлы':['ID','Модуль','ID_Записи','Имя_файла','Ссылка','FileID','Размер','Дата','Кто_загрузил','Удалено'],
 'Настройки':['Параметр','Значение']
};

const ROLES={
 'Администратор':{m:'*',c:['view','create','edit','delete','purge','users','export','review','settings']},
 'ПТО':{m:['contracts','documents','submissions','ks2','ks2Items','additional','estimates','estimateItems','closures','tenders','kp','contractors','contractorWorks','materials','reminders','calendar','tasks','objects','ppr','prescriptions','approvals','kgiop','workorders','workforce','daily','architecture','drawings','preservation','supervision'],c:['view','create','edit','delete','export','review']},
 'Бухгалтерия':{m:['contracts','documents','ks2','ks2Items','payments','contractors','contractorWorks','closures','estimates','tenders','kp','materials','reminders','calendar','tasks'],c:['view','create','edit','export']},
 'Прораб':{m:['contracts','documents','submissions','additional','daily','workorders','workforce','tasks','reminders','calendar','materials','estimateItems','closures','supervision','personnelDocs'],c:['view','create','edit','delete']},
 'Архитектор':{m:['contracts','documents','architecture','drawings','preservation','supervision','prescriptions','approvals','kgiop','ppr','tasks','reminders','calendar'],c:['view','create','edit','delete']},
 'Дизайнер':{m:['architecture','drawings','preservation','documents','tasks','reminders','calendar'],c:['view','create','edit']},
 'ГАП':{m:['contracts','documents','architecture','drawings','preservation','supervision','approvals','kgiop','prescriptions','ppr','submissions','tasks','reminders','calendar'],c:['view','create','edit','delete','export','review']},
 'ГИП':{m:'*',c:['view','create','edit','export','review']},
 'Тендерный_специалист':{m:['tenders','kp','contracts','documents','reminders','calendar','tasks'],c:['view','create','edit','delete','export']},
 'Отдел_кадров':{m:['personnel','personnelDocs','orders','documents','tasks','reminders','calendar','workforce'],c:['view','create','edit','delete']},
 'Снабжение':{m:['materials','documents','contracts','reminders','calendar','tasks'],c:['view','create','edit','delete']}
};

function ss_(){return SpreadsheetApp.openById(SHEET_ID);}
function now_(){return Utilities.formatDate(new Date(),'GMT+3','yyyy-MM-dd HH:mm:ss');}
function today_(){return Utilities.formatDate(new Date(),'GMT+3','yyyy-MM-dd');}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
function hash_(p){return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,SALT+String(p)));}
function sheet_(n){
  const ss=ss_(); let sh=ss.getSheetByName(n);
  if(!sh){ sh=ss.insertSheet(n); const h=HEADERS[n]||['ID','Название','Статус','Удалено'];
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground('#16202f').setFontColor('#ffffff'); sh.setFrozenRows(1); }
  return sh;
}
function headers_(sh){return sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getValues()[0].map(String);}
function ensureCols_(sh,names){
  const h=headers_(sh), add=names.filter(n=>h.indexOf(n)===-1);
  if(add.length) sh.getRange(1,h.length+1,1,add.length).setValues([add]).setFontWeight('bold');
  return headers_(sh);
}
function read_(n){
  const sh=ss_().getSheetByName(n); if(!sh||sh.getLastRow()<2) return [];
  const v=sh.getDataRange().getValues(), h=v[0].map(String), out=[];
  for(let i=1;i<v.length;i++){ const o={}; let blank=true;
    for(let j=0;j<h.length;j++){ if(h[j]){ o[h[j]]=v[i][j]; if(v[i][j]!==''&&v[i][j]!==null) blank=false; } }
    if(!blank){ o.__row=i+1; out.push(o); } }
  return out;
}
function alive_(r){return !(r['Удалено']===true||String(r['Удалено']).toUpperCase()==='TRUE');}
function nextId_(sh,idf,p){
  let max=0; read_(sh.getName()).forEach(r=>{const m=String(r[idf]||'').match(/(\d+)\s*$/); if(m) max=Math.max(max,parseInt(m[1],10));});
  return p+'-'+String(max+1).padStart(4,'0');
}
function append_(n,obj){ const sh=sheet_(n), h=ensureCols_(sh,Object.keys(obj)); sh.appendRow(h.map(k=>obj[k]===undefined?'':obj[k])); return sh.getLastRow(); }
function findRow_(n,idf,id){ const sh=sheet_(n), rows=read_(n);
  for(let i=0;i<rows.length;i++) if(String(rows[i][idf])===String(id)) return {sh:sh,row:rows[i]}; return null; }
function audit_(u,a,o,d,ov,nv,e){
  try{ append_('Журнал_действий',{'Дата':now_(),'Пользователь':u||'system','Действие':a,'Объект':o,'Детали':d||''});
    if(ov||nv){ const sh=sheet_('История_изменений');
      append_('История_изменений',{'ID':nextId_(sh,'ID','ИСТ'),'Дата':now_(),'Пользователь':u||'system','Действие':a,'Сущность':e||'','ID_записи':o,
        'Старые_значения':ov?JSON.stringify(ov):'','Новые_значения':nv?JSON.stringify(nv):'','Комментарий':d||''}); } }catch(x){}
}
function bust_(){try{CacheService.getScriptCache().remove(CACHE_KEY);}catch(e){}}

function token_(l){const t=Utilities.getUuid().replace(/-/g,'');CacheService.getScriptCache().put('tok_'+t,l,21600);return t;}
function userByLogin_(l){const r=read_('Пользователи');for(let i=0;i<r.length;i++) if(String(r[i]['Логин']).trim()===String(l).trim()&&alive_(r[i])) return r[i];return null;}
function profile_(u){
  const role=String(u['Роль']||'Прораб'), acc=ROLES[role]||ROLES['Прораб'];
  let perms=[]; try{perms=JSON.parse(u['Разрешения']||'[]');}catch(e){}
  if(perms.indexOf('*')>-1) return {login:u['Логин'],fio:u['ФИО'],role:role,email:u['Email']||'',subs:u['Подписки_на_уведомления']||'',modules:'*',can:ROLES['Администратор'].c};
  return {login:u['Логин'],fio:u['ФИО'],role:role,email:u['Email']||'',subs:u['Подписки_на_уведомления']||'',modules:acc.m,can:acc.c};
}
function auth_(d){
  const t=d&&d.token; if(!t) throw new Error('Нет сессии. Войдите заново.');
  const l=CacheService.getScriptCache().get('tok_'+t); if(!l) throw new Error('Сессия истекла. Войдите заново.');
  const u=userByLogin_(l); if(!u) throw new Error('Пользователь не найден'); return profile_(u);
}
function allow_(u,m,c){ if(u.can.indexOf(c)===-1) throw new Error('Недостаточно прав: '+c);
  if(u.modules==='*') return true; if(m&&u.modules.indexOf(m)===-1) throw new Error('Раздел недоступен для роли '+u.role); return true; }
function handleLogin_(d){
  const c=CacheService.getScriptCache(), k='rl_'+String(d.login||''), n=parseInt(c.get(k)||'0',10);
  if(n>=6) return {success:false,error:'Слишком много попыток. Подождите 60 секунд.'};
  const u=userByLogin_(d.login), st=u?String(u['Пароль']):'';
  const ok=u&&(st.length>=40?st===hash_(d.password):st===String(d.password));
  if(!ok){c.put(k,String(n+1),60);return {success:false,error:'Неверный логин или пароль'};}
  c.remove(k);
  if(st.length<40){const sh=sheet_('Пользователи');sh.getRange(u.__row,headers_(sh).indexOf('Пароль')+1).setValue(hash_(d.password));}
  audit_(u['Логин'],'Вход','Система',''); bust_();
  return {success:true,user:profile_(u),token:token_(u['Логин'])};
}

function buildSnapshot_(user){
  const data={},trash={};
  Object.keys(M).forEach(k=>{
    if(user.modules!=='*'&&user.modules.indexOf(k)===-1){data[k]=[];return;}
    const cfg=M[k], rows=read_(cfg.s);
    data[k]=rows.filter(alive_).map(r=>{delete r.__row;return r;});
    const del=rows.filter(r=>!alive_(r)).map(r=>({id:r[cfg.id],title:String(r[cfg.t]||r[cfg.id]),module:k}));
    if(del.length) trash[k]=del;
  });
  data.attachments=read_('Файлы').filter(alive_).map(r=>{delete r.__row;return r;});
  data.comments=read_('Комментарии').filter(alive_).map(r=>{delete r.__row;return r;});
  data.taskReplies=read_('Задания_Ответы').filter(alive_).map(r=>{delete r.__row;return r;});
  data.users=(user.can.indexOf('users')>-1)?read_('Пользователи').filter(alive_).map(u=>({Логин:u['Логин'],ФИО:u['ФИО'],Роль:u['Роль'],Email:u['Email']||'',Доступ:u['Доступ']||'',Подписки:u['Подписки_на_уведомления']||''})):[];
  data.actions=read_('Журнал_действий').slice(-300).reverse();
  data.history=read_('История_изменений').slice(-200).reverse();
  data.settings=read_('Настройки');
  const counts={}; Object.keys(M).forEach(k=>counts[k]=data[k].length);
  return {ok:true,ts:now_(),data:data,trash:trash,counts:counts};
}
function doGet(e){
  try{
    const p=(e&&e.parameter)||{};
    if(p.type==='ping') return json_({ok:true,ts:now_()});
    if(!p.token) return json_({ok:false,error:'Требуется авторизация'});
    const l=CacheService.getScriptCache().get('tok_'+p.token);
    if(!l) return json_({ok:false,error:'Сессия истекла'});
    const u=userByLogin_(l); if(!u) return json_({ok:false,error:'Пользователь не найден'});
    return json_(buildSnapshot_(profile_(u)));
  }catch(err){return json_({ok:false,error:String(err&&err.message||err)});}
}

function createRecord_(d,user){
  const cfg=M[d.module]; if(!cfg) throw new Error('Неизвестный раздел'); allow_(user,d.module,'create');
  const sh=sheet_(cfg.s), allowed=headers_(sh), v=d.values||{}, obj={};
  Object.keys(v).forEach(k=>{ if(allowed.indexOf(k)>-1&&k!==cfg.id&&k!=='Удалено') obj[k]=v[k]; });
  obj[cfg.id]=nextId_(sh,cfg.id,cfg.p);
  if(allowed.indexOf('Статус')>-1&&!obj['Статус']) obj['Статус']=cfg.st;
  if(cfg.dt&&allowed.indexOf(cfg.dt)>-1&&!obj[cfg.dt]) obj[cfg.dt]=today_();
  if(cfg.mul) obj[cfg.mul[0]]=(parseFloat(obj[cfg.mul[1]])||0)*(parseFloat(obj[cfg.mul[2]])||0);
  if(cfg.order&&!obj[cfg.order]) obj[cfg.order]=read_(cfg.s).length+1;
  if(allowed.indexOf('Удалено')>-1) obj['Удалено']=false;
  if(d.module==='tasks'){obj['От_кого']=user.login;obj['Прогресс']=obj['Прогресс']||0;}
  if(d.module==='submissions') obj['Кто_подал']=user.login;
  if(d.module==='closures') obj['Кем_закрыто']=user.login;
  if(d.module==='supervision'&&!obj['Автор']) obj['Автор']=user.fio;
  if(d.module==='documents'){obj['Ответственный']=user.login;obj['Время_загрузки']=now_();obj['Ревизия']=1;obj['Статус_оригинала']=obj['Статус_оригинала']||'Только скан';}
  if(cfg.link&&!obj[cfg.link]) obj[cfg.link]=makeFolder_(d.module,obj[cfg.id],obj[cfg.t]||'');
  append_(cfg.s,obj);
  if(d.module==='closures') applyClosure_(obj);
  if(d.module==='supervision'&&obj['Ответственный_исполнитель']){
    const t=sheet_('Задания');
    append_('Задания',{'ID':nextId_(t,'ID','ЗДЧ'),'От_кого':user.login,'Кому':obj['Ответственный_исполнитель'],
      'Тема':'Авторский надзор: '+String(obj['Описание_замечания']||'').slice(0,60),'Описание':obj['Описание_замечания']||'',
      'Дедлайн':obj['Срок_устранения']||'','Приоритет':'Высокий','Статус':'Новое','Дата_создания':now_(),'Прогресс':0,'Удалено':false});
  }
  audit_(user.login,'Создание',obj[cfg.id],'',null,obj,cfg.s); bust_();
  return {success:true,id:obj[cfg.id],record:obj};
}
function applyClosure_(obj){
  const vol=parseFloat(obj['Объём'])||0; if(!vol) return;
  if(obj['ID_Позиции']){
    const f=findRow_('Сметные_позиции','ID_Позиции',obj['ID_Позиции']);
    if(f){ const h=headers_(f.sh), tot=parseFloat(f.row['Количество'])||0, cl=parseFloat(f.row['Закрыто_объём'])||0, nc=Math.min(tot,cl+vol);
      f.sh.getRange(f.row.__row,h.indexOf('Закрыто_объём')+1).setValue(nc);
      f.sh.getRange(f.row.__row,h.indexOf('Статус')+1).setValue(nc>=tot?'Закрыто':(nc>0?'В работе':'Не начато')); }
  }
  if(obj['ID_Работы_подрядчика']){
    const f=findRow_('Работы_подрядчиков','ID',obj['ID_Работы_подрядчика']);
    if(f){ const h=headers_(f.sh), tot=parseFloat(f.row['Договорной_объём'])||0, cl=parseFloat(f.row['Закрыто_объём'])||0,
      pr=parseFloat(f.row['Цена_за_ед'])||0, nc=Math.min(tot,cl+vol);
      f.sh.getRange(f.row.__row,h.indexOf('Закрыто_объём')+1).setValue(nc);
      f.sh.getRange(f.row.__row,h.indexOf('Сумма_закрытая')+1).setValue(nc*pr);
      f.sh.getRange(f.row.__row,h.indexOf('Статус')+1).setValue(nc>=tot?'Завершено':'В работе'); }
  }
}
function updateRecord_(d,user){
  const cfg=M[d.module]; if(!cfg) throw new Error('Неизвестный раздел'); allow_(user,d.module,'edit');
  const f=findRow_(cfg.s,cfg.id,d.id); if(!f) throw new Error('Запись не найдена');
  const h=headers_(f.sh), v=d.values||{}, old={}, nw={};
  if(cfg.mul&&(v[cfg.mul[1]]!==undefined||v[cfg.mul[2]]!==undefined)){
    const q=v[cfg.mul[1]]!==undefined?v[cfg.mul[1]]:f.row[cfg.mul[1]], p=v[cfg.mul[2]]!==undefined?v[cfg.mul[2]]:f.row[cfg.mul[2]];
    v[cfg.mul[0]]=(parseFloat(q)||0)*(parseFloat(p)||0);
  }
  Object.keys(v).forEach(k=>{ const i=h.indexOf(k);
    if(i===-1||k===cfg.id||k==='Удалено'||k==='__row') return;
    if(String(f.row[k])!==String(v[k])){old[k]=f.row[k];nw[k]=v[k];f.sh.getRange(f.row.__row,i+1).setValue(v[k]);} });
  if(d.module==='tasks'&&v['Статус']==='Выполнено'){const i=h.indexOf('Дата_завершения');if(i>-1)f.sh.getRange(f.row.__row,i+1).setValue(now_());}
  if(d.module==='supervision'&&v['Статус_устранения']==='Устранено'){const i=h.indexOf('Дата_устранения');if(i>-1)f.sh.getRange(f.row.__row,i+1).setValue(today_());}
  if(d.module==='prescriptions'&&v['Статус']==='Исполнено'){const i=h.indexOf('Дата_исполнения');if(i>-1)f.sh.getRange(f.row.__row,i+1).setValue(today_());}
  if(Object.keys(nw).length) audit_(user.login,'Изменение',d.id,'',old,nw,cfg.s);
  bust_(); const fr=findRow_(cfg.s,cfg.id,d.id), rec=fr?fr.row:{}; delete rec.__row;
  return {success:true,id:d.id,record:rec,changed:Object.keys(nw).length};
}
function setDeleted_(d,user,flag,cap){
  const cfg=M[d.module]; if(!cfg) throw new Error('Неизвестный раздел'); allow_(user,d.module,cap);
  const sh=sheet_(cfg.s), h=ensureCols_(sh,['Удалено']), di=h.indexOf('Удалено');
  const ids=(d.ids||[]).map(String); let n=0;
  read_(cfg.s).forEach(r=>{ if(ids.indexOf(String(r[cfg.id]))>-1){ sh.getRange(r.__row,di+1).setValue(flag); n++; } });
  audit_(user.login,flag?'Удаление в корзину':'Восстановление',ids.join(', '),'Записей: '+n,null,null,cfg.s);
  bust_(); return {success:true,count:n,ids:ids};
}
function purge_(d,user){
  const cfg=M[d.module]; allow_(user,d.module,'purge');
  const sh=sheet_(cfg.s), rows=read_(cfg.s), ids=(d.ids||[]).map(String);
  for(let i=rows.length-1;i>=0;i--) if(ids.indexOf(String(rows[i][cfg.id]))>-1) sh.deleteRow(rows[i].__row);
  audit_(user.login,'Удаление навсегда',ids.join(', '),'',null,null,cfg.s); bust_();
  return {success:true,count:ids.length,ids:ids};
}
function reorder_(d,user){
  const cfg=M[d.module]; if(!cfg||!cfg.order) throw new Error('Раздел не поддерживает порядок'); allow_(user,d.module,'edit');
  const sh=sheet_(cfg.s), h=ensureCols_(sh,[cfg.order]), oi=h.indexOf(cfg.order), ids=d.ids||[];
  const rows=read_(cfg.s), map={}; rows.forEach(r=>map[String(r[cfg.id])]=r.__row);
  ids.forEach((id,i)=>{ const rn=map[String(id)]; if(rn) sh.getRange(rn,oi+1).setValue(i+1); });
  audit_(user.login,'Изменение порядка',cfg.s,'Позиций: '+ids.length); bust_();
  return {success:true,count:ids.length};
}

function folder_(path){ let f=DriveApp.getFolderById(ROOT_FOLDER);
  path.split('/').filter(Boolean).forEach(p=>{const it=f.getFoldersByName(p);f=it.hasNext()?it.next():f.createFolder(p);}); return f; }
function makeFolder_(mod,id,title){
  try{ const clean=String(title||'').replace(/[\\/:*?"<>|]/g,'_').slice(0,60);
    const f=folder_('_Разделы/'+mod+'/'+id+(clean?'_'+clean:''));
    if(mod==='contracts') ['01_Договорные','02_Исполнительная','03_Материалы','04_Финансы','05_Переписка','06_Доп_работы','07_Отчёты'].forEach(n=>f.createFolder(n));
    if(mod==='architecture') ['01_Чертежи','02_Предметы_охраны','03_Согласования','04_Фотофиксация','05_Версии'].forEach(n=>f.createFolder(n));
    return f.getUrl(); }catch(e){return '';}
}
function attachFiles_(d,user){
  const cfg=M[d.module]; if(!cfg) throw new Error('Неизвестный раздел'); allow_(user,d.module,'edit');
  const f=folder_('_Файлы/'+d.module+'/'+d.recordId), sh=sheet_('Файлы'), out=[];
  (d.files||[]).forEach(file=>{
    const blob=Utilities.newBlob(Utilities.base64Decode(file.fileData),file.mimeType||'application/octet-stream',file.fileName);
    const up=f.createFile(blob); up.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
    const rec={'ID':nextId_(sh,'ID','ФЛ'),'Модуль':d.module,'ID_Записи':String(d.recordId),'Имя_файла':file.fileName,
      'Ссылка':up.getUrl(),'FileID':up.getId(),'Размер':blob.getBytes().length,'Дата':now_(),'Кто_загрузил':user.login,'Удалено':false};
    append_('Файлы',rec); out.push(rec);
  });
  audit_(user.login,'Загрузка файлов',d.recordId,'Файлов: '+out.length,null,null,cfg.s); bust_();
  return {success:true,attachments:out};
}
function deleteAttachment_(d,user){
  const f=findRow_('Файлы','ID',d.id); if(!f) throw new Error('Файл не найден');
  allow_(user,String(f.row['Модуль']),'edit');
  f.sh.getRange(f.row.__row,headers_(f.sh).indexOf('Удалено')+1).setValue(true);
  try{DriveApp.getFileById(f.row['FileID']).setTrashed(true);}catch(e){}
  audit_(user.login,'Удаление файла',d.id,String(f.row['Имя_файла'])); bust_();
  return {success:true,id:d.id};
}
function addComment_(d,user){
  allow_(user,d.module,'view');
  const sh=sheet_('Комментарии');
  const rec={'ID':nextId_(sh,'ID','КОМ'),'Модуль':d.module,'ID_Записи':String(d.recordId),'Пользователь':user.fio||user.login,
    'Текст':String(d.text||'').slice(0,4000),'Дата':now_(),'Удалено':false};
  if(!rec['Текст']) throw new Error('Пустой комментарий');
  append_('Комментарии',rec); audit_(user.login,'Комментарий',d.recordId,rec['Текст'].slice(0,80)); bust_();
  return {success:true,comment:rec};
}
function addTaskReply_(d,user){
  allow_(user,'tasks','view');
  const sh=sheet_('Задания_Ответы');
  const rec={'ID':nextId_(sh,'ID','ОТВ'),'ID_Задания':String(d.taskId),'От_кого':user.login,'Текст':String(d.text||'').slice(0,4000),
    'Файлы':'[]','Время':now_(),'Удалено':false};
  if(!rec['Текст']) throw new Error('Пустой ответ');
  append_('Задания_Ответы',rec);
  const f=findRow_('Задания','ID',d.taskId);
  if(f){const h=headers_(f.sh);f.sh.getRange(f.row.__row,h.indexOf('Статус')+1).setValue('В работе');}
  audit_(user.login,'Ответ на задание',d.taskId,rec['Текст'].slice(0,80)); bust_();
  return {success:true,reply:rec};
}

function reviewSubmission_(d,user){
  allow_(user,'submissions','review');
  const f=findRow_('Подачи_объёмов','ID',d.id); if(!f) throw new Error('Подача не найдена');
  if(String(f.row['Статус'])!=='На_проверке') throw new Error('Подача уже обработана');
  const h=headers_(f.sh), sub=parseFloat(f.row['Объём_подан'])||0;
  const app=d.status==='Отклонено'?0:(parseFloat(d.volume)||sub);
  const set=(k,v)=>{const i=h.indexOf(k);if(i>-1)f.sh.getRange(f.row.__row,i+1).setValue(v);};
  set('Статус',d.status);set('Кто_проверил',user.fio||user.login);set('Дата_проверки',now_());
  set('Комментарий_проверяющего',d.comment||'');set('Скорректированный_объём',app);
  if(app>0) applyClosure_({'ID_Позиции':f.row['ID_Позиции'],'Объём':app});
  audit_(user.login,'Проверка подачи',d.id,d.status+' · '+app); bust_();
  return {success:true,id:d.id,approved:app};
}
function progress_(d){
  const cid=String(d.contractId);
  const est=read_('Сметы').filter(e=>alive_(e)&&String(e['ID_Договора'])===cid).map(e=>String(e['ID_Сметы']));
  const pos=read_('Сметные_позиции').filter(p=>alive_(p)&&est.indexOf(String(p['ID_Сметы']))>-1)
    .sort((a,b)=>(parseFloat(a['Порядок'])||999)-(parseFloat(b['Порядок'])||999));
  const subs=read_('Подачи_объёмов').filter(s=>alive_(s)&&String(s['ID_Договора'])===cid);
  const ks2=read_('КС-2').filter(k=>alive_(k)&&String(k['ID_Договора'])===cid);
  const kids=ks2.map(k=>String(k['ID']));
  const ki=read_('КС-2_Состав').filter(i=>alive_(i)&&kids.indexOf(String(i['ID_КС2']))>-1);
  const rows=pos.map(p=>{
    const pid=String(p['ID_Позиции']), total=parseFloat(p['Количество'])||0, price=parseFloat(p['Цена'])||0;
    const done=subs.filter(s=>String(s['ID_Позиции'])===pid&&['Подтверждено','Отредактировано'].indexOf(String(s['Статус']))>-1)
      .reduce((a,s)=>a+(parseFloat(s['Скорректированный_объём'])||parseFloat(s['Объём_подан'])||0),0);
    const rev=subs.filter(s=>String(s['ID_Позиции'])===pid&&String(s['Статус'])==='На_проверке')
      .reduce((a,s)=>a+(parseFloat(s['Объём_подан'])||0),0);
    const billed=ki.filter(i=>String(i['ID_Позиции'])===pid).reduce((a,i)=>a+(parseFloat(i['Количество'])||0),0);
    return {id:pid,name:p['Наименование'],unit:p['Ед_изм'],section:p['Раздел'],total:total,done:done,review:rev,
      rest:Math.max(0,total-done-rev),billed:billed,unbilled:Math.max(0,total-billed),
      amount:total*price,doneAmount:done*price,billedAmount:billed*price};
  });
  const sum=k=>rows.reduce((a,r)=>a+r[k],0);
  return {success:true,positions:rows,ks2:ks2.map(k=>({id:k['ID'],number:k['Номер_КС2'],date:k['Дата_составления'],amount:k['Общая_сумма'],status:k['Статус']})),
    summary:{total:sum('total'),done:sum('done'),review:sum('review'),rest:sum('rest'),billed:sum('billed'),unbilled:sum('unbilled'),
      amount:sum('amount'),doneAmount:sum('doneAmount'),billedAmount:sum('billedAmount'),ks2Count:ks2.length}};
}
function contractorSummary_(d){
  const c=findRow_('Подрядчики','ID',d.contractorId); if(!c) throw new Error('Подрядчик не найден');
  const works=read_('Работы_подрядчиков').filter(w=>alive_(w)&&String(w['ID_Подрядчика'])===String(d.contractorId));
  const pays=read_('Выплаты_подрядчикам').filter(p=>alive_(p)&&String(p['ID_Подрядчика'])===String(d.contractorId));
  const clo=read_('Закрытия_объёмов').filter(x=>alive_(x));
  const wd=works.map(w=>{
    const wp=pays.filter(p=>String(p['ID_Работы_подрядчика'])===String(w['ID']));
    const adv=wp.filter(p=>String(p['Тип'])==='Аванс').reduce((a,p)=>a+(parseFloat(p['Сумма'])||0),0);
    const ret=wp.filter(p=>String(p['Тип'])==='Возврат').reduce((a,p)=>a+(parseFloat(p['Сумма'])||0),0);
    const paid=wp.reduce((a,p)=>a+(parseFloat(p['Сумма'])||0)*(String(p['Тип'])==='Возврат'?-1:1),0);
    const cl=parseFloat(w['Сумма_закрытая'])||0;
    const rec={}; Object.keys(w).forEach(k=>{if(k!=='__row')rec[k]=w[k];});
    rec.advances=adv;rec.returns=ret;rec.paid=paid;rec.balance=cl-paid;
    rec.closures=clo.filter(x=>String(x['ID_Работы_подрядчика'])===String(w['ID'])).map(x=>{const o={};Object.keys(x).forEach(k=>{if(k!=='__row')o[k]=x[k];});return o;});
    rec.payments=wp.map(x=>{const o={};Object.keys(x).forEach(k=>{if(k!=='__row')o[k]=x[k];});return o;});
    return rec;
  });
  const contract=c.row; delete contract.__row;
  const tC=wd.reduce((a,w)=>a+(parseFloat(w['Сумма_договорная'])||0),0);
  const tCl=wd.reduce((a,w)=>a+(parseFloat(w['Сумма_закрытая'])||0),0);
  const tP=wd.reduce((a,w)=>a+w.paid,0);
  return {success:true,contractor:contract,works:wd,summary:{totalContract:tC,totalClosed:tCl,totalAdvances:wd.reduce((a,w)=>a+w.advances,0),totalPaid:tP,totalBalance:tCl-tP}};
}

function saveUser_(d,user){
  allow_(user,null,'users');
  const sh=sheet_('Пользователи'), h=headers_(sh);
  const ex=read_('Пользователи').filter(r=>String(r['Логин'])===String(d.login))[0];
  if(d.mode==='create'&&ex) throw new Error('Логин уже занят');
  const role=ROLES[d.role]?d.role:'Прораб';
  if(ex){ const set=(k,v)=>{const i=h.indexOf(k);if(i>-1&&v!==undefined&&v!=='')sh.getRange(ex.__row,i+1).setValue(v);};
    set('ФИО',d.fio);set('Роль',role);set('Email',d.email);set('Доступ',d.access);set('Подписки_на_уведомления',d.subs);
    if(d.password) sh.getRange(ex.__row,h.indexOf('Пароль')+1).setValue(hash_(d.password));
    audit_(user.login,'Изменение пользователя',d.login,role);
  } else {
    append_('Пользователи',{'Логин':d.login,'Пароль':hash_(d.password||'12345678'),'ФИО':d.fio,'Роль':role,'Доступ':d.access||'По роли',
      'Email':d.email||'','Подписки_на_уведомления':d.subs||'Документы,Замечания,Напоминания,Сроки',
      'Разрешения':JSON.stringify(ROLES[role].m==='*'?['*']:ROLES[role].m),'Удалено':false});
    audit_(user.login,'Создание пользователя',d.login,role);
  }
  bust_(); return {success:true};
}
function removeUser_(d,user){
  allow_(user,null,'users');
  if(String(d.login)===String(user.login)) throw new Error('Нельзя удалить себя');
  const f=findRow_('Пользователи','Логин',d.login); if(!f) throw new Error('Не найден');
  const admins=read_('Пользователи').filter(r=>alive_(r)&&String(r['Роль'])==='Администратор');
  if(admins.length<=1&&String(f.row['Роль'])==='Администратор') throw new Error('Нельзя удалить последнего администратора');
  f.sh.getRange(f.row.__row,headers_(f.sh).indexOf('Удалено')+1).setValue(true);
  audit_(user.login,'Удаление пользователя',d.login,''); bust_(); return {success:true};
}
function saveSettings_(d,user){
  allow_(user,null,'settings');
  const sh=sheet_('Настройки'), rows=read_('Настройки'), h=headers_(sh);
  Object.keys(d.items||{}).forEach(k=>{
    const ex=rows.filter(r=>String(r['Параметр'])===k)[0];
    if(ex) sh.getRange(ex.__row,h.indexOf('Значение')+1).setValue(d.items[k]);
    else append_('Настройки',{'Параметр':k,'Значение':d.items[k]});
  });
  audit_(user.login,'Настройки','Система',Object.keys(d.items||{}).join(', ')); bust_();
  return {success:true};
}
function saveMyEmail_(d,user){
  const f=findRow_('Пользователи','Логин',user.login); if(!f) throw new Error('Профиль не найден');
  const h=headers_(f.sh);
  f.sh.getRange(f.row.__row,h.indexOf('Email')+1).setValue(d.email||'');
  f.sh.getRange(f.row.__row,h.indexOf('Подписки_на_уведомления')+1).setValue(d.subs||'');
  bust_(); return {success:true};
}
function testEmail_(d,user){
  if(!d.email) throw new Error('Укажите email');
  MailApp.sendEmail(d.email,'СтройРеестр · проверка почты','',
    {htmlBody:'<div style="font-family:Arial;padding:18px;background:#f2f5f9"><h2 style="color:#ff6b35">🏗️ СтройРеестр</h2><p>Почта подключена корректно. Уведомления будут приходить на этот адрес.</p><p style="color:#7b8ea6">'+now_()+'</p><a href="'+SITE_URL+'" style="background:#ff6b35;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Открыть систему</a></div>',name:'СтройРеестр'});
  return {success:true};
}
function backupNow_(d,user){
  allow_(user,null,'settings');
  const f=folder_('_Бэкапы'), name='СтройРеестр_'+Utilities.formatDate(new Date(),'GMT+3','yyyyMMdd_HHmm');
  const copy=DriveApp.getFileById(SHEET_ID).makeCopy(name,f);
  audit_(user.login,'Резервная копия',name,'');
  return {success:true,fileUrl:copy.getUrl(),fileName:name};
}
function installTriggers_(d,user){ allow_(user,null,'settings'); createTriggers(); return {success:true}; }

function exportFile_(d,user){
  allow_(user,d.module,'export');
  const cfg=M[d.module], rows=read_(cfg.s).filter(alive_);
  if(!rows.length) throw new Error('Нет данных для экспорта');
  const h=headers_(sheet_(cfg.s)).filter(x=>x&&x!=='Удалено');
  const cell=v=>String(v===undefined||v===null?'':v instanceof Date?Utilities.formatDate(v,'GMT+3','yyyy-MM-dd'):v);
  let url,name;
  if(d.format==='xls'){
    let html='<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>'+
      h.map(k=>'<th style="background:#16202f;color:#fff">'+k+'</th>').join('')+'</tr></thead><tbody>';
    rows.forEach(r=>{html+='<tr>'+h.map(k=>'<td>'+cell(r[k]).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</td>').join('')+'</tr>';});
    html+='</tbody></table></body></html>';
    name=cfg.s+'_'+Utilities.formatDate(new Date(),'GMT+3','yyyyMMdd_HHmm')+'.xls';
    const f=folder_('_Экспорт').createFile(name,html,'application/vnd.ms-excel');
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW); url=f.getUrl();
  } else {
    const esc=v=>{const s=cell(v);return /[";\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
    let csv='\uFEFF'+h.join(';')+'\n'; rows.forEach(r=>{csv+=h.map(k=>esc(r[k])).join(';')+'\n';});
    name=cfg.s+'_'+Utilities.formatDate(new Date(),'GMT+3','yyyyMMdd_HHmm')+'.csv';
    const f=folder_('_Экспорт').createFile(name,csv,'text/csv');
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW); url=f.getUrl();
  }
  audit_(user.login,'Экспорт',cfg.s,'Строк: '+rows.length+' · '+d.format);
  return {success:true,fileUrl:url,fileName:name};
}
function inventory_(d,user){
  allow_(user,d.module,'export');
  const c=findRow_('Договоры','ID_Договора',d.contractId); if(!c) throw new Error('Договор не найден');
  const docs=read_('Документы').filter(x=>alive_(x)&&String(x['ID_Договора'])===String(d.contractId));
  const doc=DocumentApp.create('Опись_'+d.contractId+'_'+Date.now()), b=doc.getBody();
  b.appendParagraph('ОПИСЬ ДОКУМЕНТОВ').setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  b.appendParagraph('Договор №'+c.row['Номер_Договора']+' от '+Utilities.formatDate(new Date(c.row['Дата_Договора']),'GMT+3','dd.MM.yyyy')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  b.appendParagraph(c.row['Контрагент']).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  b.appendParagraph(''); b.appendParagraph('Объект: '+c.row['Предмет']).setBold(true);
  b.appendParagraph('Дата составления: '+Utilities.formatDate(new Date(),'GMT+3','dd.MM.yyyy')+' · Всего документов: '+docs.length);
  const groups={}; docs.forEach(x=>{const k=x['Категория']||'Другое';(groups[k]=groups[k]||[]).push(x);});
  let n=1;
  Object.keys(groups).forEach(k=>{
    b.appendParagraph(k.toUpperCase()+' ('+groups[k].length+')').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    const t=b.appendTable(), hr=t.appendTableRow();
    ['№','Дата','Тип','Номер','Наименование','Согласование','Оригинал'].forEach(x=>hr.appendTableCell(x).setBackgroundColor('#dddddd'));
    groups[k].forEach(x=>{const r=t.appendTableRow();
      [String(n++),Utilities.formatDate(new Date(x['Дата']),'GMT+3','dd.MM.yyyy'),x['Тип_документа'],x['Номер'],x['Наименование'],x['Статус_согласования'],x['Статус_оригинала']]
        .forEach(v=>r.appendTableCell(String(v||'')));});
  });
  b.appendParagraph(''); b.appendParagraph('Сдал: ______________ / ______________');
  b.appendParagraph('Принял: ______________ / ______________');
  doc.saveAndClose();
  const pdf=DriveApp.getFileById(doc.getId()).getAs('application/pdf');
  const name='Опись_'+d.contractId+'_'+Utilities.formatDate(new Date(),'GMT+3','yyyyMMdd')+'.pdf';
  const out=folder_('_Описи').createFile(pdf.setName(name));
  out.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  DriveApp.getFileById(doc.getId()).setTrashed(true);
  audit_(user.login,'Опись документов',d.contractId,name);
  return {success:true,fileUrl:out.getUrl(),fileName:name};
}

function doPost(e){
  try{
    const d=JSON.parse(e.postData.contents), a=d.action;
    if(a==='login') return json_(handleLogin_(d));
    if(a==='ping') return json_({success:true,ts:now_()});
    const user=auth_(d); let r;
    switch(a){
      case 'createRecord':r=createRecord_(d,user);break;
      case 'updateRecord':r=updateRecord_(d,user);break;
      case 'deleteRecords':r=setDeleted_(d,user,true,'delete');break;
      case 'restoreRecords':r=setDeleted_(d,user,false,'delete');break;
      case 'purgeRecords':r=purge_(d,user);break;
      case 'reorder':r=reorder_(d,user);break;
      case 'attachFiles':r=attachFiles_(d,user);break;
      case 'deleteAttachment':r=deleteAttachment_(d,user);break;
      case 'addComment':r=addComment_(d,user);break;
      case 'addTaskReply':r=addTaskReply_(d,user);break;
      case 'reviewSubmission':r=reviewSubmission_(d,user);break;
      case 'progress':r=progress_(d);break;
      case 'contractorSummary':r=contractorSummary_(d);break;
      case 'saveUser':r=saveUser_(d,user);break;
      case 'removeUser':r=removeUser_(d,user);break;
      case 'saveSettings':r=saveSettings_(d,user);break;
      case 'saveMyEmail':r=saveMyEmail_(d,user);break;
      case 'testEmail':r=testEmail_(d,user);break;
      case 'backupNow':r=backupNow_(d,user);break;
      case 'installTriggers':r=installTriggers_(d,user);break;
      case 'exportFile':r=exportFile_(d,user);break;
      case 'inventory':r=inventory_(d,user);break;
      case 'refresh':bust_();r={success:true};break;
      default:r={success:false,error:'Неизвестное действие: '+a};
    }
    return json_(r);
  }catch(err){return json_({success:false,error:String(err&&err.message||err)});}
}

function setupSheets(){
  Object.keys(HEADERS).forEach(n=>ensureCols_(sheet_(n),HEADERS[n]));
  const users=read_('Пользователи');
  if(!users.length){
    append_('Пользователи',{'Логин':'admin','Пароль':hash_('admin123'),'ФИО':'Орлов К.И.','Роль':'Администратор','Доступ':'Полный',
      'Email':'','Подписки_на_уведомления':'Документы,Замечания,Напоминания,Сроки','Разрешения':'["*"]','Удалено':false});
  } else {
    const sh=sheet_('Пользователи'),h=headers_(sh);
    users.forEach(u=>{if(String(u['Пароль']).length<40)sh.getRange(u.__row,h.indexOf('Пароль')+1).setValue(hash_(u['Пароль']));});
  }
  if(!read_('Настройки').length){
    append_('Настройки',{'Параметр':'Site_URL','Значение':SITE_URL});
    append_('Настройки',{'Параметр':'Email_Sender_Name','Значение':'СтройРеестр'});
    append_('Настройки',{'Параметр':'Уведомления','Значение':'включены'});
  }
  seedDemo(); bust_();
  return 'Готово. Листы: '+Object.keys(HEADERS).length+'. Вход: admin / admin123';
}
function seedDemo(){
  if(!read_('Справочник_Объекты').length)
    append_('Справочник_Объекты',{'ID':'ОБЪ-0001','Название':'РД-221-AR1.2 · Комплекс реставрационных работ','Адрес':'г. Москва','Заказчик':'ГБУ «Реставрация»','Тип_объекта':'ОКН','Статус':'Активен','Дата_начала':'2026-01-01','Дата_окончания':'2026-12-31','Примечание':'Тома 6 и 7','Удалено':false});
  if(!read_('Договоры').length)
    append_('Договоры',{'ID_Договора':'ДОГ-0001','ID_Объекта':'ОБЪ-0001','Контрагент':'ООО «РеставрМонтаж»','Номер_Договора':'23/Р','Дата_Договора':'2026-02-15','Предмет':'Реставрация кирпичной кладки и интерьеров, том 6','Сумма':3000000,'Статус':'Действует','Ответственный':'Орлов К.И.','Иконка':'🏛️','Удалено':false});
  if(!read_('Сметы').length)
    append_('Сметы',{'ID_Сметы':'СМ-0001','ID_Договора':'ДОГ-0001','Название':'Смета №1 · Том 6','Общая_сумма':1250000,'Статус':'Активна','Удалено':false});
  if(!read_('Сметные_позиции').length){
    [['ПОЗ-0001','ОИ · Интерьеры','1.1','Плитка керамическая','м2',90,1800,1],
     ['ПОЗ-0002','СТ · Стены','1.2','Кладка кирпичная','м2',240,3200,2],
     ['ПОЗ-0003','ОФ · Фасады','1.3','Штукатурка фасадов','м2',410,950,3]].forEach(p=>
      append_('Сметные_позиции',{'ID_Позиции':p[0],'ID_Сметы':'СМ-0001','Раздел':p[1],'Номер':p[2],'Наименование':p[3],'Ед_изм':p[4],'Количество':p[5],'Цена':p[6],'Сумма':p[5]*p[6],'Закрыто_объём':0,'Статус':'Не начато','Порядок':p[7],'Удалено':false}));
  }
  if(!read_('Подачи_объёмов').length){
    append_('Подачи_объёмов',{'ID':'ПДВ-0001','ID_Договора':'ДОГ-0001','ID_Позиции':'ПОЗ-0001','Кто_подал':'admin','Объём_подан':20,'Дата_подачи':now_(),'Статус':'На_проверке','Комментарий_проверяющего':'Первый ярус, оси 1–4','Удалено':false});
    append_('Подачи_объёмов',{'ID':'ПДВ-0002','ID_Договора':'ДОГ-0001','ID_Позиции':'ПОЗ-0002','Кто_подал':'admin','Объём_подан':60,'Дата_подачи':now_(),'Статус':'На_проверке','Удалено':false});
  }
  if(!read_('Архитектурные_проекты').length)
    append_('Архитектурные_проекты',{'ID_Проекта':'АРХ-0001','ID_Договора':'ДОГ-0001','Название':'Реставрация интерьеров, том 6','Тип':'Реставрационный','Автор':'Орлов К.И.','Дата_создания':today_(),'Версия':'1.0','Статус':'В_разработке','Удалено':false});
  if(!read_('Предметы_охраны').length){
    append_('Предметы_охраны',{'ID':'ПРХ-0001','ID_Проекта':'АРХ-0001','Название':'Лепной карниз главного зала','Тип':'Лепнина','Местоположение':'2 этаж, пом. 204','Описание':'Гипсовая тяга с растительным орнаментом, сер. XIX в.','Статус_сохранности':'Требует_реставрации','Меры_по_сохранению':'Расчистка, докомпоновка утрат, тонирование','Согласовано_КГИОП':false,'Статус':'Удовлетворительное','Удалено':false});
    append_('Предметы_охраны',{'ID':'ПРХ-0002','ID_Проекта':'АРХ-0001','Название':'Паркет художественный «розетка»','Тип':'Паркет','Местоположение':'2 этаж, зал 201','Описание':'Дуб, ясень, орех. Диаметр 2400 мм','Статус_сохранности':'Удовлетворительное','Меры_по_сохранению':'Циклёвка, воскование','Согласовано_КГИОП':true,'Статус':'Удовлетворительное','Удалено':false});
  }
  if(!read_('Авторский_надзор').length)
    append_('Авторский_надзор',{'ID':'АН-0001','ID_Проекта':'АРХ-0001','Дата':today_(),'Автор':'Орлов К.И.','Описание_замечания':'Расшивка швов выполнена цементным раствором вместо известкового. Переделать на участке осей 3–5.','Статус_устранения':'Не_устранено','Срок_устранения':Utilities.formatDate(new Date(Date.now()+7*864e5),'GMT+3','yyyy-MM-dd'),'Статус':'Открыто','Удалено':false});
  if(!read_('Тендеры').length)
    append_('Тендеры',{'ID':'ТНД-0001','Название':'Реставрация усадьбы, том 7','Заказчик':'ГБУ «Реставрация»','Номер_извещения':'0173200001426000123','Дата_публикации':'2026-03-01','Дата_подачи':'2026-03-20','Начальная_цена':18400000,'Наша_цена':17250000,'Статус':'Подготовка','Ответственный':'Тендерный отдел','Удалено':false});
  if(!read_('Персонал').length)
    append_('Персонал',{'ID':'ПРС-0001','ФИО':'Иванов Иван Иванович','Должность':'Прораб','Табельный_номер':'0142','Телефон':'+7 900 000-00-00','Email':'ivanov@example.com','Дата_приёма':'2025-04-01','Размер_одежды':'52-54','Размер_обуви':'43','Статус':'Работает','Удалено':false});
  if(!read_('Документы_персонала').length)
    append_('Документы_персонала',{'ID':'ДПР-0001','ID_Сотрудника':'ПРС-0001','Тип_документа':'Аттестация_ОТ','Номер':'ОТ-2025-1142','Дата_выдачи':'2025-05-12','Срок_действия':Utilities.formatDate(new Date(Date.now()+21*864e5),'GMT+3','yyyy-MM-dd'),'Орган':'УЦ «Профстандарт»','Статус':'Активен','Удалено':false});
  if(!read_('Подрядчики').length)
    append_('Подрядчики',{'ID':'ПРД-0001','Название':'ООО «КладкаПро»','ИНН':'7712345678','Контактное_лицо':'Петров П.П.','Телефон':'+7 900 111-11-11','Статус':'Активен','Дата_создания':today_(),'Удалено':false});
  if(!read_('Предписания').length)
    append_('Предписания',{'ID':'ПРДП-0001','ID_Договора':'ДОГ-0001','Тип':'Технадзор','Номер':'ТН-14','Дата':today_(),'От_кого':'Инженер технадзора Смирнов А.В.','Содержание':'Не предъявлены паспорта на реставрационные составы. Предоставить до начала работ.','Срок_исполнения':Utilities.formatDate(new Date(Date.now()+3*864e5),'GMT+3','yyyy-MM-dd'),'Статус':'Открыто','Исполнитель':'ПТО','Удалено':false});
}
function createTriggers(){
  ScriptApp.getProjectTriggers().forEach(t=>{if(['nightlyBackup','expiryDigest'].indexOf(t.getHandlerFunction())>-1)ScriptApp.deleteTrigger(t);});
  ScriptApp.newTrigger('nightlyBackup').timeBased().everyDays(1).atHour(23).create();
  ScriptApp.newTrigger('expiryDigest').timeBased().everyDays(1).atHour(9).create();
  return 'Триггеры установлены: бэкап 23:00, дайджест 09:00';
}
function nightlyBackup(){
  try{ const f=folder_('_Бэкапы');
    DriveApp.getFileById(SHEET_ID).makeCopy('СтройРеестр_'+Utilities.formatDate(new Date(),'GMT+3','yyyyMMdd'),f);
    const it=f.getFiles(),lim=new Date(Date.now()-30*864e5);
    while(it.hasNext()){const x=it.next();if(x.getDateCreated()<lim)x.setTrashed(true);} }catch(e){}
}
function expiryDigest(){
  try{
    const soon=new Date(Date.now()+30*864e5), list=[];
    read_('Документы').filter(alive_).forEach(r=>{const d=new Date(r['Срок_действия']);if(r['Срок_действия']&&d<=soon)list.push('Документ: '+r['Тип_документа']+' №'+(r['Номер']||'—')+' до '+r['Срок_действия']);});
    read_('Документы_персонала').filter(alive_).forEach(r=>{const d=new Date(r['Срок_действия']);if(r['Срок_действия']&&d<=soon)list.push('Персонал: '+r['Тип_документа']+' №'+(r['Номер']||'—')+' до '+r['Срок_действия']);});
    read_('Напоминания').filter(alive_).forEach(r=>{const d=new Date(r['Дата']);if(r['Дата']&&d<=soon&&String(r['Статус'])!=='Выполнено')list.push('Напоминание: '+r['Тип']+' · '+r['Объект']+' ('+r['Дата']+')');});
    read_('Предписания').filter(alive_).forEach(r=>{const d=new Date(r['Срок_исполнения']);if(r['Срок_исполнения']&&d<=soon&&String(r['Статус'])!=='Исполнено')list.push('Предписание №'+r['Номер']+' · срок '+r['Срок_исполнения']);});
    if(!list.length) return;
    const html='<div style="font-family:Arial;padding:18px;background:#f2f5f9"><h2 style="color:#ff6b35">🏗️ СтройРеестр · требуют внимания ('+list.length+')</h2><ul><li>'+list.join('</li><li>')+'</li></ul><a href="'+SITE_URL+'" style="background:#ff6b35;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Открыть систему</a></div>';
    read_('Пользователи').filter(u=>alive_(u)&&u['Email']&&String(u['Подписки_на_уведомления']||'').indexOf('Сроки')>-1)
      .forEach(u=>MailApp.sendEmail(u['Email'],'СтройРеестр · сроки и предписания','',{htmlBody:html,name:'СтройРеестр'}));
  }catch(e){}
}
function testLogin(){Logger.log(JSON.stringify(handleLogin_({login:'admin',password:'admin123'})));}
