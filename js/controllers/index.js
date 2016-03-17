'use strict';

var isInteger = function(n) {
    return n == parseInt(n, 10);
}

var show_message = function(message, type) {
  if (!type) {
    type = 'success';
  }
  $('.top-right').notify({
    'type': type,
    message: {
      'text': translate(message)
    },
    fadeOut: {
      enabled: true,
      delay: 5000
    }
  }).show();
};

var message = {
  'format': ('Must select a file to upload'),
  'existing': ('File already exists in the system. Redirecting...'),
  'added': ('File successfully added to system. Redirecting...')
};

$(document).ready(function() {

  var bar = $('.bar');
  var upload_submit = $('#upload_submit');
  var upload_form = $('#upload_form');
  var latest = $('#latest');
  var latest_confirmed = $('#latest_confirmed');
  var explain = $('#explain');
  var dropbox = $('.dropbox');

  // uncomment this to try non-HTML support:
  //window.File = window.FileReader = window.FileList = window.Blob = null;

  var html5 = window.File && window.FileReader && window.FileList && window.Blob;
  $('#wait').hide();

  var handleFileSelect = function(f) {
    if (!html5) {
      return;
    }
    explain.html(translate('Loading document...'));
    var output = '';
    output = translate('Preparing to hash ') + f.name + ' (' + (f.type || translate('n/a')) + ') - '
      + f.size + translate(' bytes, ') + translate('last modified: ')
      + (f.lastModifiedDate ? f.lastModifiedDate
      .toLocaleDateString() : translate('n/a')) + '';

    var reader = new FileReader();
    reader.onload = function(e) {
      var data = e.target.result;
      bar.width(0 + '%');
      bar.addClass('bar-success');
      explain.html(translate('Now hashing... ') + translate('Initializing'));
      setTimeout(function() {
        CryptoJS.SHA256(data, crypto_callback, crypto_finish);
      }, 200);

    };
    reader.onprogress = function(evt) {
      if (evt.lengthComputable) {
        var w = (((evt.loaded / evt.total) * 100).toFixed(2));
        bar.width(w + '%');
      }
    };
    reader.readAsBinaryString(f);
    show_message(output, 'info');
  };
  if (!html5) {
    explain.html(translate('disclaimer'));
    upload_form.show();
  } else {
    dropbox.show();
    dropbox.filedrop({
      callback: handleFileSelect
    });
    dropbox.click(function() {
      $('#file').click();
    });
  }

  // latest documents
  var refreshLatest = function(confirmed, table) {
    $.getJSON('http://192.168.250.3:9099/api/v1/assets/search?is-confirmed='
        + confirmed, function(data) {
      var items = [];
      table.html('')
      table.append(
        '<thead><tr><th style="width: 1%"></th>'
        + '<th style="width: 69%">'
        + translate('Document Hash') + '</th>'
        + '<th style="width: 30%">'
        + translate('Timestamp') + '</th>'
        + '</tr></thead>');
      table.append("<tbody>");
      $.each(data, function(index, obj) {
        var badge = '';
        if (obj.blockstamp) {
          badge = '<span class="label label-success">✔</span>';
        }
        var date = obj.timestamp
        if (isInteger(date)) {
          date = moment(new Date(obj.timestamp*1000)).format();
        }
        var digest = obj['digest-id']
        if (typeof digest == 'undefined') {
          digest = obj['degist-id']
        }
        table.append('<tr><td>' + badge +
          '</td><td><a href="./detail.html?digest-id=' + digest +
          '">' + digest +
          '</a></td><td> ' + date + '</td></tr>');
      });
      table.append("</tbody>");
      if (data.length > 0) {
        var dataTableDef = {
          destroy: true,
          dom: 'lrtip',
          "order": [[ 2, "desc" ]],
          "language": {
              "emptyTable":     translate("emptyTable"),
              "info":           translate("info"),
              "infoEmpty":      translate("infoEmpty"),
              "infoFiltered":   translate("infoFiltered"),
              "thousands":      ",",
              "lengthMenu":     translate("lengthMenu"),
              "loadingRecords": translate("loadingRecords"),
              "processing":     translate("processing"),
              "search":         translate("search"),
              "zeroRecords":    translate("zeroRecords"),
              "paginate": {
                  "first":      translate("paginate_first"),
                  "last":       translate("paginate_last"),
                  "next":       translate("paginate_next"),
                  "previous":   translate("paginate_previous")
              },
              "aria": {
                  "sortAscending":  ": activate to sort column ascending",
                  "sortDescending": ": activate to sort column descending"
              }
          }
        };
        table.dataTable(dataTableDef);
      }
    });
  };
  refreshLatest(false, latest);
  refreshLatest(true, latest_confirmed);

  // client-side hash
  var onRegisterSuccess = function(json) {
    console.log("test111")
    console.log(json)
    if (json.result == 0) {
      show_message(message['added'], 'success');
    } else {
      if (json.result == 1 && json.reason == 'existing_asset') {
        show_message(message['existing'], 'warn');
      } else {
        show_message(message[json.reason], 'warn');
      }
    }
    if (json['digest-id']) {
      window.setTimeout(function() {
        window.location.replace('./detail.html?digest-id=' + json['digest-id']);
      }, 5000);
    }
  };

  var crypto_callback = function(p) {
    var w = ((p * 100).toFixed(0));
    bar.width(w + '%');
    explain.html(translate('Now hashing... ') + (w) + '%');
  };

  var crypto_finish = function(hash) {
    bar.width(100 + '%');
    explain.html(translate('Document hash: ') + hash);
    var rbody = {'digest-id': hash};
    $.ajax({
      url: 'http://192.168.250.3:9099/api/v1/assets',
      type: 'post',
      data: JSON.stringify({'digest-id': hash.toString()}),
      dataType   : 'json',
      success: onRegisterSuccess
    });
  };


  document.getElementById('file').addEventListener('change', function(evt) {
    var f = evt.target.files[0];
    handleFileSelect(f);
  }, false);

  // upload form (for non-html5 clients)
  upload_submit.click(function() {
    upload_form.ajaxForm({
      dataType: 'json',
      beforeSubmit: function() {
        var percentVal = '0%';
        bar.removeClass('bar-danger');
        bar.removeClass('bar-warning');
        bar.removeClass('bar-success');
        bar.addClass('bar-info');
        bar.width(percentVal);
      },
      uploadProgress: function(event, position, total, percentComplete) {
        var percentVal = percentComplete + '%';
        bar.width(percentVal);
      },
      success: onRegisterSuccess
    });

  });
});
