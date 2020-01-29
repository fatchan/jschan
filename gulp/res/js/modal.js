function pug_attr(t,e,n,r){if(!1===e||null==e||!e&&("class"===t||"style"===t))return"";if(!0===e)return" "+(r?t:t+'="'+t+'"');var f=typeof e;return"object"!==f&&"function"!==f||"function"!=typeof e.toJSON||(e=e.toJSON()),"string"==typeof e||(e=JSON.stringify(e),n||-1===e.indexOf('"'))?(n&&(e=pug_escape(e))," "+t+'="'+e+'"'):" "+t+"='"+e.replace(/'/g,"&#39;")+"'"}
function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_has_own_property=Object.prototype.hasOwnProperty;
var pug_match_html=/["&<>]/;
function pug_style(r){if(!r)return"";if("object"==typeof r){var t="";for(var e in r)pug_has_own_property.call(r,e)&&(t=t+e+":"+r[e]+";");return t}return r+""}function modal(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;var locals_for_with = (locals || {});(function (modal) {pug_mixins["modal"] = pug_interp = function(data){
var block = (this && this.block), attributes = (this && this.attributes) || {};
pug_html = pug_html + "\u003Cdiv" + (" class=\"modal-bg\""+pug_attr("style", pug_style(data.hidden?'display:none':''), true, false)) + "\u003E\u003C\u002Fdiv\u003E\u003Cdiv" + (" class=\"modal\""+pug_attr("style", pug_style(data.hidden?'display:none':''), true, false)) + "\u003E\u003Cdiv class=\"row\"\u003E\u003Cp class=\"bold\"\u003E" + (pug_escape(null == (pug_interp = data.title) ? "" : pug_interp)) + "\u003C\u002Fp\u003E\u003Ca class=\"close postform-style\" id=\"modalclose\"\u003EX\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"row\"\u003E";
if (data.message || data.messages || data.error || data.errors) {
pug_html = pug_html + "\u003Cul class=\"nomarks\"\u003E";
if (data.message) {
pug_html = pug_html + "\u003Cli\u003E" + (pug_escape(null == (pug_interp = data.message) ? "" : pug_interp)) + "\u003C\u002Fli\u003E";
}
if (data.error) {
pug_html = pug_html + "\u003Cli\u003E" + (pug_escape(null == (pug_interp = data.error) ? "" : pug_interp)) + "\u003C\u002Fli\u003E";
}
if (data.messages) {
// iterate data.messages
;(function(){
  var $$obj = data.messages;
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
if (data.errors) {
// iterate data.errors
;(function(){
  var $$obj = data.errors;
  if ('number' == typeof $$obj.length) {
      for (var pug_index1 = 0, $$l = $$obj.length; pug_index1 < $$l; pug_index1++) {
        var error = $$obj[pug_index1];
pug_html = pug_html + "\u003Cli\u003E" + (pug_escape(null == (pug_interp = error) ? "" : pug_interp)) + "\u003C\u002Fli\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index1 in $$obj) {
      $$l++;
      var error = $$obj[pug_index1];
pug_html = pug_html + "\u003Cli\u003E" + (pug_escape(null == (pug_interp = error) ? "" : pug_interp)) + "\u003C\u002Fli\u003E";
    }
  }
}).call(this);

}
pug_html = pug_html + "\u003C\u002Ful\u003E";
}
else
if (data.settings) {
pug_html = pug_html + "\u003Cdiv class=\"form-wrapper flexleft mt-10\"\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"label\"\u003ETheme\u003C\u002Fdiv\u003E\u003Cselect id=\"theme-setting\"\u003E\u003Coption value=\"default\"\u003Edefault\u003C\u002Foption\u003E";
// iterate data.settings.themes
;(function(){
  var $$obj = data.settings.themes;
  if ('number' == typeof $$obj.length) {
      for (var pug_index2 = 0, $$l = $$obj.length; pug_index2 < $$l; pug_index2++) {
        var theme = $$obj[pug_index2];
pug_html = pug_html + "\u003Coption" + (pug_attr("value", theme, true, false)) + "\u003E" + (pug_escape(null == (pug_interp = theme) ? "" : pug_interp)) + "\u003C\u002Foption\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index2 in $$obj) {
      $$l++;
      var theme = $$obj[pug_index2];
pug_html = pug_html + "\u003Coption" + (pug_attr("value", theme, true, false)) + "\u003E" + (pug_escape(null == (pug_interp = theme) ? "" : pug_interp)) + "\u003C\u002Foption\u003E";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Fselect\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"label\"\u003ECode theme\u003C\u002Fdiv\u003E\u003Cselect id=\"codetheme-setting\"\u003E\u003Coption value=\"default\"\u003Edefault\u003C\u002Foption\u003E";
// iterate data.settings.codeThemes
;(function(){
  var $$obj = data.settings.codeThemes;
  if ('number' == typeof $$obj.length) {
      for (var pug_index3 = 0, $$l = $$obj.length; pug_index3 < $$l; pug_index3++) {
        var theme = $$obj[pug_index3];
pug_html = pug_html + "\u003Coption" + (pug_attr("value", theme, true, false)) + "\u003E" + (pug_escape(null == (pug_interp = theme) ? "" : pug_interp)) + "\u003C\u002Foption\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index3 in $$obj) {
      $$l++;
      var theme = $$obj[pug_index3];
pug_html = pug_html + "\u003Coption" + (pug_attr("value", theme, true, false)) + "\u003E" + (pug_escape(null == (pug_interp = theme) ? "" : pug_interp)) + "\u003C\u002Foption\u003E";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Fselect\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"label\"\u003ELive posts\u003C\u002Fdiv\u003E\u003Clabel class=\"postform-style ph-5\"\u003E\u003Cinput id=\"live-setting\" type=\"checkbox\"\u002F\u003E\u003C\u002Flabel\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"label\"\u003ENotifications\u003C\u002Fdiv\u003E\u003Clabel class=\"postform-style ph-5\"\u003E\u003Cinput id=\"notification-setting\" type=\"checkbox\"\u002F\u003E\u003C\u002Flabel\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"label\"\u003EScroll to new posts\u003C\u002Fdiv\u003E\u003Clabel class=\"postform-style ph-5\"\u003E\u003Cinput id=\"scroll-setting\" type=\"checkbox\"\u002F\u003E\u003C\u002Flabel\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"label\"\u003ELocal time\u003C\u002Fdiv\u003E\u003Clabel class=\"postform-style ph-5\"\u003E\u003Cinput id=\"localtime-setting\" type=\"checkbox\"\u002F\u003E\u003C\u002Flabel\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"label\"\u003E24h time\u003C\u002Fdiv\u003E\u003Clabel class=\"postform-style ph-5\"\u003E\u003Cinput id=\"24hour-setting\" type=\"checkbox\"\u002F\u003E\u003C\u002Flabel\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"label\"\u003EShow relative time\u003C\u002Fdiv\u003E\u003Clabel class=\"postform-style ph-5\"\u003E\u003Cinput id=\"relative-setting\" type=\"checkbox\"\u002F\u003E\u003C\u002Flabel\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"label\"\u003EHide Thumbnails\u003C\u002Fdiv\u003E\u003Clabel class=\"postform-style ph-5\"\u003E\u003Cinput id=\"hideimages-setting\" type=\"checkbox\"\u002F\u003E\u003C\u002Flabel\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"label\"\u003EDefault volume\u003C\u002Fdiv\u003E\u003Clabel class=\"postform-style ph-5\"\u003E\u003Cinput id=\"volume-setting\" type=\"range\" min=\"0\" max=\"100\"\u002F\u003E\u003C\u002Flabel\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"label\"\u003ELoop audio\u002Fvideo\u003C\u002Fdiv\u003E\u003Clabel class=\"postform-style ph-5\"\u003E\u003Cinput id=\"loop-setting\" type=\"checkbox\"\u002F\u003E\u003C\u002Flabel\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"label\"\u003ELimit expand height\u003C\u002Fdiv\u003E\u003Clabel class=\"postform-style ph-5\"\u003E\u003Cinput id=\"heightlimit-setting\" type=\"checkbox\"\u002F\u003E\u003C\u002Flabel\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"label\"\u003ECrisp image rendering\u003C\u002Fdiv\u003E\u003Clabel class=\"postform-style ph-5\"\u003E\u003Cinput id=\"crispimages-setting\" type=\"checkbox\"\u002F\u003E\u003C\u002Flabel\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"label\"\u003ECustom CSS\u003C\u002Fdiv\u003E\u003Ctextarea id=\"customcss-setting\"\u003E\u003C\u002Ftextarea\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
};
pug_mixins["modal"](modal);}.call(this,"modal" in locals_for_with?locals_for_with.modal:typeof modal!=="undefined"?modal:undefined));;return pug_html;}