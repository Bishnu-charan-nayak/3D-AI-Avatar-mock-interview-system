"use client";

import React from "react";
import "../ResultsPallet.css"; // Assuming this CSS file for styling

const ResultsPallet = ({ evaluationData }) => {
  // 1. Check if evaluationData exists and if it contains an error key,
  //    OR if interview_results is missing.
  if (!evaluationData || evaluationData.error || !evaluationData.interview_results) {
    // Determine the error message to display
    const errorMessage = evaluationData?.error // Use optional chaining for safety
      ? evaluationData.error
      : "Unable to load evaluation results."; // Fallback message

    // 2. Render an error message view
    return (
      <div className="results-container">
        <h1>Interview Results</h1>
        <div className="card"> {/* Use existing card styling for consistency */}
          <h2>Evaluation Error</h2>
          <p style={{ color: 'red' }}> {/* Optional: Style the error message */}
             {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  // 3. If no error and interview_results exists, proceed with destructuring
  const {
    overall_score,
    strengths,
    areas_for_improvement,
    skill_evaluations,
    summary,
    closing_note,
  } = evaluationData.interview_results;

  // Render the normal results view (your existing code)
  return (
    <div className="results-container">
      <h1>Interview Results</h1>

      <div className="scrollable-content">
        {/* Overall Score */}
        <div className="card">
          <div id="overall-score">
            <h2>Overall Score</h2>
            <div className="score">
              <span>{overall_score.score}</span>
            </div>
            <div className="description">{overall_score.description}</div>
          </div>
        </div>

        {/* Strengths */}
        <div className="card">
          <div id="strengths">
            <h2>Strengths</h2>
            <ul>
              {strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Areas for Improvement */}
        <div className="card">
          <div id="areas-for-improvement">
            <h2>Areas for Improvement</h2>
            <ul>
              {areas_for_improvement.map((area, index) => (
                <li key={index}>{area}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Skill Evaluations */}
        <div className="card">
          <div id="skill-evaluations">
            <h2>Skill Evaluations</h2>
            <div className="skill-evaluations">
              {/* Technical Knowledge */}
              <div className="skill">
                <strong>Technical Knowledge:</strong>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${skill_evaluations.technical_knowledge}%` }}
                  ></div>
                </div>
                <span>{skill_evaluations.technical_knowledge}%</span>
              </div>
               {/* Problem Solving */}
              <div className="skill">
                <strong>Problem Solving:</strong>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${skill_evaluations.problem_solving}%` }}
                  ></div>
                </div>
                <span>{skill_evaluations.problem_solving}%</span>
              </div>
              {/* Communication Skills */}
              <div className="skill">
                <strong>Communication Skills:</strong>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${skill_evaluations.communication_skills}%` }}
                  ></div>
                </div>
                <span>{skill_evaluations.communication_skills}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="card">
          <div id="summary">
            <h2>Summary</h2>
            <div className="description">{summary}</div>
          </div>
        </div>

        {/* Closing Note */}
        <div className="card">
          <div id="closing-note">
            <h2>Closing Note</h2>
            <div className="description">{closing_note}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPallet;