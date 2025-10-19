const socket = io();
let token='';

document.getElementById('loginBtn').onclick=async ()=>{
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/api/login',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({username,password})
  });
  const j = await res.json();
  if(j.token){
    token=j.token;
    localStorage.setItem('token',token);
    document.getElementById('loginBox').style.display='none';
    document.getElementById('adminPanel').style.display='block';
  }else alert('Login failed');
};

// recevoir nouveau ticket
socket.on('new_ticket', ticket=>{
  addTicket(ticket);
});

function addTicket(ticket){
  const tEl = document.createElement('div');
  tEl.className='ticket';
  tEl.innerHTML=`<b>${ticket.subject}</b> - ${ticket.name} <button onclick="openTicketChat(${ticket.id})">Ouvrir chat</button>`;
  document.getElementById('ticketsList').appendChild(tEl);
}

function openTicketChat(ticketId){
  const chatEl = document.createElement('div');
  chatEl.className='admin-chat';
  chatEl.innerHTML=`
    <div id="chat_${ticketId}" class="messages"></div>
    <textarea id="input_${ticketId}" placeholder="Écrire un message..."></textarea>
    <button id="send_${ticketId}">Envoyer</button>
  `;
  document.getElementById('ticketsList').appendChild(chatEl);

  socket.emit('join_ticket', ticketId);

  fetch(`/api/tickets/${ticketId}/messages`).then(r=>r.json()).then(msgs=>{
    msgs.forEach(m=> addAdminMsg(ticketId,m));
  });

  document.getElementById(`send_${ticketId}`).onclick=async ()=>{
    const content = document.getElementById(`input_${ticketId}`).value.trim();
    if(!content) return;
    await fetch(`/api/tickets/${ticketId}/message`,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body: JSON.stringify({content,sender:'admin'})
    });
    document.getElementById(`input_${ticketId}`).value='';
  };

  socket.on('new_message', msg=>{
    if(msg.ticket_id!==ticketId) return;
    addAdminMsg(ticketId,msg);
  });
}

function addAdminMsg(ticketId,msg){
  const mEl = document.createElement('div');
  mEl.className='msg '+msg.sender;
  mEl.innerText=`${msg.sender}: ${msg.content}`;
  document.getElementById(`chat_${ticketId}`).appendChild(mEl);
  mEl.scrollIntoView();
}
