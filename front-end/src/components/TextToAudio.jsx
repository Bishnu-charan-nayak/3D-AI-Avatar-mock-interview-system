import React, { useState } from "react";

const TextToAudio = () => {
  const [text, setText] = useState("");
  const [audioSrc, setAudioSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConvert = async () => {
    if (!text.trim()) {
      alert("Please enter some text.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("text", text);

      const response = await fetch("http://127.0.0.1:8000/text-to-speech/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to convert text to speech");
      }

      // Create an object URL for the audio file
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Set audio source
      setAudioSrc(audioUrl);
    } catch (error) {
      console.error(error);
      alert("Error: Unable to process your request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Text to Speech</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text here..."
        style={{
          width: "80%",
          height: "100px",
          marginBottom: "20px",
          fontSize: "16px",
        }}
      />
      <br />
      <button onClick={handleConvert} disabled={isLoading}>
        {isLoading ? "Processing..." : "Convert to Speech"}
      </button>
      <br />
      {audioSrc && (
        <div style={{ marginTop: "20px" }}>
          <h3>Preview:</h3>
          <audio controls src={audioSrc}>
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
};

export default TextToAudio;
