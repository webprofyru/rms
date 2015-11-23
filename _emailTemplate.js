function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (email, undefined) {
buf.push("<html>");
email.title = email.person.name + ': План загрузки с ' + email.startDate + ' по ' + email.endDate
buf.push("<body><div dir=\"ltr\"><div><div><span style=\"font-size:13px\">Привет, " + (jade.escape((jade_interp = email.toName) == null ? '' : jade_interp)) + "!</span><br/></div><div><!--div(style='font-size:13px')--><!--  div: br--><!--  div <b>В предыдущей версии рассылки плана на эту неделю были допущены ошибки.  Это же проверенная и исправленная версия плана!  Желаем успехов в его выполнении!!!</b>--><!--  br--><div style=\"font-size:13px\"><div><br/></div><div>На эту неделю у тебя запланировано рабочих часов: <b>" + (jade.escape((jade_interp = email.totalHours) == null ? '' : jade_interp)) + "</b></div><br/></div><div style=\"font-size:13px\"><div><table cellspacing=\"0\" cellpadding=\"0\" dir=\"ltr\" border=\"1\" style=\"table-layout:fixed;font-family:arial,sans,sans-serif;border-collapse:collapse;border:1px solid rgb(204,204,204)\"><colgroup><col width=\"188\"/><col width=\"119\"/><col width=\"165\"/><col width=\"210\"/></colgroup><tbody><tr style=\"height:17px\"><td style=\"padding:0px 3px;font-weight:bold;vertical-align:middle;text-align:center\">Проект</td><td style=\"padding:0px 3px;font-weight:bold;vertical-align:middle;text-align:center\">Часы план</td><td style=\"padding:0px 3px;font-weight:bold;vertical-align:middle;text-align:center\">Часы факт</td><td style=\"padding:0px 3px;font-weight:bold;vertical-align:middle;text-align:center\">Менеджер проекта</td></tr>");
// iterate email.projects
;(function(){
  var $$obj = email.projects;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var project = $$obj[$index];

buf.push("<tr style=\"height:17px\"><td style=\"padding:0px 3px;vertical-align:bottom\">" + (jade.escape((jade_interp = project.name) == null ? '' : jade_interp)) + "</td><td style=\"padding:0px 3px;vertical-align:bottom;text-align:center\">" + (((jade_interp = project.hours) == null ? '' : jade_interp)) + "</td><td style=\"padding:0px 3px;vertical-align:bottom\"></td><td style=\"padding:0px 3px;vertical-align:bottom\">" + (jade.escape((jade_interp = project.manager) == null ? '' : jade_interp)) + "</td></tr>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var project = $$obj[$index];

buf.push("<tr style=\"height:17px\"><td style=\"padding:0px 3px;vertical-align:bottom\">" + (jade.escape((jade_interp = project.name) == null ? '' : jade_interp)) + "</td><td style=\"padding:0px 3px;vertical-align:bottom;text-align:center\">" + (((jade_interp = project.hours) == null ? '' : jade_interp)) + "</td><td style=\"padding:0px 3px;vertical-align:bottom\"></td><td style=\"padding:0px 3px;vertical-align:bottom\">" + (jade.escape((jade_interp = project.manager) == null ? '' : jade_interp)) + "</td></tr>");
    }

  }
}).call(this);

var n = 4
while (n-- > 0)
{
buf.push("<tr style=\"height:17px\"><td style=\"padding:0px 3px;vertical-align:bottom\"></td><td style=\"padding:0px 3px;vertical-align:bottom;text-align:center\"></td><td style=\"padding:0px 3px;vertical-align:bottom\"></td><td style=\"padding:0px 3px;vertical-align:bottom\"></td></tr>");
}
buf.push("<tr style=\"height:24px\"><td style=\"padding:0px 3px;vertical-align:bottom;font-weight:bold\">Итого за неделю:</td><td style=\"padding:0px 3px;font-weight:bold;vertical-align:bottom;text-align:center\">" + (jade.escape((jade_interp = email.totalHours) == null ? '' : jade_interp)) + "</td><td style=\"padding:0px 3px;vertical-align:bottom\"></td><td style=\"padding:0px 3px;vertical-align:bottom\"></td></tr></tbody></table></div></div><div style=\"font-size:13px\"><div><br/></div><div><div><div>Обрати внимание! В табличке &nbsp;<span style=\"background-color:rgb(255,153,0)\">оранжевым</span>&nbsp; отмечены запланированные часы по задачам, необходимость выполнения которых\nзависит от каких-либо внешних условий (оплаты, утверждения и прочее). Подробности\nможете узнать у менеджера проекта.</div><div><br/></div><div>В конце недели считаешь количество фактически отработанных часов по каждому \nпроекту и общее количество часов за неделю и заполняешь пустые ячейки.</div><div><b>Отправляешь табличку в пятницу вечером всем получателям, стоящим в копии письма.</b></div><div><br/></div><div>* Добавлены пустые строки для проектов, по которым на эту неделю запланировано \nвремени не было, но задачи по проектам выполнялись.</div></div><div><br/></div><div>Удачной рабочей недели :)</div></div><div><br/></div></div></div></div><div><div class=\"gmail_signature\"><table width=\"482\" height=\"63\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\"><tbody><tr><td width=\"482\"><p style=\"font-family:Arial,sans-serif;font-size:14px;line-height:17px;margin-bottom:10px;margin-top:0px\"><b>Верхотурова Татьяна</b><br/><span style=\"font-size:12px\">Тестировщик, контент-менеджер</span></p></td></tr><!--tr: td(width='482', height='75')--><!--  a(href='http://www.webprofy.ru/?utm_source=signature&utm_medium=verhoturova-tatyana', style='color:rgb(17,85,204)', target='_blank')--><!--    img(src='imap-message://zork33%40gmail%2Ecom@imap.googlemail.com/INBOX#51472?header=saveas&part=1.2&filename=webprofy.png', alt='logo1416310825', width='110', height='72')--><tr><td width=\"482\"><p style=\"font-family:Arial,sans-serif;font-size:12px;line-height:17px;margin-bottom:2px;margin-top:8px\">Skype: hi_pchela  |  Моб.: 8 (980) 559-58-41  |  Моб.: 8 (916) 056-08-34</p></td></tr><!--tr: td(width='482')--><!--  a(href='http://www.kokocgroup.ru/?utm_source=signature&utm_medium=verhoturova-tatyana', style='color:rgb(17,85,204)', target='_blank')--><!--    img(src='imap-message://zork33%40gmail%2Ecom@imap.googlemail.com/INBOX#51472?header=saveas&part=1.3&filename=kokocgroup.png', alt='kokocgroup', width='123')--></tbody></table></div></div></div></body></html>");}.call(this,"email" in locals_for_with?locals_for_with.email:typeof email!=="undefined"?email:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
}