"use client";
import React from "react";
import { useRouter } from "next/navigation";

const LogoutPage = () => {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("expireToken");
    localStorage.removeItem("expireRefreshToken");

    router.push("/login");
  };

  return (
    <div className="min-h-[95vh] flex flex-col justify-center items-center">
      <h2 className="text-3xl  mb-6 text-white ">You are log out</h2>
      <button
        onClick={handleLogout}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
      >
        Log In
      </button>
    </div>
  );
};

export default LogoutPage;
