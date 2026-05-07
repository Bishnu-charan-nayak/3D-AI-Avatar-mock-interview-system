import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "../PDFUpload.css";
import "../Navbar.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faRotate } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MySwal = withReactContent(Swal);

const PDFUpload = ({ onUploadSuccess }) => {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    sessionStorage.clear();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!resumeFile || !jobDescription || !difficultyLevel) {
      MySwal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill in all fields and upload a resume!",
        background: "#f8d7da",
        color: "#721c24",
        iconHtml: `<i class="fas fa-exclamation-triangle"></i>`,
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("resume_file", resumeFile);
    formData.append("job_description", jobDescription);
    formData.append("difficulty_level", difficultyLevel);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload_resume/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      console.log("Response from server:", data);
      onUploadSuccess(data);

      let previousResponses =
        JSON.parse(sessionStorage.getItem("BotResponses")) || [];
      previousResponses.push({ Interviewer: data.ai_start });
      sessionStorage.setItem("BotResponses", JSON.stringify(previousResponses));
      console.log("Bot Response Stored:", previousResponses);

      toast.success("Your resume has been uploaded successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Upload Failed",
        text: error.message,
        background: "#f8d7da",
        color: "#721c24",
        iconHtml: `<i class="fas fa-times-circle"></i>`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page">
      {/* HOME SECTION */}
      <section id="home" className="Container">
        <div className="hero-section">
          <h1>Master Your Next Interview</h1>
          <p>
            Preparing for an interview shouldn't be stressful. Our 3D AI Mock Interview System 
            gives you a realistic, interactive environment to practice before the big day. 
            Experience dynamic conversations, anticipate what interviewers will ask, and refine 
            your answers with instant, personalized feedback from our AI recruiter.
          </p>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="about-section">
        <div className="about-content">
          <h2>Why Choose Our AI System?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <i className="fas fa-cube feature-icon"></i>
              <h3>Interactive 3D Avatar</h3>
              <p>Experience realistic body language and lip-syncing for an immersive interview simulation.</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-bolt feature-icon"></i>
              <h3>Real-Time AI Processing</h3>
              <p>Powered by advanced LLMs, receive tailored questions based on your unique resume and job description.</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-chart-line feature-icon"></i>
              <h3>Instant Feedback</h3>
              <p>Get comprehensive evaluation metrics on your communication, confidence, and technical accuracy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SETUP SECTION */}
      <section id="setup" className="setup-section">
        <div className="card-container">
          <form onSubmit={handleUpload}>
            <h2>Set Up Interview</h2>

            <div className="file-upload">
              <label htmlFor="resumeUpload" className="custom-upload-button">
                <FontAwesomeIcon icon={faUpload} /> Upload Resume
              </label>
              <input
                required
                id="resumeUpload"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files[0])}
                style={{ display: "none" }}
              />
              {resumeFile && <p className="file-name">{resumeFile.name}</p>}
            </div>

            <label htmlFor="jobDescription" className="job-description-label">
              Job Description:
            </label>
            <textarea
              required
              placeholder="Enter Job Description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            ></textarea>

            <label htmlFor="difficultyLevel" className="difficulty-level-label">
              Difficulty Level:
            </label>
            <select
              required
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value)}
            >
              <option value="">Select Difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <button type="submit" disabled={loading}>
              {loading ? <FontAwesomeIcon icon={faRotate} spin /> : "Start Interview"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default PDFUpload;
