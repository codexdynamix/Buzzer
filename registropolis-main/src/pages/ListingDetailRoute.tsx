import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ListingDetailPage from '@/components/listing-detail/ListingDetailPage';

const ListingDetailRoute: React.FC = () => (
  <AppLayout withSidebar={true} maxWidth="2xl">
    <ListingDetailPage />
  </AppLayout>
);

export default ListingDetailRoute;
