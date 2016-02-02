var electron = require('electron');
var ipc = electron.ipcRenderer;
var remote = electron.remote;
var click = require('./click');
var qsa = require('./qsa');

var seen;

function extractData(ss) {
  var id, avatar, sender, subject;

  var p = ss.parentNode.parentNode.parentNode.parentNode.parentNode;
  var a = p.querySelector('[data-action-data]');
  var action = a.dataset.actionData;
  id = /#.+?:([^"]+)/.exec(action)[1];

  if (id.indexOf('^' === 0)) {
    // Use textContent for clusters
    id = p.textContent.replace(/\W/g, '');
  }

  if (p.classList.contains('full-cluster-item')
    || p.querySelector('.itemIconMarkedDone')
  ) return;


  subject = (p.querySelector('.lt') || p.querySelector('.qG span')).textContent;

  var brand = ss.getAttribute('brand_name');
  if (brand) {
    sender = brand;
    avatar = ss.getAttribute('brand_avatar_url');
  }
  else {
    sender = p.querySelector('[email]').textContent;
    var img = p.querySelector('img');
    if (img) {
      avatar = img.src;
    }
    else {
      var icon = p.querySelector('.pE');
      var bg = getComputedStyle(icon)['background-image'];
      avatar = bg.replace(/url\((.+)\)/, '$1');
    }
  }

  return {
    id: id,
    subject: subject,
    sender: ss.textContent,
    avatar: avatar,
    element: ss
  };
}

function getNew(messages) {
  return messages.filter(function(msg) {
    return !seen[msg.id];
  });
}

function getUnreadMessages() {
  if (!document.querySelector('.hn.b4')) return []; // not inside the inbox
  return qsa('.ss').map(extractData).filter(Boolean);
}

function checkState() {
  var messages = getUnreadMessages();
  var count = messages.length;
  ipc.send('unread', '' + count);

  var firstTime = !seen;
  if (firstTime) seen = {};

  getNew(messages).forEach(function(msg) {
    if (!firstTime) {
      // Don't show notifications upon startup
      new Notification(msg.sender, {
        tag: msg.id,
        body: msg.subject,
        icon: msg.avatar
      })
      .addEventListener('click', function(ev) {
        remote.getCurrentWindow().show();
        click(msg.element);
      });
    }
    seen[msg.id] = true;
  });

  setTimeout(checkState, 1000);
}

checkState();
