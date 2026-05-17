import { useCallback } from "react";
import { create } from "zustand";

// Zustand Store
export const useAIStore = create((set) => ({
  transcription: "",
  botResponse: "",
  loading: false,
  setTranscription: (text) => set({ transcription: text }),
  setBotResponse: (response) => set({ botResponse: response }),
  setLoading: (status) => set({ loading: status }),
  setLoading: (Status) => set ({Loading: status}),
}));

// Custom Hook
const useAI = () => {
  const { setBotResponse, setLoading, setTranscription } = useAIStore();

  const fetchBotResponse = useCallback(async (text) => {
    if (!text) {
      alert("Please provide valid input!");
      return;
    }

    setTranscription(text); // Update transcription in the store
    setLoading(true); // Start loading animation

    const formData = new FormData();
    formData.append("user_message", text);

    try {
      const response = await fetch("http://127.0.0.1:8000/user_input/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      if (response.ok) {
        setBotResponse(data.bot_response); // Update bot response in the store
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Error fetching bot response:", error);
      alert("An error occurred while fetching the bot response.");
    } finally {
      setLoading(false); // Stop loading animation
    }
  }, [setBotResponse, setLoading, setTranscription]);

  return { fetchBotResponse };
};

export default useAI;
