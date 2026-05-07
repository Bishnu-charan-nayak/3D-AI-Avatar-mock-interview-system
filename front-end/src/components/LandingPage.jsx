/**
 * LandingPage — Premium scroll-driven landing experience
 * Sections: Hero (pinned) → Features (staggered cards) → Workflow (timeline) → Team → CTA (setup form)
 * Uses GSAP ScrollTrigger for scrubbed animations, Lenis for smooth scroll.
 */
import React, { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import useSmoothScroll from '../hooks/useSmoothScroll';
import useScrollAnimation from '../hooks/useScrollAnimation';
import useParallax from '../hooks/useParallax';
import useTiltCard from '../hooks/useTiltCard';
import useMagneticButton from '../hooks/useMagneticButton';

import GlowCursor from './GlowCursor';
import ParticleField from './ParticleField';

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faRotate } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import '../LandingPage.css';

gsap.registerPlugin(ScrollTrigger);
const MySwal = withReactContent(Swal);

/* ═══ FEATURE CARD with 3D Tilt ═══ */
function FeatureCard({ icon, title, description, delay }) {
  const cardRef = useRef(null);
  useTiltCard(cardRef, 10);

  return (
    <div ref={cardRef} className="lp-feature-card" style={{ transitionDelay: `${delay}s` }}>
      <div className="lp-feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

/* ═══ TEAM CARD ═══ */
function TeamCard({ name, role, github, linkedin, initials, gradientClass, photo }) {
  const cardRef = useRef(null);
  useTiltCard(cardRef, 8);

  return (
    <div ref={cardRef} className="lp-team-card">
      {photo ? (
        <img src={photo} alt={name} className="lp-team-photo" />
      ) : (
        <div className={`lp-team-avatar ${gradientClass}`}>
          <span>{initials}</span>
        </div>
      )}
      <h3>{name}</h3>
      <p className="lp-team-role">{role}</p>
      <div className="lp-team-links">
        {github && (
          <a href={github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        )}
        {linkedin && (
          <a href={linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════ */
export default function LandingPage({ onUploadSuccess }) {
  /* ── Smooth scroll ── */
  useSmoothScroll();

  /* ── Form state (preserved from PDFUpload) ── */
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { sessionStorage.clear(); }, []);

  /* ── Section refs ── */
  const heroRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroSubRef = useRef(null);
  const heroLineRef = useRef(null);
  const featuresRef = useRef(null);
  const workflowRef = useRef(null);
  const teamRef = useRef(null);
  const ctaRef = useRef(null);
  const submitBtnRef = useRef(null);

  /* ── Parallax refs ── */
  const orbRef1 = useRef(null);
  const orbRef2 = useRef(null);
  const orbRef3 = useRef(null);

  /* ── Apply parallax to decorative orbs ── */
  useParallax(orbRef1, -80);
  useParallax(orbRef2, 60);
  useParallax(orbRef3, -40);

  /* ── Scroll animations ── */
  useScrollAnimation(featuresRef, { type: 'fadeUp', staggerChildren: '.lp-feature-card', stagger: 0.12 });
  useScrollAnimation(workflowRef, { type: 'fadeUp', staggerChildren: '.lp-wf-step', stagger: 0.2 });
  useScrollAnimation(teamRef, { type: 'fadeUp', staggerChildren: '.lp-team-card', stagger: 0.15 });
  useScrollAnimation(ctaRef, { type: 'scaleIn', duration: 0.8 });

  /* ── Magnetic submit button ── */
  useMagneticButton(submitBtnRef, 0.3);

  /* ── Hero pinned timeline ── */
  useEffect(() => {
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '+=150%',
          pin: true,
          scrub: 1,
        },
      });

      tl.from(heroTitleRef.current, { y: 80, opacity: 0, duration: 1, ease: 'power3.out' }, 0)
        .from(heroSubRef.current, { y: 50, opacity: 0, duration: 1, ease: 'power3.out' }, 0.3)
        .from(heroLineRef.current, { scaleX: 0, transformOrigin: 'left center', duration: 1, ease: 'power2.inOut' }, 0.5);
    }, heroRef);

    return () => ctx.revert();
  }, []);

  /* ── Workflow timeline line draw ── */
  useEffect(() => {
    if (!workflowRef.current) return;

    const line = workflowRef.current.querySelector('.lp-wf-line-fill');
    if (!line) return;

    const ctx = gsap.context(() => {
      gsap.from(line, {
        scaleY: 0,
        transformOrigin: 'top center',
        ease: 'none',
        scrollTrigger: {
          trigger: workflowRef.current,
          start: 'top 60%',
          end: 'bottom 60%',
          scrub: 1,
        },
      });
    }, workflowRef);

    return () => ctx.revert();
  }, []);

  /* ── Upload handler (identical logic from PDFUpload) ── */
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!resumeFile || !jobDescription || !difficultyLevel) {
      MySwal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill in all fields and upload a resume!',
        background: '#0D0E12',
        color: '#e5e2e3',
        confirmButtonColor: '#00F2FF',
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('resume_file', resumeFile);
    formData.append('job_description', jobDescription);
    formData.append('difficulty_level', difficultyLevel);

    try {
      const response = await fetch('http://127.0.0.1:8000/upload_resume/', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      onUploadSuccess(data);

      let previousResponses = JSON.parse(sessionStorage.getItem('BotResponses')) || [];
      previousResponses.push({ Interviewer: data.ai_start });
      sessionStorage.setItem('BotResponses', JSON.stringify(previousResponses));

      toast.success('Your resume has been uploaded successfully!', {
        position: 'top-right', autoClose: 3000, theme: 'colored',
      });
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.message,
        background: '#0D0E12',
        color: '#e5e2e3',
        confirmButtonColor: '#00F2FF',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ═══ RENDER ═══ */
  return (
    <div className="lp-root">
      <GlowCursor />
      <ParticleField />

      {/* Decorative parallax orbs */}
      <div ref={orbRef1} className="lp-orb lp-orb-1" aria-hidden="true" />
      <div ref={orbRef2} className="lp-orb lp-orb-2" aria-hidden="true" />
      <div ref={orbRef3} className="lp-orb lp-orb-3" aria-hidden="true" />

      {/* ═══ HERO — Pinned scroll zone ═══ */}
      <section ref={heroRef} className="lp-hero" id="home">
        <div className="lp-hero-content">
          <h1 ref={heroTitleRef} className="lp-hero-title">
            Master Your Next
            <span className="lp-hero-accent"> Interview</span>
          </h1>
          <div ref={heroLineRef} className="lp-hero-line" />
          <p ref={heroSubRef} className="lp-hero-sub">
            Our 3D AI Mock Interview System gives you a realistic, interactive environment to
            practice before the big day. Experience dynamic conversations, anticipate questions,
            and refine your answers with instant, personalized AI feedback.
          </p>
          <div className="lp-hero-scroll-hint">
            <span>Scroll to explore</span>
            <div className="lp-scroll-arrow" />
          </div>
        </div>
      </section>

      {/* ═══ FEATURES — Staggered card reveal ═══ */}
      <section ref={featuresRef} className="lp-features" id="features">
        <div className="lp-section-header">
          <h2>Why Choose Our AI System?</h2>
          <div className="lp-section-line" />
        </div>
        <div className="lp-features-grid">
          <FeatureCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>}
            title="Interactive 3D Avatar"
            description="Experience realistic body language and lip-syncing for an immersive interview simulation."
            delay={0}
          />
          <FeatureCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>}
            title="Real-Time AI Processing"
            description="Powered by advanced LLMs, receive tailored questions based on your unique resume and job description."
            delay={0.12}
          />
          <FeatureCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
            title="Instant Feedback"
            description="Get comprehensive evaluation metrics on your communication, confidence, and technical accuracy."
            delay={0.24}
          />
        </div>
      </section>

      {/* ═══ WORKFLOW — Progressive timeline ═══ */}
      <section ref={workflowRef} className="lp-workflow" id="workflow">
        <div className="lp-section-header">
          <h2>How It Works</h2>
          <div className="lp-section-line" />
        </div>
        <div className="lp-wf-track">
          <div className="lp-wf-line">
            <div className="lp-wf-line-fill" />
          </div>
          {[
            { num: '01', title: 'Upload Resume', desc: 'Upload your resume and enter the target job description.' },
            { num: '02', title: 'AI Analyzes', desc: 'Our AI processes your profile and generates tailored interview questions.' },
            { num: '03', title: 'Practice Interview', desc: 'Interact with a 3D AI avatar in a realistic interview simulation.' },
            { num: '04', title: 'Get Results', desc: 'Receive detailed feedback with scores on communication, confidence & accuracy.' },
          ].map((step, i) => (
            <div key={step.num} className={`lp-wf-step ${i % 2 === 0 ? 'lp-wf-left' : 'lp-wf-right'}`}>
              <div className="lp-wf-node">{step.num}</div>
              <div className="lp-wf-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TEAM SECTION ═══ */}
      <section ref={teamRef} className="lp-team" id="team">
        <div className="lp-section-header">
          <h2>Meet The Team</h2>
          <div className="lp-section-line" />
        </div>
        <div className="lp-team-grid">
          <TeamCard
            name="Bishnu Charan Nayak"
            role="Frontend Developer · Code Tester · API Learner"
            github="https://github.com/Bishnu-charan-nayak"
            linkedin="https://www.linkedin.com/in/bishnu-charan-nayak/"
            initials="BC"
            gradientClass="lp-grad-cyan"
          />
          <TeamCard
            name="Omm Shubham Sahoo"
            role="Backend Developer"
            github="https://github.com/ommsubhamsahoo"
            linkedin="https://www.linkedin.com/in/omm-subham-sahoo"
            initials="OS"
            gradientClass="lp-grad-violet"
          />
          <TeamCard
            name="Chinmaya Pradhan"
            role="Frontend Developer · PPT Designer"
            github="https://github.com/chinmayapradhan07"
            linkedin="https://www.linkedin.com/in/chinmaya-pradhan-3544b5392"
            initials="CP"
            gradientClass="lp-grad-emerald"
            photo="/textures/Chinmaya Pradhan.jpeg"
          />
        </div>
      </section>

      {/* ═══ CTA / SETUP FORM ═══ */}
      <section ref={ctaRef} className="lp-cta" id="setup">
        <div className="lp-cta-card">
          <h2>Set Up Your Interview</h2>
          <p className="lp-cta-sub">Upload your resume, describe the role, and let our AI prepare your session.</p>

          <form onSubmit={handleUpload} className="lp-cta-form">
            <div className="lp-upload-zone">
              <label htmlFor="resumeUpload" className="lp-upload-label">
                <FontAwesomeIcon icon={faUpload} />
                <span>{resumeFile ? resumeFile.name : 'Upload Resume (PDF / DOCX)'}</span>
              </label>
              <input
                required id="resumeUpload" type="file" accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files[0])} style={{ display: 'none' }}
              />
            </div>

            <div className="lp-field">
              <label htmlFor="jobDesc">Job Description</label>
              <textarea
                required id="jobDesc" placeholder="Paste the job description here..."
                value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <div className="lp-field">
              <label htmlFor="difficulty">Difficulty Level</label>
              <select
                required id="difficulty" value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
              >
                <option value="">Select Difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <button ref={submitBtnRef} type="submit" disabled={loading} className="lp-submit-btn" data-magnetic>
              {loading ? <FontAwesomeIcon icon={faRotate} spin /> : 'Start Interview'}
            </button>
          </form>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="lp-footer">
        <p>© 2026 3D AI Mock Interview System — Built with passion in Bhubaneswar</p>
      </footer>
    </div>
  );
}
