import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Camera, Save, User, AtSign, Phone, MapPin, Info, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const PLATFORMS = [
  { key: 'whatsapp', label: 'WhatsApp', color: '#25D366', emoji: '💬' },
  { key: 'viber',    label: 'Viber',    color: '#7360F2', emoji: '📞' },
  { key: 'telegram', label: 'Telegram', color: '#229ED9', emoji: '✈️' },
  { key: 'signal',   label: 'Signal',   color: '#3A76F0', emoji: '🔒' },
  { key: 'messenger',label: 'Messenger',color: '#0078FF', emoji: '💙' },
] as const;

interface ProfileSettingsProps {
  user: any | null;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user: propUser }) => {
  const { user: authUser, updateUser } = useAuth();
  const activeUser = authUser ?? propUser;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    name: activeUser?.name ?? '',
    bio: activeUser?.bio ?? 'Buzzer member — buying and selling locally.',
    email: activeUser?.email ?? '',
    location: activeUser?.location ?? '',
    phoneNumber: activeUser?.phoneNumber ?? '',
    profileImageUrl: activeUser?.profileImageUrl ?? '',
    contactPhone: activeUser?.contactPhone ?? '',
    whatsapp: activeUser?.whatsapp ?? false,
    viber: activeUser?.viber ?? false,
    telegram: activeUser?.telegram ?? false,
    signal: activeUser?.signal ?? false,
    messenger: activeUser?.messenger ?? false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setProfileData(prev => ({ ...prev, profileImageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handlePlatformToggle = (key: string) => {
    setProfileData(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleSave = async () => {
    if (!profileData.name.trim()) { toast.error('Name is required'); return; }
    setIsSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const payload = {
        name: profileData.name,
        bio: profileData.bio,
        location: profileData.location,
        profileImageUrl: profileData.profileImageUrl,
        contactPhone: profileData.contactPhone,
        whatsapp: profileData.whatsapp,
        viber: profileData.viber,
        telegram: profileData.telegram,
        signal: profileData.signal,
        messenger: profileData.messenger,
      };
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save profile');
      updateUser(data.user ?? payload);
      toast.success('Profile saved!');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Could not save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = profileData.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="space-y-4 max-w-xl">
      {/* ── Photo card ── */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
        <div className="flex items-center gap-5">
          <div className="relative">
            <div
              className="h-20 w-20 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: '#F0EBE1', border: '2px solid #E8D9BC' }}
            >
              {profileData.profileImageUrl ? (
                <img src={profileData.profileImageUrl} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold" style={{ color: '#C9A96E' }}>{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ backgroundColor: '#C9A96E', border: '2px solid #fff' }}
            >
              <Camera size={12} style={{ color: '#fff' }} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base truncate" style={{ color: '#0F1923' }}>{profileData.name || 'Your Name'}</p>
            <p className="text-sm truncate mt-0.5" style={{ color: '#6E7A8A' }}>{profileData.email || 'your@email.com'}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-xs font-semibold px-3 py-1 rounded-full transition-all"
              style={{ backgroundColor: '#F0EBE1', color: '#C9A96E', border: '1px solid #E8D9BC' }}
            >
              Change photo
            </button>
          </div>
        </div>
      </div>

      {/* ── Profile Info card ── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E2D8', backgroundColor: '#fff' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #F0EBE1' }}>
          <p className="font-bold text-sm" style={{ color: '#0F1923' }}>Profile Information</p>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
              style={{ backgroundColor: '#F0EBE1', color: '#1A3353', border: '1px solid #E8D9BC' }}
            >
              <Edit2 size={11} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="h-7 w-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#F5F2EC', color: '#6E7A8A' }}
              >
                <X size={12} />
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                style={{ backgroundColor: '#1A3353', color: '#fff' }}
              >
                {isSaving ? '…' : <><Save size={11} /> Save</>}
              </button>
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">
          {isEditing ? (
            <>
              {[
                { label: 'Full Name', name: 'name', placeholder: 'Your full name', icon: User },
                { label: 'Email', name: 'email', placeholder: 'your@email.com', icon: AtSign },
                { label: 'Location', name: 'location', placeholder: 'e.g. Port of Spain', icon: MapPin },
              ].map(field => (
                <div key={field.name}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6E7A8A' }}>{field.label}</label>
                  <div className="relative">
                    <field.icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#C9A96E' }} />
                    <input
                      name={field.name}
                      value={(profileData as any)[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: '#F9F7F4', border: '1px solid #E8E2D8', color: '#0F1923' }}
                    />
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6E7A8A' }}>Bio</label>
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Tell buyers a little about yourself…"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ backgroundColor: '#F9F7F4', border: '1px solid #E8E2D8', color: '#0F1923' }}
                />
              </div>
            </>
          ) : (
            <>
              {[
                { label: 'Name', value: profileData.name, icon: User },
                { label: 'Email', value: profileData.email || 'Not provided', icon: AtSign },
                { label: 'Location', value: profileData.location || 'Not provided', icon: MapPin },
                { label: 'Bio', value: profileData.bio, icon: Info },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#F5F2EC' }}>
                    <item.icon size={14} style={{ color: '#C9A96E' }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: '#6E7A8A' }}>{item.label}</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: '#0F1923' }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Seller Contact Info card ── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E2D8', backgroundColor: '#fff' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #F0EBE1' }}>
          <p className="font-bold text-sm" style={{ color: '#0F1923' }}>Seller Contact Info</p>
          <p className="text-xs mt-0.5" style={{ color: '#6E7A8A' }}>This number & platforms appear on your listings so buyers can reach you directly.</p>
        </div>
        <div className="p-5 space-y-4">
          {/* Phone number */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6E7A8A' }}>Contact Phone Number</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#C9A96E' }} />
              <input
                name="contactPhone"
                value={profileData.contactPhone}
                onChange={handleChange}
                placeholder="+1 (868) 555-0100"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ backgroundColor: '#F9F7F4', border: '1px solid #E8E2D8', color: '#0F1923' }}
              />
            </div>
          </div>

          {/* Platform toggles */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#6E7A8A' }}>Reachable via</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PLATFORMS.map(platform => {
                const isOn = profileData[platform.key as keyof typeof profileData] as boolean;
                return (
                  <button
                    key={platform.key}
                    onClick={() => handlePlatformToggle(platform.key)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: isOn ? `${platform.color}18` : '#F9F7F4',
                      border: `1px solid ${isOn ? platform.color + '55' : '#E8E2D8'}`,
                      color: isOn ? platform.color : '#6E7A8A',
                    }}
                  >
                    <span>{platform.emoji}</span>
                    <span className="text-xs">{platform.label}</span>
                    {isOn && <Check size={11} className="ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all"
            style={{ backgroundColor: '#1A3353', color: '#fff' }}
          >
            {isSaving ? 'Saving…' : '💾 Save Contact Settings'}
          </button>
        </div>
      </div>

      {/* ── Account / Phone ── */}
      <div className="rounded-2xl p-5" style={{ border: '1px solid #E8E2D8', backgroundColor: '#fff' }}>
        <p className="text-xs font-semibold mb-3" style={{ color: '#6E7A8A' }}>ACCOUNT</p>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#F5F2EC' }}>
            <Phone size={14} style={{ color: '#C9A96E' }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: '#6E7A8A' }}>Registered phone (cannot be changed)</p>
            <p className="text-sm font-semibold" style={{ color: '#0F1923' }}>{profileData.phoneNumber || '+1 (868) 555-0000'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
