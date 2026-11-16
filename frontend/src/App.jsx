/**
 * Componente principal de la interfaz del chat de lingüística.
 */

import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // Estado para almacenar el historial de mensajes de la conversación
  const [mensajes, setMensajes] = useState([]);

  // Efecto inicial para reiniciar el contexto en el servidor al cargar la aplicación
  useEffect(() => {
    fetch('http://localhost:8000/chatbot/refresh', {
      method: 'POST',
    });
  }, []);

  // Efecto para hacer scroll automático hacia el final del chat cada vez que se actualizan los mensajes
  useEffect(() => {
    const contenedor = document.getElementsByClassName('chat')[0];
    if (contenedor) {
      contenedor.scrollTop = contenedor.scrollHeight;
    }
  }, [mensajes]);

  /**
   * Maneja el evento de teclado en el textarea para enviar la pregunta al presionar Enter.
   */
  const handleKeyDown = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const inputElement = document.getElementById('input');
      const preguntaUser = inputElement.value;

      // Agrega el mensaje del usuario al estado local
      setMensajes((valorPrevio) => [
        ...valorPrevio,
        { clase: 'bubble-chat-user', texto: preguntaUser },
      ]);

      inputElement.value = '';

      const peticion = { pregunta: preguntaUser };
      
      const respuesta = await fetch('http://127.0.0.1:8000/chatbot/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(peticion),
      });

      const datos = await respuesta.json();

      // Agrega la respuesta generada por el bot al estado local
      setMensajes((valorPrevio) => [
        ...valorPrevio,
        { clase: 'bubble-chat-bot', texto: datos.respuesta },
      ]);
    }
  };

  return (
    <div className="grilla">
      <div className="title">CHATBOT DE LINGUISTICA</div>
      <div className="frame-chat">
        <div className="chat">
          {mensajes.map((mensaje, index) => (
            <div key={index} className={mensaje.clase}>
              {mensaje.texto}
            </div>
          ))}
        </div>
        <textarea id="input" onKeyDown={handleKeyDown}></textarea>
      </div>
    </div>
  );
}

export default App;