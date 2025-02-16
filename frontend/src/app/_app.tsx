"use client";

import { useEffect, useState } from "react";

const MyComponent = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // useEffect runs only on the client-side to access localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Fetch the token from localStorage on the client-side
      setToken(localStorage.getItem("expireToken"));
      setIsClient(true);
    }
  }, []); // Empty dependency array to run once after initial render

  return (
    <>
      {/* Display token status */}
      <div>{token ? "Logged In" : "Not Logged In"}</div>

      {/* Display client-side rendering status */}
      <div>{isClient ? "Client-side Rendered" : "Loading..."}</div>
    </>
  );
};

export default MyComponent;
