"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, X } from "lucide-react";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email || !formData.password) {
      setError("All fields are required");
      return false;
    }

    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:9090/v1/api/login",
        formData,
        {
          timeout: 10000,
          validateStatus: (status) => status < 500
        }
      );

      if (response.status === 200) {
        if (!response.data?.access_token || !response.data?.refresh_token) {
          throw new Error("Authentication tokens missing in response");
        }

        // Store tokens and expiration
        localStorage.setItem("refreshToken", response.data.refresh_token);
        localStorage.setItem("token", response.data.access_token);
        localStorage.setItem("expireRefreshToken", response.data.expire_refresh_token);
        localStorage.setItem("expireToken", response.data.expire_access_token);

        router.push("/");
        return;
      }

      // Handle API error responses
      const errorMessage = response.data?.message || "Unknown error occurred";
      setError(errorMessage);

    } catch (error: any) {
      let errorMessage = "Failed to sign in. Please try again.";
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = error.response.data?.message || error.response.statusText;
        } else if (error.request) {
          errorMessage = "No response from server. Check your connection.";
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br ">
      <Card className="max-w-md w-full p-8 bg-white shadow-xl rounded-2xl">
        <h2 className="text-center text-3xl font-bold mb-8 text-gray-800">Welcome Back</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              disabled={loading}
              className="rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">Password</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              className="rounded-lg"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-lg py-6 text-lg"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Continue"}
          </Button>
        </form>

        <div className="mt-6 space-y-4 text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Forgot your password?
          </Link>
          
          <div className="text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/sign-up"
              className="text-blue-600 hover:underline font-medium"
            >
              Create account
            </Link>
          </div>
        </div>

        {/* Error Dialog */}
        <Dialog open={!!error} onOpenChange={(open) => !open && setError(null)}>
          <DialogContent className="sm:max-w-md rounded-lg bg-white">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <DialogTitle className="text-red-600">Login Error</DialogTitle>
                
              </div>
            </DialogHeader>
            <div className="text-gray-600 break-words">
              {error}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => setError(null)}
                className="bg-red-600 hover:bg-red-700"
              >
                Try Again
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
};

export default Login;