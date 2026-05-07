import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVideo,
  faVideoSlash,
  faMicrophone,
  faStop,
  faSpinner,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import "../MeetingControls.css";

const MeetingControls = ({ refresh, setAnimation, getEvaluation }) => {
  const [isCameraOn, setIsCameraOn]   = useState(false);
  const [isRecording, setIsRecording] = useState(false);  // mic is listening
  const [isProcessing, setIsProcessing] = useState(false); // waiting for backend

  const webcamRef       = useRef(null);
  const recognitionRef  = useRef(null);
  const botResponseRef  = useRef(null);
  const transcriptRef   = useRef(""); // Store ongoing speech

  const toggleCamera = () => setIsCameraOn((p) => !p);

  // ── Send transcript to backend ───────────────────────────────────────────────
  const sendToBot = useCallback(async (text) => {
    if (!text || !text.trim()) return;
    console.log("[Mic] Sending to bot:", text);

    setIsProcessing(true);

    const formData = new FormData();
    formData.append("user_message", text);

    try {
      const response = await fetch("http://127.0.0.1:8000/user_input/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok)
        throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      console.log("[Mic] Bot responded:", data.bot_response);

      // Store in sessionStorage
      const prev = JSON.parse(sessionStorage.getItem("BotResponses") || "[]");
      prev.push({ Interviewer: data.bot_response });
      sessionStorage.setItem("BotResponses", JSON.stringify(prev));

      // Trigger evaluation if interview is closing
      if (
        data.bot_response.includes("Thank you for your time") &&
        data.bot_response.includes("next steps")
      ) {
        getEvaluation(true);
      }

      refresh(data.bot_response);
      setAnimation(data.bot_response);
    } catch (error) {
      console.error("[Mic] Bot error:", error);
      alert("Error communicating with server. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [refresh, setAnimation, getEvaluation]);

  // Keep ref always fresh
  useEffect(() => { botResponseRef.current = sendToBot; }, [sendToBot]);

  // ── Create a fresh SpeechRecognition instance ────────────────────────────────
  const buildRecognition = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support speech recognition. Use Chrome.");
      return null;
    }

    const r = new SpeechRecognition();
    r.lang             = "en-US";
    r.interimResults   = true;  // Get results while speaking
    r.continuous       = true;  // Keep listening until manually stopped
    r.maxAlternatives  = 0;

    r.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript + " ";
      }
      transcriptRef.current = text;
      console.log("[Mic] Ongoing transcript:", text);
    };

    r.onerror = (event) => {
      console.error("[Mic] Recognition error:", event.error);
      setIsRecording(false);
      // "no-speech" is benign — don't alert, just let user try again
      if (event.error !== "no-speech" && event.error !== "aborted") {
        alert(`Microphone error: ${event.error}. Please try again.`);
      }
    };

    r.onend = () => {
      console.log("[Mic] Recognition ended");
      setIsRecording(false);
      
      const finalMsg = transcriptRef.current.trim();
      if (finalMsg) {
        console.log("[Mic] Final message to send:", finalMsg);
        
        // Store user response
        const prev = JSON.parse(sessionStorage.getItem("userResponses") || "[]");
        prev.push({ You: finalMsg });
        sessionStorage.setItem("userResponses", JSON.stringify(prev));

        refresh(finalMsg);
        if (botResponseRef.current) botResponseRef.current(finalMsg);
      }
      
      // Clear for next recording
      transcriptRef.current = "";
    };

    return r;
  }, [refresh]); // refresh is a dependency now since we use it in onend

  // ── Toggle Recording (click once to start, once to stop) ────────────────────
  const toggleRecognition = () => {
    // Don't allow recording while backend is processing
    if (isProcessing) return;

    if (isRecording) {
      // STOP: user clicked again to finish speaking
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // START: build a fresh instance each time to avoid stale state
      transcriptRef.current = ""; // Reset transcript before starting
      const r = buildRecognition();
      if (!r) return;
      recognitionRef.current = r;

      try {
        r.start();
        setIsRecording(true);
        console.log("[Mic] Recognition started");
      } catch (e) {
        console.error("[Mic] Failed to start recognition:", e);
        setIsRecording(false);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // ── Mic button label / icon ──────────────────────────────────────────────────
  const micIcon  = isProcessing ? faSpinner : isRecording ? faStop : faMicrophone;
  const micClass = `control-button ${
    isProcessing ? "mic-processing" :
    isRecording  ? "mic-recording"  : "mic-on"
  }`;
  const micTitle = isProcessing
    ? "Processing your answer..."
    : isRecording
    ? "Click to STOP recording"
    : "Click to START recording";

  return (
    <div className="meeting-container">
      {/* Video Feed */}
      <div className="video-container">
        {isCameraOn ? (
          <Webcam audio={false} ref={webcamRef} className="webcam-feed" />
        ) : (
          <FontAwesomeIcon icon={faUser} className="camera-off-icon" />
        )}

        {/* Recording status overlay */}
        {isRecording && (
          <div className="recording-indicator">
            <span className="recording-dot" />
            Listening…
          </div>
        )}
        {isProcessing && (
          <div className="recording-indicator processing">
            <FontAwesomeIcon icon={faSpinner} spin />
            &nbsp;Processing…
          </div>
        )}

        {/* Controls */}
        <div className="controls-overlay">
          <button
            onClick={toggleCamera}
            className={`control-button ${isCameraOn ? "camera-off" : "camera-on"}`}
            title={isCameraOn ? "Turn off camera" : "Turn on camera"}
          >
            <FontAwesomeIcon icon={isCameraOn ? faVideoSlash : faVideo} />
          </button>

          {/* Microphone — click to toggle record */}
          <button
            className={micClass}
            onClick={toggleRecognition}
            disabled={isProcessing}
            title={micTitle}
          >
            <FontAwesomeIcon icon={micIcon} spin={isProcessing} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingControls;
