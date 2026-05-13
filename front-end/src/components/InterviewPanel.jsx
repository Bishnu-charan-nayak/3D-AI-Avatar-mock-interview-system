import React, { useState, useEffect, useRef, useCallback } from "react";
import { Experience } from "./Experience"
import Me from "./me";
import { Canvas } from "@react-three/fiber";
// Keep useLoader if results.json is used as a fallback or for other purposes
import { useLoader } from "@react-three/fiber";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
// Keep * as THREE if useLoader needs it
import * as THREE from "three";
import "../InterviewPanel.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate } from "@fortawesome/free-solid-svg-icons";

const MySwal = withReactContent(Swal);

const InterviewPanel = ({ setEvaluation, response }) => {
  const [conversation, setConversation] = useState([]);
  const [botResponse, setBotResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [showButton, setShowButton] = useState(false);

  // ── Trigger the initial greeting as soon as the panel mounts ────────────────
  // App.jsx passes response={interviewResponse} which contains { ai_start: "..." }
  // Without this, botResponse stays "" and the avatar never speaks the greeting.
  useEffect(() => {
    if (response?.ai_start) {
      console.log("[InterviewPanel] Triggering initial greeting:", response.ai_start);
      setBotResponse(response.ai_start);
    }
  }, [response]);


  // Keep useLoader if it serves another purpose or as a placeholder/fallback
  // If 'results.json' isn't actually used elsewhere, you could remove this.
  const chatViewRef = useRef(null);

  // --- getConversation Function (No changes needed here) ---
  const getConversation = useCallback(() => {
    // Add basic error handling for JSON parsing
    let userResponses = [];
    let botResponses = [];

    try {
      const userResponsesRaw = sessionStorage.getItem("userResponses");
      if (userResponsesRaw) {
        userResponses = JSON.parse(userResponsesRaw);
      }
    } catch (e) {
      console.error("Error parsing userResponses from sessionStorage:", e);
    }

    try {
      const botResponsesRaw = sessionStorage.getItem("BotResponses");
      if (botResponsesRaw) {
        botResponses = JSON.parse(botResponsesRaw);
      }
    } catch (e) {
      console.error("Error parsing BotResponses from sessionStorage:", e);
    }

    const mergedConversation = [];
    const maxLength = Math.max(userResponses.length, botResponses.length);

    for (let i = 0; i < maxLength; i++) {
      // Add bot response first if available and has the Interviewer key
      if (botResponses[i] && botResponses[i].Interviewer !== undefined) {
        mergedConversation.push({
          sender: "Interviewer",
          text: botResponses[i].Interviewer,
        });
      }
      // Then add user response if available and has the You key
      if (userResponses[i] && userResponses[i].You !== undefined) {
        mergedConversation.push({ sender: "user", text: userResponses[i].You });
      }
    }
    console.log("Conversation data being sent:", mergedConversation); // Log data before sending
    return mergedConversation;
  }, []);

  // --- Modified showEvaluationPallet Function ---
  const showEvaluationPallet = async () => {
    setLoading(true);
    try {
      // 1. Get the conversation data using your existing function
      const conversationData = getConversation();

      // 2. Prepare the payload object
      const payload = {
        conversation: conversationData,
        // Add any other data you might need to send to the backend here
      };

      // 3. Make the API call, adding the JSON payload to the body
      const response = await fetch("http://127.0.0.1:8000/end_interview/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add other headers like Authorization if needed
        },
        // *** Add the body property with the stringified JSON data ***
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Improved error message
        let errorDetails = `HTTP error! Status: ${response.status}`;
        try {
          // Try to get text from the response body for more context
          const errorText = await response.text();
          errorDetails += ` - ${errorText}`;
        } catch (e) {
          // Ignore if reading text fails
        }
        throw new Error(`Failed to generate results: ${errorDetails}`);
      }

      // --- Keep the existing response handling logic ---
      const blob = await response.blob();
      const fileReader = new FileReader();
      fileReader.onload = () => {
        try {
          const jsonData = JSON.parse(fileReader.result);
          console.log("Evaluation results received and parsed:", jsonData);
          setEvaluation(jsonData);
        } catch (error) {
          console.error("Error parsing JSON file from blob:", error);
          MySwal.fire({
            // Show error if JSON parsing fails
            icon: "error",
            title: "Error Processing Results",
            text: "Received data, but failed to parse it as JSON.",
            background: "#f8d7da",
            color: "#721c24",
            iconHtml: `<i class="fas fa-exclamation-triangle"></i>`,
          });
        }
      };
      // Handle FileReader errors
      fileReader.onerror = (error) => {
        console.error("FileReader error:", error);
        MySwal.fire({
          icon: "error",
          title: "Error Reading Results",
          text: "Failed to read the response data.",
          background: "#f8d7da",
          color: "#721c24",
          iconHtml: `<i class="fas fa-exclamation-triangle"></i>`,
        });
      };
      fileReader.readAsText(blob);
      // --- End of existing response handling logic ---
    } catch (error) {
      console.error("Error during evaluation request:", error); // Log the full error
      MySwal.fire({
        icon: "error",
        title: "Error Generating Results",
        text: error.message || "An unknown network or server error occurred.", // More specific default
        background: "#f8d7da",
        color: "#721c24",
        iconHtml: `<i class="fas fa-exclamation-triangle"></i>`, // Ensure FontAwesome CSS is loaded
      });
    } finally {
      setLoading(false);
    }
  };

  const setAnimationTrigger = useCallback((response) => {
    setBotResponse(response);
  }, []);

  const updateConversation = useCallback(() => {
    // Use try-catch for safety when parsing sessionStorage
    try {
      const userResponses = JSON.parse(
        sessionStorage.getItem("userResponses") || "[]",
      );
      setConversation(getConversation()); // Update displayed conversation
      // Base button visibility on having at least 2 user turns
      setShowButton(userResponses.length >= 2);
    } catch (error) {
      console.error("Error updating conversation state:", error);
      // Handle potential bad data in sessionStorage, maybe clear it?
      // sessionStorage.removeItem("userResponses");
      // sessionStorage.removeItem("BotResponses");
      setConversation([]); // Reset conversation display on error
      setShowButton(false);
    }
  }, [getConversation]);

  // Add listener for storage changes to keep UI sync (optional but good)
  useEffect(() => {
    updateConversation(); // Initial load

    const handleStorageChange = (event) => {
      // Check if the keys we care about changed
      if (event.key === "userResponses" || event.key === "BotResponses") {
        console.log("Storage change detected, updating conversation display.");
        updateConversation();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Cleanup listener
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [updateConversation]); // Run only on mount and unmount

  // Scroll chat view to bottom
  useEffect(() => {
    if (chatViewRef.current) {
      chatViewRef.current.scrollTop = chatViewRef.current.scrollHeight;
    }
  }, [conversation]);

  return (
    <div className="container">
      <div className="container-media">
        <div className="left-side">
          <Canvas shadows camera={{ position: [0, 0, 8], fov: 42 }}>
            <color attach="background" args={["#0D0E12"]} />
            <Experience botResponse={botResponse} />
          </Canvas>
        </div>

        <div className="right-side">
          <Me
            refresh={updateConversation}
            setAnimation={setAnimationTrigger}
            getEvaluation={showEvaluationPallet}
          />
        </div>
      </div>

      {showButton && (
        <button
          onClick={showEvaluationPallet}
          disabled={loading}
          className="Interview-button"
        >
          {loading ? (
            <FontAwesomeIcon icon={faRotate} spin />
          ) : (
            "Generate Results"
          )}
        </button>
      )}

      <div className="chat-view-container" ref={chatViewRef}>
        {conversation.length === 0 ? (
          <div className="no-messages">No messages yet.</div>
        ) : (
          conversation.map((message, index) => (
            <div
              key={index}
              className={`chat-message ${message.sender === "user" ? "user-message" : "bot-message"}`}
            >
              {message.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InterviewPanel;
