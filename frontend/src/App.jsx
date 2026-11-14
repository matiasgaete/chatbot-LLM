import { useState } from 'react'
import './App.css'

function App() {
  const [mensajes, addMsj] = useState(
    []
  )

  const enter = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const texto_input = document.getElementById('input').value;
      e.preventDefault();
      addMsj([
        ...mensajes,
        {clase: "bubble-chat-user", texto: texto_input},
        {clase: "bubble-chat-bot", texto: "respuestas"}
      ]);
      document.getElementById('input').value = '';
    }
  };

  return (
    <div class="grilla">
      <div class="title">CHATBOT DE LINGUISTICA</div>
      <div class="menu-chat">este es el menu</div>
      <div class="frame-chat">
        <div class="chat">
          {mensajes.map(mensajes => (<div class={mensajes.clase}>{mensajes.texto}</div>))}
        </div>
        <textarea id="input" onKeyDown={enter}></textarea>
      </div>
    </div>
  )
}

export default App
