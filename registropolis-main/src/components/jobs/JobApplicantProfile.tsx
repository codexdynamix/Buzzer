
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Upload, User, Briefcase, GraduationCap, Calendar, MapPin, Clock, Save } from 'lucide-react';

const JobApplicantProfile = () => {
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+254712345678',
    location: 'Nairobi, Kenya',
    birthDate: '1990-01-01',
    education: 'Bachelor Degree',
    experience: '3 years',
    skills: 'JavaScript, React, Node.js',
    bio: 'Experienced software developer with a passion for creating user-friendly applications.',
    resume: '',
    availability: 'full-time',
    remoteWork: true,
    profileVisibility: true,
    notificationsEnabled: true
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string) => {
    setFormData(prev => ({ ...prev, [name]: !prev[name as keyof typeof prev] }));
  };

  const handleSave = () => {
    toast.success("Profile updated successfully");
    setIsEditing(false);
  };

  const handleAddEducation = () => {
    toast.success("Education section added");
  };

  const handleAddExperience = () => {
    toast.success("Experience section added");
  };

  const handleAddSkill = () => {
    toast.success("Skill added to profile");
  };

  const handleUploadResume = () => {
    toast.success("Resume uploaded successfully");
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Job Applicant Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center relative">
              <User className="h-12 w-12 text-muted-foreground" />
              <Button 
                size="icon" 
                variant="secondary" 
                className="absolute bottom-0 right-0 rounded-full"
                onClick={() => {
                  toast.success("Profile picture updated");
                }}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                  />
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-semibold">{formData.name}</h2>
                  <p className="text-muted-foreground">{formData.location}</p>
                  <p className="text-muted-foreground">{formData.email}</p>
                </div>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birthDate">Date of Birth</Label>
                <Input 
                  id="birthDate" 
                  name="birthDate" 
                  type="date" 
                  value={formData.birthDate} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>
          ) : null}
        </div>
        
        <div className="pt-4 border-t">
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <GraduationCap className="h-5 w-5" /> Education
          </h3>
          
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="education">Highest Education</Label>
                <Select 
                  value={formData.education} 
                  onValueChange={(value) => handleSelectChange('education', value)}
                >
                  <SelectTrigger id="education">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high-school">High School</SelectItem>
                    <SelectItem value="associate">Associate Degree</SelectItem>
                    <SelectItem value="Bachelor Degree">Bachelor's Degree</SelectItem>
                    <SelectItem value="masters">Master's Degree</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleAddEducation}
                className="w-full"
              >
                Add Education History
              </Button>
            </div>
          ) : (
            <div className="p-3 border rounded-md">
              <p className="font-medium">{formData.education}</p>
              <p className="text-sm text-muted-foreground">University of Example, 2012-2016</p>
            </div>
          )}
        </div>
        
        <div className="pt-4 border-t">
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> Work Experience
          </h3>
          
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input 
                  id="experience" 
                  name="experience" 
                  value={formData.experience} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleAddExperience}
                className="w-full"
              >
                Add Work Experience
              </Button>
            </div>
          ) : (
            <div className="p-3 border rounded-md">
              <p className="font-medium">Senior Developer at Example Company</p>
              <p className="text-sm text-muted-foreground">Jan 2019 - Present • {formData.experience}</p>
              <p className="text-sm mt-2">Led development team in creating innovative solutions for clients.</p>
            </div>
          )}
        </div>
        
        <div className="pt-4 border-t">
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Skills & Expertise
          </h3>
          
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma separated)</Label>
                <Textarea 
                  id="skills" 
                  name="skills" 
                  value={formData.skills} 
                  onChange={handleInputChange} 
                  rows={3}
                />
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleAddSkill}
                className="w-full"
              >
                Add Skill
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {formData.skills.split(',').map((skill, index) => (
                <div key={index} className="px-3 py-1 bg-secondary rounded-full text-sm">
                  {skill.trim()}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="pt-4 border-t">
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <User className="h-5 w-5" /> About Me
          </h3>
          
          {isEditing ? (
            <div className="space-y-2">
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea 
                id="bio" 
                name="bio" 
                value={formData.bio} 
                onChange={handleInputChange} 
                rows={4}
              />
            </div>
          ) : (
            <p>{formData.bio}</p>
          )}
        </div>
        
        <div className="pt-4 border-t">
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Upload className="h-5 w-5" /> Resume
          </h3>
          
          {isEditing ? (
            <Button 
              variant="outline" 
              onClick={handleUploadResume}
              className="w-full"
            >
              Upload Resume
            </Button>
          ) : (
            <Button variant="outline" className="text-sm">
              <Upload className="h-4 w-4 mr-2" /> View Resume
            </Button>
          )}
        </div>
        
        <div className="pt-4 border-t">
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5" /> Preferences
          </h3>
          
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Select 
                  value={formData.availability} 
                  onValueChange={(value) => handleSelectChange('availability', value)}
                >
                  <SelectTrigger id="availability">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="remoteWork">Open to Remote Work</Label>
                <Switch 
                  id="remoteWork" 
                  checked={formData.remoteWork}
                  onCheckedChange={() => handleSwitchChange('remoteWork')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="profileVisibility">Public Profile Visibility</Label>
                <Switch 
                  id="profileVisibility" 
                  checked={formData.profileVisibility}
                  onCheckedChange={() => handleSwitchChange('profileVisibility')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="notificationsEnabled">Job Notifications</Label>
                <Switch 
                  id="notificationsEnabled" 
                  checked={formData.notificationsEnabled}
                  onCheckedChange={() => handleSwitchChange('notificationsEnabled')}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Availability:</span>
                <span className="font-medium capitalize">{formData.availability}</span>
              </div>
              <div className="flex justify-between">
                <span>Open to Remote Work:</span>
                <span className="font-medium">{formData.remoteWork ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span>Public Profile Visibility:</span>
                <span className="font-medium">{formData.profileVisibility ? 'Visible' : 'Hidden'}</span>
              </div>
              <div className="flex justify-between">
                <span>Job Notifications:</span>
                <span className="font-medium">{formData.notificationsEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {isEditing ? (
          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" /> Save Profile
          </Button>
        ) : (
          <Button onClick={() => setIsEditing(true)} className="w-full">
            Edit Profile
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default JobApplicantProfile;
