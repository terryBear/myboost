import { getShareToken } from "@/services/api";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const shareToken = getShareToken();
    const token = localStorage.getItem("access_token");

    if (shareToken) {
      navigate("/coffee/dashboard");
      return;
    }
    if (!token) {
      navigate("/coffee/login");
      return;
    }
    navigate("/coffee/dashboard");
  }, [navigate]);

  return null;
};

export default Index;
