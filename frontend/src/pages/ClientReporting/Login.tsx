import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BOOST_LOGO_URL } from "@/lib/constants";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { saveTokens, type Tokens } from "../../services/api";
import { useAuthenticate } from "../../services/authenticate.service";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuthenticate();
  const { pathname } = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response: Tokens = await login(email, password);
      console.log("Login response:", response);
      console.log("Current pathname:", pathname);
      saveTokens(response);
      navigate("/" + pathname.split("/")[1] + "/dashboard");
      toast({
        title: "Welcome back!",
        description: "Logged in successfully",
      });
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src={BOOST_LOGO_URL}
              alt="MyBoost"
              className="h-14 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold">
            MyBoost
          </CardTitle>
          <CardDescription>
            Simplifying IT · Amplifying potential
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Username</Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
