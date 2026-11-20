"use strict";
/* ⚠️ URL веб-приложения Apps Script, заканчивается на /exec */
var API_URL='https://script.google.com/macros/s/AKfycby0NXF3ZPUmMmfZCG6mX5SrVZ6N46hQjdHkd9-bvLm4le-oWBqYuEibDPnm6YbN3ZQxxA/exec';

var PAL={site:{n:'Площадка',h:['#ff6b35','#2f6df6','#0fbd8c','#f59f00','#e8437f','#7c5cff','#00b8d9','#8aa2b8']},
 blue:{n:'Синька',h:['#2f6df6','#00b8d9','#7c5cff','#0fbd8c','#5c7cfa','#22b8cf','#4dabf7','#9fb3c8']},
 heritage:{n:'Реставрация',h:['#c2410c','#b45309','#a16207','#4d7c0f','#0f766e','#7e22ce','#be123c','#8a8178']},
 signal:{n:'Сигнал',h:['#e5322d','#f59f00','#0fbd8c','#2f6df6','#e8437f','#7c5cff','#00b8d9','#94a3b8']}};
var DDEF={period:'365',contract:'',metric:'count',chart:'donut',palette:'site',threshold:14,thick:16,curve:38,labels:true,grid:true,glow:true};
var DENS={compact:{p:6,f:11.5},normal:{p:10,f:12.5},roomy:{p:15,f:13.5}};
var UNITS=['м2','м3','м','шт','кг','т','компл'];
var SECT=['ПР · Подготовительные','ДМ · Демонтажные','ФП · Фундаменты','СТ · Стены','ПР · Перекрытия','КР · Кровля','ЗП · Проёмы','ОФ · Фасады','ОИ · Интерьеры','ЛБ · Лестницы','ИС · Инженерные','СП · Специальные','НИ · Исследования','ПМ · Приёмочные'];
var DT=['Договор','Доп_соглашение','АОСР','АОК','Исполнительная_схема','Акт_входного_контроля','Протокол_испытаний','Паспорт','Сертификат','Журнал_работ','Фотофиксация','Акт_подбора_состава','Протокол_химанализа','Колористический_паспорт','Реставрационный_паспорт','Научное_согласование','КС-2','КС-3','Счет-фактура','УПД','Письмо_исходящее','Предписание'];
var PRES=['Фасад','Интерьер','Лепнина','Роспись','Паркет','Изразцы','Двери','Окна','Витраж','Ковка','Камины','Печи','Кладка','Кровля'];
var GROUPS=[['flow','Рабочие процессы'],['docs','Документация и сметы'],['money','Коммерция и финансы'],['people','Люди и допуски'],['plan','Планирование и надзор'],['misc','Ресурсы'],['analytics','Аналитика']];

var MODS=[
{id:'contracts',g:'flow',i:'📋',t:'Договоры',idK:'ID_Договора',tK:'Контрагент',sK:'Статус',st:['Действует','Приостановлен','Завершён','Архив'],money:'Сумма',dateK:'Дата_Договора',kids:{m:'items',k:'ID_Договора'},
 cols:['Контрагент','Номер_Договора','Дата_Договора','Сумма','Статус'],
 f:[{k:'Контрагент',l:'Контрагент',t:'text',req:1},{k:'Номер_Договора',l:'Номер',t:'text',req:1},{k:'Дата_Договора',l:'Дата',t:'date'},
 {k:'ID_Объекта',l:'Объект',t:'ref',ref:'objects',rid:'ID',rl:'Название'},{k:'Предмет',l:'Предмет',t:'textarea',wide:1},
 {k:'Сумма',l:'Сумма, ₽',t:'number'},{k:'Ответственный',l:'Ответственный',t:'text'},{k:'Статус',l:'Статус',t:'select'},
 {k:'Иконка',l:'Иконка',t:'select',opts:['🏛️','🏢','🏗️','🏭','🏠']}]},
{id:'submissions',g:'flow',i:'📝',t:'Подачи объёмов',idK:'ID',tK:'ID_Позиции',sK:'Статус',st:['На_проверке','Подтверждено','Отредактировано','Отклонено'],review:1,dateK:'Дата_подачи',
 cols:['ID_Позиции','Объём_подан','Скорректированный_объём','Статус','Кто_подал'],
 f:[{k:'ID_Договора',l:'Договор',t:'ref',ref:'contracts',rid:'ID_Договора',rl:'Контрагент',req:1},
 {k:'ID_Позиции',l:'Позиция сметы',t:'ref',ref:'items',rid:'ID_Позиции',rl:'Наименование',req:1},
 {k:'Объём_подан',l:'Объём',t:'number',req:1},{k:'Комментарий',l:'Комментарий',t:'textarea',wide:1}]},
{id:'progress',g:'flow',i:'📊',t:'Прогресс / КС-2',special:'progress'},
{id:'ks2',g:'flow',i:'💰',t:'КС-2 / КС-3',idK:'ID',tK:'Номер_КС2',sK:'Статус',st:['В_работе','Подана','Подписана','Оплачена','Отклонена'],money:'Общая_сумма',dateK:'Дата_составления',kids:{m:'ks2items',k:'ID_КС2'},
 cols:['Номер_КС2','Дата_составления','Период_работ','Общая_сумма','Статус'],
 f:[{k:'ID_Договора',l:'Договор',t:'ref',ref:'contracts',rid:'ID_Договора',rl:'Контрагент',req:1},
 {k:'Номер_КС2',l:'Номер КС-2',t:'text',req:1},{k:'Дата_составления',l:'Дата',t:'date'},{k:'Период_работ',l:'Период',t:'text'},
 {k:'Общая_сумма',l:'Сумма, ₽',t:'number'},{k:'Подписант_исполнителя',l:'Подписант (исп.)',t:'text'},
 {k:'Подписант_заказчика',l:'Подписант (зак.)',t:'text'},{k:'Статус',l:'Статус',t:'select'}]},
{id:'additional',g:'flow',i:'➕',t:'Доп. работы',idK:'ID',tK:'Наименование',sK:'Статус',st:['Подана','На_согласовании','Согласована','В_работе','Отклонена'],money:'Сумма',calc:['Количество','Цена'],dateK:'Дата_подачи',
 cols:['Наименование','Количество','Ед_изм','Сумма','Статус'],
 f:[{k:'ID_Договора',l:'Договор',t:'ref',ref:'contracts',rid:'ID_Договора',rl:'Контрагент',req:1},
 {k:'Наименование',l:'Наименование',t:'text',req:1,wide:1},{k:'Обоснование',l:'Обоснование',t:'textarea',wide:1},
 {k:'Ед_изм',l:'Ед. изм.',t:'select',opts:UNITS},{k:'Количество',l:'Количество',t:'number'},{k:'Цена',l:'Цена, ₽',t:'number'},{k:'Статус',l:'Статус',t:'select'}]},
{id:'closures',g:'flow',i:'✅',t:'Закрытия объёмов',idK:'ID',tK:'Комментарий',sK:'Статус',st:['Проведено','Отменено'],dateK:'Дата',
 cols:['Дата','Тип_закрытия','Объём','Кем_закрыто','Статус'],
 f:[{k:'Тип_закрытия',l:'Тип',t:'select',opts:['ПТО','Подрядчик'],req:1},
 {k:'ID_Позиции',l:'Позиция сметы',t:'ref',ref:'items',rid:'ID_Позиции',rl:'Наименование'},
 {k:'ID_Работы',l:'Работа подрядчика',t:'ref',ref:'works',rid:'ID',rl:'Вид_работ'},
 {k:'Объём',l:'Объём',t:'number',req:1},{k:'Дата',l:'Дата',t:'date'},{k:'Комментарий',l:'Основание',t:'textarea',wide:1}]},

{id:'documents',g:'docs',i:'📄',t:'Документы',idK:'ID_Документа',tK:'Наименование',sK:'Согласование',st:['На проверке','Согласован','Замечания'],dateK:'Дата',files:1,
 cols:['Тип_документа','Наименование','Номер','Категория','Согласование'],
 f:[{k:'ID_Договора',l:'Договор',t:'ref',ref:'contracts',rid:'ID_Договора',rl:'Контрагент',req:1},
 {k:'Категория',l:'Категория',t:'select',opts:['Договор','ИД','Материалы','Финансы','Переписка','Отчёты'],req:1},
 {k:'Тип_документа',l:'Тип',t:'select',opts:DT,req:1},{k:'Наименование',l:'Наименование',t:'text',wide:1},
 {k:'Номер',l:'Номер',t:'text'},{k:'Дата',l:'Дата',t:'date'},{k:'Срок_действия',l:'Срок действия',t:'date'},
 {k:'Согласование',l:'Согласование',t:'select'},{k:'Оригинал',l:'Оригинал',t:'select',opts:['Оригинал в офисе','Оригинал у заказчика','Только скан','У субподрядчика','Утерян']},
 {k:'Примечание',l:'Примечание',t:'textarea',wide:1}]},
{id:'estimates',g:'docs',i:'🧮',t:'Сметы',idK:'ID_Сметы',tK:'Название',sK:'Статус',st:['Активна','На_проверке','Утверждена','Архив'],money:'Общая_сумма',kids:{m:'items',k:'ID_Сметы'},
 cols:['Название','Общая_сумма','Статус'],
 f:[{k:'ID_Договора',l:'Договор',t:'ref',ref:'contracts',rid:'ID_Договора',rl:'Контрагент',req:1},
 {k:'Название',l:'Название',t:'text',req:1,wide:1},{k:'Общая_сумма',l:'Сумма, ₽',t:'number'},{k:'Статус',l:'Статус',t:'select'}]},
{id:'items',g:'docs',i:'📑',t:'Позиции смет',idK:'ID_Позиции',tK:'Наименование',sK:'Статус',st:['Не начато','В работе','Закрыто'],money:'Сумма',calc:['Количество','Цена'],orderK:'Порядок',
 cols:['Номер','Наименование','Количество','Ед_изм','Закрыто_объём','Статус'],
 f:[{k:'ID_Сметы',l:'Смета',t:'ref',ref:'estimates',rid:'ID_Сметы',rl:'Название',req:1},
 {k:'ID_Договора',l:'Договор',t:'ref',ref:'contracts',rid:'ID_Договора',rl:'Контрагент'},
 {k:'Раздел',l:'Раздел',t:'select',opts:SECT},{k:'Номер',l:'№',t:'text'},
 {k:'Наименование',l:'Наименование',t:'text',req:1,wide:1},{k:'Ед_изм',l:'Ед. изм.',t:'select',opts:UNITS},
 {k:'Количество',l:'Количество',t:'number',req:1},{k:'Цена',l:'Цена, ₽',t:'number',req:1},
 {k:'Закрыто_объём',l:'Закрыто',t:'number'},{k:'ID_Подрядчика',l:'Подрядчик',t:'ref',ref:'contractors',rid:'ID',rl:'Название'},{k:'Статус',l:'Статус',t:'select'}]},
{id:'ks2items',g:'docs',i:'🧾',t:'Состав КС-2',idK:'ID',tK:'Наименование',money:'Сумма',calc:['Количество','Цена'],
 cols:['Наименование','Количество','Ед_изм','Сумма'],
 f:[{k:'ID_КС2',l:'Акт КС-2',t:'ref',ref:'ks2',rid:'ID',rl:'Номер_КС2',req:1},
 {k:'ID_Позиции',l:'Позиция',t:'ref',ref:'items',rid:'ID_Позиции',rl:'Наименование'},
 {k:'Наименование',l:'Наименование',t:'text',req:1,wide:1},{k:'Ед_изм',l:'Ед. изм.',t:'select',opts:UNITS},
 {k:'Количество',l:'Количество',t:'number',req:1},{k:'Цена',l:'Цена, ₽',t:'number',req:1}]},
{id:'architecture',g:'docs',i:'🏛️',t:'Арх. проекты',idK:'ID_Проекта',tK:'Название',sK:'Статус',st:['В_разработке','На_согласовании','Согласован','Утверждён','Архив'],dateK:'Дата_создания',kids:{m:'preservation',k:'ID_Проекта'},
 cols:['Название','Тип','Автор','Версия','Статус'],
 f:[{k:'ID_Договора',l:'Договор',t:'ref',ref:'contracts',rid:'ID_Договора',rl:'Контрагент'},
 {k:'Название',l:'Название',t:'text',req:1,wide:1},{k:'Тип',l:'Тип',t:'select',opts:['Обмерный','Рабочий_РД','Реставрационный','Дизайн-проект','Колористический','3D-визуализация']},
 {k:'Автор',l:'Автор',t:'text'},{k:'Версия',l:'Версия',t:'text'},{k:'Статус',l:'Статус',t:'select'},{k:'Примечание',l:'Примечание',t:'textarea',wide:1}]},
{id:'preservation',g:'docs',i:'🏺',t:'Предметы охраны',idK:'ID',tK:'Название',sK:'Сохранность',st:['Отличное','Удовлетворительное','Требует_реставрации','Аварийное','Утрачено'],
 cols:['Название','Тип','Местоположение','Сохранность','Согласовано_КГИОП'],
 f:[{k:'ID_Проекта',l:'Проект',t:'ref',ref:'architecture',rid:'ID_Проекта',rl:'Название',req:1},
 {k:'Название',l:'Название',t:'text',req:1,wide:1},{k:'Тип',l:'Тип',t:'select',opts:PRES},
 {k:'Местоположение',l:'Местоположение',t:'text'},{k:'Описание',l:'Описание',t:'textarea',wide:1},
 {k:'Сохранность',l:'Сохранность',t:'select'},{k:'Меры',l:'Меры',t:'textarea',wide:1},
 {k:'Согласовано_КГИОП',l:'КГИОП',t:'select',opts:['Да','Нет']}]},

{id:'tenders',g:'money',i:'🎯',t:'Тендеры',idK:'ID',tK:'Название',sK:'Статус',st:['Мониторинг','Подготовка','Подана','Победа','Проигрыш','Отменён'],money:'Наша_цена',dateK:'Дата_подачи',
 cols:['Название','Заказчик','Дата_подачи','Наша_цена','Статус'],
 f:[{k:'Название',l:'Название',t:'text',req:1,wide:1},{k:'Заказчик',l:'Заказчик',t:'text'},{k:'Номер_извещения',l:'№ извещения',t:'text'},
 {k:'Дата_публикации',l:'Публикация',t:'date'},{k:'Дата_подачи',l:'Подача',t:'date'},{k:'Начальная_цена',l:'Начальная, ₽',t:'number'},
 {k:'Наша_цена',l:'Наша, ₽',t:'number'},{k:'Ответственный',l:'Ответственный',t:'text'},{k:'Статус',l:'Статус',t:'select'},{k:'Примечание',l:'Примечание',t:'textarea',wide:1}]},
{id:'kp',g:'money',i:'💼',t:'КП',idK:'ID',tK:'Номер_КП',sK:'Статус',st:['В_разработке','Отправлено','На_согласовании','Принято','Отклонено'],money:'Сумма',dateK:'Дата',
 cols:['Номер_КП','Заказчик','Объект','Сумма','Статус'],
 f:[{k:'Номер_КП',l:'Номер',t:'text',req:1},{k:'Дата',l:'Дата',t:'date'},{k:'Заказчик',l:'Заказчик',t:'text'},
 {k:'Объект',l:'Объект',t:'text',wide:1},{k:'Сумма',l:'Сумма, ₽',t:'number'},{k:'Версия',l:'Версия',t:'text'},{k:'Автор',l:'Автор',t:'text'},{k:'Статус',l:'Статус',t:'select'}]},
{id:'contractors',g:'money',i:'🏢',t:'Подрядчики',idK:'ID',tK:'Название',sK:'Статус',st:['Активен','Приостановлен','Завершён'],finance:1,dateK:'Дата_создания',kids:{m:'works',k:'ID_Подрядчика'},
 cols:['Название','ИНН','Контактное_лицо','Телефон','Статус'],
 f:[{k:'Название',l:'Название',t:'text',req:1,wide:1},{k:'ИНН',l:'ИНН',t:'text'},{k:'Контактное_лицо',l:'Контакт',t:'text'},
 {k:'Телефон',l:'Телефон',t:'text'},{k:'Email',l:'Email',t:'email'},{k:'Статус',l:'Статус',t:'select'},{k:'Примечание',l:'Примечание',t:'textarea',wide:1}]},
{id:'works',g:'money',i:'🔨',t:'Работы подрядчиков',idK:'ID',tK:'Вид_работ',sK:'Статус',st:['Не начато','В работе','Завершено'],money:'Сумма_договорная',calc:['Договорной_объём','Цена_за_ед'],dateK:'Дата_начала',
 cols:['Вид_работ','Договорной_объём','Закрыто_объём','Сумма_закрытая','Статус'],
 f:[{k:'ID_Подрядчика',l:'Подрядчик',t:'ref',ref:'contractors',rid:'ID',rl:'Название',req:1},
 {k:'ID_Договора',l:'Договор',t:'ref',ref:'contracts',rid:'ID_Договора',rl:'Контрагент'},
 {k:'Вид_работ',l:'Вид работ',t:'text',req:1,wide:1},{k:'Раздел',l:'Раздел',t:'select',opts:SECT},
 {k:'Ед_изм',l:'Ед. изм.',t:'select',opts:UNITS},{k:'Договорной_объём',l:'Объём',t:'number'},{k:'Цена_за_ед',l:'Цена, ₽',t:'number'},
 {k:'Закрыто_объём',l:'Закрыто',t:'number'},{k:'Дата_начала',l:'Начало',t:'date'},{k:'Дата_окончания',l:'Окончание',t:'date'},{k:'Статус',l:'Статус',t:'select'}]},
{id:'payments',g:'money',i:'💳',t:'Выплаты',idK:'ID',tK:'Основание',sK:'Статус',st:['Проведена','Ожидает','Отклонена'],money:'Сумма',dateK:'Дата',
 cols:['Дата','Тип','Сумма','Основание','Статус'],
 f:[{k:'ID_Подрядчика',l:'Подрядчик',t:'ref',ref:'contractors',rid:'ID',rl:'Название',req:1},
 {k:'ID_Работы',l:'Работа',t:'ref',ref:'works',rid:'ID',rl:'Вид_работ'},
 {k:'Тип',l:'Тип',t:'select',opts:['Аванс','Оплата этапа','Окончательная','Возврат']},
 {k:'Сумма',l:'Сумма, ₽',t:'number',req:1},{k:'Дата',l:'Дата',t:'date'},{k:'Основание',l:'Основание',t:'text',wide:1},
 {k:'Комментарий',l:'Комментарий',t:'textarea',wide:1},{k:'Статус',l:'Статус',t:'select'}]},

{id:'personnel',g:'people',i:'👥',t:'Персонал',idK:'ID',tK:'ФИО',sK:'Статус',st:['Работает','Отпуск','Уволен'],avatar:'ФИО',dateK:'Дата_приёма',kids:{m:'certs',k:'ID_Сотрудника'},
 cols:['ФИО','Должность','Табельный_номер','Телефон','Статус'],
 f:[{k:'ФИО',l:'ФИО',t:'text',req:1,wide:1},{k:'Должность',l:'Должность',t:'text'},{k:'Табельный_номер',l:'Табельный №',t:'text'},
 {k:'Телефон',l:'Телефон',t:'text'},{k:'Email',l:'Email',t:'email'},{k:'Дата_приёма',l:'Приём',t:'date'},{k:'Дата_рождения',l:'Рождение',t:'date'},
 {k:'Размер_одежды',l:'Одежда',t:'select',opts:['44-46','48-50','52-54','56-58','60-62']},
 {k:'Размер_обуви',l:'Обувь',t:'select',opts:['39','40','41','42','43','44','45','46']},{k:'Статус',l:'Статус',t:'select'}]},
{id:'certs',g:'people',i:'🪪',t:'Допуски',idK:'ID',tK:'Тип',sK:'Статус',st:['Активен','Истекает','Просрочен','Отозван'],deadline:'Срок_действия',dateK:'Дата_выдачи',
 cols:['Тип','Номер','Срок_действия','Орган','Статус'],
 f:[{k:'ID_Сотрудника',l:'Сотрудник',t:'ref',ref:'personnel',rid:'ID',rl:'ФИО',req:1},
 {k:'Тип',l:'Тип',t:'select',req:1,opts:['Паспорт','Удостоверение','Диплом','Медкнижка','Допуск_к_работам','Аттестация_ОТ','НАКС','Работы_на_высоте','Электробезопасность','Пожарный_минимум','Пропуск','Спецодежда']},
 {k:'Номер',l:'Номер',t:'text'},{k:'Дата_выдачи',l:'Выдача',t:'date'},{k:'Срок_действия',l:'Срок',t:'date'},{k:'Орган',l:'Кем выдан',t:'text'},{k:'Статус',l:'Статус',t:'select'}]},
{id:'orders',g:'people',i:'📋',t:'Приказы',idK:'ID',tK:'Номер',sK:'Статус',st:['Действует','Отменён','Архив'],dateK:'Дата',
 cols:['Номер','Дата','Тип','Сотрудник','Статус'],
 f:[{k:'Номер',l:'Номер',t:'text',req:1},{k:'Дата',l:'Дата',t:'date'},
 {k:'Тип',l:'Тип',t:'select',opts:['Приём','Увольнение','Перевод','Премия','Выговор','Отпуск','Командировка','Допуск_к_работам']},
 {k:'Сотрудник',l:'Сотрудник',t:'text'},{k:'Содержание',l:'Содержание',t:'textarea',wide:1},{k:'Статус',l:'Статус',t:'select'}]},
{id:'tasks',g:'people',i:'📨',t:'Задания',idK:'ID',tK:'Тема',sK:'Статус',st:['Новое','В работе','На проверке','Выполнено','Отклонено'],deadline:'Дедлайн',replies:1,dateK:'Дата_создания',
 cols:['Тема','Кому','Дедлайн','Приоритет','Статус'],
 f:[{k:'Тема',l:'Тема',t:'text',req:1,wide:1},{k:'Кому',l:'Исполнитель',t:'text',req:1},{k:'Дедлайн',l:'Дедлайн',t:'date'},
 {k:'Приоритет',l:'Приоритет',t:'select',opts:['Низкий','Обычный','Высокий','Срочный']},
 {k:'ID_Договора',l:'Договор',t:'ref',ref:'contracts',rid:'ID_Договора',rl:'Контрагент'},
 {k:'Прогресс',l:'Прогресс, %',t:'number'},{k:'Статус',l:'Статус',t:'select'},{k:'Описание',l:'Описание',t:'textarea',wide:1}]},

{id:'ppr',g:'plan',i:'📅',t:'ППР / Техкарты',idK:'ID',tK:'Название',sK:'Статус',st:['В_разработке','На_согласовании','Согласован','Утверждён'],dateK:'Дата',
 cols:['Тип','Название','Номер','Версия','Статус'],
 f:[{k:'ID_Договора',l:'Договор',t:'ref',ref:'contracts',rid:'ID_Договора',rl:'Контрагент'},
 {k:'Тип',l:'Тип',t:'select',opts:['ППР','ПОС','Техкарта','Техзадание','График работ']},
 {k:'Название',l:'Название',t:'text',req:1,wide:1},{k:'Номер',l:'Номер',t:'text'},{k:'Версия',l:'Версия',t:'text'},
 {k:'Разработал',l:'Разработал',t:'text'},{k:'Согласовал',l:'Согласовал',t:'text'},{k:'Утвердил',l:'Утвердил',t:'text'},{k:'Статус',l:'Статус',t:'select'}]},
{id:'prescriptions',g:'plan',i:'⚠️',t:'Предписания',idK:'ID',tK:'Номер',sK:'Статус',st:['Открыто','В работе','Исполнено','Просрочено'],deadline:'Срок_исполнения',dateK:'Дата',
 cols:['Тип','Номер','Дата','Срок_исполнения','Статус'],
 f:[{k:'ID_Договора',l:'Договор',t:'ref',ref:'contracts',rid:'ID_Договора',rl:'Контрагент'},
 {k:'Тип',l:'Источник',t:'select',opts:['Технадзор','Авторский надзор','Госстройнадзор','Охрана труда','Пожарная безопасность','КГИОП']},
 {k:'Номер',l:'Номер',t:'text',req:1},{k:'Дата',l:'Дата',t:'date'},{k:'От_кого',l:'От кого',t:'text'},
 {k:'Срок_исполнения',l:'Срок',t:'date'},{k:'Исполнитель',l:'Исполнитель',t:'text'},{k:'Статус',l:'Статус',t:'select'},{k:'Содержание',l:'Содержание',t:'textarea',wide:1}]},
{id:'supervision',g:'plan',i:'🔍',t:'Авторский надзор',idK:'ID',tK:'Описание',sK:'Статус',st:['Не_устранено','В_работе','Устранено'],deadline:'Срок_устранения',dateK:'Дата',
 cols:['Дата','Автор','Срок_устранения','Статус'],
 f:[{k:'ID_Проекта',l:'Проект',t:'ref',ref:'architecture',rid:'ID_Проекта',rl:'Название',req:1},
 {k:'Дата',l:'Дата осмотра',t:'date',req:1},{k:'Автор',l:'Автор',t:'text'},
 {k:'Описание',l:'Замечание',t:'textarea',req:1,wide:1},{k:'Исполнитель',l:'Исполнитель',t:'text'},
 {k:'Срок_устранения',l:'Срок',t:'date'},{k:'Статус',l:'Статус',t:'select'}]},
{id:'approvals',g:'plan',i:'🤝',t:'Согласования',idK:'ID',tK:'Название',sK:'Статус',st:['На_согласовании','Согласовано','Отказ','Отозвано'],dateK:'Дата_обращения',
 cols:['Тип','Название','Орган','Дата_ответа','Статус'],
 f:[{k:'ID_Договора',l:'Договор',t:'ref',ref:'contracts',rid:'ID_Договора',rl:'Контрагент'},
 {k:'Тип',l:'Тип',t:'select',opts:['МАФ','Ордер ОАТИ','Порубочный билет','Схема движения','Отключение сетей','КГИОП','Роспотребнадзор']},
 {k:'Название',l:'Название',t:'text',req:1,wide:1},{k:'Орган',l:'Орган',t:'text'},{k:'Номер_письма',l:'№ письма',t:'text'},
 {k:'Дата_обращения',l:'Обращение',t:'date'},{k:'Дата_ответа',l:'Ответ',t:'date'},{k:'Статус',l:'Статус',t:'select'},{k:'Результат',l:'Результат',t:'textarea',wide:1}]},
{id:'daily',g:'plan',i:'🗒️',t:'Отчёты прораба',idK:'ID',tK:'Прораб',dateK:'Дата',
 cols:['Дата','Прораб','Численность','Погода'],
 f:[{k:'ID_Договора',l:'Договор',t:'ref',ref:'contracts',rid:'ID_Договора',rl:'Контрагент',req:1},
 {k:'Дата',l:'Дата',t:'date',req:1},{k:'Прораб',l:'Прораб',t:'text'},{k:'Погода',l:'Погода',t:'text'},
 {k:'Численность',l:'Численность',t:'number'},{k:'Выполнено',l:'Выполнено',t:'textarea',wide:1},
 {k:'Простой',l:'Простой',t:'textarea',wide:1},{k:'Проблемы',l:'Проблемы',t:'textarea',wide:1}]},

{id:'materials',g:'misc',i:'📦',t:'Материалы',idK:'ID',tK:'Наименование',sK:'Статус',st:['Заказан','В пути','Доставлено','Использован'],deadline:'Срок_сертификата',dateK:'Дата_поставки',
 cols:['Наименование','Поставщик','Количество','Ед_изм','Статус'],
 f:[{k:'ID_Договора',l:'Договор',t:'ref',ref:'contracts',rid:'ID_Договора',rl:'Контрагент'},
 {k:'Наименование',l:'Наименование',t:'text',req:1,wide:1},{k:'Поставщик',l:'Поставщик',t:'text'},
 {k:'Количество',l:'Количество',t:'number'},{k:'Ед_изм',l:'Ед. изм.',t:'select',opts:UNITS},
 {k:'Дата_поставки',l:'Поставка',t:'date'},{k:'Сертификат',l:'Сертификат',t:'text'},{k:'Срок_сертификата',l:'Срок серт.',t:'date'},{k:'Статус',l:'Статус',t:'select'}]},
{id:'reminders',g:'misc',i:'⏰',t:'Напоминания',idK:'ID',tK:'Объект',sK:'Статус',st:['Активно','Выполнено','Просрочено'],deadline:'Дата',dateK:'Дата',
 cols:['Тип','Объект','Дата','Ответственный','Статус'],
 f:[{k:'Тип',l:'Тип',t:'select',opts:['Инструктаж','Поверка','Сертификат','КС-2','Оплата','Поставка','Аттестация','Другое']},
 {k:'Объект',l:'Объект',t:'text',req:1,wide:1},{k:'Дата',l:'Дата',t:'date',req:1},{k:'Ответственный',l:'Ответственный',t:'text'},
 {k:'Статус',l:'Статус',t:'select'},{k:'Описание',l:'Описание',t:'textarea',wide:1}]},
{id:'objects',g:'misc',i:'🏗️',t:'Объекты',idK:'ID',tK:'Название',sK:'Статус',st:['Активен','Приостановлен','Завершён'],dateK:'Дата_начала',kids:{m:'contracts',k:'ID_Объекта'},
 cols:['Название','Адрес','Заказчик','Тип_объекта','Статус'],
 f:[{k:'Название',l:'Название',t:'text',req:1,wide:1},{k:'Адрес',l:'Адрес',t:'text',wide:1},{k:'Заказчик',l:'Заказчик',t:'text'},
 {k:'Тип_объекта',l:'Тип',t:'select',opts:['ОКН','Новое строительство','Реконструкция','Капремонт']},
 {k:'Дата_начала',l:'Начало',t:'date'},{k:'Дата_окончания',l:'Окончание',t:'date'},{k:'Статус',l:'Статус',t:'select'},{k:'Примечание',l:'Примечание',t:'textarea',wide:1}]},

{id:'dashboard',g:'analytics',i:'📈',t:'Дашборд',special:'dashboard'},
{id:'journal',g:'analytics',i:'📜',t:'Журнал',special:'journal'},
{id:'trash',g:'analytics',i:'🗑️',t:'Корзина',special:'trash'},
{id:'admin',g:'analytics',i:'⚙️',t:'Пользователи',special:'admin',adminOnly:1}
];
var M={};MODS.forEach(function(m){M[m.id]=m;});

/* ---------- утилиты ---------- */
var $=function(s,r){return (r||document).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function num(v){var n=parseFloat(String(v==null?'':v).replace(/\s/g,'').replace(',','.'));return isNaN(n)?0:n;}
function money(v){return num(v).toLocaleString('ru-RU')+' ₽';}
function compact(v){var n=num(v);return n>=1e6?(n/1e6).toFixed(1)+' млн':n>=1e3?Math.round(n/1e3)+' тыс':String(Math.round(n));}
function short(s,n){s=String(s==null?'':s);return s.length>n?s.slice(0,n-1)+'…':s;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function pad(n){return String(n).padStart(2,'0');}
function iso(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function dstr(v){if(!v)return '';var s=String(v);if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);
 var m=s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);if(m)return m[3]+'-'+m[2]+'-'+m[1];var d=new Date(s);return isNaN(d)?s:iso(d);}
function daysLeft(v){var s=dstr(v);if(!s)return null;var t=new Date(s+'T00:00:00');if(isNaN(t))return null;
 return Math.ceil((t-new Date(new Date().toDateString()))/864e5);}
function initials(s){return String(s||'?').trim().split(/\s+/).map(function(x){return x[0];}).join('').slice(0,2).toUpperCase();}
function debounce(fn,ms){var t;return function(){var a=arguments,c=this;clearTimeout(t);t=setTimeout(function(){fn.apply(c,a);},ms);};}
function isMob(){return window.matchMedia('(max-width: 860px)').matches;}
function toast(msg,kind,label,act){
  var host=$('#toasts');if(!host)return;
  var el=document.createElement('div');el.className='toast '+(kind||'info');
  el.innerHTML='<span class="tdot"></span><span class="tmsg">'+esc(msg)+'</span>';
  if(label){var b=document.createElement('button');b.className='tact';b.textContent=label;
    b.onclick=function(){el.remove();if(act)act();};el.appendChild(b);}
  var x=document.createElement('button');x.className='tx';x.innerHTML='×';x.onclick=function(){el.remove();};el.appendChild(x);
  host.appendChild(el);requestAnimationFrame(function(){el.classList.add('in');});
  setTimeout(function(){el.classList.remove('in');setTimeout(function(){el.remove();},260);},label?9000:4500);
}

/* ---------- состояние ---------- */
var S={user:null,token:null,snap:{},trash:{},counts:{},mod:'dashboard',q:{},filter:{},sort:{},page:{},
 sel:new Set(),order:false,drag:null,focus:-1,lastSel:-1,drawer:null,palOpen:false,palIdx:0,palItems:[],notifOpen:false,
 prefs:{density:'normal',dash:JSON.parse(JSON.stringify(DDEF))},views:{},cols:{},read:{},inflight:null};
try{var sp=localStorage.getItem('sr5_prefs');if(sp)S.prefs=JSON.parse(sp);}catch(e){}
S.prefs.dash=Object.assign({},DDEF,S.prefs.dash||{});
try{S.views=JSON.parse(localStorage.getItem('sr5_views')||'{}');}catch(e){S.views={};}
try{S.cols=JSON.parse(localStorage.getItem('sr5_cols')||'{}');}catch(e){S.cols={};}
try{S.read=JSON.parse(localStorage.getItem('sr5_read')||'{}');}catch(e){S.read={};}
function savePrefs(){try{localStorage.setItem('sr5_prefs',JSON.stringify(S.prefs));}catch(e){}}
function saveViews(){try{localStorage.setItem('sr5_views',JSON.stringify(S.views));}catch(e){}}
function saveCols(){try{localStorage.setItem('sr5_cols',JSON.stringify(S.cols));}catch(e){}}
function saveRead(){try{localStorage.setItem('sr5_read',JSON.stringify(S.read));}catch(e){}}
function hues(){return (PAL[S.prefs.dash.palette]||PAL.site).h;}
function applyDens(){var d=DENS[S.prefs.density]||DENS.normal;
 document.documentElement.style.setProperty('--rowpad',d.p+'px');
 document.documentElement.style.setProperty('--rowfont',d.f+'px');}
function themeInit(){document.documentElement.dataset.theme=localStorage.getItem('sr5_theme')||'dark';}
function toggleTheme(){var n=document.documentElement.dataset.theme==='dark'?'light':'dark';
 document.documentElement.dataset.theme=n;try{localStorage.setItem('sr5_theme',n);}catch(e){}
 if(S.mod==='dashboard')render();}
themeInit();applyDens();

/* ---------- транспорт ---------- */
function setNet(ok){var b=$('#net');if(!b)return;b.className='net '+(ok?'ok':'bad');b.textContent=ok?'онлайн':'нет связи';}
function api(action,payload){
  var body=JSON.stringify(Object.assign({action:action,token:S.token},payload||{}));
  return fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:body})
    .then(function(r){return r.text();})
    .then(function(txt){
      var j;try{j=JSON.parse(txt);}catch(e){throw new Error('Сервер вернул не JSON. Проверьте развёртывание (доступ: Все).');}
      if(j&&j.success===false)throw new Error(j.error||'Ошибка операции');
      if(j&&j.error&&j.success===undefined)throw new Error(j.error);
      setNet(true);return j;
    })
    .catch(function(e){
      if(/Failed to fetch|NetworkError|Load failed/i.test(String(e.message||e))){
        setNet(false);throw new Error('Нет связи с сервером. Отключите VPN, проверьте URL и доступ «Все».');
      }
      throw e;
    });
}
function fetchSnap(){
  if(S.inflight)return S.inflight;
  S.inflight=fetch(API_URL+'?type=snapshot&token='+encodeURIComponent(S.token||'')+'&_='+Date.now())
    .then(function(r){return r.json();})
    .then(function(j){
      if(!j||!j.ok)throw new Error((j&&j.error)||'Снимок недоступен');
      S.snap=j.data||{};S.trash=j.trash||{};S.counts=j.counts||{};
      buildNotif();setNet(true);return j;
    })
    .catch(function(e){setNet(false);throw e;})
    .then(function(v){S.inflight=null;return v;},function(e){S.inflight=null;throw e;});
  return S.inflight;
}
function loadData(silent){
  if(!silent)skeleton();
  return fetchSnap().then(function(){render();paintBadges();paintNotif();})
    .catch(function(e){
      if(/Сессия|авторизац/i.test(e.message)){toast('Сессия истекла — войдите заново','warn');setTimeout(logout,1200);return;}
      if(!Object.keys(S.snap).length)fail(e.message);else toast(e.message,'warn');
    });
}
function rows(id){return S.snap[id]||[];}
function find(id,rid){var a=rows(id);for(var i=0;i<a.length;i++)if(String(a[i][M[id].idK])===String(rid))return a[i];return null;}
function label(mod,rid){var m=M[mod];if(!m||!rid)return rid||'';var r=find(mod,rid);return r?(r[m.tK]||rid):rid;}
function colsOf(m){var s=S.cols[m.id];return (s&&s.length)?m.cols.filter(function(c){return s.indexOf(c)>-1;}):m.cols;}
function isAdmin(){return S.user&&S.user.role==='Администратор';}
function visible(){return MODS.filter(function(m){return !m.adminOnly||isAdmin();});}

/* ---------- вход ---------- */
function doLogin(){
  var l=$('#li').value.trim(),p=$('#pi').value,err=$('#le'),btn=$('#lb');
  err.textContent='';
  if(!l||!p){err.textContent='Введите логин и пароль';return;}
  btn.disabled=true;btn.classList.add('busy');
  api('login',{login:l,password:p}).then(function(r){
    S.user=r.user;S.token=r.token;
    try{localStorage.setItem('sr5_sess',JSON.stringify({user:S.user,token:S.token,at:Date.now()}));}catch(e){}
    enterApp();
  }).catch(function(e){err.textContent=e.message;})
    .then(function(){btn.disabled=false;btn.classList.remove('busy');});
}
function logout(){
  S.user=null;S.token=null;S.snap={};S.sel.clear();NOTIF=[];
  try{localStorage.removeItem('sr5_sess');}catch(e){}
  $('#app').style.display='none';$('#login').style.display='flex';$('#pi').value='';
  Pal.close();Notif.close();
}
function enterApp(){
  $('#login').style.display='none';$('#app').style.display='block';
  $('#un').textContent=S.user.fio||S.user.login;$('#ur').textContent=S.user.role;
  buildNav();buildSheet();loadData();
}
function skeleton(){var h=$('#host');if(h)h.innerHTML='<div class="sk-wrap">'+
  Array.from({length:6}).map(function(){return '<div class="sk-row"><span class="sk"></span><span class="sk b"></span><span class="sk c"></span></div>';}).join('')+'</div>';}
function fail(msg){var h=$('#host');if(h)h.innerHTML='<div class="empty"><div class="empty-i">⚠️</div><h3>Нет данных</h3><p>'+esc(msg)+
  '</p><button class="btn primary" onclick="loadData()">Повторить</button></div>';}

/* ---------- уведомления ---------- */
var NOTIF=[];
function buildNotif(){
  var out=[],th=S.prefs.dash.threshold;
  function push(k,mod,id,title,sub,d){out.push({key:mod+':'+id+':'+k,kind:k,mod:mod,id:id,title:title,sub:sub,days:d});}
  rows('prescriptions').forEach(function(p){var d=daysLeft(p['Срок_исполнения']);
    if(p['Статус']!=='Исполнено'&&d!==null&&d<=th)push(d<0?'late':'soon','prescriptions',p.ID||p['ID'],'Предписание '+p['Номер'],p['Тип'],d);});
  rows('supervision').forEach(function(p){var d=daysLeft(p['Срок_устранения']);
    if(p['Статус']!=='Устранено'&&d!==null&&d<=th)push(d<0?'late':'soon','supervision',p.ID,'Авторский надзор',short(p['Описание'],42),d);});
  rows('certs').forEach(function(c){var d=daysLeft(c['Срок_действия']);
    if(d!==null&&d<=30&&c['Статус']!=='Отозван')push(d<0?'late':'soon','certs',c.ID,c['Тип'],label('personnel',c['ID_Сотрудника']),d);});
  rows('reminders').forEach(function(r){var d=daysLeft(r['Дата']);
    if(r['Статус']!=='Выполнено'&&d!==null&&d<=th)push(d<0?'late':'soon','reminders',r.ID,r['Тип'],short(r['Объект'],40),d);});
  rows('tasks').forEach(function(t){var d=daysLeft(t['Дедлайн']);
    if(['Выполнено','Отклонено'].indexOf(t['Статус'])<0&&d!==null&&d<=th)push(d<0?'late':'soon','tasks',t.ID,short(t['Тема'],40),t['Кому'],d);});
  rows('submissions').forEach(function(s){if(s['Статус']==='На_проверке')
    push('review','submissions',s.ID,'Подача '+s.ID,label('items',s['ID_Позиции'])+' · '+s['Объём_подан'],null);});
  rows('documents').forEach(function(x){if(x['Согласование']==='Замечания')
    push('remark','documents',x['ID_Документа'],x['Тип_документа']+' №'+(x['Номер']||'—'),short(x['Наименование'],40),null);});
  rows('preservation').forEach(function(p){if(/Аварийное|Утрачено/.test(p['Сохранность']))
    push('remark','preservation',p.ID,'Охрана: '+short(p['Название'],32),p['Сохранность'],null);});
  var rank={late:0,review:1,remark:2,soon:3};
  out.sort(function(a,b){return (rank[a.kind]-rank[b.kind])||((a.days==null?999:a.days)-(b.days==null?999:b.days));});
  NOTIF=out;
}
function unread(){return NOTIF.filter(function(n){return !S.read[n.key];}).length;}
function paintNotif(){var b=$('#nb'),n=unread();
 if(b){b.textContent=n>99?'99+':(n||'');b.classList.toggle('show',n>0);}
 var bell=$('#bell');if(bell)bell.classList.toggle('ring',NOTIF.some(function(x){return x.kind==='late'&&!S.read[x.key];}));}
var Notif={
  open:function(){S.notifOpen=true;buildNotif();$('#notif').classList.add('on');$('#scrim').classList.add('on');
    document.body.classList.add('lock');Notif.render();},
  close:function(){S.notifOpen=false;$('#notif').classList.remove('on');$('#scrim').classList.remove('on');unlock();},
  render:function(){
    var gs=[['late','Просрочено','bad'],['review','Ждут проверки','warn'],['remark','Замечания и охрана','bad'],['soon','Близкие сроки','warn']],h='';
    if(!NOTIF.length)h='<div class="empty"><div class="empty-i">✅</div><h3>Всё под контролем</h3><p>Просрочек и близких сроков нет.</p></div>';
    gs.forEach(function(g){
      var list=NOTIF.filter(function(n){return n.kind===g[0];});if(!list.length)return;
      h+='<div class="ntg"><div class="nth"><span class="chip '+g[2]+'">'+g[1]+'</span><em>'+list.length+'</em>'+
        '<button class="btn ghost sm" onclick="Notif.markGroup(\''+g[0]+'\')">Прочитано</button></div>';
      list.forEach(function(n){var m=M[n.mod]||{i:'📄'};
        h+='<button class="nti'+(S.read[n.key]?' read':'')+'" onclick="Notif.jump(\''+n.mod+'\',\''+esc(n.id)+'\',\''+n.key+'\')">'+
          '<span class="nti-i">'+m.i+'</span><span class="nti-t"><b>'+esc(n.title)+'</b><i>'+esc(n.sub||'')+'</i></span>'+
          (n.days!=null?'<span class="ntd '+(n.days<0?'late':'soon')+'">'+(n.days<0?'−'+Math.abs(n.days):'+'+n.days)+' дн</span>':'')+'</button>';});
      h+='</div>';});
    $('#nb2').innerHTML=h;$('#nc').textContent=NOTIF.length+' событий · '+unread()+' новых';
  },
  markGroup:function(k){NOTIF.forEach(function(n){if(n.kind===k)S.read[n.key]=1;});saveRead();Notif.render();paintNotif();},
  markAll:function(){NOTIF.forEach(function(n){S.read[n.key]=1;});saveRead();Notif.render();paintNotif();toast('Отмечено','ok');},
  jump:function(mod,id,key){S.read[key]=1;saveRead();paintNotif();Notif.close();go(mod);setTimeout(function(){Drawer.open(mod,id);},90);}
};

/* ---------- навигация ---------- */
function buildNav(){
  var host=$('#nav');host.innerHTML='';
  GROUPS.forEach(function(g){
    var mods=visible().filter(function(m){return m.g===g[0];});if(!mods.length)return;
    var sec=document.createElement('section');sec.className='ng';
    sec.innerHTML='<div class="ng-l">'+esc(g[1])+'</div>';
    var row=document.createElement('div');row.className='ng-r';
    mods.forEach(function(m){
      var b=document.createElement('button');b.className='tab'+(m.id===S.mod?' on':'');b.dataset.mod=m.id;
      b.innerHTML='<span>'+m.i+'</span><span>'+esc(m.t)+'</span><span class="tab-n" data-badge="'+m.id+'"></span>';
      b.onclick=function(){go(m.id);};row.appendChild(b);});
    sec.appendChild(row);host.appendChild(sec);});
}
function paintBadges(){
  $$('[data-badge]').forEach(function(el){
    var id=el.dataset.badge,m=M[id],n=0,hot=false;
    if(id==='trash')n=Object.keys(S.trash).reduce(function(a,k){return a+S.trash[k].length;},0);
    else if(id==='submissions'){n=rows('submissions').filter(function(r){return r['Статус']==='На_проверке';}).length;hot=n>0;}
    else if(m&&!m.special)n=rows(id).length;
    el.textContent=n||'';el.classList.toggle('show',!!n);el.classList.toggle('hot',hot);});
}
function buildSheet(){
  var host=$('#sb2');host.innerHTML='';
  GROUPS.forEach(function(g){
    var mods=visible().filter(function(m){return m.g===g[0];});if(!mods.length)return;
    var s=document.createElement('div');s.className='sg';s.innerHTML='<div class="sg-l">'+esc(g[1])+'</div>';
    var grid=document.createElement('div');grid.className='sg-g';
    mods.forEach(function(m){var b=document.createElement('button');b.className='si';
      b.innerHTML='<span>'+m.i+'</span><b>'+esc(m.t)+'</b>';
      b.onclick=function(){go(m.id);closeSheet();};grid.appendChild(b);});
    s.appendChild(grid);host.appendChild(s);});
}
function openSheet(){$('#sheet').classList.add('on');document.body.classList.add('lock');}
function closeSheet(){$('#sheet').classList.remove('on');unlock();}
function unlock(){if(!$('#modal').classList.contains('on')&&!$('#drawer').classList.contains('on')&&!S.palOpen&&!S.notifOpen&&!$('#sheet').classList.contains('on'))document.body.classList.remove('lock');}
function go(id){if(!M[id])return;S.mod=id;S.sel.clear();S.order=false;S.focus=-1;S.lastSel=-1;
 $$('.tab').forEach(function(t){t.classList.toggle('on',t.dataset.mod===id);});
 $$('.mn').forEach(function(t){t.classList.toggle('on',t.dataset.mod===id);});
 render();window.scrollTo({top:0,behavior:'smooth'});}
function fab(){var m=M[S.mod];if(m&&!m.special)Form.open(m.id,null);else{go('contracts');Form.open('contracts',null);}}

/* ---------- рендер ---------- */
function render(){
  var m=M[S.mod];if(!m)return;
  var head='<div class="mh"><div><h1><span class="mh-i">'+m.i+'</span>'+esc(m.t)+'</h1><div class="mh-s" id="ms"></div></div><div class="mh-a" id="ma"></div></div>';
  if(m.special){$('#host').innerHTML=head+'<div id="body"></div>';
    $('#ms').textContent={dashboard:'Живая сводка · панель справа',progress:'Выполнение и подача КС-2 параллельно',
      trash:'Удалённые записи можно вернуть',journal:'Кто, что и когда изменил',admin:'Учётные записи и роли'}[m.special]||'';
    $('#ma').innerHTML='<button class="btn ghost" onclick="loadData()">⟳ Обновить</button>';
    renderSpecial(m);paintBadges();return;}
  $('#host').innerHTML=head+'<div class="tb" id="tb"></div><div class="bulk" id="bulk"></div><div id="body"></div>';
  $('#ms').textContent=rows(m.id).length+' записей';
  $('#ma').innerHTML='<button class="btn primary" onclick="Form.open(\''+m.id+'\',null)">＋ Создать</button>'+
    '<button class="btn ghost" onclick="exportCur(\'xls\')">⤓ Excel</button>'+
    '<button class="btn ghost" onclick="exportCur(\'csv\')">⤓ CSV</button>'+
    '<button class="btn ghost" onclick="printReg()">🖨</button>';
  toolbar(m);bulkBar(m);list(m);paintBadges();
}
function fname(m,c){var f=(m.f||[]).filter(function(x){return x.k===c;})[0];return f?f.l:c;}
function toolbar(m){
  var v=S.views[m.id]&&S.views[m.id].active?S.views[m.id].list[S.views[m.id].active]:null;
  if(v&&S.q[m.id]===undefined&&S.filter[m.id]===undefined){S.q[m.id]=v.q||'';S.filter[m.id]=v.status||'';S.sort[m.id]=v.sort||null;}
  var q=S.q[m.id]||'',sc=(S.sort[m.id]||{}).col||'',names=Object.keys((S.views[m.id]||{}).list||{});
  var h='<div class="tb-s"><span>🔍</span><input id="q" placeholder="Поиск в разделе · Ctrl+K — по всей системе" value="'+esc(q)+'"></div>';
  if(m.st)h+='<select id="fs" class="tb-sel"><option value="">Все статусы</option>'+
    m.st.map(function(s){return '<option'+(S.filter[m.id]===s?' selected':'')+'>'+esc(s)+'</option>';}).join('')+'</select>';
  h+='<select id="fo" class="tb-sel"><option value="">Сортировка</option>'+
    m.cols.map(function(c){return '<option value="'+esc(c)+'"'+(sc===c?' selected':'')+'>по «'+esc(fname(m,c))+'»</option>';}).join('')+'</select>';
  h+='<button class="btn ghost sm" id="bd">'+(((S.sort[m.id]||{}).dir||'desc')==='desc'?'↓':'↑')+'</button>';
  if(m.orderK)h+='<button class="btn '+(S.order?'warn':'ghost')+' sm" id="bo">⇅ Порядок</button>';
  h+='<div class="pw"><button class="btn ghost sm" id="bc">▦ Колонки</button><div class="pop" id="cp">'+
    m.cols.map(function(c){return '<label class="chk"><input type="checkbox" class="cc" value="'+esc(c)+'"'+
      (colsOf(m).indexOf(c)>-1?' checked':'')+'><i></i><span>'+esc(fname(m,c))+'</span></label>';}).join('')+
    '<button class="btn ghost sm" id="bca">Все колонки</button></div></div>';
  h+='<div class="seg">'+['compact','normal','roomy'].map(function(d){
    return '<button class="seg-b'+(S.prefs.density===d?' on':'')+'" data-d="'+d+'">'+({compact:'▤',normal:'▦',roomy:'▩'}[d])+'</button>';}).join('')+'</div>';
  h+='<select id="fv" class="tb-sel"><option value="">Виды…</option>'+
    names.map(function(n){return '<option'+(((S.views[m.id]||{}).active===n)?' selected':'')+'>'+esc(n)+'</option>';}).join('')+'</select>';
  h+='<button class="btn ghost sm" id="bsv">💾</button>';
  if(names.length)h+='<button class="btn ghost sm" id="bdv">🗑</button>';
  h+='<span class="tb-c" id="cnt"></span>';
  var tb=$('#tb');tb.innerHTML=h;
  var qi=$('#q');qi.oninput=debounce(function(){S.q[m.id]=qi.value;S.page[m.id]=1;list(m);},160);
  if($('#fs'))$('#fs').onchange=function(){S.filter[m.id]=this.value;S.page[m.id]=1;list(m);};
  $('#fo').onchange=function(){S.sort[m.id]={col:this.value,dir:(S.sort[m.id]||{}).dir||'desc'};toolbar(m);list(m);};
  $('#bd').onclick=function(){var s=S.sort[m.id]||{col:m.cols[0],dir:'desc'};s.dir=s.dir==='desc'?'asc':'desc';S.sort[m.id]=s;toolbar(m);list(m);};
  if($('#bo'))$('#bo').onclick=function(){S.order=!S.order;
    if(S.order){S.sort[m.id]={col:m.orderK,dir:'asc'};S.q[m.id]='';S.filter[m.id]='';toast('Перетаскивайте строки','info');}
    toolbar(m);list(m);};
  $('#bc').onclick=function(e){$('#cp').classList.toggle('on');e.stopPropagation();};
  $('#bca').onclick=function(){S.cols[m.id]=m.cols.slice();saveCols();toolbar(m);$('#cp').classList.add('on');list(m);};
  $$('.cc').forEach(function(c){c.onchange=function(){
    var sel=$$('.cc').filter(function(x){return x.checked;}).map(function(x){return x.value;});
    S.cols[m.id]=sel.length?sel:[m.cols[0]];saveCols();list(m);};});
  $$('[data-d]').forEach(function(b){b.onclick=function(){S.prefs.density=b.dataset.d;savePrefs();applyDens();toolbar(m);list(m);};});
  $('#fv').onchange=function(){var n=this.value;S.views[m.id]=S.views[m.id]||{list:{}};S.views[m.id].active=n||null;
    var vv=n?S.views[m.id].list[n]:null;S.q[m.id]=vv?vv.q:'';S.filter[m.id]=vv?vv.status:'';S.sort[m.id]=vv?vv.sort:null;
    saveViews();toolbar(m);list(m);};
  $('#bsv').onclick=function(){var n=prompt('Название вида:','Мой вид');if(!n)return;
    S.views[m.id]=S.views[m.id]||{list:{}};
    S.views[m.id].list[n]={q:S.q[m.id]||'',status:S.filter[m.id]||'',sort:S.sort[m.id]||null};
    S.views[m.id].active=n;saveViews();toolbar(m);toast('Вид сохранён','ok');};
  if($('#bdv'))$('#bdv').onclick=function(){var n=(S.views[m.id]||{}).active;if(!n){toast('Выберите вид','warn');return;}
    delete S.views[m.id].list[n];S.views[m.id].active=null;saveViews();toolbar(m);toast('Вид удалён','ok');};
}
function selectRows(m){
  var a=rows(m.id).slice(),q=(S.q[m.id]||'').trim().toLowerCase(),f=S.filter[m.id]||'',s=S.sort[m.id];
  if(q)a=a.filter(function(r){for(var k in r){if(String(r[k]).toLowerCase().indexOf(q)>-1)return true;}return false;});
  if(f&&m.sK)a=a.filter(function(r){return String(r[m.sK])===f;});
  if(s&&s.col){var dir=s.dir==='asc'?1:-1;
    a.sort(function(x,y){var A=x[s.col],B=y[s.col],na=parseFloat(A),nb=parseFloat(B);
      if(!isNaN(na)&&!isNaN(nb)&&String(A).trim()!==''&&String(B).trim()!=='')return (na-nb)*dir;
      return String(A==null?'':A).localeCompare(String(B==null?'':B),'ru')*dir;});}
  return a;
}
function kind(v){var s=String(v||'');
 if(/Согласован|Подтверждено|Выполнено|Закрыто|Победа|Принято|Оплачена|Доставлено|Активен|Действует|Работает|Исполнено|Утвержд|Сдан|Проведена|Устранено|Отличное|Удовлетвор|^Да$/.test(s))return 'ok';
 if(/проверке|разработке|согласовании|работе|пути|Подана|Подано|Выдан|Заказан|Ожидает|Новое|Отпуск|Подготовка|Мониторинг|Активно|Истекает|Требует/.test(s))return 'warn';
 if(/Замечания|Отклонен|Отказ|Просрочен|Утерян|Выговор|Уволен|Отмен|Аварийное|Утрачено|Не_устранено|Отозван/.test(s))return 'bad';
 return 'neutral';}
function cellHtml(m,c,r){
  var v=r[c];
  if(c===m.sK)return '<span class="chip '+kind(v)+'">'+esc(v||'—')+'</span>';
  if(c==='Согласовано_КГИОП')return v==='Да'?'<span class="chip ok">Да</span>':'<span class="chip neutral">Нет</span>';
  if(c===m.money||/^(Сумма|Общая_сумма|Наша_цена|Начальная_цена|Цена|Цена_за_ед|Сумма_договорная|Сумма_закрытая)$/.test(c))
    return '<b class="num">'+(v!==''&&v!=null?money(v):'—')+'</b>';
  if(/Дата|Дедлайн|Срок/.test(c)){
    var d=daysLeft(v);
    if(m.deadline===c&&d!==null&&d<=S.prefs.dash.threshold&&!/Выполнено|Исполнено|Устранено|Закрыто/.test(String(r[m.sK])))
      return '<span class="dt '+(d<0?'late':'soon')+'">'+esc(dstr(v))+' <i>'+(d<0?Math.abs(d)+' дн. назад':d+' дн.')+'</i></span>';
    return '<span class="dt">'+esc(dstr(v)||'—')+'</span>';}
  if(/^ID_/.test(c)){
    var map={'ID_Договора':'contracts','ID_Позиции':'items','ID_Сметы':'estimates','ID_Проекта':'architecture',
      'ID_Подрядчика':'contractors','ID_Сотрудника':'personnel','ID_КС2':'ks2','ID_Объекта':'objects','ID_Работы':'works'};
    if(map[c])return '<span class="ref">'+esc(short(label(map[c],v),26)||'—')+'</span>';}
  if(c==='Приоритет')return '<span class="chip '+(/Срочный/.test(v)?'bad':/Высокий/.test(v)?'warn':'neutral')+'">'+esc(v||'—')+'</span>';
  if(c==='Закрыто_объём'){var t=num(r['Количество']||r['Договорной_объём']),dd=num(v),p=t?Math.min(100,Math.round(dd/t*100)):0;
    return '<div class="mini"><div class="mini-b"><i style="width:'+p+'%"></i></div><span>'+dd+'/'+t+'</span></div>';}
  if(m.avatar===c)return '<div class="who"><span class="ava">'+esc(initials(v))+'</span><b>'+esc(v||'—')+'</b></div>';
  return esc(short(v,60)||'—');
}
function list(m){
  var all=selectRows(m),page=S.page[m.id]||1,lim=page*40,slice=all.slice(0,lim),cols=colsOf(m);
  var cnt=$('#cnt');if(cnt)cnt.textContent=all.length+' из '+rows(m.id).length;
  var host=$('#body');if(!host)return;
  if(!all.length){host.innerHTML='<div class="empty"><div class="empty-i">'+m.i+'</div><h3>Ничего не найдено</h3><p>'+
    ((S.q[m.id]||S.filter[m.id])?'Измените запрос или сбросьте фильтр.':'Создайте первую запись.')+'</p>'+
    ((S.q[m.id]||S.filter[m.id])?'<button class="btn ghost" onclick="resetF()">Сбросить</button>':
     '<button class="btn primary" onclick="Form.open(\''+m.id+'\',null)">＋ Создать</button>')+'</div>';return;}
  var drag=S.order&&!!m.orderK,h;
  if(isMob()){
    h='<div class="cards">'+slice.map(function(r,i){
      var id=r[m.idK],on=S.sel.has(String(id));
      return '<article class="rc'+(on?' sel':'')+'" data-id="'+esc(id)+'" data-i="'+i+'">'+
        '<div class="rc-t"><label class="cb"><input type="checkbox" data-a="sel" data-id="'+esc(id)+'"'+(on?' checked':'')+'><i></i></label>'+
        '<button class="rc-ti" data-a="open" data-id="'+esc(id)+'">'+esc(short(r[m.tK]||id,56))+'</button>'+
        (m.sK?'<span class="chip '+kind(r[m.sK])+'">'+esc(short(r[m.sK],14)||'—')+'</span>':'')+'</div>'+
        '<div class="rc-g">'+cols.filter(function(c){return c!==m.tK&&c!==m.sK;}).slice(0,4).map(function(c){
          return '<div><span>'+esc(fname(m,c))+'</span>'+cellHtml(m,c,r)+'</div>';}).join('')+'</div>'+
        '<div class="rc-f"><span class="fid">'+esc(id)+'</span><span class="grow"></span>'+
        '<button class="btn ghost sm" data-a="edit" data-id="'+esc(id)+'">✎</button>'+
        '<button class="btn danger sm" data-a="del" data-id="'+esc(id)+'">🗑</button></div></article>';}).join('')+'</div>';
  }else{
    var allOn=slice.length&&slice.every(function(r){return S.sel.has(String(r[m.idK]));});
    h=(drag?'<div class="hint">⇅ Перетащите строки — порядок сохранится в смете и на графике прогресса.</div>':'')+
      '<div class="tw"><table class="grid'+(drag?' drag':'')+'"><thead><tr>'+(drag?'<th class="c-dh"></th>':'')+
      '<th class="c-cb"><label class="cb"><input type="checkbox" data-a="selall"'+(allOn?' checked':'')+'><i></i></label></th>'+
      '<th class="c-id">ID</th>'+cols.map(function(c){
        return '<th class="s'+(((S.sort[m.id]||{}).col===c)?' act':'')+'" data-a="sort" data-col="'+esc(c)+'">'+esc(fname(m,c))+
          (((S.sort[m.id]||{}).col===c)?(((S.sort[m.id]||{}).dir==='asc')?' ↑':' ↓'):'')+'</th>';}).join('')+
      '<th class="c-a"></th></tr></thead><tbody>'+
      slice.map(function(r,i){var id=r[m.idK],on=S.sel.has(String(id));
        return '<tr class="'+(on?'sel':'')+(i===S.focus?' foc':'')+'" data-id="'+esc(id)+'" data-i="'+i+'"'+(drag?' draggable="true"':'')+'>'+
          (drag?'<td class="c-dh"><span class="dh">⠿</span></td>':'')+
          '<td class="c-cb"><label class="cb"><input type="checkbox" data-a="sel" data-id="'+esc(id)+'"'+(on?' checked':'')+'><i></i></label></td>'+
          '<td class="c-id"><button class="idb" data-a="open" data-id="'+esc(id)+'">'+esc(id)+'</button></td>'+
          cols.map(function(c){return '<td>'+cellHtml(m,c,r)+'</td>';}).join('')+
          '<td class="c-a"><div class="acts">'+
          '<button class="btn ghost sm" data-a="open" data-id="'+esc(id)+'">👁</button>'+
          '<button class="btn ghost sm" data-a="edit" data-id="'+esc(id)+'">✎</button>'+
          '<button class="btn danger sm" data-a="del" data-id="'+esc(id)+'">🗑</button></div></td></tr>';}).join('')+
      '</tbody></table></div><div class="kb-hint">↑↓ строка · Enter карточка · E правка · Space выбор · Del удалить</div>';
  }
  if(all.length>lim)h+='<div class="more"><button class="btn ghost" data-a="more">Показать ещё '+Math.min(40,all.length-lim)+' из '+(all.length-lim)+'</button></div>';
  host.innerHTML=h;
  host.onclick=function(e){bodyClick(e,m);};
  if(drag){
    host.ondragstart=function(e){var tr=e.target.closest('tr[data-id]');if(!tr)return;
      S.drag=tr.dataset.id;tr.classList.add('src');e.dataTransfer.effectAllowed='move';
      try{e.dataTransfer.setData('text/plain',S.drag);}catch(x){}};
    host.ondragover=function(e){if(!S.drag)return;e.preventDefault();
      var tr=e.target.closest('tr[data-id]');if(!tr||tr.dataset.id===S.drag)return;
      $$('tr.over').forEach(function(x){x.classList.remove('over');});tr.classList.add('over');};
    host.ondragend=function(){S.drag=null;$$('.src,.over').forEach(function(x){x.classList.remove('src','over');});};
    host.ondrop=function(e){dropRow(e,m);};
  }else{host.ondragstart=host.ondragover=host.ondrop=host.ondragend=null;}
}
function resetF(){var m=M[S.mod];S.q[m.id]='';S.filter[m.id]='';S.page[m.id]=1;toolbar(m);list(m);}
function bodyClick(e,m){
  var t=e.target.closest('[data-a]');if(!t)return;
  var a=t.dataset.a,id=t.dataset.id;
  if(a==='more'){S.page[m.id]=(S.page[m.id]||1)+1;list(m);return;}
  if(a==='sort'){var c=t.dataset.col,s=S.sort[m.id]||{};S.sort[m.id]={col:c,dir:s.col===c&&s.dir==='desc'?'asc':'desc'};toolbar(m);list(m);return;}
  if(a==='sel'){
    var all=selectRows(m).slice(0,(S.page[m.id]||1)*40),idx=-1;
    for(var i=0;i<all.length;i++)if(String(all[i][m.idK])===String(id)){idx=i;break;}
    if(e.shiftKey&&S.lastSel>-1){var a1=Math.min(S.lastSel,idx),b1=Math.max(S.lastSel,idx);
      for(var j=a1;j<=b1;j++)S.sel.add(String(all[j][m.idK]));}
    else{if(S.sel.has(String(id)))S.sel.delete(String(id));else S.sel.add(String(id));}
    S.lastSel=idx;S.focus=idx;bulkBar(m);list(m);return;}
  if(a==='selall'){var all2=selectRows(m).slice(0,(S.page[m.id]||1)*40);
    var on=all2.every(function(r){return S.sel.has(String(r[m.idK]));});
    all2.forEach(function(r){if(on)S.sel.delete(String(r[m.idK]));else S.sel.add(String(r[m.idK]));});
    bulkBar(m);list(m);return;}
  if(a==='open'){Drawer.open(m.id,id);return;}
  if(a==='edit'){Form.open(m.id,id);return;}
  if(a==='del'){if(confirm('Удалить '+id+'? Запись попадёт в корзину.'))del(m.id,[id]);}
}
function dropRow(e,m){
  if(!S.drag)return;e.preventDefault();
  var tr=e.target.closest('tr[data-id]'),from=S.drag;
  S.drag=null;$$('.src,.over').forEach(function(x){x.classList.remove('src','over');});
  if(!tr||tr.dataset.id===from)return;
  var all=selectRows(m),fi=-1,ti=-1;
  all.forEach(function(r,i){if(String(r[m.idK])===String(from))fi=i;if(String(r[m.idK])===String(tr.dataset.id))ti=i;});
  if(fi<0||ti<0)return;
  var moved=all.splice(fi,1)[0];all.splice(ti,0,moved);
  var ids=all.map(function(r){return r[m.idK];});
  ids.forEach(function(id,i){var r=find(m.id,id);if(r)r[m.orderK]=i+1;});
  list(m);
  api('reorder',{module:m.id,ids:ids}).then(function(){toast('Порядок сохранён','ok');return fetchSnap();})
    .then(function(){render();}).catch(function(e){toast(e.message,'bad');loadData();});
}
function bulkBar(m){
  var n=S.sel.size,bar=$('#bulk');if(!bar)return;
  if(!n){bar.innerHTML='';bar.classList.remove('on');return;}
  bar.classList.add('on');
  var h='<b>'+n+'</b> выбрано<button class="btn danger sm" id="bdl">🗑 Удалить</button>';
  if(m.sK)h+='<select id="bst" class="tb-sel"><option value="">Статус…</option>'+
    m.st.map(function(s){return '<option>'+esc(s)+'</option>';}).join('')+'</select><button class="btn ghost sm" id="bsg">Применить</button>';
  h+='<button class="btn ghost sm" id="bcl">Снять</button>';
  bar.innerHTML=h;
  $('#bdl').onclick=function(){if(confirm('Удалить '+n+' записей?'))del(m.id,Array.from(S.sel));};
  $('#bcl').onclick=function(){S.sel.clear();bulkBar(m);list(m);};
  if($('#bsg'))$('#bsg').onclick=function(){
    var v=$('#bst').value;if(!v){toast('Выберите статус','warn');return;}
    var ids=Array.from(S.sel),patch={};patch[m.sK]=v;
    ids.forEach(function(id){var r=find(m.id,id);if(r)r[m.sK]=v;});
    list(m);
    var chain=Promise.resolve();
    ids.forEach(function(id){chain=chain.then(function(){return api('updateRecord',{module:m.id,id:id,values:patch});});});
    chain.then(function(){toast('Статус обновлён: '+ids.length,'ok');S.sel.clear();bulkBar(m);return fetchSnap();})
      .then(function(){render();paintNotif();}).catch(function(e){toast(e.message,'bad');loadData();});};
}
function del(mod,ids){
  api('deleteRecords',{module:mod,ids:ids}).then(function(){
    S.sel.clear();toast(M[mod].t+': удалено '+ids.length,'warn','Отменить',function(){
      api('restoreRecords',{module:mod,ids:ids}).then(function(){return fetchSnap();})
        .then(function(){render();paintNotif();toast('Восстановлено','ok');}).catch(function(e){toast(e.message,'bad');});
    });
    return fetchSnap();
  }).then(function(){render();paintNotif();}).catch(function(e){toast(e.message,'bad');});
}

/* ---------- форма ---------- */
var Form={
  ctx:null,
  open:function(mod,id){
    var m=M[mod];if(!m||!m.f)return;
    var rec=id?find(mod,id):null;
    Form.ctx={mod:mod,id:id||null};
    $('#mt').innerHTML=(rec?'✎ ':'＋ ')+esc(m.t)+(rec?' · '+esc(id):'');
    var h='<form class="form" onsubmit="return false">'+m.f.map(function(f){return fieldHtml(m,f,rec);}).join('');
    if(m.calc)h+='<div class="note" id="calcNote">Сумма считается автоматически.</div>';
    h+='</form>';
    $('#mb').innerHTML=h;
    $('#mf').innerHTML='<button class="btn ghost" onclick="Form.close()">Отмена</button>'+
      '<button class="btn primary" id="fs2">'+(rec?'Сохранить':'Создать')+'</button>';
    $('#fs2').onclick=Form.submit;
    $('#modal').classList.add('on');document.body.classList.add('lock');
    if(m.calc){var a=$('#f_'+m.calc[0]),b=$('#f_'+m.calc[1]);
      var upd=function(){var n=$('#calcNote');if(n)n.textContent='Сумма: '+money(num(a.value)*num(b.value));};
      if(a&&b){a.oninput=upd;b.oninput=upd;upd();}}
    setTimeout(function(){var el=$('#mb input, #mb select, #mb textarea');if(el)el.focus();},60);
  },
  close:function(){$('#modal').classList.remove('on');unlock();Form.ctx=null;},
  submit:function(){
    if(!Form.ctx)return;
    var m=M[Form.ctx.mod],vals={};
    for(var i=0;i<m.f.length;i++){
      var f=m.f[i],el=$('#f_'+f.k);if(!el)continue;
      var v=el.value;if(f.t==='number')v=v===''?'':num(v);
      if(f.req&&(v===''||v==null)){el.classList.add('bad');el.focus();toast('Заполните «'+f.l+'»','warn');return;}
      el.classList.remove('bad');vals[f.k]=v;
    }
    var btn=$('#fs2');btn.disabled=true;btn.classList.add('busy');
    var p=Form.ctx.id
      ? api('updateRecord',{module:Form.ctx.mod,id:Form.ctx.id,values:vals})
      : api('createRecord',{module:Form.ctx.mod,values:vals});
    p.then(function(r){
      toast(Form.ctx.id?'Изменения сохранены':'Создано: '+(r.id||''),'ok');
      var opened=Form.ctx.id||(r&&r.id);var mod=Form.ctx.mod;
      Form.close();return fetchSnap().then(function(){render();paintNotif();
        if(opened&&S.mod===mod)Drawer.open(mod,opened);});
    }).catch(function(e){toast(e.message,'bad');})
      .then(function(){if(btn){btn.disabled=false;btn.classList.remove('busy');}});
  }
};
function fieldHtml(m,f,rec){
  var id='f_'+f.k,v=rec?rec[f.k]:'';
  var req=f.req?' <em>*</em>':'',opts=f.opts||(f.k===m.sK?m.st:null),inp;
  if(f.t==='textarea')inp='<textarea id="'+id+'" rows="3">'+esc(v==null?'':v)+'</textarea>';
  else if(f.t==='select'&&opts)inp='<select id="'+id+'"><option value="">—</option>'+
    opts.map(function(o){return '<option'+(String(v)===String(o)?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select>';
  else if(f.t==='ref'){var arr=rows(f.ref);
    inp='<select id="'+id+'"><option value="">— не выбрано —</option>'+arr.map(function(r){
      return '<option value="'+esc(r[f.rid])+'"'+(String(v)===String(r[f.rid])?' selected':'')+'>'+
        esc(short(r[f.rl]||r[f.rid],52))+' · '+esc(r[f.rid])+'</option>';}).join('')+'</select>';}
  else if(f.t==='date')inp='<input id="'+id+'" type="date" value="'+esc(dstr(v))+'">';
  else if(f.t==='number')inp='<input id="'+id+'" type="number" step="any" value="'+esc(v===''||v==null?'':num(v))+'">';
  else inp='<input id="'+id+'" type="'+(f.t==='email'?'email':'text')+'" value="'+esc(v==null?'':v)+'">';
  return '<div class="fg'+(f.wide?' wide':'')+'"><label for="'+id+'">'+esc(f.l)+req+'</label>'+inp+'</div>';
}

/* ---------- карточка ---------- */
var Drawer={
  open:function(mod,id){
    var m=M[mod],r=find(mod,id);
    if(!m||!r){toast('Запись не найдена','warn');return;}
    S.drawer={mod:mod,id:id};
    $('#dt').innerHTML='<span class="sh-i">'+m.i+'</span><div style="min-width:0"><b>'+esc(short(r[m.tK]||id,48))+
      '</b><span>'+esc(m.t)+' · '+esc(id)+'</span></div>';
    var h='<div class="dgr">'+(m.f||[]).map(function(f){
      var v=r[f.k],inner;
      if(f.k===m.sK)inner='<span class="chip '+kind(v)+'">'+esc(v||'—')+'</span>';
      else if(f.t==='ref')inner='<b>'+esc(label(f.ref,v)||'—')+'</b>';
      else if(f.k===m.money||/^(Сумма|Общая_сумма|Цена|Наша_цена|Сумма_договорная)$/.test(f.k))inner='<b class="num">'+(v!==''&&v!=null?money(v):'—')+'</b>';
      else if(f.t==='date')inner='<b>'+esc(dstr(v)||'—')+'</b>';
      else inner='<b>'+esc(v===''||v==null?'—':v)+'</b>';
      return '<div class="dc'+(f.wide?' wide':'')+'"><span>'+esc(f.l)+'</span><div>'+inner+'</div></div>';}).join('')+'</div>';
    if(m.review&&r['Статус']==='На_проверке'){
      h+='<div class="rev"><div class="dst">Проверка объёма · ПТО</div>'+
        '<div class="rev-r"><label>Подтвердить объём</label><input id="rv" type="number" step="any" value="'+esc(num(r['Объём_подан']))+'"></div>'+
        '<div class="rev-r"><label>Комментарий</label><textarea id="rn" rows="2" placeholder="Причина корректировки или отказа"></textarea></div>'+
        '<div class="rev-a"><button class="btn ok" onclick="review(\''+esc(id)+'\',\'Подтверждено\')">✓ Подтвердить</button>'+
        '<button class="btn warn" onclick="review(\''+esc(id)+'\',\'Отредактировано\')">✎ Скорректировать</button>'+
        '<button class="btn danger" onclick="review(\''+esc(id)+'\',\'Отклонено\')">✕ Отклонить</button></div></div>';
    }
    if(m.review&&r['Статус']!=='На_проверке'){
      h+='<div class="dbl"><div class="dst">Результат проверки</div>'+
        '<div class="drw"><span>Проверил</span><b>'+esc(r['Кто_проверил']||'—')+'</b></div>'+
        '<div class="drw"><span>Когда</span><b>'+esc(r['Дата_проверки']||'—')+'</b></div>'+
        '<div class="drw"><span>Зачтено</span><b>'+esc(r['Скорректированный_объём']===''?'—':r['Скорректированный_объём'])+'</b></div></div>';
    }
    if(m.id==='items'||m.id==='works'){
      var t=num(r['Количество']||r['Договорной_объём']),d=num(r['Закрыто_объём']),p=t?Math.min(100,Math.round(d/t*100)):0;
      h+='<div class="dbl"><div class="dst">Закрытие объёма</div><div class="bb"><i style="width:'+p+'%"></i><span>'+
        d+' / '+t+' '+esc(r['Ед_изм']||'')+' · '+p+'%</span></div>'+
        (m.id==='items'?'<button class="btn ok sm" style="margin-top:10px" onclick="submitFor(\''+esc(id)+'\')">＋ Подать объём</button>':'')+'</div>';
    }
    if(r['Ссылка_на_папку'])h+='<div class="dbl"><a class="btn ghost" href="'+esc(r['Ссылка_на_папку'])+'" target="_blank" rel="noopener">📁 Папка договора на Drive</a></div>';
    if(m.finance)h+='<div class="dbl"><div class="dst">Финансовая сводка</div><div id="fin"><p class="dim">Загрузка…</p></div></div>';
    if(m.kids&&M[m.kids.m]){
      var cm=M[m.kids.m],kids=rows(m.kids.m).filter(function(x){return String(x[m.kids.k])===String(id);});
      h+='<div class="dbl"><div class="dst">'+esc(cm.t)+' ('+kids.length+')</div>';
      h+=kids.length?'<div class="kids">'+kids.slice(0,30).map(function(k){
        return '<button class="kid" onclick="Drawer.open(\''+m.kids.m+'\',\''+esc(k[cm.idK])+'\')"><span>'+cm.i+'</span><b>'+
          esc(short(k[cm.tK]||k[cm.idK],36))+'</b>'+(k[cm.sK]?'<i class="chip '+kind(k[cm.sK])+'">'+esc(short(k[cm.sK],12))+'</i>':'')+'</button>';}).join('')+'</div>'
        :'<p class="dim">Связанных записей нет.</p>';
      h+='<button class="btn ghost sm" style="margin-top:9px" onclick="childForm(\''+m.kids.m+'\',\''+m.kids.k+'\',\''+esc(id)+'\')">＋ Добавить</button></div>';
    }
    var cms=(S.snap.comments||[]).filter(function(c){return String(c['Модуль'])===mod&&String(c['ID_Записи'])===String(id);});
    h+='<div class="dbl"><div class="dst">'+(m.replies?'Переписка':'Комментарии')+' ('+cms.length+')</div>'+
      (cms.length?cms.map(function(c){return '<div class="msg"><b>'+esc(c['Автор'])+'</b><i>'+esc(c['Дата'])+'</i><p>'+esc(c['Текст'])+'</p></div>';}).join(''):'<p class="dim">Пока пусто.</p>')+
      '<div class="rb"><textarea id="ct" rows="2" placeholder="Написать…"></textarea>'+
      '<button class="btn primary sm" onclick="sendComment(\''+mod+'\',\''+esc(id)+'\')">Отправить</button></div></div>';
    var fl=(S.snap.files||[]).filter(function(f){return String(f['Модуль'])===mod&&String(f['ID_Записи'])===String(id);});
    h+='<div class="dbl"><div class="dst">Файлы ('+fl.length+')</div><div id="fl">'+filesHtml(fl,mod)+'</div>'+
      '<div class="drop" id="dz"><input type="file" id="fi" multiple hidden>'+
      '<b>Перетащите файлы сюда</b><span>PDF, DOC, XLS, JPG, PNG · до 10 МБ</span>'+
      '<button class="btn ghost sm" onclick="document.getElementById(\'fi\').click()">Выбрать файлы</button></div></div>';
    $('#db').innerHTML=h;
    $('#df').innerHTML='<button class="btn primary" onclick="Form.open(\''+mod+'\',\''+esc(id)+'\')">✎ Редактировать</button>'+
      '<button class="btn danger" onclick="Drawer.del()">🗑 Удалить</button>'+
      '<button class="btn ghost" onclick="Drawer.close()">Закрыть</button>';
    $('#drawer').classList.add('on');$('#scrim').classList.add('on');document.body.classList.add('lock');
    var inp=$('#fi');
    inp.onchange=function(){upload(mod,id,Array.from(inp.files));};
    var dz=$('#dz');
    ['dragenter','dragover'].forEach(function(ev){dz.addEventListener(ev,function(e){e.preventDefault();dz.classList.add('hot');});});
    ['dragleave','drop'].forEach(function(ev){dz.addEventListener(ev,function(e){e.preventDefault();dz.classList.remove('hot');});});
    dz.addEventListener('drop',function(e){if(e.dataTransfer.files.length)upload(mod,id,Array.from(e.dataTransfer.files));});
    if(m.finance)loadFin(id);
  },
  close:function(){$('#drawer').classList.remove('on');$('#scrim').classList.remove('on');unlock();S.drawer=null;},
  del:function(){if(!S.drawer)return;var d=S.drawer;if(confirm('Удалить '+d.id+'?')){Drawer.close();del(d.mod,[d.id]);}}
};
function filesHtml(fl,mod){
  if(!fl.length)return '<p class="dim">Файлов нет.</p>';
  return '<div class="files">'+fl.map(function(f){
    return '<div class="file"><span class="fico">'+ficon(f['Имя_файла'])+'</span><div class="fmeta"><b>'+esc(f['Имя_файла'])+
      '</b><i>'+(num(f['Размер'])/1024).toFixed(0)+' КБ · '+esc(f['Дата'])+'</i></div>'+
      '<a class="btn ghost sm" href="'+esc(f['Ссылка'])+'" target="_blank" rel="noopener">Открыть</a>'+
      '<button class="btn danger sm" onclick="dropFile(\''+esc(f.ID)+'\')">×</button></div>';}).join('')+'</div>';
}
function ficon(n){var s=String(n||'').toLowerCase();
 if(/\.(jpg|jpeg|png|gif|webp)$/.test(s))return '🖼';if(/\.pdf$/.test(s))return '📕';
 if(/\.(doc|docx)$/.test(s))return '📘';if(/\.(xls|xlsx|csv)$/.test(s))return '📗';
 if(/\.(dwg|dxf)$/.test(s))return '📐';return '📄';}
function b64(file){return new Promise(function(res,rej){var r=new FileReader();
 r.onload=function(e){res(String(e.target.result).split(',')[1]);};r.onerror=function(){rej(new Error('Не прочитать '+file.name));};r.readAsDataURL(file);});}
function upload(mod,id,files){
  var ok=files.filter(function(f){return f.size<=10*1024*1024;});
  if(files.length-ok.length)toast((files.length-ok.length)+' файл(ов) больше 10 МБ — пропущены','warn');
  if(!ok.length)return;
  var host=$('#fl');
  if(host)host.insertAdjacentHTML('afterbegin','<div class="msg" id="up"><b>Загрузка '+ok.length+' файл(ов)…</b></div>');
  Promise.all(ok.map(function(f){return b64(f).then(function(d){return {fileName:f.name,mimeType:f.type||'application/octet-stream',fileData:d};});}))
    .then(function(payload){return api('attachFiles',{module:mod,recordId:String(id),files:payload});})
    .then(function(){toast('Загружено: '+ok.length,'ok');return fetchSnap();})
    .then(function(){Drawer.open(mod,id);list(M[S.mod]);})
    .catch(function(e){var u=$('#up');if(u)u.remove();toast(e.message,'bad');});
}
function dropFile(fid){
  if(!confirm('Удалить файл?'))return;
  var d=S.drawer;
  api('deleteAttachment',{id:fid}).then(function(){return fetchSnap();})
    .then(function(){if(d)Drawer.open(d.mod,d.id);toast('Файл удалён','ok');}).catch(function(e){toast(e.message,'bad');});
}
function sendComment(mod,id){
  var el=$('#ct'),t=el?el.value.trim():'';
  if(!t){toast('Введите текст','warn');return;}
  api('addComment',{module:mod,recordId:id,text:t}).then(function(){return fetchSnap();})
    .then(function(){Drawer.open(mod,id);toast('Отправлено','ok');}).catch(function(e){toast(e.message,'bad');});
}
function childForm(mod,key,val){Form.open(mod,null);
  setTimeout(function(){var e=$('#f_'+key);if(e){e.value=val;e.disabled=true;}},80);}
function submitFor(itemId){
  var it=find('items',itemId);if(!it)return;
  Drawer.close();Form.open('submissions',null);
  setTimeout(function(){
    var c=$('#f_ID_Договора'),i=$('#f_ID_Позиции'),v=$('#f_Объём_подан'),n=$('#f_Комментарий');
    if(c){c.value=it['ID_Договора']||'';c.disabled=true;}
    if(i){i.value=itemId;i.disabled=true;}
    if(v)v.value=Math.max(0,num(it['Количество'])-num(it['Закрыто_объём']));
    if(n)n.value='Подача по позиции '+(it['Номер']||itemId);
  },90);
}
function review(id,status){
  var v=num($('#rv').value),n=$('#rn').value.trim();
  if(status==='Отклонено'&&!n){toast('Укажите причину отказа','warn');$('#rn').focus();return;}
  api('reviewSubmission',{id:id,status:status,volume:v,comment:n}).then(function(r){
    toast('Подача '+status.toLowerCase()+' · зачтено '+r.approved+(r.capped?' (ограничено объёмом сметы)':''),r.capped?'warn':'ok');
    Drawer.close();return fetchSnap();
  }).then(function(){render();paintNotif();}).catch(function(e){toast(e.message,'bad');});
}
function loadFin(cid){
  api('contractorSummary',{contractorId:cid}).then(function(r){
    var s=r.summary,H=hues(),host=$('#fin');if(!host)return;
    var it=[['Договор',s.totalContract,H[0]],['Закрыто',s.totalClosed,H[2]],['Авансы',s.totalAdvances,H[3]],
      ['Выплачено',s.totalPaid,H[1]],['Баланс',s.totalBalance,s.totalBalance>=0?H[2]:H[4]]];
    host.innerHTML='<div class="pg-s">'+it.map(function(x){
      return '<div class="pgs" style="--k:'+x[2]+'"><span>'+x[0]+'</span><b>'+money(x[1])+'</b></div>';}).join('')+'</div>';
  }).catch(function(e){var h=$('#fin');if(h)h.innerHTML='<p class="dim">'+esc(e.message)+'</p>';});
}

/* ---------- палитра ---------- */
var Pal={
  open:function(){S.palOpen=true;S.palIdx=0;$('#pal').classList.add('on');document.body.classList.add('lock');
    var i=$('#pin');i.value='';Pal.search('');i.focus();},
  close:function(){S.palOpen=false;$('#pal').classList.remove('on');unlock();},
  search:function(q){
    q=String(q||'').trim().toLowerCase();var items=[];
    visible().forEach(function(m){if(!q||m.t.toLowerCase().indexOf(q)>-1)
      items.push({g:'Раздел',i:m.i,title:m.t,sub:m.special?'аналитика':rows(m.id).length+' записей',
        run:function(){Pal.close();go(m.id);}});});
    if(q)visible().filter(function(m){return !m.special;}).forEach(function(m){
      if(('создать '+m.t).toLowerCase().indexOf(q)>-1)
        items.push({g:'Действие',i:'＋',title:'Создать · '+m.t,sub:'новая запись',
          run:function(){Pal.close();go(m.id);Form.open(m.id,null);}});});
    if(q.length>=2){var n=0;
      visible().filter(function(m){return !m.special;}).forEach(function(m){
        if(n>=36)return;
        rows(m.id).forEach(function(r){
          if(n>=36)return;
          var hit=String(r[m.idK]).toLowerCase().indexOf(q)>-1;
          if(!hit)for(var k in r){if(String(r[k]).toLowerCase().indexOf(q)>-1){hit=true;break;}}
          if(hit){n++;items.push({g:m.t,i:m.i,title:String(r[m.tK]||r[m.idK]),
            sub:r[m.idK]+(r[m.sK]?' · '+r[m.sK]:''),
            run:function(){Pal.close();go(m.id);setTimeout(function(){Drawer.open(m.id,r[m.idK]);},90);}});}});});}
    items.push({g:'Команда',i:'🔔',title:'Сроки и замечания',sub:unread()+' непрочитанных',run:function(){Pal.close();Notif.open();}});
    items.push({g:'Команда',i:'🌓',title:'Переключить тему',sub:'светлая / тёмная',run:function(){toggleTheme();}});
    items.push({g:'Команда',i:'⟳',title:'Обновить данные',sub:'новый снимок',run:function(){Pal.close();loadData();}});
    S.palItems=items.slice(0,60);Pal.paint(q);
  },
  paint:function(q){
    var host=$('#pr');
    if(!S.palItems.length){host.innerHTML='<div class="pe">Ничего не найдено. Попробуйте номер договора, ФИО или тип документа.</div>';return;}
    var last='',h='';
    S.palItems.forEach(function(it,i){
      if(it.g!==last){h+='<div class="pg">'+esc(it.g)+'</div>';last=it.g;}
      h+='<button class="pi'+(i===S.palIdx?' on':'')+'" data-i="'+i+'"><span class="pi-i">'+it.i+'</span>'+
        '<span class="pi-t"><b>'+hl(it.title,q)+'</b><i>'+hl(it.sub,q)+'</i></span><em>↵</em></button>';});
    host.innerHTML=h;
    $$('.pi',host).forEach(function(b){
      b.onmouseenter=function(){S.palIdx=+b.dataset.i;$$('.pi').forEach(function(x){x.classList.toggle('on',+x.dataset.i===S.palIdx);});};
      b.onclick=function(){S.palItems[+b.dataset.i].run();};});
    var on=$('.pi.on',host);if(on)on.scrollIntoView({block:'nearest'});
  },
  key:function(e){
    if(!S.palOpen)return;var q=$('#pin').value.trim().toLowerCase();
    if(e.key==='ArrowDown'){e.preventDefault();S.palIdx=clamp(S.palIdx+1,0,S.palItems.length-1);Pal.paint(q);}
    if(e.key==='ArrowUp'){e.preventDefault();S.palIdx=clamp(S.palIdx-1,0,S.palItems.length-1);Pal.paint(q);}
    if(e.key==='Enter'){e.preventDefault();var it=S.palItems[S.palIdx];if(it)it.run();}
  }
};
function hl(t,q){var s=esc(String(t||''));if(!q)return s;var i=s.toLowerCase().indexOf(q);if(i<0)return s;
 return s.slice(0,i)+'<mark>'+s.slice(i,i+q.length)+'</mark>'+s.slice(i+q.length);}

/* ---------- спец-разделы ---------- */
function renderSpecial(m){
  if(m.special==='dashboard')return dash();
  if(m.special==='progress')return progShell();
  if(m.special==='trash')return trashView();
  if(m.special==='journal')return journalView();
  if(m.special==='admin')return adminView();
}
function dashData(){
  var d=S.prefs.dash,cut=d.period==='all'?null:new Date(Date.now()-parseInt(d.period,10)*864e5);
  function inR(r){if(!cut)return true;var s=dstr(r['Дата']);if(!s)return true;var t=new Date(s+'T00:00:00');return isNaN(t)?true:t>=cut;}
  function byC(r){return !d.contract||String(r['ID_Договора']||'')===String(d.contract);}
  var docs=rows('documents').filter(function(r){return inR(r)&&byC(r);});
  var met=function(r){return d.metric==='sum'?num(r['Сумма']):1;};
  function grp(arr,key){var o={};arr.forEach(function(r){var k=r[key]||'Другое';o[k]=(o[k]||0)+met(r);});return o;}
  var mo={};docs.forEach(function(r){var s=dstr(r['Дата']);if(!s)return;var k=s.slice(0,7);mo[k]=(mo[k]||0)+met(r);});
  var mk=Object.keys(mo).sort().slice(-12);
  return {docs:docs,byCat:grp(docs,'Категория'),byStatus:grp(docs,'Согласование'),
    trend:mk.map(function(k){return {label:k,value:mo[k]};}),
    contracts:rows('contracts').filter(function(c){return !d.contract||String(c['ID_Договора'])===String(d.contract);}),
    subs:rows('submissions').filter(byC),ks2:rows('ks2').filter(byC)};
}
function dash(){
  var d=S.prefs.dash;
  var co=rows('contracts').map(function(c){return '<option value="'+esc(c['ID_Договора'])+'"'+(d.contract===c['ID_Договора']?' selected':'')+'>'+
    esc(short(c['Контрагент'],28))+' · №'+esc(c['Номер_Договора'])+'</option>';}).join('');
  $('#body').innerHTML='<div class="dl"><aside class="rail" id="rail"><div class="rail-t">🎛 Панель вида</div>'+
    cSel('Период','dPeriod',[['7','7 дней'],['30','30 дней'],['90','Квартал'],['365','Год'],['all','Всё время']],d.period)+
    cSel('Договор','dContract','<option value="">Все договоры</option>'+co,d.contract)+
    cSel('Метрика','dMetric',[['count','Количество'],['sum','Сумма, ₽']],d.metric)+
    cSeg('Тип графика','chart',[['donut','◕'],['bars','▥'],['line','⌇']],d.chart)+
    cSel('Палитра','dPalette',Object.keys(PAL).map(function(k){return [k,PAL[k].n];}),d.palette)+
    cRng('Порог срока, дней','dThreshold',3,60,1,d.threshold)+
    cRng('Толщина сегментов','dThick',8,30,1,d.thick)+
    cRng('Сглаживание линии','dCurve',0,60,2,d.curve)+
    cTog('Подписи значений','dLabels',d.labels)+cTog('Сетка и оси','dGrid',d.grid)+cTog('Свечение','dGlow',d.glow)+
    '<div class="rail-a"><button class="btn ghost sm" data-d="reset">↺ Сброс</button>'+
    '<button class="btn ghost sm" data-d="rand">🎲 Случайно</button>'+
    '<button class="btn primary sm" data-d="png">⤓ PNG</button></div>'+
    '<div class="rail-n">Настройки применяются мгновенно и сохраняются. Порог срока влияет и на центр уведомлений.</div>'+
    '</aside><div id="dm"></div></div>';
  var rail=$('#rail');
  rail.oninput=rail.onchange=function(e){
    var k=e.target.dataset.c;if(!k)return;
    var map={dPeriod:'period',dContract:'contract',dMetric:'metric',dPalette:'palette',dThreshold:'threshold',
      dThick:'thick',dCurve:'curve',dLabels:'labels',dGrid:'grid',dGlow:'glow'};
    var p=map[k];if(!p)return;
    S.prefs.dash[p]=e.target.type==='checkbox'?e.target.checked:(e.target.type==='range'?parseInt(e.target.value,10):e.target.value);
    var vl=document.getElementById(k+'V');if(vl)vl.textContent=e.target.value;
    savePrefs();if(p==='threshold'){buildNotif();paintNotif();}
    dashMain();};
  rail.onclick=function(e){
    var s=e.target.closest('[data-seg]');
    if(s){S.prefs.dash[s.dataset.seg]=s.dataset.v;savePrefs();dash();return;}
    var b=e.target.closest('[data-d]');if(!b)return;
    if(b.dataset.d==='reset'){S.prefs.dash=JSON.parse(JSON.stringify(DDEF));savePrefs();buildNotif();paintNotif();dash();toast('Вид сброшен','ok');}
    if(b.dataset.d==='rand'){var pk=Object.keys(PAL),ch=['donut','bars','line'],dd=S.prefs.dash;
      dd.palette=pk[Math.floor(Math.random()*pk.length)];dd.chart=ch[Math.floor(Math.random()*ch.length)];
      dd.thick=8+Math.floor(Math.random()*22);dd.curve=Math.floor(Math.random()*60);dd.threshold=5+Math.floor(Math.random()*40);
      savePrefs();buildNotif();paintNotif();dash();toast('Вид перемешан','ok');}
    if(b.dataset.d==='png')chartPng();};
  dashMain();
}
function cSel(l,id,o,v){var opts=typeof o==='string'?o:o.map(function(x){
  return '<option value="'+esc(x[0])+'"'+(String(v)===String(x[0])?' selected':'')+'>'+esc(x[1])+'</option>';}).join('');
  return '<div class="ctl"><label for="'+id+'">'+esc(l)+'</label><select id="'+id+'" data-c="'+id+'">'+opts+'</select></div>';}
function cSeg(l,key,o,v){return '<div class="ctl"><label>'+esc(l)+'</label><div class="seg wide">'+o.map(function(x){
  return '<button class="seg-b'+(v===x[0]?' on':'')+'" data-seg="'+key+'" data-v="'+x[0]+'">'+x[1]+'</button>';}).join('')+'</div></div>';}
function cRng(l,id,mn,mx,st,v){return '<div class="ctl"><label for="'+id+'">'+esc(l)+' <b id="'+id+'V">'+v+'</b></label>'+
  '<input id="'+id+'" data-c="'+id+'" type="range" min="'+mn+'" max="'+mx+'" step="'+st+'" value="'+v+'"></div>';}
function cTog(l,id,on){return '<div class="ctl"><label class="chk"><input type="checkbox" id="'+id+'" data-c="'+id+'"'+(on?' checked':'')+
  '><i></i><span>'+esc(l)+'</span></label></div>';}
function dashMain(){
  var host=$('#dm');if(!host)return;
  var d=S.prefs.dash,D=dashData(),H=hues();
  var pend=D.subs.filter(function(s){return s['Статус']==='На_проверке';}).length;
  var noOr=D.docs.filter(function(x){return x['Оригинал']==='Только скан';}).length;
  var late=NOTIF.filter(function(n){return n.kind==='late';}).length;
  var soon=NOTIF.filter(function(n){return n.kind==='soon';}).length;
  var pres=rows('preservation').filter(function(p){return /Требует|Аварийное|Утрачено/.test(p['Сохранность']);}).length;
  var openP=rows('prescriptions').filter(function(p){return p['Статус']!=='Исполнено';}).length;
  var cs=D.contracts.reduce(function(a,c){return a+num(c['Сумма']);},0);
  var ks=D.ks2.reduce(function(a,k){return a+num(k['Общая_сумма']);},0);
  var fmt=function(v){return d.metric==='sum'?compact(v):String(Math.round(v));};
  var kp=[['Договоры',D.contracts.length,money(cs),H[0]],['Документы',D.docs.length,noOr+' без оригинала',H[1]],
    ['На проверке',pend,'подачи объёмов',H[3]],['КС-2',D.ks2.length,money(ks),H[2]],
    ['Просрочено',late,'требуют действия',H[4]],['Сроки ≤'+d.threshold+' дн.',soon,'на контроль',H[5]],
    ['Охрана ОКН',pres,'требуют работ',H[6]],['Предписания',openP,'не исполнено',H[7]]];
  var top=D.contracts.slice().sort(function(a,b){return num(b['Сумма'])-num(a['Сумма']);}).slice(0,6);
  var mx=top.length?num(top[0]['Сумма']):1;
  host.innerHTML='<div class="kpis">'+kp.map(function(k){
    return '<div class="kpi" style="--k:'+k[3]+'"><span class="kpi-l">'+esc(k[0])+'</span><b class="kpi-n">'+k[1]+
      '</b><span class="kpi-s">'+esc(k[2])+'</span></div>';}).join('')+'</div><div class="dg">'+
    '<section class="panel"><h3>Документы по категориям</h3>'+chart(D.byCat,'a')+'</section>'+
    '<section class="panel"><h3>Статусы согласования</h3>'+chart(D.byStatus,'b')+'</section>'+
    '<section class="panel wide"><h3>Динамика документов по месяцам</h3>'+trend(D.trend)+'</section>'+
    '<section class="panel wide"><h3>Крупнейшие договоры</h3><div class="hbs">'+
      (top.length?top.map(function(t,i){
        return '<button class="hb" onclick="Drawer.open(\'contracts\',\''+esc(t['ID_Договора'])+'\')"><span class="hb-l">'+
          esc(short(t['Контрагент'],26))+'</span><div class="hb-t"><i style="width:'+Math.max(4,num(t['Сумма'])/mx*100)+
          '%;background:linear-gradient(90deg,'+H[i%8]+','+H[(i+3)%8]+')"></i></div><b>'+money(t['Сумма'])+'</b></button>';}).join('')
        :'<p class="dim">Договоров в выборке нет.</p>')+'</div></section>'+
    '<section class="panel"><h3>Требуют внимания</h3><div class="feed">'+attention()+'</div></section>'+
    '<section class="panel"><h3>Последние действия</h3><div class="feed">'+
      ((S.snap.journal||[]).length?(S.snap.journal||[]).slice(0,10).map(function(a){
        return '<div class="fi"><span class="fd"></span><div><b>'+esc(a['Действие'])+'</b><i>'+esc(a['Пользователь'])+' · '+
          esc(a['Дата'])+'</i><p>'+esc(short(a['Объект'],34))+'</p></div></div>';}).join(''):'<p class="dim">Журнал пуст.</p>')+
      '</div></section></div>';
}
function attention(){
  if(!NOTIF.length)return '<p class="dim">Просрочек и близких сроков нет.</p>';
  var ico={late:'⚠️',soon:'⏳',review:'📝',remark:'❗'};
  return NOTIF.slice(0,14).map(function(n){
    return '<button class="ai" onclick="Notif.jump(\''+n.mod+'\',\''+esc(n.id)+'\',\''+n.key+'\')"><span>'+ico[n.kind]+
      '</span><div><b>'+esc(n.title)+'</b><i>'+esc(n.sub||'')+(n.days!=null?' · '+(n.days<0?'просрочено '+Math.abs(n.days)+' дн.':'через '+n.days+' дн.'):'')+
      '</i></div><em>→</em></button>';}).join('');
}
function gdef(){return '<filter id="gl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4" result="b"/>'+
  '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';}
function chart(obj,tag){
  var d=S.prefs.dash,keys=Object.keys(obj),H=hues();
  if(!keys.length)return '<p class="dim">Нет данных в выбранном периоде.</p>';
  var total=keys.reduce(function(a,k){return a+obj[k];},0);
  var fmt=function(v){return d.metric==='sum'?compact(v):String(Math.round(v));};
  if(d.chart==='bars'){
    var mx=Math.max.apply(null,keys.map(function(k){return obj[k];}));
    var w=Math.max(320,keys.length*68),h=214,p=d.grid?28:10,g='';
    if(d.grid)for(var i=0;i<=4;i++){var y=p+(h-p*2)*i/4;
      g+='<line x1="'+p+'" y1="'+y+'" x2="'+(w-p)+'" y2="'+y+'" stroke="currentColor" stroke-opacity=".13"/>'+
        '<text x="3" y="'+(y+3)+'" class="ax">'+fmt(mx*(1-i/4))+'</text>';}
    var bw=(w-p*2)/keys.length;
    var bars=keys.map(function(k,i){
      var bh=Math.max(3,(obj[k]/mx)*(h-p*2)),x=p+i*bw+bw*0.18,y2=h-p-bh;
      return '<g><rect x="'+x+'" y="'+y2+'" width="'+(bw*0.64)+'" height="'+bh+'" rx="5" fill="url(#bg'+tag+i+')"'+
        (d.glow?' filter="url(#gl)"':'')+'><title>'+esc(k)+': '+fmt(obj[k])+'</title></rect>'+
        (d.labels?'<text x="'+(x+bw*0.32)+'" y="'+(y2-5)+'" text-anchor="middle" class="vl">'+fmt(obj[k])+'</text>':'')+
        '<text x="'+(x+bw*0.32)+'" y="'+(h-5)+'" text-anchor="middle" class="ax">'+esc(short(k,9))+'</text></g>';}).join('');
    var defs=keys.map(function(k,i){return '<linearGradient id="bg'+tag+i+'" x1="0" y1="1" x2="0" y2="0">'+
      '<stop offset="0" stop-color="'+H[i%8]+'"/><stop offset="1" stop-color="'+H[(i+2)%8]+'"/></linearGradient>';}).join('');
    return '<svg viewBox="0 0 '+w+' '+h+'" class="chart" data-c="'+tag+'"><defs>'+defs+gdef()+'</defs>'+g+bars+'</svg>'+legend(keys,obj,fmt);
  }
  if(d.chart==='line'){
    var w2=470,h2=214,p2=d.grid?30:12,mx2=Math.max.apply(null,keys.map(function(k){return obj[k];}))||1;
    var pts=keys.map(function(k,i){return [p2+(w2-p2*2)*(keys.length===1?0.5:i/(keys.length-1)),h2-p2-(obj[k]/mx2)*(h2-p2*2)];});
    var path=smooth(pts,d.curve/100),g2='';
    if(d.grid)for(var j=0;j<=4;j++){var yy=p2+(h2-p2*2)*j/4;
      g2+='<line x1="'+p2+'" y1="'+yy+'" x2="'+(w2-p2)+'" y2="'+yy+'" stroke="currentColor" stroke-opacity=".13"/>'+
        '<text x="3" y="'+(yy+3)+'" class="ax">'+fmt(mx2*(1-j/4))+'</text>';}
    return '<svg viewBox="0 0 '+w2+' '+h2+'" class="chart" data-c="'+tag+'"><defs>'+
      '<linearGradient id="ln'+tag+'" x1="0" x2="1"><stop offset="0" stop-color="'+H[0]+'"/><stop offset=".5" stop-color="'+H[1]+
      '"/><stop offset="1" stop-color="'+H[4]+'"/></linearGradient>'+
      '<linearGradient id="ar'+tag+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+H[1]+
      '" stop-opacity=".34"/><stop offset="1" stop-color="'+H[1]+'" stop-opacity="0"/></linearGradient>'+gdef()+'</defs>'+g2+
      '<path d="'+path+' L '+(w2-p2)+' '+(h2-p2)+' L '+p2+' '+(h2-p2)+' Z" fill="url(#ar'+tag+')"/>'+
      '<path d="'+path+'" fill="none" stroke="url(#ln'+tag+')" stroke-width="'+(d.thick/4+2)+'" stroke-linecap="round"'+(d.glow?' filter="url(#gl)"':'')+'/>'+
      pts.map(function(pt,i){return '<circle cx="'+pt[0]+'" cy="'+pt[1]+'" r="4" fill="'+H[i%8]+'"><title>'+esc(keys[i])+': '+fmt(obj[keys[i]])+'</title></circle>'+
        (d.labels?'<text x="'+pt[0]+'" y="'+(pt[1]-9)+'" text-anchor="middle" class="vl">'+fmt(obj[keys[i]])+'</text>':'')+
        '<text x="'+pt[0]+'" y="'+(h2-5)+'" text-anchor="middle" class="ax">'+esc(short(keys[i],8))+'</text>';}).join('')+'</svg>';
  }
  var R=54,C=2*Math.PI*R,acc=0,segs='';
  keys.forEach(function(k,i){var len=obj[k]/total*C;
    segs+='<circle r="'+R+'" cx="80" cy="80" fill="none" stroke="'+H[i%8]+'" stroke-width="'+d.thick+
      '" stroke-dasharray="'+len.toFixed(2)+' '+C.toFixed(2)+'" stroke-dashoffset="'+(-acc).toFixed(2)+
      '" transform="rotate(-90 80 80)"'+(d.glow?' filter="url(#gl)"':'')+'><title>'+esc(k)+': '+fmt(obj[k])+'</title></circle>';
    acc+=len;});
  return '<div class="dw"><svg viewBox="0 0 160 160" class="donut chart" data-c="'+tag+'"><defs>'+gdef()+'</defs>'+segs+
    '<text x="80" y="76" text-anchor="middle" class="dn">'+fmt(total)+'</text>'+
    '<text x="80" y="93" text-anchor="middle" class="ds">'+(d.metric==='sum'?'₽ всего':'всего')+'</text></svg>'+legend(keys,obj,fmt)+'</div>';
}
function legend(keys,obj,fmt){var H=hues(),total=keys.reduce(function(a,k){return a+obj[k];},0)||1;
 return '<ul class="leg">'+keys.map(function(k,i){return '<li><i style="background:'+H[i%8]+'"></i><span>'+esc(k)+
   '</span><b>'+fmt(obj[k])+'</b><em>'+Math.round(obj[k]/total*100)+'%</em></li>';}).join('')+'</ul>';}
function smooth(pts,t){
  if(!pts.length)return '';
  if(pts.length<3||t<=0)return 'M '+pts.map(function(p){return p[0]+' '+p[1];}).join(' L ');
  var d='M '+pts[0][0]+' '+pts[0][1];
  for(var i=0;i<pts.length-1;i++){
    var p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;
    d+=' C '+(p1[0]+(p2[0]-p0[0])/6*t*2)+' '+(p1[1]+(p2[1]-p0[1])/6*t*2)+', '+
      (p2[0]-(p3[0]-p1[0])/6*t*2)+' '+(p2[1]-(p3[1]-p1[1])/6*t*2)+', '+p2[0]+' '+p2[1];}
  return d;
}
function trend(tr){
  var d=S.prefs.dash,H=hues();
  if(!tr.length)return '<p class="dim">Нет датированных документов в выбранном периоде.</p>';
  var w=900,h=234,p=d.grid?40:14,mx=Math.max.apply(null,tr.map(function(t){return t.value;}))||1;
  var pts=tr.map(function(t,i){return [p+(w-p*2)*(tr.length===1?0.5:i/(tr.length-1)),h-p-(t.value/mx)*(h-p*2)];});
  var path=smooth(pts,d.curve/100),fmt=function(v){return d.metric==='sum'?compact(v):String(Math.round(v));},g='';
  if(d.grid)for(var i=0;i<=4;i++){var y=p+(h-p*2)*i/4;
    g+='<line x1="'+p+'" y1="'+y+'" x2="'+(w-p)+'" y2="'+y+'" stroke="currentColor" stroke-opacity=".13"/>'+
      '<text x="5" y="'+(y+4)+'" class="ax">'+fmt(mx*(1-i/4))+'</text>';}
  return '<svg viewBox="0 0 '+w+' '+h+'" class="chart" data-c="trend"><defs>'+
    '<linearGradient id="tl" x1="0" x2="1"><stop offset="0" stop-color="'+H[0]+'"/><stop offset=".35" stop-color="'+H[3]+
    '"/><stop offset=".7" stop-color="'+H[2]+'"/><stop offset="1" stop-color="'+H[1]+'"/></linearGradient>'+
    '<linearGradient id="ta" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+H[1]+
    '" stop-opacity=".34"/><stop offset="1" stop-color="'+H[1]+'" stop-opacity="0"/></linearGradient>'+gdef()+'</defs>'+g+
    '<path d="'+path+' L '+(w-p)+' '+(h-p)+' L '+p+' '+(h-p)+' Z" fill="url(#ta)"/>'+
    '<path d="'+path+'" fill="none" stroke="url(#tl)" stroke-width="'+(d.thick/4+2.5)+'" stroke-linecap="round"'+(d.glow?' filter="url(#gl)"':'')+'/>'+
    pts.map(function(pt,i){return '<g><circle cx="'+pt[0]+'" cy="'+pt[1]+'" r="5" fill="'+H[i%8]+
      '" stroke="var(--surface)" stroke-width="2"><title>'+tr[i].label+': '+fmt(tr[i].value)+'</title></circle>'+
      (d.labels?'<text x="'+pt[0]+'" y="'+(pt[1]-11)+'" text-anchor="middle" class="vl">'+fmt(tr[i].value)+'</text>':'')+
      '<text x="'+pt[0]+'" y="'+(h-7)+'" text-anchor="middle" class="ax">'+esc(tr[i].label)+'</text></g>';}).join('')+'</svg>';
}
function chartPng(){
  var svg=$('[data-c="trend"]')||$('[data-c="a"]');
  if(!svg){toast('Нет графика','warn');return;}
  try{
    var cs=getComputedStyle(document.documentElement);
    var txt=cs.getPropertyValue('--txt').trim()||'#101a27',txt3=cs.getPropertyValue('--txt3').trim()||'#7690a8',
      surf=cs.getPropertyValue('--surface').trim()||'#fff';
    var clone=svg.cloneNode(true);clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
    $$('.ax,.vl,.dn,.ds',clone).forEach(function(t){
      t.setAttribute('fill',t.classList.contains('vl')||t.classList.contains('dn')?txt:txt3);
      t.setAttribute('font-family','Arial, sans-serif');t.setAttribute('font-size',t.classList.contains('dn')?'21':'10');});
    $$('[stroke="currentColor"]',clone).forEach(function(l){l.setAttribute('stroke','#94a3b8');});
    $$('[stroke="var(--surface)"]',clone).forEach(function(l){l.setAttribute('stroke',surf);});
    var vb=(clone.getAttribute('viewBox')||'0 0 900 234').split(/\s+/).map(Number),sc=2,W=vb[2]*sc,Hh=vb[3]*sc;
    var data=new XMLSerializer().serializeToString(clone),img=new Image();
    img.onload=function(){try{
      var cv=document.createElement('canvas');cv.width=W;cv.height=Hh;
      var ctx=cv.getContext('2d');ctx.fillStyle=surf;ctx.fillRect(0,0,W,Hh);ctx.drawImage(img,0,0,W,Hh);
      var a=document.createElement('a');a.download='СтройРеестр_'+iso(new Date())+'.png';a.href=cv.toDataURL('image/png');a.click();
      toast('PNG сохранён','ok');}catch(e){toast('Браузер запретил PNG','bad');}};
    img.onerror=function(){toast('Не удалось отрисовать','bad');};
    img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(data)));
  }catch(e){toast('Экспорт PNG недоступен','bad');}
}
function progShell(){
  var o=rows('contracts').map(function(c){return '<option value="'+esc(c['ID_Договора'])+'">'+esc(c['Контрагент'])+' · №'+esc(c['Номер_Договора'])+'</option>';}).join('');
  $('#body').innerHTML='<div class="panel"><div class="pg-p"><div><label>Договор</label><select id="pgc">'+
    '<option value="">— выберите —</option>'+o+'</select></div><button class="btn primary" id="pgg">Показать</button></div>'+
    '<div id="pgo"><p class="dim">Выберите договор — по каждой позиции будут две шкалы: выполнение и подача КС-2.</p></div></div>';
  $('#pgc').onchange=progRun;$('#pgg').onclick=progRun;
  if(rows('contracts').length){$('#pgc').value=rows('contracts')[0]['ID_Договора'];progRun();}
}
function progRun(){
  var cid=$('#pgc').value,out=$('#pgo');
  if(!cid){out.innerHTML='<p class="dim">Выберите договор.</p>';return;}
  out.innerHTML='<div class="sk-wrap"><div class="sk-row"><span class="sk"></span><span class="sk b"></span><span class="sk c"></span></div></div>';
  api('progress',{contractId:cid}).then(function(r){
    var s=r.summary,H=hues(),pct=function(a,b){return b?Math.min(100,a/b*100):0;},f=function(n){return (+n).toFixed(2).replace(/\.00$/,'');};
    var sm=[['Объём по смете',s.total,''],['Выполнено',s.done,money(s.doneAmount)],['На проверке',s.review,''],
      ['Осталось',s.rest,''],['Подано КС-2',s.billed,money(s.billedAmount)],['Не подано',s.unbilled,'']];
    out.innerHTML='<div class="pg-s">'+sm.map(function(x,i){
      return '<div class="pgs" style="--k:'+H[i%8]+'"><span>'+x[0]+'</span><b>'+f(x[1])+'</b><i>'+esc(x[2]||'')+'</i></div>';}).join('')+'</div>'+
      (r.positions.length?r.positions.map(function(p){
        return '<div class="pg-r"><div class="pg-h"><b>'+esc(p.name)+'</b><span>'+esc(p.section||'')+' · '+esc(p.unit||'')+' · '+money(p.amount)+'</span></div>'+
          '<div class="pg-l"><label>Выполнение</label><div class="stack">'+
          '<i class="s-ok" style="width:'+pct(p.done,p.total)+'%" title="Подтверждено: '+p.done+'">'+(pct(p.done,p.total)>9?f(p.done):'')+'</i>'+
          '<i class="s-wn" style="width:'+pct(p.review,p.total)+'%" title="На проверке: '+p.review+'">'+(pct(p.review,p.total)>9?f(p.review):'')+'</i>'+
          '<i class="s-rs" style="width:'+pct(p.rest,p.total)+'%" title="Осталось: '+p.rest+'">'+(pct(p.rest,p.total)>9?f(p.rest):'')+'</i>'+
          '</div><em>'+f(p.done)+' / '+f(p.total)+'</em></div>'+
          '<div class="pg-l"><label>КС-2</label><div class="stack">'+
          '<i class="s-bl" style="width:'+pct(p.billed,p.total)+'%" title="Подано: '+p.billed+'">'+(pct(p.billed,p.total)>9?f(p.billed):'')+'</i>'+
          '<i class="s-rs" style="width:'+pct(p.unbilled,p.total)+'%" title="Не подано: '+p.unbilled+'">'+(pct(p.unbilled,p.total)>9?f(p.unbilled):'')+'</i>'+
          '</div><em>'+f(p.billed)+' / '+f(p.total)+'</em></div></div>';}).join('')
        :'<p class="dim">У договора нет позиций сметы.</p>')+
      '<div class="lr"><span><i class="s-ok"></i>подтверждено</span><span><i class="s-wn"></i>на проверке</span>'+
      '<span><i class="s-bl"></i>подано КС-2</span><span><i class="s-rs"></i>остаток</span></div>';
  }).catch(function(e){out.innerHTML='<div class="empty"><div class="empty-i">⚠️</div><p>'+esc(e.message)+'</p></div>';});
}
function trashView(){
  var keys=Object.keys(S.trash).filter(function(k){return S.trash[k].length;});
  if(!keys.length){$('#body').innerHTML='<div class="empty"><div class="empty-i">🗑️</div><h3>Корзина пуста</h3><p>Удалённые записи можно вернуть.</p></div>';return;}
  $('#body').innerHTML=keys.map(function(k){var m=M[k]||{t:k,i:'📄'};
    return '<section class="panel"><h3>'+m.i+' '+esc(m.t)+' <em>'+S.trash[k].length+'</em></h3><div class="tl">'+
      S.trash[k].map(function(t){return '<div class="ti"><b>'+esc(t.title)+'</b><span>'+esc(t.id)+'</span>'+
        '<button class="btn ok sm" onclick="tRestore(\''+k+'\',\''+esc(t.id)+'\')">↺ Вернуть</button>'+
        (isAdmin()?'<button class="btn danger sm" onclick="tPurge(\''+k+'\',\''+esc(t.id)+'\')">✕ Навсегда</button>':'')+'</div>';}).join('')+
      '</div></section>';}).join('');
}
function tRestore(mod,id){api('restoreRecords',{module:mod,ids:[id]}).then(function(){return fetchSnap();})
  .then(function(){render();paintNotif();toast('Восстановлено','ok');}).catch(function(e){toast(e.message,'bad');});}
function tPurge(mod,id){if(!confirm('Удалить '+id+' НАВСЕГДА?'))return;
  api('purgeRecords',{module:mod,ids:[id]}).then(function(){return fetchSnap();})
    .then(function(){render();toast('Удалено навсегда','ok');}).catch(function(e){toast(e.message,'bad');});}
function journalView(){
  var a=S.snap.journal||[];
  if(!a.length){$('#body').innerHTML='<div class="empty"><div class="empty-i">📜</div><h3>Журнал пуст</h3></div>';return;}
  $('#body').innerHTML='<div class="tw"><table class="grid"><thead><tr><th>Когда</th><th>Кто</th><th>Действие</th><th>Объект</th><th>Детали</th></tr></thead><tbody>'+
    a.map(function(x){return '<tr><td>'+esc(x['Дата'])+'</td><td>'+esc(x['Пользователь'])+'</td><td><b>'+esc(x['Действие'])+
      '</b></td><td>'+esc(x['Объект'])+'</td><td>'+esc(short(x['Детали'],60))+'</td></tr>';}).join('')+'</tbody></table></div>';
}
function adminView(){
  if(!isAdmin()){$('#body').innerHTML='<div class="empty"><div class="empty-i">🔒</div><h3>Раздел закрыт</h3><p>Только для администратора.</p></div>';return;}
  var u=S.snap.users||[];
  $('#body').innerHTML='<section class="panel"><h3>Учётные записи <em>'+u.length+'</em></h3><div class="tw"><table class="grid">'+
    '<thead><tr><th>Логин</th><th>ФИО</th><th>Роль</th><th>Email</th><th class="c-a"></th></tr></thead><tbody>'+
    u.map(function(x){return '<tr><td class="c-id">'+esc(x['Логин'])+'</td><td><div class="who"><span class="ava">'+esc(initials(x['ФИО']))+
      '</span><b>'+esc(x['ФИО'])+'</b></div></td><td><span class="chip '+(x['Роль']==='Администратор'?'bad':'neutral')+'">'+esc(x['Роль'])+
      '</span></td><td>'+esc(x['Email']||'—')+'</td><td class="c-a"><div class="acts">'+
      '<button class="btn ghost sm" onclick="userForm(\''+esc(x['Логин'])+'\')">✎</button>'+
      '<button class="btn danger sm"'+(x['Логин']===S.user.login?' disabled':'')+' onclick="userDel(\''+esc(x['Логин'])+'\')">🗑</button>'+
      '</div></td></tr>';}).join('')+'</tbody></table></div>'+
    '<div class="pf"><button class="btn primary" onclick="userForm(null)">＋ Новый пользователь</button></div></section>';
}
function userForm(login){
  var u=login?(S.snap.users||[]).filter(function(x){return x['Логин']===login;})[0]:null;
  $('#mt').innerHTML=u?'✎ Пользователь · '+esc(login):'＋ Новый пользователь';
  $('#mb').innerHTML='<form class="form" onsubmit="return false">'+
    '<div class="fg"><label>Логин <em>*</em></label><input id="uL" type="text" value="'+esc(u?u['Логин']:'')+'"'+(u?' readonly':'')+'></div>'+
    '<div class="fg"><label>'+(u?'Новый пароль (пусто — не менять)':'Пароль <em>*</em>')+'</label><input id="uP" type="text"></div>'+
    '<div class="fg wide"><label>ФИО <em>*</em></label><input id="uF" type="text" value="'+esc(u?u['ФИО']:'')+'"></div>'+
    '<div class="fg"><label>Роль</label><select id="uR">'+['Администратор','ПТО','Бухгалтерия','Прораб','Архитектор','ГИП','ГАП'].map(function(r){
      return '<option'+(u&&u['Роль']===r?' selected':'')+'>'+r+'</option>';}).join('')+'</select></div>'+
    '<div class="fg"><label>Email</label><input id="uE" type="email" value="'+esc(u?u['Email']:'')+'"></div></form>';
  $('#mf').innerHTML='<button class="btn ghost" onclick="Form.close()">Отмена</button><button class="btn primary" id="uS">'+(u?'Сохранить':'Создать')+'</button>';
  $('#uS').onclick=function(){
    var l=$('#uL').value.trim(),f=$('#uF').value.trim(),p=$('#uP').value;
    if(!l||!f){toast('Заполните логин и ФИО','warn');return;}
    if(!u&&p.length<8){toast('Пароль минимум 8 символов','warn');return;}
    api('saveUser',{mode:u?'edit':'create',login:l,fio:f,password:p,role:$('#uR').value,email:$('#uE').value})
      .then(function(){Form.close();return fetchSnap();}).then(function(){render();toast('Сохранено','ok');})
      .catch(function(e){toast(e.message,'bad');});};
  $('#modal').classList.add('on');document.body.classList.add('lock');
}
function userDel(login){if(!confirm('Удалить '+login+'?'))return;
  api('removeUser',{login:login}).then(function(){return fetchSnap();}).then(function(){render();toast('Удалён','ok');})
    .catch(function(e){toast(e.message,'bad');});}

/* ---------- печать / экспорт ---------- */
function printReg(){
  var m=M[S.mod];if(!m||m.special){toast('Печать доступна в разделах с таблицей','warn');return;}
  var all=selectRows(m),cols=colsOf(m),w=window.open('','_blank');
  if(!w){toast('Разрешите всплывающие окна','warn');return;}
  var css='body{font:12px/1.45 Arial,sans-serif;color:#101a27;padding:26px}h1{font-size:19px;margin:0 0 4px}'+
    '.m{color:#5a6b80;font-size:11px;margin-bottom:14px;border-bottom:2px solid #ff6b35;padding-bottom:8px}'+
    'table{width:100%;border-collapse:collapse;font-size:11px}th{background:#111c28;color:#fff;text-align:left;padding:6px 7px}'+
    'td{border-bottom:1px solid #d7dee7;padding:5px 7px}tr:nth-child(even) td{background:#f4f7fb}'+
    '.s{margin-top:26px;display:flex;gap:40px;font-size:12px}';
  w.document.write('<html><head><meta charset="utf-8"><title>'+esc(m.t)+'</title><style>'+css+'</style></head><body>'+
    '<h1>'+m.i+' '+esc(m.t)+' — реестр</h1><div class="m">СтройРеестр · РД-221-AR1.2 · '+esc(S.user.fio)+' · '+
    new Date().toLocaleString('ru-RU')+' · записей: '+all.length+'</div><table><thead><tr><th>ID</th>'+
    cols.map(function(c){return '<th>'+esc(fname(m,c))+'</th>';}).join('')+'</tr></thead><tbody>'+
    all.map(function(r){return '<tr><td>'+esc(r[m.idK])+'</td>'+cols.map(function(c){return '<td>'+esc(r[c]==null?'':r[c])+'</td>';}).join('')+'</tr>';}).join('')+
    '</tbody></table><div class="s"><span>Составил: ______________ / '+esc(S.user.fio)+'</span><span>Проверил: ______________</span></div></body></html>');
  w.document.close();setTimeout(function(){w.print();},350);
}
function exportCur(fmt){
  var m=M[S.mod];if(!m||m.special){toast('Выберите раздел с таблицей','warn');return;}
  toast('Готовлю файл…','info');
  api('exportFile',{module:m.id,format:fmt}).then(function(r){window.open(r.fileUrl,'_blank');toast('Файл: '+r.fileName,'ok');})
    .catch(function(e){toast(e.message,'bad');});
}

/* ---------- клавиши ---------- */
function tableKeys(e){
  var m=M[S.mod];if(!m||m.special)return;
  var all=selectRows(m).slice(0,(S.page[m.id]||1)*40);if(!all.length)return;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();
    S.focus=clamp(S.focus+(e.key==='ArrowDown'?1:-1),0,all.length-1);list(m);
    var el=$('[data-i="'+S.focus+'"]');if(el)el.scrollIntoView({block:'nearest'});return;}
  if(S.focus<0)return;
  var id=all[S.focus][m.idK];
  if(e.key==='Enter'){e.preventDefault();Drawer.open(m.id,id);}
  if(e.key.toLowerCase()==='e'){e.preventDefault();Form.open(m.id,id);}
  if(e.key===' '){e.preventDefault();if(S.sel.has(String(id)))S.sel.delete(String(id));else S.sel.add(String(id));bulkBar(m);list(m);}
  if(e.key==='Delete'){e.preventDefault();if(confirm('Удалить '+id+'?'))del(m.id,[id]);}
}
document.addEventListener('keydown',function(e){
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(S.user)Pal.open();return;}
  if(e.key==='Escape'){
    if(S.palOpen){Pal.close();return;}
    if(S.notifOpen){Notif.close();return;}
    if($('#modal').classList.contains('on')){Form.close();return;}
    if($('#drawer').classList.contains('on')){Drawer.close();return;}
    if($('#sheet').classList.contains('on')){closeSheet();return;}
    return;}
  var typing=['INPUT','TEXTAREA','SELECT'].indexOf(document.activeElement.tagName)>-1;
  if(e.key==='Enter'&&$('#login').style.display!=='none'&&document.activeElement.id==='pi'){doLogin();return;}
  if(e.key==='/'&&!typing&&S.user){e.preventDefault();Pal.open();return;}
  if(!typing&&S.user&&!S.palOpen&&!$('#modal').classList.contains('on')&&!$('#drawer').classList.contains('on'))tableKeys(e);
});
document.addEventListener('click',function(e){if(!e.target.closest('.pw'))$$('.pop.on').forEach(function(p){p.classList.remove('on');});});
window.addEventListener('resize',debounce(function(){var m=M[S.mod];if(m&&!m.special&&Object.keys(S.snap).length)list(m);},220));
window.addEventListener('online',function(){setNet(true);if(S.user)loadData(true);});
window.addEventListener('offline',function(){setNet(false);});

/* ---------- старт ---------- */
(function(){
  var raw=null;try{raw=localStorage.getItem('sr5_sess');}catch(e){}
  if(raw){try{var s=JSON.parse(raw);
    if(s&&s.token&&Date.now()-s.at<216e5){S.user=s.user;S.token=s.token;enterApp();return;}}catch(e){}}
  $('#login').style.display='flex';
  $('#pin').addEventListener('input',function(){Pal.search(this.value);});
  $('#pin').addEventListener('keydown',function(e){Pal.key(e);});
  $('#pal').addEventListener('mousedown',function(e){if(e.target===this)Pal.close();});
  $('#modal').addEventListener('mousedown',function(e){if(e.target===this)Form.close();});
})();
