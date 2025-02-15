'use client'
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";

const SignIn = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    organization_name: "",
    user_image: "",
  });

  const [error, setError] = useState<string | null>(null);  
  const [loading, setLoading] = useState(false); 
  const router = useRouter(); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); // Clear error on input change
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
    setError(null);
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errors = [];

    if (!formData.name.trim()) errors.push("Name is required");
    if (!formData.email.trim()) {
      errors.push("Email is required");
    } else if (!emailRegex.test(formData.email)) {
      errors.push("Invalid email format");
    }
    if (!formData.password.trim()) {
      errors.push("Password is required");
    } else if (formData.password.length < 6) {
      errors.push("Password must be at least 6 characters");
    }
    if (!formData.role) errors.push("Role is required");
    if (!formData.organization_name.trim()) errors.push("Organization name is required");

    if (errors.length > 0) {
      setError(errors.join(", "));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:9090/v1/api/sign-in", formData, {
        timeout: 10000,
        validateStatus: (status) => status < 500
      });

      if (response.status === 200) {
        if (!response.data?.access_token || !response.data?.refresh_token) {
          throw new Error("Invalid server response");
        }

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
          errorMessage = "No response from server";
        } else {
          errorMessage = error.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-md w-full p-6 bg-white shadow-lg rounded-xl">
        <h2 className="text-center text-2xl font-bold mb-6 text-gray-800">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { id: "name", label: "Name", type: "text", placeholder: "Your Name" },
            { id: "email", label: "Email", type: "email", placeholder: "your@email.com" },
            { id: "password", label: "Password", type: "password", placeholder: "••••••••" },
            { id: "organization_name", label: "Organization Name", type: "text", placeholder: "Organization Name" },
            { id: "user_image", label: "Profile Image URL (optional)", type: "url", placeholder: "https://example.com/avatar.jpg" },
          ].map((field) => (
            <div key={field.id}>
              <Label htmlFor={field.id} className="text-gray-700">{field.label}</Label>
              <Input
                {...field}
                name={field.id}
                value={formData[field.id as keyof typeof formData]}
                onChange={handleChange}
                disabled={loading}
                className="mt-1"
              />
            </div>
          ))}

          <div>
            <Label htmlFor="role" className="text-gray-700">Role</Label>
            <Select onValueChange={handleRoleChange} value={formData.role} disabled={loading}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectGroup>
                  <SelectLabel>Roles</SelectLabel>
                  {["College Staff", "NGO Staff", "Self Staff"].map((role) => (
                    <SelectItem 
                      key={role.toLowerCase().replace(" ", "_")} 
                      value={role.toLowerCase().replace(" ", "_")}
                    >
                      {role}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full mt-6" 
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link 
            href="/login" 
            className="text-blue-600 hover:underline font-medium"
          >
            Log in here
          </Link>
        </div>

        {/* Error Dialog */}
        <Dialog open={!!error} onOpenChange={(open) => !open && setError(null)}>
          <DialogContent className="sm:max-w-md bg-white rounded-lg">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <DialogTitle className="text-red-600">Registration Error</DialogTitle>
              </div>
            </DialogHeader>
            <div className="mt-2 text-gray-600">
              {error?.split(", ").map((msg, i) => (
                <p key={i} className="py-1">• {msg}</p>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setError(null)}
                className="border-red-200 hover:bg-red-50"
              >
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={handleSubmit}
                className="ml-2"
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

export default SignIn;