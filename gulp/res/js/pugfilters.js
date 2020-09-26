function pug_attr(t,e,n,r){if(!1===e||null==e||!e&&("class"===t||"style"===t))return"";if(!0===e)return" "+(r?t:t+'="'+t+'"');var f=typeof e;return"object"!==f&&"function"!==f||"function"!=typeof e.toJSON||(e=e.toJSON()),"string"==typeof e||(e=JSON.stringify(e),n||-1===e.indexOf('"'))?(n&&(e=pug_escape(e))," "+t+'="'+e+'"'):" "+t+"='"+e.replace(/'/g,"&#39;")+"'"}
function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_match_html=/["&<>]/;function filters(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;
    var locals_for_with = (locals || {});
    
    (function (filterArr) {
      pug_mixins["filters"] = pug_interp = function(filterArr){
var block = (this && this.block), attributes = (this && this.attributes) || {};
const filterTypeMap = { single: 'single', fid: 'ID', fname: 'name', ftrip: 'tripcode', fnamer: 'name regex', ftripr: 'tripcode regex' }
// iterate filterArr
;(function(){
  var $$obj = filterArr;
  if ('number' == typeof $$obj.length) {
      for (var pug_index0 = 0, $$l = $$obj.length; pug_index0 < $$l; pug_index0++) {
        var filter = $$obj[pug_index0];
pug_html = pug_html + "\u003Ctr\u003E\u003Ctd\u003E" + (pug_escape(null == (pug_interp = filterTypeMap[filter.type]) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug_escape(null == (pug_interp = filter.val.toString()) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E\u003Ca" + (" class=\"close\""+pug_attr("data-type", filter.type, true, false)+pug_attr("data-data", filter.val, true, false)) + "\u003EX\u003C\u002Fa\u003E\u003C\u002Ftd\u003E\u003C\u002Ftr\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index0 in $$obj) {
      $$l++;
      var filter = $$obj[pug_index0];
pug_html = pug_html + "\u003Ctr\u003E\u003Ctd\u003E" + (pug_escape(null == (pug_interp = filterTypeMap[filter.type]) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug_escape(null == (pug_interp = filter.val.toString()) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E\u003Ca" + (" class=\"close\""+pug_attr("data-type", filter.type, true, false)+pug_attr("data-data", filter.val, true, false)) + "\u003EX\u003C\u002Fa\u003E\u003C\u002Ftd\u003E\u003C\u002Ftr\u003E";
    }
  }
}).call(this);

};
pug_mixins["filters"](filterArr);
    }.call(this, "filterArr" in locals_for_with ?
        locals_for_with.filterArr :
        typeof filterArr !== 'undefined' ? filterArr : undefined));
    ;;return pug_html;}