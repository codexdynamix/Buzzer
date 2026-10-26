
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Briefcase, Clock, DollarSign, BookmarkPlus, Filter, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/layout/Sidebar';
import { Badge } from '@/components/ui/badge';

// Job card component
const JobCard = ({ 
  title, 
  company, 
  location, 
  salary, 
  type,
  postedTime,
  companyLogo,
  isSponsored = false
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  return (
    <motion.div 
      className="bg-card rounded-lg overflow-hidden border border-border p-4"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex gap-4">
        <div className="h-14 w-14 rounded-md overflow-hidden flex-shrink-0 bg-accent flex items-center justify-center">
          {companyLogo ? (
            <img src={companyLogo} alt={company} className="h-full w-full object-cover" />
          ) : (
            <Building className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between">
            <h3 className="font-semibold line-clamp-1">{title}</h3>
            <button 
              className="text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setIsBookmarked(!isBookmarked)}
            >
              <BookmarkPlus className={`h-5 w-5 ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
            </button>
          </div>
          
          <div className="text-sm font-medium mt-1">{company}</div>
          
          <div className="flex items-center text-muted-foreground mt-2 text-sm">
            <MapPin className="h-3.5 w-3.5 mr-1" />
            <span>{location}</span>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {salary}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {type}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {postedTime}
            </Badge>
            {isSponsored && (
              <Badge variant="outline" className="border-primary text-primary">
                Sponsored
              </Badge>
            )}
          </div>
          
          <div className="mt-4">
            <Button className="w-full">Apply Now</Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Quick apply modal - this would be expanded in a real app
const JobFilters = () => {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="font-medium mb-3">Refine Search</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Salary Range</label>
          <div className="flex gap-2">
            <Input placeholder="Min" type="number" className="w-1/2" />
            <Input placeholder="Max" type="number" className="w-1/2" />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Job Type</label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">Full-time</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">Part-time</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">Contract</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">Remote</Badge>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Experience Level</label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">Entry Level</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">Mid Level</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">Senior</Badge>
          </div>
        </div>
        
        <Button className="w-full">Apply Filters</Button>
      </div>
    </div>
  );
};

const Jobs = () => {
  // Sample jobs data - would come from API in real app
  const jobs = [
    {
      id: 1,
      title: "Frontend Developer",
      company: "Tech Innovations Inc.",
      location: "San Francisco, CA (Remote)",
      salary: "$90,000 - $120,000",
      type: "Full-time",
      postedTime: "2 days ago",
      companyLogo: "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=200",
      isSponsored: true
    },
    {
      id: 2,
      title: "UX/UI Designer",
      company: "Creative Studios",
      location: "New York, NY",
      salary: "$75,000 - $95,000",
      type: "Full-time",
      postedTime: "5 days ago",
      companyLogo: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=200",
      isSponsored: false
    },
    {
      id: 3,
      title: "Backend Engineer",
      company: "Data Systems Pro",
      location: "Austin, TX (Hybrid)",
      salary: "$100,000 - $130,000",
      type: "Full-time",
      postedTime: "1 week ago",
      companyLogo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200",
      isSponsored: false
    },
    {
      id: 4,
      title: "Marketing Specialist",
      company: "Growth Hackers",
      location: "Chicago, IL",
      salary: "$60,000 - $80,000",
      type: "Full-time",
      postedTime: "3 days ago",
      companyLogo: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=200",
      isSponsored: false
    },
    {
      id: 5,
      title: "Product Manager",
      company: "Innovate Solutions",
      location: "Seattle, WA",
      salary: "$110,000 - $140,000",
      type: "Full-time",
      postedTime: "Just now",
      companyLogo: "https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?auto=format&fit=crop&w=200",
      isSponsored: true
    },
    {
      id: 6,
      title: "Customer Support Specialist",
      company: "Help Desk Inc.",
      location: "Remote",
      salary: "$45,000 - $55,000",
      type: "Part-time",
      postedTime: "1 day ago",
      companyLogo: "https://images.unsplash.com/photo-1556157382-97eda2f9e861?auto=format&fit=crop&w=200",
      isSponsored: false
    },
    {
      id: 7,
      title: "DevOps Engineer",
      company: "Cloud Systems",
      location: "Boston, MA",
      salary: "$95,000 - $125,000",
      type: "Full-time",
      postedTime: "4 days ago",
      companyLogo: null,
      isSponsored: false
    },
    {
      id: 8,
      title: "Data Scientist",
      company: "Analytics Pro",
      location: "San Jose, CA",
      salary: "$105,000 - $135,000",
      type: "Contract",
      postedTime: "1 week ago",
      companyLogo: null,
      isSponsored: false
    },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 overflow-auto pl-64">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Find Jobs</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                View Saved Jobs
              </Button>
              <Button variant="default" size="sm">
                Upload Resume
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Job title, keywords, or company" 
              className="pl-10 py-6"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Job filters sidebar */}
            <div className="hidden lg:block">
              <JobFilters />
            </div>
            
            {/* Job listings */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Found {jobs.length} jobs</h2>
                <select className="bg-background border rounded px-2 py-1 text-sm">
                  <option>Most relevant</option>
                  <option>Newest</option>
                  <option>Highest salary</option>
                </select>
              </div>
              
              {jobs.map(job => (
                <JobCard key={job.id} {...job} />
              ))}
              
              <div className="flex justify-center mt-6">
                <Button variant="outline">Load More Jobs</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jobs;
