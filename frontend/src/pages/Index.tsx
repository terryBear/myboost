import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/coffee/login");
      return;
    } else {
      navigate("/coffee/dashboard");
    }
  }, [navigate]);

  return null;
};

export default Index;
