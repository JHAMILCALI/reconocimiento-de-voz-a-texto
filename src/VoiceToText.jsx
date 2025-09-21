import React, { useState, useEffect, useRef } from "react";

const VoiceToText = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [finalTranscript, setFinalTranscript] = useState(""); // texto confirmado
  const [interimTranscript, setInterimTranscript] = useState(""); // texto provisional
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => navigator.mediaDevices.enumerateDevices())
      .then((deviceInfos) => {
        const mics = deviceInfos.filter((d) => d.kind === "audioinput");
        setDevices(mics);
        if (mics.length > 0) setSelectedDeviceId(mics[0].deviceId);
      })
      .catch((err) => console.error("Error micrófono:", err));

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta Speech Recognition API (usa Chrome/Edge)");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES"; // idioma
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
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

      // ✅ Guardar textos separados
      if (final) {
        setFinalTranscript((prev) => prev + final);
        setInterimTranscript(""); // limpiar interino cuando llega final
      }
      if (interim) {
        setInterimTranscript(interim);
      }
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !listening) {
      setFinalTranscript("");
      setInterimTranscript("");
      navigator.mediaDevices
        .getUserMedia({ audio: { deviceId: selectedDeviceId } })
        .then(() => {
          recognitionRef.current.start();
          setListening(true);
        })
        .catch((err) => console.error("Error al iniciar:", err));
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>🎤 Voz a Texto con Resultados Limpios</h2>

      {/* Selector de micrófono */}
      <select
        value={selectedDeviceId}
        onChange={(e) => setSelectedDeviceId(e.target.value)}
        style={{ marginBottom: "1rem", padding: "0.5rem" }}
      >
        {devices.map((d, i) => (
          <option key={i} value={d.deviceId}>
            {d.label || `Micrófono ${i + 1}`}
          </option>
        ))}
      </select>

      <div>
        <button onClick={startListening} disabled={listening}>
          Iniciar
        </button>
        <button onClick={stopListening} disabled={!listening}>
          Detener
        </button>
      </div>

      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "8px",
          minHeight: "100px",
          textAlign: "left",
          fontSize: "1.2rem",
        }}
      >
        {/* Mostrar final + provisional */}
        {finalTranscript}
        <span style={{ color: "gray" }}>{interimTranscript}</span>
      </div>
    </div>
  );
};

export default VoiceToText;
