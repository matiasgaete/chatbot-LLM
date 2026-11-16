import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [mensajes, addMsj] = useState(
    []
  );

  useEffect(() => {
    fetch('http://localhost:8000/chatbot/refresh', {
      method: 'POST'
    })
  }, []); 

  useEffect(() => {
        const contenedor = document.getElementsByClassName("chat")[0];
        contenedor.scrollTop = contenedor.scrollHeight;
    }, [mensajes]);
  
  const enter = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const pregunta_user = document.getElementById('input').value;

      addMsj(
        valorPrevio => [
          ...valorPrevio,
          {clase: "bubble-chat-user", texto: pregunta_user}
        ]
      )

      document.getElementById('input').value = '';
      const peticion = {pregunta: pregunta_user}
      const respuesta = await fetch("http://127.0.0.1:8000/chatbot/responder", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(peticion)
      })

      const datos = await respuesta.json();
      addMsj(
        valorPrevio => [
         ...valorPrevio,
         {clase: "bubble-chat-bot", texto: datos.respuesta}
        ]
      );
    }
  };


  return (
    <div className="grilla">
      <div className="title">CHATBOT DE LINGUISTICA</div>
      <div className="frame-chat">
        <div className="chat">
          {mensajes.map(mensajes => (<div class={mensajes.clase}>{mensajes.texto}</div>))}
        </div>
        <textarea id="input" onKeyDown={enter}></textarea>
      </div>
    </div>
  )
}

export default App
