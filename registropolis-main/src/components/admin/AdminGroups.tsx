import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { adminAPI } from '@/services/apiService';

interface AdminGroup {
  id: string;
  name: string;
  memberCount: number;
  createdBy: string;
  createdAt: string;
}

const AdminGroups: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getGroups()
      .then(({ groups: records }) => setGroups(records ?? []))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const query = searchQuery.toLowerCase();
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(query) ||
    group.createdBy.toLowerCase().includes(query)
  );
  const totalMembers = groups.reduce((count, group) => count + group.memberCount, 0);

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Group Statistics</CardTitle>
          <CardDescription>Overview of group activity</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Total Groups</span>
            <span className="text-2xl font-bold">{loading || loadError ? '—' : groups.length}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Total Members</span>
            <span className="text-2xl font-bold">{loading || loadError ? '—' : totalMembers}</span>
          </div>
        </CardContent>
      </Card>

      <div className="max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group Name</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.length > 0 ? filteredGroups.map(group => (
              <TableRow key={group.id}>
                <TableCell className="font-medium">{group.name}</TableCell>
                <TableCell>{group.createdBy}</TableCell>
                <TableCell>{group.memberCount}</TableCell>
                <TableCell>{new Date(group.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  {loading ? 'Loading groups…' : loadError ? 'Groups could not be loaded' : 'No groups found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminGroups;
