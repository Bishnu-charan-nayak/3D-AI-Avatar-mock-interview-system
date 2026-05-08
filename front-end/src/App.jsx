import React, { useState } from "react";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import InterviewPanel from "./components/InterviewPanel";
import ResultsPallet from "./components/ResultsPallet";
import "./App.css";

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [interviewResponse, setInterviewResponse] = useState(null);
  const [evaluationData, setEvaluationData] = useState(null);

  const handleUploadSuccess = (response) => {
    setInterviewResponse(response);
    setShowLanding(false);
  };
  const handleEvaluation = (evaluationData) => {
    setEvaluationData(evaluationData);
  };

  return (
    <div className="App">
      <Navbar />
      {showLanding ? (
        <LandingPage onUploadSuccess={handleUploadSuccess} />
      ) : evaluationData ? (
        <ResultsPallet evaluationData={evaluationData} />
      ) : (
        <InterviewPanel
          response={interviewResponse}
          setEvaluation={handleEvaluation}
        />
      )}
    </div>
  );
}

export default App;
