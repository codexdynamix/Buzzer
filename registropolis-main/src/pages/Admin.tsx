import React from 'react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminMessages from '@/components/admin/AdminMessages';
import AdminGroups from '@/components/admin/AdminGroups';
import AdminFeatures from '@/components/admin/AdminFeatures';
import AdminUserActivity from '@/components/admin/AdminUserActivity';
import AdminRestrictions from '@/components/admin/AdminRestrictions';
import AdminServices from '@/components/admin/AdminServices';
import AdminSupport from '@/components/admin/AdminSupport';

const Admin = () => {
  return (
    <AdminRouteGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>
          <TabsContent value="features">
            <AdminFeatures />
          </TabsContent>
          <TabsContent value="services">
            <AdminServices />
          </TabsContent>
          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>
          <TabsContent value="activity">
            <AdminUserActivity />
          </TabsContent>
          <TabsContent value="restrictions">
            <AdminRestrictions />
          </TabsContent>
          <TabsContent value="messages">
            <AdminMessages />
          </TabsContent>
          <TabsContent value="groups">
            <AdminGroups />
          </TabsContent>
          <TabsContent value="support">
            <AdminSupport />
          </TabsContent>
        </Tabs>
      </div>
    </AdminRouteGuard>
  );
};

export default Admin;
