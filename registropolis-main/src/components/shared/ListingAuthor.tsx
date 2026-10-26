import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ListingAuthorProps {
  listing: {
    owner?: { id?: string; name?: string; profileImageUrl?: string };
    userId?: string;
    seller?: string;
    name?: string;
    host?: string;
  };
}

export default function ListingAuthor({ listing }: ListingAuthorProps) {
  const navigate = useNavigate();
  const name = listing.owner?.name ?? listing.seller ?? listing.name ?? listing.host;
  const userId = listing.owner?.id ?? listing.userId;
  if (!name) return null;

  const content = (
    <>
      <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full text-[10px] font-bold" style={{ backgroundColor: '#F0EBE1', color: '#1A3353' }}>
        {listing.owner?.profileImageUrl
          ? <img src={listing.owner.profileImageUrl} alt="" className="h-full w-full object-cover" />
          : name.charAt(0).toLocaleUpperCase()}
      </span>
      <span className="truncate">{name}</span>
    </>
  );

  return userId ? (
    <button
      type="button"
      onClick={event => {
        event.stopPropagation();
        navigate(`/dashboard/seller/${encodeURIComponent(userId)}`);
      }}
      className="inline-flex max-w-full items-center gap-1.5 text-xs font-medium hover:underline"
      style={{ color: '#1A3353' }}
      title={`View ${name}'s profile`}
    >
      {content}
    </button>
  ) : (
    <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-medium" style={{ color: '#6E7A8A' }}>
      {content}
    </span>
  );
}
