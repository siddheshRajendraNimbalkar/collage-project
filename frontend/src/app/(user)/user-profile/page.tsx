'use client'
import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import Avatar from "@/components/Custom/common/ChangeAvater";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface UserProfileProps {
  name?: string;
  role?: string;
  organization_name?: string;
  user_image?: string;
}

interface FormData {
  name: string;
  role: string;
  organization_name: string;
  user_image: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
}

interface RoleOption {
  label: string;
  value: string;
}

// Let's first check what props the Avatar component requires
// Since we don't have the exact type definition, we'll create one based on usage
interface AvatarProps {
  size: number;
  className: string;
  onChange: (imageUrl: string) => void;
  // The currentImage prop is causing the type error, so we need to check
  // if it's really needed or if there's an alternative way to pass the current image
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  name, 
  role, 
  organization_name, 
  user_image 
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: name || "",
    role: role || "",
    organization_name: organization_name || "",
    user_image: user_image || "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setFormData({
      name: name || "",
      role: role || "",
      organization_name: organization_name || "",
      user_image: user_image || "",
    });
  }, [name, role, organization_name, user_image]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleRoleChange = (value: string): void => {
    setFormData(prev => ({ ...prev, role: value }));
    setError(null);
    setSuccess(false);
  };

  const handleAvatarChange = (imageUrl: string): void => {
    setFormData(prev => ({ ...prev, user_image: imageUrl }));
    setError(null);
    setSuccess(false);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!formData.name.trim()) errors.push("Name is required");
    if (!formData.role) errors.push("Role is required");
    if (!formData.organization_name.trim()) errors.push("Organization name is required");

    if (errors.length > 0) {
      setError(errors.join(", "));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found');
      router.push('/');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post<ApiResponse>(
        "http://localhost:9090/v1/api/updateUser",
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          timeout: 10000,
          validateStatus: (status) => status < 500
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      let errorMessage = "Failed to update profile. Please try again.";
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        if (axiosError.response) {
          errorMessage = axiosError.response.data?.message || axiosError.response.statusText;
        } else if (axiosError.request) {
          errorMessage = "No response from server";
        } else {
          errorMessage = axiosError.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions: RoleOption[] = [
    { label: "College Staff", value: "college_staff" },
    { label: "NGO Staff", value: "ngo_staff" },
    { label: "Self Staff", value: "self_staff" }
  ];

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg rounded-xl overflow-hidden border-0">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardTitle className="text-center text-2xl font-bold">Update Your Profile</CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6 pb-2 px-6">
          <div className="flex justify-center mb-6">
            {/* Fix: Remove the currentImage prop that's causing the type error */}
            <Avatar 
              size={96} 
              className="border-4 border-gray-100 shadow-md" 
              onChange={handleAvatarChange}
              // Assuming the Avatar component internally handles displaying 
              // the current image through some other mechanism - check documentation
            />
          </div>
          
          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success</AlertTitle>
              <AlertDescription className="text-green-700">
                Your profile has been updated successfully!
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 bg-gray-50 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
              />
            </div>
            
            <div>
              <Label htmlFor="organization_name" className="text-gray-700 font-medium">Organization Name</Label>
              <Input
                id="organization_name"
                name="organization_name"
                type="text"
                placeholder="Organization Name"
                value={formData.organization_name}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 bg-gray-50 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
              />
            </div>

            <div>
              <Label htmlFor="role" className="text-gray-700 font-medium">Your Role</Label>
              <Select 
                onValueChange={handleRoleChange} 
                value={formData.role} 
                disabled={loading}
              >
                <SelectTrigger id="role" className="w-full mt-1 bg-gray-50 border-gray-200 focus:border-blue-300 focus:ring-blue-200">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectGroup>
                    <SelectLabel>Available Roles</SelectLabel>
                    {roleOptions.map((role) => (
                      <SelectItem 
                        key={role.value} 
                        value={role.value}
                      >
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <Button 
            onClick={() => handleSubmit()} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium" 
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </div>
            ) : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Error Dialog */}
      <Dialog open={!!error} onOpenChange={(open) => !open && setError(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <DialogTitle className="text-red-600">Update Error</DialogTitle>
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
              onClick={() => handleSubmit()}
              className="ml-2"
            >
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProfile;