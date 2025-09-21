import React, { useState, useEffect, useRef } from "react";

const VoiceToText = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [silenceDelay] = useState(1000); // 2 segundos de silencio para detener
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);

  useEffect(() => {
    // Obtener dispositivos de audio
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => navigator.mediaDevices.enumerateDevices())
      .then((deviceInfos) => {
        const mics = deviceInfos.filter((d) => d.kind === "audioinput");
        setDevices(mics);
        if (mics.length > 0) setSelectedDeviceId(mics[0].deviceId);
      })
      .catch((err) => console.error("Error micrófono:", err));

    // Configurar reconocimiento de voz
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta Speech Recognition API (usa Chrome/Edge)");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      // Reiniciar el temporizador de silencio cuando se detecta voz
      resetSilenceTimer();
      
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setFinalTranscript((prev) => prev + final);
        setInterimTranscript("");
      }
      if (interim) {
        setInterimTranscript(interim);
      }
    };

    recognition.onend = () => {
      clearTimeout(silenceTimerRef.current);
      setListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Error en reconocimiento:", event.error);
      clearTimeout(silenceTimerRef.current);
      setListening(false);
    };

    recognitionRef.current = recognition;

    // Limpiar el temporizador al desmontar el componente
    return () => {
      clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // Función para reiniciar el temporizador de silencio
  const resetSilenceTimer = () => {
    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (listening) {
        console.log("Deteniendo por silencio...");
        stopListening();
      }
    }, silenceDelay);
  };

  const startListening = () => {
    if (recognitionRef.current && !listening) {
      setFinalTranscript("");
      setInterimTranscript("");
      navigator.mediaDevices
        .getUserMedia({ audio: { deviceId: selectedDeviceId } })
        .then(() => {
          recognitionRef.current.start();
          setListening(true);
          resetSilenceTimer(); // Iniciar el temporizador de silencio
        })
        .catch((err) => console.error("Error al iniciar:", err));
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      clearTimeout(silenceTimerRef.current);
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  return (
    <div style={{ 
      padding: "2rem", 
      maxWidth: "900px", 
      margin: "0 auto"
    }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h2 style={{ color: "#2c3e50", marginBottom: "1.5rem" }}>🎤 Voz a Texto con Detención Automática</h2>
      </div>

      {/* Selector de micrófono */}
      <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        <label htmlFor="mic-select" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
          Seleccionar micrófono:
        </label>
        <select
          id="mic-select"
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          style={{ padding: "0.5rem", width: "100%", maxWidth: "300px" }}
        >
          {devices.map((d, i) => (
            <option key={i} value={d.deviceId}>
              {d.label || `Micrófono ${i + 1}`}
            </option>
          ))}
        </select>
      </div>

      {/* Botones de control */}
      <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        <button 
          onClick={startListening} 
          disabled={listening}
          style={{
            margin: "0 0.5rem",
            padding: "0.75rem 1.5rem",
            backgroundColor: listening ? "#95a5a6" : "#2ecc71",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: listening ? "not-allowed" : "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            transition: "background-color 0.3s"
          }}
          onMouseOver={(e) => {
            if (!listening) e.target.style.backgroundColor = "#27ae60";
          }}
          onMouseOut={(e) => {
            if (!listening) e.target.style.backgroundColor = "#2ecc71";
          }}
        >
          Iniciar Grabación
        </button>
        <button 
          onClick={stopListening} 
          disabled={!listening}
          style={{
            margin: "0 0.5rem",
            padding: "0.75rem 1.5rem",
            backgroundColor: !listening ? "#95a5a6" : "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: !listening ? "not-allowed" : "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            transition: "background-color 0.3s"
          }}
          onMouseOver={(e) => {
            if (listening) e.target.style.backgroundColor = "#c0392b";
          }}
          onMouseOut={(e) => {
            if (listening) e.target.style.backgroundColor = "#e74c3c";
          }}
        >
          Detener Grabación
        </button>
      </div>

      {/* Indicador de estado */}
      <div style={{ 
        marginBottom: "1.5rem", 
        textAlign: "center"
      }}>
        <div style={{ 
          padding: "0.75rem", 
          backgroundColor: listening ? "#2ecc71" : "#e74c3c",
          color: "white",
          borderRadius: "4px",
          fontWeight: "bold",
          display: "inline-block"
        }}>
          {listening ? "🎤 ESCUCHANDO..." : "⏸️ DETENIDO"}
        </div>
      </div>

      {/* Información */}
      <div style={{ 
        marginBottom: "1.5rem", 
        padding: "1rem", 
        backgroundColor: "#f8f9fa", 
        borderRadius: "4px",
        borderLeft: "4px solid #3498db",
        textAlign: "center"
      }}>
        <p style={{ margin: "0", color: "#2c3e50" }}>
          <strong>Nota:</strong> La grabación se detendrá automáticamente después de {silenceDelay/1000} segundos de silencio.
        </p>
      </div>

      {/* Área de transcripción */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ color: "#2c3e50", borderBottom: "2px solid #eee", paddingBottom: "0.5rem" }}>
          Transcripción
        </h3>
      </div>
      <div
        style={{
          padding: "1.5rem",
          border: "2px solid #ddd",
          borderRadius: "8px",
          height: "300px", // Altura fija
          width: "100%", // Ancho fijo
          textAlign: "left",
          fontSize: "1.1rem",
          lineHeight: "1.6",
          backgroundColor: "#fdfdfd",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          color: "#000000", // Texto en negro
          overflowY: "auto", // Scroll vertical cuando sea necesario
          overflowX: "hidden", // Sin scroll horizontal
          wordWrap: "break-word", // Romper palabras largas
          whiteSpace: "pre-wrap" // Preservar espacios y saltos de línea
        }}
      >
        <span style={{ color: "#000000" }}>{finalTranscript}</span>
        <span style={{ color: "#666666" }}>{interimTranscript}</span>
        {!finalTranscript && !interimTranscript && (
          <span style={{ color: "#bbb", fontStyle: "italic" }}>
            El texto transcrito aparecerá aquí. Habla claramente después de presionar "Iniciar Grabación".
          </span>
        )}
      </div>

      {/* Contador de palabras */}
      <div style={{ 
        marginTop: "1rem", 
        textAlign: "right", 
        color: "#7f8c8d",
        fontSize: "0.9rem"
      }}>
        Palabras: {finalTranscript.split(/\s+/).filter(Boolean).length}
        {interimTranscript && ` + ${interimTranscript.split(/\s+/).filter(Boolean).length} provisionales`}
      </div>
    </div>
  );
};

export default VoiceToText;