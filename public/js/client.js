const socket = io();
const form = document.getElementById('ticketForm');

form.addEventListener('submit', async e=>{
  e.preventDefault();
  const data = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    subject: form.subject.value.trim(),
    message: form.message.value.trim()
  };
  const res = await fetch('/api/tickets',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(data)
  });
  const j = await res.json();
  if(j.ok){
    form.style.display='none';
    document.getElementById('chatBox').style.display='block';
    const ticketId = j.ticket.id;
    socket.emit('join_ticket', ticketId);

    // load previous messages
    loadMessages(ticketId);

    document.getElementById('sendMsgBtn').onclick = async ()=>{
      const content = document.getElementById('msgInput').value.trim();
      if(!content) return;
      await fetch(`/api/tickets/${ticketId}/message`,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('token')||'')},
        body: JSON.stringify({content,sender:'user'})
      });
      document.getElementById('msgInput').value='';
    };

    socket.on('new_message', msg=>{
      if(msg.ticket_id!==ticketId) return;
      addMessage(msg);
    });
  }
});

function addMessage(msg){
  const mEl = document.createElement('div');
  mEl.className='msg '+msg.sender;
  mEl.innerText=`${msg.sender}: ${msg.content}`;
  document.getElementById('messages').appendChild(mEl);
  mEl.scrollIntoView();
}

async function loadMessages(ticketId){
  const res = await fetch(`/api/tickets/${ticketId}/messages`);
  const msgs = await res.json();
  msgs.forEach(addMessage);
}
