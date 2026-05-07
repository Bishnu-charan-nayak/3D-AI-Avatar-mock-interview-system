import React from "react";
import "../Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">MY APP</div>
      <div className="nav-links">
        <a href="#home">Home</a>
        <a href="#about">About</a>
        <a href="#setup" className="start-btn">Start Interview</a>
      </div>
    </nav>
  );
};

export default Navbar;
