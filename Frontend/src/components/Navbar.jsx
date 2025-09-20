import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-primary text-white p-4 flex justify-between">
      <h1 className="font-bold text-xl">Repair Management</h1>
      <div>
        <Link className="mx-2 hover:text-secondary" to="/">Home</Link>
        <Link className="mx-2 hover:text-secondary" to="/repair-request">New Request</Link>
        <Link className="mx-2 hover:text-secondary" to="/dashboard">Dashboard</Link>
      </div>
    </nav>
  );
};

export default Navbar;
