"use client";

import { useEffect, useState } from "react";

const MyComponent = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return <div>{isClient ? "Client-side Rendered" : "Loading..."}</div>;
};

export default MyComponent;
