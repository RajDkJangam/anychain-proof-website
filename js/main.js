function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return null;
};

var userLang = navigator.language || navigator.userLanguage;
var lang = getQueryVariable("lang");
if (lang != null) {
    userLang = lang;
    localStorage.setItem("lang", userLang);
} else {
    userLang = localStorage.getItem("lang");
}
console.log("lang: " + userLang);
$(function(){
    var opts = { language: userLang, pathPrefix: "i18n" };
    $("[data-localize]").localize("strings", opts)
})

var i18n = $.i18n()
i18n.locale = userLang;
i18n.load( 'i18n/strings-' + i18n.locale + '.json', i18n.locale )

var translate = function(message) {
    return $.i18n(message);
};
