import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Pencil, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useGuestGate } from '@/context/GuestGateContext';

export type ListingType = 'marketplace' | 'job' | 'service' | 'real-estate' | 'transport' | 'event';

interface CreateListingModalProps {
  type: ListingType;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void | Promise<void>;
  initialData?: any;
  editId?: string;
}

/* ── Shared field styles ───────────────────────────────────────── */
const inputCls = "w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-shadow";
const inputStyle = { backgroundColor: '#F5F2EC', border: '1px solid #E8E2D8', color: '#0F1923', '--tw-ring-color': '#C9A96E' } as React.CSSProperties;
const labelCls = "block text-xs font-semibold mb-1.5 uppercase tracking-wide";
const labelStyle = { color: '#6E7A8A' };
const selectCls = "w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-shadow appearance-none cursor-pointer";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls} style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
      style={inputStyle}
    />
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={selectCls} style={inputStyle}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={inputCls}
      style={{ ...inputStyle, resize: 'none' }}
    />
  );
}

/* ── Photo upload ───────────────────────────────────────────────── */
function PhotoUploadField({ images, onChange, max = 4 }: {
  images: string[];
  onChange: (imgs: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const slots = max - images.length;
    const picked = Array.from(files).slice(0, Math.max(0, slots));
    const dataUrls: string[] = [];
    for (const f of picked) {
      const url = await new Promise<string>(res => {
        const r = new FileReader();
        r.onload = e => res(e.target?.result as string ?? '');
        r.readAsDataURL(f);
      });
      if (url) dataUrls.push(url);
    }
    onChange([...images, ...dataUrls]);
  };

  return (
    <div>
      <label className={labelCls} style={labelStyle}>
        Photos {images.length > 0 ? `(${images.length} / ${max})` : `— up to ${max}`}
      </label>
      <div className="grid grid-cols-4 gap-2">
        {images.map((src, i) => (
          <div
            key={i}
            className="relative rounded-xl overflow-hidden"
            style={{ paddingBottom: '100%', position: 'relative' }}
          >
            <div className="absolute inset-0">
              <img src={src} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span
                  className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: '#1A3353', color: '#FAFAF7' }}
                >
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(15,25,35,0.7)', color: '#FAFAF7' }}
              >
                <X size={9} />
              </button>
            </div>
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="relative rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
            style={{
              paddingBottom: '100%',
              border: '1.5px dashed #C9A96E',
              backgroundColor: '#FEFDFB',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#FBF8F1'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#FEFDFB'; }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
              <Camera size={18} style={{ color: '#C9A96E' }} />
              <span className="text-[10px] font-semibold" style={{ color: '#C9A96E' }}>
                {images.length === 0 ? 'Add photo' : 'Add more'}
              </span>
            </div>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 text-sm font-medium transition-colors"
      style={{ color: checked ? '#1A3353' : '#6E7A8A' }}
    >
      <div
        className="w-9 h-5 rounded-full transition-colors relative"
        style={{ backgroundColor: checked ? '#C9A96E' : '#E8E2D8' }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
          style={{ left: checked ? '18px' : '2px' }}
        />
      </div>
      {label}
    </button>
  );
}

/* ── Config per type ────────────────────────────────────────────── */
const CONFIG = {
  marketplace: { title: 'List an Item',     editTitle: 'Edit Listing',    subtitle: 'Sell something to your community',         cta: 'Post Listing',   editCta: 'Save Changes' },
  job:         { title: 'Post a Role',       editTitle: 'Edit Job',        subtitle: 'Attract top talent in your community',     cta: 'Post Job',       editCta: 'Save Changes' },
  service:     { title: 'Offer a Service',   editTitle: 'Edit Service',    subtitle: 'Let the community know what you do',       cta: 'Post Service',   editCta: 'Save Changes' },
  'real-estate':{ title: 'List a Property', editTitle: 'Edit Property',   subtitle: 'Reach buyers and renters near you',         cta: 'List Property',  editCta: 'Save Changes' },
  transport:   { title: 'List a Vehicle',    editTitle: 'Edit Vehicle',    subtitle: 'Find the right buyer for your vehicle',    cta: 'Post Vehicle',   editCta: 'Save Changes' },
  event:       { title: 'Create an Event',   editTitle: 'Edit Event',      subtitle: 'Invite your community to something great', cta: 'Create Event',   editCta: 'Save Changes' },
};

/* ── Form per type ──────────────────────────────────────────────── */
function MarketplaceForm({ onData, initialData }: { onData: (d: any) => void; initialData?: any }) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [price, setPrice] = useState(initialData?.price != null ? String(initialData.price) : '');
  const [originalPrice, setOriginalPrice] = useState(initialData?.originalPrice ? String(initialData.originalPrice) : '');
  const [condition, setCondition] = useState(initialData?.condition ?? 'Good');
  const [category, setCategory] = useState(initialData?.category ?? 'Electronics');
  const [location, setLocation] = useState(initialData?.location ?? '');
  const [images, setImages] = useState<string[]>(() => {
    const main = initialData?.imageUrl ?? initialData?.image ?? '';
    const gallery = Array.isArray(initialData?.galleryImages) ? initialData.galleryImages : [];
    return [main, ...gallery].filter(Boolean);
  });
  const [description, setDescription] = useState(initialData?.description ?? '');

  useEffect(() => {
    onData({ title, price, originalPrice, condition, category, location, imageUrl: images[0] ?? '', galleryImages: images.slice(1), description });
  }, [title, price, originalPrice, condition, category, location, images, description]);

  return (
    <div className="space-y-4">
      <Field label="Title"><TextInput value={title} onChange={setTitle} placeholder="e.g. MacBook Pro 14-inch 2023" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price ($)"><TextInput type="number" value={price} onChange={setPrice} placeholder="0" /></Field>
        <Field label="Original Price ($) — optional"><TextInput type="number" value={originalPrice} onChange={setOriginalPrice} placeholder="0" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Condition"><SelectInput value={condition} onChange={setCondition} options={['New', 'Like New', 'Good', 'Fair']} /></Field>
        <Field label="Category"><SelectInput value={category} onChange={setCategory} options={['Electronics', 'Clothing', 'Home & Living', 'Sports', 'Vehicles', 'Books', 'Other']} /></Field>
      </div>
      <Field label="Location"><TextInput value={location} onChange={setLocation} placeholder="e.g. San Francisco, CA" /></Field>
      <PhotoUploadField images={images} onChange={setImages} max={4} />
      <Field label="Description"><TextArea value={description} onChange={setDescription} placeholder="Describe the item…" /></Field>
    </div>
  );
}

function JobForm({ onData, initialData }: { onData: (d: any) => void; initialData?: any }) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [company, setCompany] = useState(initialData?.company ?? '');
  const [location, setLocation] = useState(initialData?.location ?? '');
  const [salary, setSalary] = useState(initialData?.salary ?? '');
  const [type, setType] = useState(initialData?.type ?? 'Full-time');
  const [remote, setRemote] = useState(initialData?.remote ?? false);
  const [description, setDescription] = useState(initialData?.description ?? initialData?.desc ?? '');
  const [tags, setTags] = useState(
    Array.isArray(initialData?.tags) ? initialData.tags.join(', ') : (initialData?.tags ?? '')
  );

  const [images, setImages] = useState<string[]>(() => {
    const main = initialData?.imageUrl ?? initialData?.image ?? '';
    return main ? [main] : [];
  });

  useEffect(() => {
    onData({ title, company, location, salary, type, remote, description, tags, imageUrl: images[0] ?? '', galleryImages: images.slice(1) });
  }, [title, company, location, salary, type, remote, description, tags, images]);

  return (
    <div className="space-y-4">
      <Field label="Job Title"><TextInput value={title} onChange={setTitle} placeholder="e.g. Senior Frontend Engineer" /></Field>
      <Field label="Company"><TextInput value={company} onChange={setCompany} placeholder="e.g. Acme Corp" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Location"><TextInput value={location} onChange={setLocation} placeholder="e.g. Remote or City, ST" /></Field>
        <Field label="Salary Range"><TextInput value={salary} onChange={setSalary} placeholder="e.g. $120k – $160k" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Job Type"><SelectInput value={type} onChange={setType} options={['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']} /></Field>
        <Field label="&nbsp;">
          <div className="pt-2"><Toggle checked={remote} onChange={setRemote} label="Remote position" /></div>
        </Field>
      </div>
      <Field label="Description"><TextArea value={description} onChange={setDescription} placeholder="Describe the role, responsibilities, and requirements…" rows={4} /></Field>
      <Field label="Skills / Tags (comma-separated)"><TextInput value={tags} onChange={setTags} placeholder="e.g. React, TypeScript, Node.js" /></Field>
      <PhotoUploadField images={images} onChange={setImages} max={2} />
    </div>
  );
}

function ServiceForm({ onData, initialData }: { onData: (d: any) => void; initialData?: any }) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [category, setCategory] = useState(initialData?.category ?? 'Home Repair');
  const [rate, setRate] = useState(initialData?.rate ?? '');
  const [location, setLocation] = useState(initialData?.location ?? '');
  const [available, setAvailable] = useState(initialData?.available ?? true);
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [tags, setTags] = useState(
    Array.isArray(initialData?.tags) ? initialData.tags.join(', ') : (initialData?.tags ?? '')
  );

  const [images, setImages] = useState<string[]>(() => {
    const main = initialData?.imageUrl ?? initialData?.image ?? '';
    return main ? [main] : [];
  });

  useEffect(() => {
    onData({ name, title, category, rate, location, available, description, tags, imageUrl: images[0] ?? '', galleryImages: images.slice(1) });
  }, [name, title, category, rate, location, available, description, tags, images]);

  return (
    <div className="space-y-4">
      <Field label="Your Name"><TextInput value={name} onChange={setName} placeholder="e.g. Jordan Williams" /></Field>
      <Field label="Service Title"><TextInput value={title} onChange={setTitle} placeholder="e.g. Certified Personal Trainer" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category"><SelectInput value={category} onChange={setCategory} options={['Home Repair', 'Cleaning', 'Design', 'Tutoring', 'Health', 'Tech Support', 'Catering', 'Other']} /></Field>
        <Field label="Rate"><TextInput value={rate} onChange={setRate} placeholder="e.g. $75/hr or $200/event" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Location"><TextInput value={location} onChange={setLocation} placeholder="e.g. Remote or City, ST" /></Field>
        <Field label="&nbsp;">
          <div className="pt-2"><Toggle checked={available} onChange={setAvailable} label="Currently available" /></div>
        </Field>
      </div>
      <PhotoUploadField images={images} onChange={setImages} max={4} />
      <Field label="Description"><TextArea value={description} onChange={setDescription} placeholder="Describe your experience and what you offer…" /></Field>
      <Field label="Specialties (comma-separated)"><TextInput value={tags} onChange={setTags} placeholder="e.g. Plumbing, Electrical, Fixtures" /></Field>
    </div>
  );
}

function RealEstateForm({ onData, initialData }: { onData: (d: any) => void; initialData?: any }) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [address, setAddress] = useState(initialData?.address ?? '');
  const [mode, setMode] = useState(initialData?.mode ?? 'Buy');
  const [price, setPrice] = useState(initialData?.price != null ? String(initialData.price) : '');
  const [beds, setBeds] = useState(initialData?.beds != null ? String(initialData.beds) : '');
  const [baths, setBaths] = useState(initialData?.baths != null ? String(initialData.baths) : '');
  const [sqft, setSqft] = useState(initialData?.sqft != null ? String(initialData.sqft) : '');
  const [agent, setAgent] = useState(initialData?.agent ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');

  const [images, setImages] = useState<string[]>(() => {
    const main = initialData?.imageUrl ?? initialData?.image ?? '';
    const gallery = Array.isArray(initialData?.galleryImages) ? initialData.galleryImages : [];
    return [main, ...gallery].filter(Boolean);
  });

  useEffect(() => {
    onData({ title, address, mode, price, beds, baths, sqft, agent, description, imageUrl: images[0] ?? '', galleryImages: images.slice(1) });
  }, [title, address, mode, price, beds, baths, sqft, agent, description, images]);

  return (
    <div className="space-y-4">
      <Field label="Property Title"><TextInput value={title} onChange={setTitle} placeholder="e.g. Modern 3BR Family Home" /></Field>
      <Field label="Address"><TextInput value={address} onChange={setAddress} placeholder="e.g. 123 Oak Lane, Austin, TX" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Listing Type"><SelectInput value={mode} onChange={setMode} options={['Buy', 'Rent', 'Commercial']} /></Field>
        <Field label={mode === 'Rent' ? 'Monthly Rent ($)' : 'Price ($)'}><TextInput type="number" value={price} onChange={setPrice} placeholder="0" /></Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Bedrooms"><TextInput type="number" value={beds} onChange={setBeds} placeholder="3" /></Field>
        <Field label="Bathrooms"><TextInput type="number" value={baths} onChange={setBaths} placeholder="2" /></Field>
        <Field label="Sq Ft"><TextInput type="number" value={sqft} onChange={setSqft} placeholder="1800" /></Field>
      </div>
      <Field label="Your Name (Agent / Owner)"><TextInput value={agent} onChange={setAgent} placeholder="e.g. Sarah Mitchell" /></Field>
      <PhotoUploadField images={images} onChange={setImages} max={6} />
      <Field label="Description"><TextArea value={description} onChange={setDescription} placeholder="Describe the property, features, and neighbourhood…" /></Field>
    </div>
  );
}

function TransportForm({ onData, initialData }: { onData: (d: any) => void; initialData?: any }) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [category, setCategory] = useState(initialData?.category ?? 'Cars');
  const [year, setYear] = useState(initialData?.year != null ? String(initialData.year) : '');
  const [price, setPrice] = useState(initialData?.price != null ? String(initialData.price) : '');
  const [mileage, setMileage] = useState(initialData?.mileage ?? '');
  const [fuel, setFuel] = useState(initialData?.fuel ?? 'Petrol');
  const [transmission, setTransmission] = useState(initialData?.transmission ?? 'Auto');
  const [condition, setCondition] = useState(initialData?.condition ?? 'Good');
  const [location, setLocation] = useState(initialData?.location ?? '');
  const [electric, setElectric] = useState(initialData?.electric ?? false);
  const [description, setDescription] = useState(initialData?.description ?? '');

  const [images, setImages] = useState<string[]>(() => {
    const main = initialData?.imageUrl ?? initialData?.image ?? '';
    const gallery = Array.isArray(initialData?.galleryImages) ? initialData.galleryImages : [];
    return [main, ...gallery].filter(Boolean);
  });

  useEffect(() => {
    onData({ title, category, year, price, mileage, fuel, transmission, condition, location, electric, description, imageUrl: images[0] ?? '', galleryImages: images.slice(1) });
  }, [title, category, year, price, mileage, fuel, transmission, condition, location, electric, description, images]);

  return (
    <div className="space-y-4">
      <Field label="Vehicle Title"><TextInput value={title} onChange={setTitle} placeholder="e.g. 2023 Tesla Model S Plaid" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category"><SelectInput value={category} onChange={setCategory} options={['Cars', 'Motorcycles', 'Trucks & Vans', 'SUVs', 'Electric', 'Other']} /></Field>
        <Field label="Condition"><SelectInput value={condition} onChange={setCondition} options={['New', 'Like New', 'Excellent', 'Good', 'Fair']} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Year"><TextInput type="number" value={year} onChange={setYear} placeholder="2023" /></Field>
        <Field label="Price ($)"><TextInput type="number" value={price} onChange={setPrice} placeholder="0" /></Field>
        <Field label="Mileage"><TextInput value={mileage} onChange={setMileage} placeholder="e.g. 12,000 mi" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fuel Type"><SelectInput value={fuel} onChange={setFuel} options={['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Other']} /></Field>
        <Field label="Transmission"><SelectInput value={transmission} onChange={setTransmission} options={['Auto', 'Manual', 'PDK', 'CVT']} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Location"><TextInput value={location} onChange={setLocation} placeholder="e.g. San Francisco, CA" /></Field>
        <Field label="&nbsp;">
          <div className="pt-2"><Toggle checked={electric} onChange={setElectric} label="Electric vehicle" /></div>
        </Field>
      </div>
      <PhotoUploadField images={images} onChange={setImages} max={6} />
      <Field label="Description"><TextArea value={description} onChange={setDescription} placeholder="Describe the vehicle, features, and history…" /></Field>
    </div>
  );
}

function EventForm({ onData, initialData }: { onData: (d: any) => void; initialData?: any }) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [category, setCategory] = useState(initialData?.category ?? 'Music');
  const [date, setDate] = useState(initialData?.date ?? '');
  const [time, setTime] = useState(initialData?.time ?? '');
  const [location, setLocation] = useState(initialData?.location ?? '');
  const [price, setPrice] = useState(initialData?.price != null ? String(initialData.price) : '0');
  const [host, setHost] = useState(initialData?.host ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');

  const [images, setImages] = useState<string[]>(() => {
    const main = initialData?.imageUrl ?? initialData?.image ?? '';
    return main ? [main] : [];
  });

  useEffect(() => {
    onData({ title, category, date, time, location, price, host, description, imageUrl: images[0] ?? '', galleryImages: images.slice(1) });
  }, [title, category, date, time, location, price, host, description, images]);

  return (
    <div className="space-y-4">
      <Field label="Event Name"><TextInput value={title} onChange={setTitle} placeholder="e.g. Community Art Fair 2025" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category"><SelectInput value={category} onChange={setCategory} options={['Music', 'Sports', 'Arts & Culture', 'Business', 'Food & Drink', 'Tech', 'Community', 'Other']} /></Field>
        <Field label="Organiser / Host"><TextInput value={host} onChange={setHost} placeholder="e.g. Your Name or Org" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><TextInput type="date" value={date} onChange={setDate} /></Field>
        <Field label="Time"><TextInput type="time" value={time} onChange={setTime} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Location / Venue"><TextInput value={location} onChange={setLocation} placeholder="e.g. City Square Park, NYC" /></Field>
        <Field label="Ticket Price (0 = Free)"><TextInput type="number" value={price} onChange={setPrice} placeholder="0" /></Field>
      </div>
      <PhotoUploadField images={images} onChange={setImages} max={4} />
      <Field label="Description"><TextArea value={description} onChange={setDescription} placeholder="Tell people what to expect…" rows={4} /></Field>
    </div>
  );
}

const FORMS: Record<ListingType, React.FC<{ onData: (d: any) => void; initialData?: any }>> = {
  marketplace: MarketplaceForm,
  job: JobForm,
  service: ServiceForm,
  'real-estate': RealEstateForm,
  transport: TransportForm,
  event: EventForm,
};

const REQUIRED_FIELDS: Record<ListingType, string[]> = {
  marketplace: ['title', 'price'],
  job: ['title', 'company', 'location', 'description'],
  service: ['title', 'category', 'description'],
  'real-estate': ['title', 'mode', 'price', 'address'],
  transport: ['title', 'category', 'price'],
  event: ['title', 'date', 'location'],
};

/* ── Main Modal ─────────────────────────────────────────────────── */
const CreateListingModal: React.FC<CreateListingModalProps> = ({ type, open, onClose, onSubmit, initialData, editId }) => {
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const { requireAuth } = useGuestGate();

  const isEdit = !!editId;
  const cfg = CONFIG[type];
  const Form = FORMS[type];

  useEffect(() => {
    if (!open) {
      setFormData({});
      setSubmitting(false);
    } else if (!requireAuth()) {
      onClose();
    }
  }, [open, onClose, requireAuth]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!requireAuth()) return;
    const missingField = REQUIRED_FIELDS[type].find(field => {
      const value = formData[field];
      return value == null || String(value).trim() === '';
    });
    if (missingField) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      toast.success(
        isEdit
          ? 'Listing changes saved. If moderation is enabled, they will be reviewed before appearing.'
          : 'Your listing was submitted. It may need approval before appearing publicly.',
        {
        icon: isEdit ? '✏️' : '✅',
        },
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: 'rgba(10,15,22,0.72)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
              style={{
                pointerEvents: 'all',
                borderRadius: 22,
                background: '#FAFAF7',
                border: '1px solid #E8E2D8',
                boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(201,169,110,0.08)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-5 shrink-0"
                style={{ borderBottom: '1px solid #E8E2D8' }}
              >
                <div>
                  <div className="w-8 h-0.5 rounded-full mb-2.5" style={{ backgroundColor: '#C9A96E' }} />
                  <h2 className="text-lg font-bold" style={{ color: '#0F1923', letterSpacing: '-0.03em' }}>
                    {isEdit ? cfg.editTitle : cfg.title}
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: '#6E7A8A' }}>{cfg.subtitle}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: '#F5F2EC', color: '#6E7A8A' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#E8E2D8'; (e.currentTarget as HTMLElement).style.color = '#0F1923'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; (e.currentTarget as HTMLElement).style.color = '#6E7A8A'; }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Scrollable form body */}
              <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: 'thin' }}>
                <Form key={editId ?? 'new'} onData={setFormData} initialData={initialData} />
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
                style={{ borderTop: '1px solid #E8E2D8' }}
              >
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ backgroundColor: '#F5F2EC', color: '#6E7A8A' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#E8E2D8'; (e.currentTarget as HTMLElement).style.color = '#0F1923'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; (e.currentTarget as HTMLElement).style.color = '#6E7A8A'; }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: submitting ? '#6E7A8A' : '#1A3353',
                    color: '#ffffff',
                    opacity: submitting ? 0.7 : 1,
                  }}
                  onMouseEnter={e => { if (!submitting) { (e.currentTarget as HTMLElement).style.backgroundColor = '#142842'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(26,51,83,0.25)'; } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = submitting ? '#6E7A8A' : '#1A3353'; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
                >
                  {submitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                        className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white"
                      />
                      {isEdit ? 'Saving…' : 'Posting…'}
                    </>
                  ) : (
                    <>
                      {isEdit ? <Pencil size={14} strokeWidth={2.5} /> : <Check size={14} strokeWidth={2.5} />}
                      {isEdit ? cfg.editCta : cfg.cta}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateListingModal;
