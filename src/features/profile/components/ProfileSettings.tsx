import { useState, useEffect, useRef } from "react";
import { User, Mail, GraduationCap, Loader2, Save, Camera, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PasoaMascot } from "@/features/shared/components/PasoaMascot";

const programs = [
  "BSOA-D - Office Administration with Data Analytics",
];

const yearLevels = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
];

export function ProfileSettings() {
  const { profile, refreshProfile, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    student_id: "",
    program: "",
    year_level: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        student_id: profile.student_id || "",
        program: profile.program || "",
        year_level: profile.year_level?.toString() || "",
      });
      setAvatarPreview(profile.avatar_url);
    }
  }, [profile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Create a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split("/").slice(-2).join("/");
        await supabase.storage.from("avatars").remove([oldPath]);
      }

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl.publicUrl })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
      setAvatarPreview(profile.avatar_url);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profile || !profile.avatar_url) return;

    setIsUploadingAvatar(true);
    try {
      // Delete from storage
      const oldPath = profile.avatar_url.split("/").slice(-2).join("/");
      await supabase.storage.from("avatars").remove([oldPath]);

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", profile.id);

      if (error) throw error;

      setAvatarPreview(null);
      await refreshProfile();
      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed.",
      });
    } catch (error) {
      console.error("Error removing avatar:", error);
      toast({
        title: "Error",
        description: "Failed to remove avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          student_id: formData.student_id || null,
          program: formData.program || null,
          year_level: formData.year_level ? parseInt(formData.year_level) : null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-12 space-y-6 sm:space-y-8 md:space-y-8 animate-fade-up w-full max-w-none">
        {/* Header - Enhanced */}
        <section className="space-y-3 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-2xl blur-3xl -z-10" />
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-11 w-11 sm:h-13 sm:w-13 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Profile</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Manage your account information and preferences</p>
            </div>
          </div>
        </section>

        {/* Profile Header Card - Enhanced */}
        <Card className="border-border/30 bg-card/60 backdrop-blur-sm overflow-hidden hover:shadow-md transition-all">
          <div className="h-20 sm:h-28 md:h-32 bg-gradient-to-r from-primary to-blue-600" />
          <CardContent className="relative pt-0 px-5 sm:px-6 pb-5 sm:pb-6">
            <div className="flex flex-col items-center sm:flex-row sm:items-end gap-4 sm:gap-5 -mt-10 sm:-mt-12 md:-mt-16">
              <div className="relative group flex-shrink-0">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-card border-4 border-card flex items-center justify-center overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <PasoaMascot size="lg" mood="happy" animate={false} />
                  )}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 flex gap-0.5 sm:gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-full shadow-md"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  {avatarPreview && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-full shadow-md"
                      onClick={handleRemoveAvatar}
                      disabled={isUploadingAvatar}
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div className="text-center sm:text-left pb-1 sm:pb-2">
                <h2 className="text-lg sm:text-xl font-semibold">
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form - Mobile Optimized */}
        <Card className="border-border/50">
          <CardHeader className="pb-3 p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              Personal Information
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Update your personal details below
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="first_name" className="text-xs sm:text-sm">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, first_name: e.target.value }))
                    }
                    className="rounded-lg sm:rounded-xl text-sm h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="last_name" className="text-xs sm:text-sm">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, last_name: e.target.value }))
                    }
                    className="rounded-lg sm:rounded-xl text-sm h-9 sm:h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="student_id" className="text-xs sm:text-sm">Student ID</Label>
                <Input
                  id="student_id"
                  value={formData.student_id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, student_id: e.target.value }))
                  }
                  placeholder="e.g., 2024-00001"
                  className="rounded-lg sm:rounded-xl text-sm h-9 sm:h-10"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Program</Label>
                <Select
                  value={formData.program}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, program: value }))
                  }
                >
                  <SelectTrigger className="rounded-lg sm:rounded-xl text-sm h-9 sm:h-10">
                    <SelectValue placeholder="Select your program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program} value={program} className="text-sm">
                        {program}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Year Level</Label>
                <Select
                  value={formData.year_level}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, year_level: value }))
                  }
                >
                  <SelectTrigger className="rounded-lg sm:rounded-xl text-sm h-9 sm:h-10">
                    <SelectValue placeholder="Select your year level" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearLevels.map((year) => (
                      <SelectItem key={year.value} value={year.value} className="text-sm">
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg sm:rounded-xl bg-gradient-primary text-sm sm:text-base h-9 sm:h-10 mt-2 sm:mt-3"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Info - Mobile Optimized */}
        <Card className="border-border/50">
          <CardHeader className="pb-3 p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center py-2 sm:py-3 border-b border-border/50">
              <span className="text-xs sm:text-sm text-muted-foreground">Email</span>
              <span className="text-xs sm:text-sm font-medium text-right break-all">{profile.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 sm:py-3 border-b border-border/50">
              <span className="text-xs sm:text-sm text-muted-foreground">Account Status</span>
              <span className="text-xs sm:text-sm font-medium capitalize text-green-500">
                {profile.status}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 sm:py-3">
              <span className="text-xs sm:text-sm text-muted-foreground">Member Since</span>
              <span className="text-xs sm:text-sm font-medium">
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
