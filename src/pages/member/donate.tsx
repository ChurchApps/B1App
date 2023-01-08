import { useState, useEffect } from "react";
import { ApiHelper } from "@/helpers";
import { AuthLanding } from "@/components"

export default function Donate() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    setIsAuthenticated(ApiHelper.isAuthenticated);
  }, [ApiHelper.isAuthenticated]);

  return isAuthenticated ? <AuthLanding /> : <h1>Non authenticated</h1>;
}
