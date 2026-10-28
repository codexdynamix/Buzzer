import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Info, Camera, Eye, EyeOff,
  Save, Edit2, X, Check, KeyRound, LogOut, Loader2, ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { realAuthAPI } from '@/services/authService';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';
import { useLocalization } from '@/i18n/LocalizationContext';

const PLATFORMS = [
  { key: 'whatsapp', label: 'WhatsApp', color: '#25D366', emoji: '💬' },
  { key: 'viber',    label: 'Viber',    color: '#7360F2', emoji: '📞' },
  { key: 'telegram', label: 'Telegram', color: '#229ED9', emoji: '✈️' },
  { key: 'signal',   label: 'Signal',   color: '#3A76F0', emoji: '🔒' },
  { key: 'messenger',label: 'Messenger',color: '#0078FF', emoji: '💙' },
] as const;

const inputCls = 'w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all';
const inputStyle = { backgroundColor: '#F9F7F4', border: '1px solid #E8E2D8', color: '#0F1923' };
const inputFocusStyle = { outline: 'none', boxShadow: '0 0 0 2px #1a1f3633' };

function Field({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6E7A8A' }}>{label}</label>
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#C9A96E' }} />
        {children}
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E2D8', backgroundColor: '#fff' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #F0EBE1' }}>
        <p className="font-bold text-sm" style={{ color: '#0F1923' }}>{title}</p>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: '#6E7A8A' }}>{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, signOut, refreshUser } = useAuth();
  const { t } = useLocalization();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ── Profile state ──────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    bio: user?.bio ?? '',
    location: user?.location ?? '',
    contactPhone: user?.contactPhone ?? '',
    profileImageUrl: user?.profileImageUrl ?? '',
    whatsapp:  user?.whatsapp  ?? false,
    viber:     user?.viber     ?? false,
    telegram:  user?.telegram  ?? false,
    signal:    user?.signal    ?? false,
    messenger: user?.messenger ?? false,
  });

  // ── Password state ─────────────────────────────────────────
  const [pwSection, setPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const initials = profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  // ── Handlers ───────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setProfile(p => ({ ...p, profileImageUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!profile.name.trim()) return toast.error(t('Name is required'));
    setIsSaving(true);
    try {
      const data = await realAuthAPI.updateProfile({
        name: profile.name,
        bio: profile.bio,
        location: profile.location,
        contactPhone: profile.contactPhone,
        profileImageUrl: profile.profileImageUrl,
        whatsapp:  profile.whatsapp,
        viber:     profile.viber,
        telegram:  profile.telegram,
        signal:    profile.signal,
        messenger: profile.messenger,
      });
      updateUser(data.user ?? profile);
      toast.success(t('Profile saved!'));
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Could not save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPw) return toast.error(t('Enter a new password'));
    if (newPw.length < 6) return toast.error(t('At least 6 characters'));
    if (newPw !== confirmPw) return toast.error(t("Passwords don't match"));
    setSavingPw(true);
    try {
      await realAuthAPI.changePassword(currentPw, newPw);
      toast.success(t('Password updated!'));
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setPwSection(false);
    } catch (err: any) {
      toast.error(err.message || 'Password change failed');
    } finally {
      setSavingPw(false);
    }
  };

  const hasPassword = !!user?.email; // email users have passwords; phone-only may not

  return (
    <AppLayout withSidebar maxWidth="2xl">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="mb-7">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium mb-4 transition-colors hover:text-[#0F1923]"
            style={{ color: '#6E7A8A' }}
          >
            <ArrowLeft size={14} /> {t('Back')}
          </button>
          <h1 className="text-2xl font-bold" style={{ color: '#0F1923', letterSpacing: '-0.03em' }}>{t('Profile & Settings')}</h1>
          <p className="text-sm mt-1" style={{ color: '#6E7A8A' }}>{t('Manage your identity, contact details, and security')}</p>
        </motion.div>

        <div className="space-y-4">

          {/* ── Avatar card ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: 0.04 }}>
            <div className="rounded-2xl p-5" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div
                    className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: '#F0EBE1', border: '2px solid #E8D9BC' }}
                  >
                    {profile.profileImageUrl ? (
                      <img src={profile.profileImageUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold" style={{ color: '#C9A96E' }}>{initials}</span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ backgroundColor: '#C9A96E', border: '2px solid #fff' }}
                  >
                    <Camera size={12} color="#fff" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base truncate" style={{ color: '#0F1923' }}>{profile.name || 'Your Name'}</p>
                  <p className="text-sm truncate mt-0.5" style={{ color: '#6E7A8A' }}>{user?.email || user?.phoneNumber || ''}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold px-3 py-1 rounded-full transition-all"
                      style={{ backgroundColor: '#F0EBE1', color: '#C9A96E', border: '1px solid #E8D9BC' }}
                    >
                      {t('Change photo')}
                    </button>
                    {user?.role === 'admin' && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Profile info ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: 0.08 }}>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E2D8', backgroundColor: '#fff' }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #F0EBE1' }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#0F1923' }}>{t('Profile Information')}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6E7A8A' }}>{t('Your public display name, bio, and location')}</p>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                    style={{ backgroundColor: '#F0EBE1', color: '#1A3353', border: '1px solid #E8D9BC' }}
                  >
                    <Edit2 size={11} /> {t('Edit')}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setIsEditing(false)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F5F2EC', color: '#6E7A8A' }}>
                      <X size={12} />
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                      style={{ backgroundColor: '#1A3353', color: '#fff' }}
                    >
                      {isSaving ? <Loader2 size={11} className="animate-spin" /> : <><Save size={11} /> {t('Save')}</>}
                    </button>
                  </div>
                )}
              </div>

              <div className="p-5 space-y-4">
                {isEditing ? (
                  <>
                    <Field label={t('Full name')} icon={User}>
                      <input
                        value={profile.name}
                        onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                        placeholder={t('Your full name')}
                        className={inputCls + ' pl-9'}
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Location" icon={MapPin}>
                      <input
                        value={profile.location}
                        onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                        placeholder={t('e.g. London, UK')}
                        className={inputCls + ' pl-9'}
                        style={inputStyle}
                      />
                    </Field>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6E7A8A' }}>{t('Bio')}</label>
                      <textarea
                        value={profile.bio}
                        onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                        rows={3}
                        placeholder={t('A short description about yourself…')}
                        className="w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none resize-none transition-all"
                        style={inputStyle}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    {[
                      { label: t('Name'), value: profile.name, Icon: User },
                      { label: t('Email'), value: user?.email || t('Not provided'), Icon: Mail },
                      { label: t('Location'), value: profile.location || t('Not provided'), Icon: MapPin },
                      { label: t('Bio'), value: profile.bio || t('Not provided'), Icon: Info },
                    ].map(({ label, value, Icon }) => (
                      <div key={label} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#F5F2EC' }}>
                          <Icon size={14} style={{ color: '#C9A96E' }} />
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: '#6E7A8A' }}>{label}</p>
                          <p className="text-sm font-medium mt-0.5" style={{ color: '#0F1923' }}>{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Contact / Phone ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: 0.12 }}>
            <Section title={t('Contact Details')} subtitle={t('Phone number shown on your listings so buyers can reach you')}>
              <div className="space-y-4">
                {/* Registered account phone (read-only) */}
                {user?.phoneNumber && (
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#F9F7F4', border: '1px solid #E8E2D8' }}>
                    <Phone size={14} style={{ color: '#C9A96E' }} />
                    <div>
                      <p className="text-xs" style={{ color: '#6E7A8A' }}>{t('Account phone (WhatsApp sign-in)')}</p>
                      <p className="text-sm font-semibold" style={{ color: '#0F1923' }}>{user.phoneNumber}</p>
                    </div>
                  </div>
                )}

                {/* Seller contact phone (editable) */}
                <Field label={t('Public Contact Number')} icon={Phone}>
                  <input
                    value={profile.contactPhone}
                    onChange={e => setProfile(p => ({ ...p, contactPhone: e.target.value }))}
                    placeholder="+44 7700 900000"
                    className={inputCls + ' pl-9'}
                    style={inputStyle}
                  />
                </Field>

                {/* Platform toggles */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#6E7A8A' }}>{t('Reachable via')}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PLATFORMS.map(pl => {
                      const isOn = profile[pl.key as keyof typeof profile] as boolean;
                      return (
                        <button
                          key={pl.key}
                          onClick={() => setProfile(p => ({ ...p, [pl.key]: !p[pl.key as keyof typeof p] }))}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: isOn ? `${pl.color}18` : '#F9F7F4',
                            border: `1px solid ${isOn ? pl.color + '55' : '#E8E2D8'}`,
                            color: isOn ? pl.color : '#6E7A8A',
                          }}
                        >
                          <span>{pl.emoji}</span>
                          <span>{pl.label}</span>
                          {isOn && <Check size={10} className="ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#1A3353', color: '#fff' }}
                >
                  {isSaving ? <Loader2 size={15} className="animate-spin mx-auto" /> : t('Save Contact Settings')}
                </button>
              </div>
            </Section>
          </motion.div>

          {/* ── Password ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: 0.16 }}>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E2D8', backgroundColor: '#fff' }}>
              <button
                className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50"
                style={{ borderBottom: pwSection ? '1px solid #F0EBE1' : 'none' }}
                onClick={() => setPwSection(s => !s)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F5F2EC' }}>
                    <KeyRound size={14} style={{ color: '#C9A96E' }} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm" style={{ color: '#0F1923' }}>
                      {hasPassword ? t('Change Password') : t('Set a Password')}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#6E7A8A' }}>
                      {hasPassword ? t('Update your account password') : t('Add email/password login to your account')}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full transition-all" style={{ backgroundColor: '#F0EBE1', color: '#1A3353' }}>
                  {pwSection ? t('Cancel') : t('Change')}
                </span>
              </button>

              {pwSection && (
                <div className="p-5 space-y-4">
                  {hasPassword && (
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6E7A8A' }}>{t('Current Password')}</label>
                      <div className="relative">
                        <input
                          type={showCurrent ? 'text' : 'password'}
                          value={currentPw}
                          onChange={e => setCurrentPw(e.target.value)}
                          placeholder={t('Your current password')}
                          className={inputCls + ' pr-10'}
                          style={inputStyle}
                          autoFocus
                        />
                        <button type="button" onClick={() => setShowCurrent(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }}>
                          {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6E7A8A' }}>{t('New Password')}</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                        placeholder={t('At least 6 characters')}
                        className={inputCls + ' pr-10'}
                        style={inputStyle}
                        autoFocus={!hasPassword}
                      />
                      <button type="button" onClick={() => setShowNew(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }}>
                        {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6E7A8A' }}>{t('Confirm New Password')}</label>
                    <input
                      type="password"
                      value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                      placeholder={t('Repeat your new password')}
                      className={inputCls}
                      style={inputStyle}
                    />
                    {confirmPw && newPw !== confirmPw && (
                      <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>{t("Passwords don't match")}</p>
                    )}
                  </div>

                  <button
                    onClick={handleChangePassword}
                    disabled={savingPw || !newPw || (newPw !== confirmPw)}
                    className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                    style={{ backgroundColor: '#1A3353', color: '#fff' }}
                  >
                    {savingPw ? <Loader2 size={15} className="animate-spin" /> : <><ShieldCheck size={14} /> {t('Update Password')}</>}
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Account / sign out ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: 0.20 }}>
            <div className="rounded-2xl p-5" style={{ border: '1px solid #E8E2D8', backgroundColor: '#fff' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#6E7A8A' }}>{t('Account')}</p>
              <button
                onClick={signOut}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition-all hover:bg-red-50"
                style={{ borderColor: '#fecaca', color: '#dc2626' }}
              >
                <LogOut size={15} /> {t('Sign out')}
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </AppLayout>
  );
}
