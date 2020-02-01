var lastRetrievalDate,
    timer,
    delay = 100;


function createElement(type, classObj={}, text=undefined, node1=undefined, node2=undefined) {
  const div = document.createElement(type);
  if (text) {
    const content = document.createTextNode(text);
    div.appendChild(content);
  }
  if (node1) {
    div.appendChild(node1);
  }
  if (node2) {
    div.appendChild(node2);
  }
  for (const id in classObj) {
    div.setAttribute(id, classObj[id]);
  }
  return div;
}

function sendMessage(message) {
  //console.log('sending message', message);
  const req= new XMLHttpRequest();
  var slug = document.getElementById('chat-id').value;
  req.open('POST', 'http://localhost:3000/chat/' + slug + '/send', true);
  req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
  req.send('text=' + message);
  req.addEventListener('load', function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    clearTimeout(timer);
    getMessages(slug);
  }, true);
}
/**
function handleGet(evt, req) {
  evt.stopPropagation();
  evt.preventDefault();
  if (req.status >= 200 && req.status < 400){
    data = JSON.parse(req.responseText);
    const messageWrapper = document.getElementById('message-wrapper');
    console.log("node1",messageWrapper.childNodes);
    messageWrapper.removeChild(messageWrapper.childNodes[1]);
    const messageList = document.createElement('div');
    messageList.setAttribute('id', 'message-list')
    messageWrapper.appendChild(messageList);
    //data.forEach(function(msg) {
      //let newele = createElement('div', {class: 'message-content'}, msg.time + ' - ' + msg.text + ' sent by ' + msg.sender_name);
      //let div = messageList.appendChild(newele);
    //});

    for (let i = 0; i < data.length; i++) {
      const newele = document.createElement('div');
      newele.setAttribute('class', 'message-content');
      newele.textContent = data[i].time + ' - ' + data[i].text + ' sent by ' + data[i].sender_name;
      const div = messageList.appendChild(newele);
    }
    //console.log(data);
    console.log("node2",messageWrapper.childNodes);
    //messageWrapper.removeChild(messageWrapper.childNodes[2]);
    timer = setTimeout(getMessages(slug), 1000);
  } else {
    console.log(req.status);
  }
}**/

function getMessages(slug) {
  var slug = document.getElementById('chat-id').value;
  var req = new XMLHttpRequest(),
  url = 'http://localhost:3000/chat/'+ slug + '/send';
  console.log("slug isis", slug);
  req.open('GET', url, true);

  req.addEventListener('load', function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    if (req.status >= 200 && req.status < 400){
      data = JSON.parse(req.responseText);
      const messageWrapper = document.getElementById('message-wrapper');
      console.log("node1",messageWrapper.childNodes);
      messageWrapper.removeChild(messageWrapper.childNodes[1]);
      const messageList = document.createElement('div');
      messageList.setAttribute('id', 'message-list')
      messageWrapper.appendChild(messageList);
      //data.forEach(function(msg) {
        //let newele = createElement('div', {class: 'message-content'}, msg.time + ' - ' + msg.text + ' sent by ' + msg.sender_name);
        //let div = messageList.appendChild(newele);
      //});

      for (let i = 0; i < data.length; i++) {
        const newele = document.createElement('div');
        newele.setAttribute('class', 'message-content');
        newele.textContent = data[i].time + ' - ' + data[i].text + ' sent by ' + data[i].sender_name;
        const div = messageList.appendChild(newele);
      }
      //console.log(data);
      console.log("node2",messageWrapper.childNodes);
      //messageWrapper.removeChild(messageWrapper.childNodes[2]);
      timer = setTimeout(getMessages(slug), 1000);
    } else {
      console.log(req.status);
    }
  }, true);
  req.addEventListener('error', function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    console.log('uh-oh... network error or cross domain request');
  }, true);

  req.send();
}

function handleClick(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  var slug = document.getElementById('chat-id').value;
  const sendMessageBox = document.getElementById('send-message-box');
  const message = sendMessageBox.value;
  sendMessageBox.value = "";
  sendMessage(message, slug);
}

function main(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  const sendButton = document.getElementById('send-message-button');
  sendButton.addEventListener('click', handleClick, true);
  getMessages(slug);
}

document.addEventListener("DOMContentLoaded", main, true);