function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_match_html=/["&<>]/;function modal(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;var locals_for_with = (locals || {});(function (error, errors, message, messages, title) {pug_html = pug_html + "\u003Cdiv class=\"modal-bg\"\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"modal\"\u003E\u003Cdiv class=\"row\"\u003E\u003Cp class=\"bold\"\u003E" + (pug_escape(null == (pug_interp = title) ? "" : pug_interp)) + "\u003C\u002Fp\u003E\u003Ca class=\"close postform-style\" id=\"modalclose\"\u003EX\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"row\"\u003E\u003Cul class=\"nomarks\"\u003E";
if (message) {
pug_html = pug_html + "\u003Cli\u003E" + (pug_escape(null == (pug_interp = message) ? "" : pug_interp)) + "\u003C\u002Fli\u003E";
}
else
if (error) {
pug_html = pug_html + "\u003Cli\u003E" + (pug_escape(null == (pug_interp = error) ? "" : pug_interp)) + "\u003C\u002Fli\u003E";
}
else
if (messages) {
// iterate messages
;(function(){
  var $$obj = messages;
  if ('number' == typeof $$obj.length) {
      for (var pug_index0 = 0, $$l = $$obj.length; pug_index0 < $$l; pug_index0++) {
        var msg = $$obj[pug_index0];
pug_html = pug_html + "\u003Cli\u003E" + (pug_escape(null == (pug_interp = msg) ? "" : pug_interp)) + "\u003C\u002Fli\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index0 in $$obj) {
      $$l++;
      var msg = $$obj[pug_index0];
pug_html = pug_html + "\u003Cli\u003E" + (pug_escape(null == (pug_interp = msg) ? "" : pug_interp)) + "\u003C\u002Fli\u003E";
    }
  }
}).call(this);

}
else
if (errors) {
// iterate errors
;(function(){
  var $$obj = errors;
  if ('number' == typeof $$obj.length) {
      for (var pug_index1 = 0, $$l = $$obj.length; pug_index1 < $$l; pug_index1++) {
        var err = $$obj[pug_index1];
pug_html = pug_html + "\u003Cli\u003E" + (pug_escape(null == (pug_interp = err) ? "" : pug_interp)) + "\u003C\u002Fli\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index1 in $$obj) {
      $$l++;
      var err = $$obj[pug_index1];
pug_html = pug_html + "\u003Cli\u003E" + (pug_escape(null == (pug_interp = err) ? "" : pug_interp)) + "\u003C\u002Fli\u003E";
    }
  }
}).call(this);

}
pug_html = pug_html + "\u003C\u002Ful\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";}.call(this,"error" in locals_for_with?locals_for_with.error:typeof error!=="undefined"?error:undefined,"errors" in locals_for_with?locals_for_with.errors:typeof errors!=="undefined"?errors:undefined,"message" in locals_for_with?locals_for_with.message:typeof message!=="undefined"?message:undefined,"messages" in locals_for_with?locals_for_with.messages:typeof messages!=="undefined"?messages:undefined,"title" in locals_for_with?locals_for_with.title:typeof title!=="undefined"?title:undefined));;return pug_html;}