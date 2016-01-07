'use strict';

var translate = function(x) {
  return x;
};

$(document).ready(function() {

  var getQueryVariable = function(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
      var pair = vars[i].split("=");
      if (pair[0] == variable) {
        return pair[1];
      }
    } 
    alert('Query Variable ' + variable + ' not found');
  }

  var digest = $('#digest');
  var timestamp = $('#timestamp');
  var blockchain_message = $('#blockchain_message');
  var icon = $('#icon');
  var certify_message = $('#certify_message');
  var confirmed_message = $('#confirmed_message');
  var confirming_message = $('#confirming_message');
  var tx = $('#tx');
  var plink = $('#payment_link');
  var qrcode;

  var pathname = window.location.pathname.split('/');
  var digestId = getQueryVariable('digest-id')

  var onFail = function() {
    digest.html(translate('Error!'));
    timestamp.html(translate('We couldn\'t find that document'));
    //window.location = 'http://old.proofofexistence.com/detail/' + uuid;
  };

  var onSuccess = function(data) {
    if (data.result == 0) {
      confirming_message.hide();
      blockchain_message.show();
      digest.html(data['digest-id']);
      var times = '';
      if (data.timestamp) {
        times += translate('Registered in our servers since:')
          + ' <strong>' + moment(new Date(data.timestamp*1000)).format()
          + '</strong><br />';
      }
      if (data.txstamp) {
        times += translate('Transaction broadcast timestamp:') +
          ' <strong>' + moment(new Date(data.txstamp*1000)).format() + '</strong><br />';
      }
      if (data.blockstamp) {
        times += translate('Registered in the private anychain since:') +
          ' <strong>' + moment(new Date(data.blockstamp*1000)).format() + '</strong><br />'
      }
      // if (data.signature) {
      //   times += '<h4>Signature info:</h4>' + data.signature.replace(/\n/gi, '<br/>')
      // }
      times += '<br />'
      timestamp.html(times);
      var msg = '';
      var clz = '';
      var in_blockchain = data.blockstamp && data.blockstamp.length > 1;
      var img_src = '';
      var txURL = 'http://192.168.250.3:2750/'
        + 'tx/' + data.tx;
      if (in_blockchain) {
        console.log('in blockchain');
        msg = translate('Document proof embedded in the private anychain!');
        clz = 'alert-success';
        img_src = 'check.png';
        tx.html('<a href="' + txURL + '"> ' + translate('Transaction') + ' ' + data.tx + '</a>');
        confirmed_message.show();
        confirming_message.hide();
        certify_message.hide();
      } else {
        console.log('registered');
        msg = translate('Document proof not yet be confirmed in the private anychain.');
        clz = 'alert-danger';
        img_src = 'warn.png';
        setTimeout(askDetails, 5000);
        tx.html('<a href="' + txURL + '"> ' + translate('Transaction') + ' ' + data.tx + '</a>');
        confirmed_message.hide();
        confirming_message.hide();
        certify_message.show();
      }
      blockchain_message.html(msg);
      blockchain_message.addClass(clz);

      icon.html('<img src="/img/' + img_src + '" />');
    } else {
      onFail();
    }
  };

  var askDetails = function() {
    $.getJSON('http://192.168.250.3:9099/api/v1/assets?digest-id=' + digestId,
      onSuccess).fail(onFail);
  };

  askDetails();

});