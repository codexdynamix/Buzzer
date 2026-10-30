import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowUpRight, BarChart3, Check, Copy, ExternalLink, Image, LoaderCircle, MessageCircle, Package, Search, Store, Tag, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useChatContext } from '@/context/ChatContext';
import { useUserListings, type UserListing } from '@/context/UserListingsContext';
import { realAuthAPI } from '@/services/authService';
import { listingEngagementAPI } from '@/services/listingEngagementService';
import {
  sellerWorkspaceAPI,
  type SellerAnalytics,
  type SellerOrder,
  type SellerOrderStatus,
} from '@/services/sellerWorkspaceService';

const fieldClass = 'mt-1 w-full rounded-xl border border-[#E8E2D8] bg-white px-3 py-2.5 text-sm text-[#0F1923] outline-none focus:border-[#1A3353]';
const panelClass = 'rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm';

function isHttpUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function SellerStorefrontSettings() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    storeName: '',
    storeSlug: '',
    storeTagline: '',
    storeDescription: '',
    storeLogoUrl: '',
    storeBannerUrl: '',
    storeWebsite: '',
    storeContactPhone: '',
    storeEmail: '',
  });

  useEffect(() => {
    setForm({
      storeName: user?.storeName ?? '',
      storeSlug: user?.storeSlug ?? '',
      storeTagline: user?.storeTagline ?? '',
      storeDescription: user?.storeDescription ?? '',
      storeLogoUrl: user?.storeLogoUrl ?? '',
      storeBannerUrl: user?.storeBannerUrl ?? '',
      storeWebsite: user?.storeWebsite ?? '',
      storeContactPhone: user?.storeContactPhone ?? user?.contactPhone ?? '',
      storeEmail: user?.storeEmail ?? '',
    });
  }, [user]);

  const publicSlug = form.storeSlug.trim() || user?.id || '';
  const storeUrl = `${window.location.origin}/shop/${encodeURIComponent(publicSlug)}`;

  const updateField = (key: keyof typeof form, value: string) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const saveStore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const storeSlug = form.storeSlug.trim().toLowerCase();
    if (storeSlug && !/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/.test(storeSlug)) {
      toast.error('Store URL must be 3–32 lowercase letters, numbers, or hyphens');
      return;
    }
    if (![form.storeLogoUrl, form.storeBannerUrl, form.storeWebsite].every(isHttpUrl)) {
      toast.error('Store image and website URLs must use http or https');
      return;
    }

    setSaving(true);
    try {
      const { user: savedUser } = await realAuthAPI.updateProfile({
        ...form,
        storeName: form.storeName.trim(),
        storeSlug,
        storeTagline: form.storeTagline.trim(),
        storeDescription: form.storeDescription.trim(),
        storeLogoUrl: form.storeLogoUrl.trim(),
        storeBannerUrl: form.storeBannerUrl.trim(),
        storeWebsite: form.storeWebsite.trim(),
        storeContactPhone: form.storeContactPhone.trim(),
        storeEmail: form.storeEmail.trim(),
      });
      updateUser(savedUser);
      setForm(current => ({ ...current, storeSlug: savedUser.storeSlug ?? '' }));
      toast.success('Storefront saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save your storefront');
    } finally {
      setSaving(false);
    }
  };

  const copyStoreUrl = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error('Could not copy storefront link:', error);
      toast.error('Could not copy the store link');
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,.7fr)]">
      <form className={`${panelClass} space-y-4`} onSubmit={event => void saveStore(event)}>
        <div>
          <h2 className="text-base font-bold text-[#0F1923]">Store profile</h2>
          <p className="mt-1 text-sm text-[#6E7A8A]">Set up the public details buyers will see.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-[#52606D]">
            Store name
            <input maxLength={80} className={fieldClass} value={form.storeName} onChange={event => updateField('storeName', event.target.value)} placeholder={user?.name || 'Your shop name'} />
          </label>
          <label className="text-xs font-semibold text-[#52606D]">
            Store URL slug
            <input maxLength={32} className={fieldClass} value={form.storeSlug} onChange={event => updateField('storeSlug', event.target.value)} placeholder={user?.id || 'your-store-name'} />
          </label>
        </div>
        <label className="block text-xs font-semibold text-[#52606D]">
          Tagline
          <input maxLength={120} className={fieldClass} value={form.storeTagline} onChange={event => updateField('storeTagline', event.target.value)} placeholder="What makes your shop special?" />
        </label>
        <label className="block text-xs font-semibold text-[#52606D]">
          About your store
          <textarea maxLength={2000} rows={4} className={fieldClass} value={form.storeDescription} onChange={event => updateField('storeDescription', event.target.value)} placeholder="Tell buyers what you sell and how you work." />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-[#52606D]">
            Logo image URL
            <input maxLength={2048} type="url" className={fieldClass} value={form.storeLogoUrl} onChange={event => updateField('storeLogoUrl', event.target.value)} placeholder="https://…" />
          </label>
          <label className="text-xs font-semibold text-[#52606D]">
            Banner image URL
            <input maxLength={2048} type="url" className={fieldClass} value={form.storeBannerUrl} onChange={event => updateField('storeBannerUrl', event.target.value)} placeholder="https://…" />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-[#52606D]">
            Public contact phone
            <input maxLength={40} type="tel" className={fieldClass} value={form.storeContactPhone} onChange={event => updateField('storeContactPhone', event.target.value)} placeholder="Phone number" />
          </label>
          <label className="text-xs font-semibold text-[#52606D]">
            Public contact email
            <input maxLength={160} type="email" className={fieldClass} value={form.storeEmail} onChange={event => updateField('storeEmail', event.target.value)} placeholder="shop@example.com" />
          </label>
        </div>
        <label className="block text-xs font-semibold text-[#52606D]">
          Website
          <input maxLength={300} type="url" className={fieldClass} value={form.storeWebsite} onChange={event => updateField('storeWebsite', event.target.value)} placeholder="https://example.com" />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F0EBE1] pt-4">
          <p className="text-xs text-[#6E7A8A]">Only the contact details above are displayed publicly.</p>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#1A3353] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {saving && <LoaderCircle size={15} className="animate-spin" />} Save storefront
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <div className={`${panelClass} overflow-hidden p-0`}>
          <div
            className="h-28 bg-gradient-to-r from-[#1A3353] via-[#34516E] to-[#C9A96E] bg-cover bg-center"
            style={form.storeBannerUrl && isHttpUrl(form.storeBannerUrl) ? { backgroundImage: `linear-gradient(90deg, rgba(26,51,83,.48), rgba(52,81,110,.18)), url("${form.storeBannerUrl}")` } : undefined}
          />
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[#F0EBE1] font-bold text-[#1A3353]">
              {form.storeLogoUrl && isHttpUrl(form.storeLogoUrl)
                ? <img src={form.storeLogoUrl} alt="" className="h-full w-full object-cover" />
                : <Store size={19} />}
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold text-[#0F1923]">{form.storeName || user?.name || 'Your store'}</p>
              <p className="truncate text-xs text-[#6E7A8A]">{form.storeTagline || 'Storefront preview'}</p>
            </div>
          </div>
          <div className="space-y-3 px-4 pb-4">
            <p className="line-clamp-3 text-xs leading-5 text-[#6E7A8A]">{form.storeDescription || user?.bio || 'Your store description will appear here.'}</p>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-[#F8F6F1] p-3">
              <span className="min-w-0 truncate text-xs text-[#52606D]">{storeUrl}</span>
              <button type="button" onClick={() => void copyStoreUrl()} aria-label="Copy public store link" className="shrink-0 rounded-lg p-2 text-[#1A3353] hover:bg-white">
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>
            <a href={`/shop/${encodeURIComponent(publicSlug)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A3353] hover:underline">
              Preview public store <ExternalLink size={12} />
            </a>
          </div>
        </div>
        <div className={`${panelClass} flex gap-3`}>
          <Image size={17} className="mt-0.5 shrink-0 text-[#C9A96E]" />
          <p className="text-xs leading-5 text-[#6E7A8A]">Use direct image URLs for your logo and banner. Buyers only see the public store fields you save here.</p>
        </div>
      </div>
    </div>
  );
}

interface SellerLead {
  customer: { id: string; name: string; profileImageUrl?: string; createdAt: string };
  listing: UserListing;
}

export function SellerInboxPanel() {
  const { listings } = useUserListings();
  const { user } = useAuth();
  const { openChatWithListing } = useChatContext();
  const [leads, setLeads] = useState<SellerLead[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderLead, setOrderLead] = useState<SellerLead | null>(null);
  const [orderPrice, setOrderPrice] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      Promise.all(listings.map(async listing => {
        const engagement = await listingEngagementAPI.get(listing.id);
        return (engagement.customers ?? []).map(customer => ({ customer, listing }));
      })),
      sellerWorkspaceAPI.getOrders(),
    ])
      .then(([listingLeads, sellerOrders]) => {
        if (!active) return;
        const nextLeads = listingLeads.flat().sort((left, right) =>
          right.customer.createdAt.localeCompare(left.customer.createdAt),
        );
        setLeads(nextLeads);
        setOrders(sellerOrders);
      })
      .catch(loadError => {
        if (!active) return;
        const message = loadError instanceof Error ? loadError.message : 'Could not load customer inquiries';
        setError(message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [listings]);

  const beginOrder = (lead: SellerLead) => {
    const rawPrice = lead.listing.data?.price ?? lead.listing.data?.priceDisplay ?? 0;
    const parsedPrice = Number(String(rawPrice).replace(/[^\d.]/g, ''));
    setOrderPrice(Number.isFinite(parsedPrice) ? String(parsedPrice) : '0');
    setOrderLead(lead);
  };

  const createOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!orderLead) return;
    const price = Number(orderPrice);
    if (!Number.isFinite(price) || price < 0) {
      toast.error('Enter a valid order amount');
      return;
    }
    setCreatingOrder(true);
    try {
      const order = await sellerWorkspaceAPI.createOrder({
        listingId: orderLead.listing.id,
        buyerId: orderLead.customer.id,
        price,
      });
      setOrders(current => [order, ...current]);
      setOrderLead(null);
      toast.success('Order created');
    } catch (createError) {
      toast.error(createError instanceof Error ? createError.message : 'Could not create order');
    } finally {
      setCreatingOrder(false);
    }
  };

  const hasOpenOrder = (lead: SellerLead) => orders.some(order =>
    order.listingId === lead.listing.id && order.buyerId === lead.customer.id && order.status !== 'cancelled',
  );

  if (loading) return <div className={`${panelClass} py-12 text-center text-sm text-[#6E7A8A]`}>Loading customer inquiries…</div>;
  if (error) {
    return <div className={`${panelClass} py-10 text-center`}><p className="text-sm text-red-600">{error}</p></div>;
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#0F1923]">Customer inquiries</h2>
            <p className="mt-1 text-sm text-[#6E7A8A]">Messages of interest across your listings. Orders here are internal records, not payment or shipping confirmations.</p>
          </div>
          <span className="rounded-full bg-[#F0EBE1] px-3 py-1 text-xs font-semibold text-[#1A3353]">{leads.length} inquiries</span>
        </div>
        {leads.length ? leads.map(({ customer, listing }) => (
          <article key={`${listing.id}-${customer.id}`} className={`${panelClass} flex flex-wrap items-center gap-3`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F0EBE1] text-sm font-bold text-[#1A3353]">
              {customer.profileImageUrl ? <img src={customer.profileImageUrl} alt="" className="h-full w-full object-cover" /> : customer.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#0F1923]">{customer.name}</p>
              <p className="truncate text-xs text-[#6E7A8A]">Interested in {listing.data?.title ?? listing.data?.name ?? 'your listing'} · {new Date(customer.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openChatWithListing({
                  listingId: listing.id,
                  listingTitle: listing.data?.title ?? listing.data?.name ?? 'Your listing',
                  listingPrice: String(listing.data?.priceDisplay ?? listing.data?.price ?? ''),
                  listingImage: listing.data?.image,
                  listingCategory: listing.section,
                  sellerName: customer.name,
                  sellerId: customer.id,
                })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E2D8] px-3 py-2 text-xs font-semibold text-[#1A3353] hover:bg-[#F8F6F1]"
              >
                <MessageCircle size={14} /> Message
              </button>
              <button
                type="button"
                disabled={hasOpenOrder({ customer, listing })}
                onClick={() => beginOrder({ customer, listing })}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1A3353] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Package size={14} /> {hasOpenOrder({ customer, listing }) ? 'Order exists' : 'Create order'}
              </button>
            </div>
          </article>
        )) : (
          <div className={`${panelClass} py-12 text-center`}>
            <UserRound size={25} className="mx-auto text-[#C9A96E]" />
            <p className="mt-3 text-sm font-semibold text-[#0F1923]">No inquiries yet</p>
            <p className="mt-1 text-xs text-[#6E7A8A]">When buyers contact you about a listing, they’ll appear here.</p>
          </div>
        )}
      </div>

      {orderLead && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget && !creatingOrder) setOrderLead(null);
        }}>
          <form onSubmit={event => void createOrder(event)} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="create-order-title">
            <div>
              <h2 id="create-order-title" className="text-lg font-bold text-[#0F1923]">Create order record</h2>
              <p className="mt-1 text-sm text-[#6E7A8A]">{orderLead.customer.name} · {orderLead.listing.data?.title ?? orderLead.listing.data?.name}</p>
            </div>
            <label className="block text-sm font-semibold text-[#52606D]">
              Agreed amount
              <input required min="0" step="0.01" type="number" value={orderPrice} onChange={event => setOrderPrice(event.target.value)} className={fieldClass} />
            </label>
            <p className="text-xs leading-5 text-[#6E7A8A]">This records an agreement for your seller workspace. It does not collect payment or arrange delivery.</p>
            <div className="flex justify-end gap-2">
              <button type="button" disabled={creatingOrder} onClick={() => setOrderLead(null)} className="rounded-xl border border-[#E8E2D8] px-4 py-2 text-sm font-semibold text-[#52606D]">Cancel</button>
              <button type="submit" disabled={creatingOrder} className="rounded-xl bg-[#1A3353] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{creatingOrder ? 'Creating…' : 'Create order'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

const orderNext: Partial<Record<SellerOrderStatus, { status: SellerOrderStatus; label: string }>> = {
  new: { status: 'confirmed', label: 'Confirm order' },
  confirmed: { status: 'fulfilled', label: 'Mark fulfilled' },
};

export function SellerOrdersPanel() {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    sellerWorkspaceAPI.getOrders()
      .then(result => { if (active) setOrders(result); })
      .catch(loadError => { if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load orders'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const changeStatus = async (order: SellerOrder, status: SellerOrderStatus) => {
    setUpdating(order.id);
    try {
      const updated = await sellerWorkspaceAPI.updateOrderStatus(order.id, status);
      setOrders(current => current.map(item => item.id === updated.id ? updated : item));
      toast.success(`Order marked ${status}`);
    } catch (updateError) {
      toast.error(updateError instanceof Error ? updateError.message : 'Could not update order');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className={`${panelClass} py-12 text-center text-sm text-[#6E7A8A]`}>Loading orders…</div>;
  if (error) return <div className={`${panelClass} py-10 text-center text-sm text-red-600`}>{error}</div>;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-[#0F1923]">Orders</h2>
        <p className="mt-1 text-sm text-[#6E7A8A]">Track order agreements from new to fulfilled. Payments and shipping are handled outside this workspace.</p>
      </div>
      {orders.length ? orders.map(order => {
        const next = orderNext[order.status];
        return (
          <article key={order.id} className={`${panelClass} flex flex-wrap items-center gap-4`}>
            {order.listingImage
              ? <img src={order.listingImage} alt="" className="h-14 w-14 rounded-xl object-cover" />
              : <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#F0EBE1]"><Package size={20} className="text-[#C9A96E]" /></div>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#0F1923]">{order.listingTitle}</p>
              <p className="mt-1 text-xs text-[#6E7A8A]">{order.buyerName} · {new Date(order.createdAt).toLocaleDateString()}</p>
              <p className="mt-1 text-sm font-semibold text-[#1A3353]">{order.price.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</p>
            </div>
            <span className="rounded-full bg-[#F0EBE1] px-3 py-1 text-xs font-semibold capitalize text-[#1A3353]">{order.status}</span>
            {next && (
              <button type="button" disabled={updating === order.id} onClick={() => void changeStatus(order, next.status)} className="rounded-xl bg-[#1A3353] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                {updating === order.id ? 'Saving…' : next.label}
              </button>
            )}
            {order.status === 'new' || order.status === 'confirmed' ? (
              <button type="button" disabled={updating === order.id} onClick={() => void changeStatus(order, 'cancelled')} className="rounded-xl border border-[#FECACA] px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">
                Cancel
              </button>
            ) : null}
          </article>
        );
      }) : (
        <div className={`${panelClass} py-12 text-center`}>
          <Package size={25} className="mx-auto text-[#C9A96E]" />
          <p className="mt-3 text-sm font-semibold text-[#0F1923]">No orders yet</p>
          <p className="mt-1 text-xs text-[#6E7A8A]">Create an order record from a customer inquiry.</p>
        </div>
      )}
    </div>
  );
}

export function SellerAnalyticsPanel() {
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    sellerWorkspaceAPI.getAnalytics()
      .then(result => { if (active) setAnalytics(result); })
      .catch(loadError => { if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load analytics'); });
    return () => { active = false; };
  }, []);

  if (error) return <div className={`${panelClass} py-10 text-center text-sm text-red-600`}>{error}</div>;
  if (!analytics) return <div className={`${panelClass} py-12 text-center text-sm text-[#6E7A8A]`}>Loading analytics…</div>;

  const maximum = Math.max(1, ...analytics.daily.map(day => day.views + day.inquiries));
  const recentDays = analytics.daily.slice(-14);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-[#0F1923]">Listing performance</h2>
        <p className="mt-1 text-sm text-[#6E7A8A]">Unique signed-in viewers and buyer actions over the last {analytics.periodDays} days.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Listing views', value: analytics.totals.views, icon: Search },
          { label: 'Inquiries', value: analytics.totals.inquiries, icon: MessageCircle },
          { label: 'Saves', value: analytics.totals.saves, icon: Tag },
          { label: 'Shares', value: analytics.totals.shares, icon: ArrowUpRight },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className={panelClass}>
            <div className="flex items-center justify-between text-sm text-[#6E7A8A]"><span>{label}</span><Icon size={16} className="text-[#C9A96E]" /></div>
            <p className="mt-2 text-2xl font-bold text-[#0F1923]">{value}</p>
          </div>
        ))}
      </div>
      <div className={panelClass}>
        <div className="flex items-center justify-between">
          <div><h3 className="text-sm font-bold text-[#0F1923]">Daily activity</h3><p className="mt-1 text-xs text-[#6E7A8A]">Last 14 days · views and inquiries</p></div>
          <BarChart3 size={18} className="text-[#C9A96E]" />
        </div>
        <div className="mt-5 grid h-40 grid-cols-[repeat(14,minmax(0,1fr))] items-end gap-1 sm:gap-2">
          {recentDays.map(day => (
            <div key={day.date} className="flex h-full flex-col items-center justify-end gap-1" title={`${day.date}: ${day.views} views, ${day.inquiries} inquiries`}>
              <div className="flex w-full flex-1 items-end justify-center gap-0.5">
                <div className="min-h-0.5 w-1/2 rounded-t bg-[#1A3353]" style={{ height: `${(day.views / maximum) * 100}%` }} />
                <div className="min-h-0.5 w-1/2 rounded-t bg-[#C9A96E]" style={{ height: `${(day.inquiries / maximum) * 100}%` }} />
              </div>
              <span className="text-[9px] text-[#6E7A8A]">{new Date(`${day.date}T12:00:00`).getDate()}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-[11px] text-[#6E7A8A]">
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#1A3353]" />Views</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#C9A96E]" />Inquiries</span>
        </div>
      </div>
      <div className={panelClass}>
        <h3 className="text-sm font-bold text-[#0F1923]">Top listings</h3>
        {analytics.topListings.length ? (
          <div className="mt-3 divide-y divide-[#F0EBE1]">
            {analytics.topListings.map(listing => (
              <div key={listing.listingId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[#0F1923]">{listing.title}</p>
                <p className="text-xs text-[#6E7A8A]">{listing.views} views · {listing.inquiries} inquiries · {listing.saves} saves · {listing.shares} shares</p>
              </div>
            ))}
          </div>
        ) : <p className="mt-3 text-sm text-[#6E7A8A]">Your listings haven’t received activity in this period.</p>}
      </div>
    </div>
  );
}

export function SellerPromotionsPanel() {
  const { listings, setListingPromotion } = useUserListings();
  const [updating, setUpdating] = useState<string | null>(null);
  const now = Date.now();
  const toggle = async (listing: UserListing) => {
    const active = Boolean(listing.promotionEndAt && new Date(listing.promotionEndAt).getTime() > Date.now());
    setUpdating(listing.id);
    try {
      await setListingPromotion(listing.id, !active);
      toast.success(active ? 'Feature removed' : 'Listing featured for 7 days');
    } finally {
      setUpdating(null);
    }
  };

  const active = listings.filter(listing => listing.status === 'active');
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-[#0F1923]">Listing promotions</h2>
        <p className="mt-1 text-sm text-[#6E7A8A]">Feature an active listing for seven days. Featured listings appear ahead of standard listings. Billing is not connected.</p>
      </div>
      {active.length ? active.map(listing => {
        const isFeatured = Boolean(listing.promotionEndAt && new Date(listing.promotionEndAt).getTime() > now);
        return (
          <article key={listing.id} className={`${panelClass} flex flex-wrap items-center gap-3`}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#0F1923]">{listing.data?.title ?? listing.data?.name ?? 'Listing'}</p>
              <p className="mt-1 text-xs text-[#6E7A8A]">
                {isFeatured ? `Featured through ${new Date(listing.promotionEndAt!).toLocaleDateString()}` : 'Standard visibility'}
              </p>
            </div>
            <button type="button" disabled={updating === listing.id} onClick={() => void toggle(listing)} className={`rounded-xl px-3 py-2 text-xs font-semibold ${isFeatured ? 'border border-[#E8E2D8] text-[#52606D]' : 'bg-[#1A3353] text-white'} disabled:opacity-60`}>
              {updating === listing.id ? 'Saving…' : isFeatured ? 'Remove feature' : 'Feature for 7 days'}
            </button>
          </article>
        );
      }) : <div className={`${panelClass} py-10 text-center text-sm text-[#6E7A8A]`}>Publish an active listing to feature it here.</div>}
    </div>
  );
}

export function SellerWorkspaceOverview({ analytics, onOpen }: {
  analytics?: SellerAnalytics | null;
  onOpen: (view: 'listings' | 'storefront' | 'inquiries' | 'orders' | 'analytics' | 'promotions') => void;
}) {
  const { user } = useAuth();
  const { listings } = useUserListings();
  const [performance, setPerformance] = useState<SellerAnalytics | null>(analytics ?? null);
  useEffect(() => {
    if (analytics) return;
    let active = true;
    sellerWorkspaceAPI.getAnalytics()
      .then(result => { if (active) setPerformance(result); })
      .catch(error => console.error('Could not load seller overview analytics:', error));
    return () => { active = false; };
  }, [analytics]);
  const activeCount = listings.filter(listing => listing.status === 'active').length;
  const featuredCount = listings.filter(listing => listing.promotionEndAt && new Date(listing.promotionEndAt).getTime() > Date.now()).length;
  const cards = useMemo(() => [
    { label: 'Active listings', value: activeCount, action: () => onOpen('listings'), icon: Package },
    { label: 'Views · 30 days', value: performance?.totals.views ?? '—', action: () => onOpen('analytics'), icon: Search },
    { label: 'Inquiries · 30 days', value: performance?.totals.inquiries ?? '—', action: () => onOpen('inquiries'), icon: MessageCircle },
    { label: 'Featured listings', value: featuredCount, action: () => onOpen('promotions'), icon: Tag },
  ], [activeCount, performance, featuredCount, onOpen]);

  return (
    <div className="space-y-5">
      <div className={`${panelClass} flex flex-wrap items-center justify-between gap-4`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#C9A96E]">Welcome back</p>
          <h2 className="mt-1 text-xl font-bold text-[#0F1923]">{user?.storeName || user?.name || 'Seller'}</h2>
          <p className="mt-1 text-sm text-[#6E7A8A]">{user?.storeTagline || 'Your business at a glance'}</p>
        </div>
        <button type="button" onClick={() => onOpen('storefront')} className="inline-flex items-center gap-2 rounded-xl border border-[#E8E2D8] px-3 py-2 text-sm font-semibold text-[#1A3353] hover:bg-[#F8F6F1]">
          <Store size={15} /> Manage storefront
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, action, icon: Icon }) => (
          <button key={label} type="button" onClick={action} className={`${panelClass} text-left transition-shadow hover:shadow-md`}>
            <div className="flex items-center justify-between text-sm text-[#6E7A8A]"><span>{label}</span><Icon size={16} className="text-[#C9A96E]" /></div>
            <p className="mt-2 text-2xl font-bold text-[#0F1923]">{value}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <button type="button" onClick={() => onOpen('inquiries')} className={`${panelClass} flex items-center justify-between gap-3 text-left hover:shadow-md`}>
          <div><h3 className="text-sm font-bold text-[#0F1923]">Customer inbox</h3><p className="mt-1 text-xs text-[#6E7A8A]">Review inquiries and message interested buyers.</p></div>
          <ArrowUpRight size={17} className="shrink-0 text-[#C9A96E]" />
        </button>
        <button type="button" onClick={() => onOpen('orders')} className={`${panelClass} flex items-center justify-between gap-3 text-left hover:shadow-md`}>
          <div><h3 className="text-sm font-bold text-[#0F1923]">Order tracking</h3><p className="mt-1 text-xs text-[#6E7A8A]">Manage your order records from confirmation to fulfillment.</p></div>
          <ArrowUpRight size={17} className="shrink-0 text-[#C9A96E]" />
        </button>
      </div>
    </div>
  );
}
