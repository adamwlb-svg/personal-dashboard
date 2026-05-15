"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createContact, updateContact, deleteContact } from "@/app/health/actions";

export type SerializedContact = {
  id: number;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
};

const ROLES = [
  { value: "Primary Care",       emoji: "🩺" },
  { value: "Dermatologist",      emoji: "🔬" },
  { value: "Therapist",          emoji: "🧠" },
  { value: "Psychiatrist",       emoji: "🧠" },
  { value: "Dentist",            emoji: "🦷" },
  { value: "Optometrist",        emoji: "👁️" },
  { value: "Physical Therapist", emoji: "🏃" },
  { value: "Pharmacist",         emoji: "💊" },
  { value: "Cardiologist",       emoji: "❤️" },
  { value: "Orthopedist",        emoji: "🦴" },
  { value: "Nutritionist",       emoji: "🥗" },
  { value: "Emergency Contact",  emoji: "🆘" },
  { value: "Other",              emoji: "👤" },
];

function getRoleEmoji(role: string) {
  return ROLES.find((r) => r.value === role)?.emoji ?? "👤";
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function ContactModal({
  contact,
  onClose,
}: {
  contact?: SerializedContact | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEditing = !!contact;

  const [name,    setName]    = useState(contact?.name    ?? "");
  const [role,    setRole]    = useState(contact?.role    ?? "Primary Care");
  const [phone,   setPhone]   = useState(contact?.phone   ?? "");
  const [email,   setEmail]   = useState(contact?.email   ?? "");
  const [address, setAddress] = useState(contact?.address ?? "");
  const [notes,   setNotes]   = useState(contact?.notes   ?? "");
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const data = {
      name: name.trim(),
      role,
      phone:   phone.trim()   || undefined,
      email:   email.trim()   || undefined,
      address: address.trim() || undefined,
      notes:   notes.trim()   || undefined,
    };
    if (isEditing) await updateContact(contact.id, data);
    else           await createContact(data);
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!contact) return;
    setDeleting(true);
    await deleteContact(contact.id);
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-surface-raised border border-surface-border rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-semibold text-fg">
            {isEditing ? "Edit Contact" : "Add Contact"}
          </h2>
          <button onClick={onClose} className="text-fg-3 hover:text-fg-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Name */}
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-fg placeholder-fg-4 focus:outline-none focus:border-accent"
          />

          {/* Role */}
          <div>
            <label className="text-xs text-fg-3 mb-1.5 block">Role / Specialty</label>
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1
                    ${role === r.value
                      ? "bg-accent/15 text-accent border-accent/40"
                      : "bg-surface border-surface-border text-fg-3 hover:border-gray-500"}`}
                >
                  <span>{r.emoji}</span> {r.value}
                </button>
              ))}
            </div>
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-fg-3 mb-1 block">Phone</label>
              <input
                type="tel"
                placeholder="(555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-fg text-sm placeholder-fg-4 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs text-fg-3 mb-1 block">Email</label>
              <input
                type="email"
                placeholder="doctor@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-fg text-sm placeholder-fg-4 focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-xs text-fg-3 mb-1 block">Address / Clinic</label>
            <input
              type="text"
              placeholder="123 Main St, City, State"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-fg text-sm placeholder-fg-4 focus:outline-none focus:border-accent"
            />
          </div>

          {/* Notes */}
          <textarea
            placeholder="Notes (insurance, portal link, preferred times…)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-fg placeholder-fg-4 focus:outline-none focus:border-accent text-sm resize-none"
          />

          <div className="flex items-center gap-2 pt-1">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-fg-2 hover:text-fg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-fg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : isEditing ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Contact Card ───────────────────────────────────────────────────────────────

function ContactCard({ contact, onEdit }: { contact: SerializedContact; onEdit: () => void }) {
  const emoji = getRoleEmoji(contact.role);

  return (
    <div className="bg-surface border border-surface-border rounded-xl p-4 flex flex-col gap-3 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-base flex-shrink-0">
            {emoji}
          </div>
          <div>
            <p className="text-sm font-semibold text-fg leading-tight">{contact.name}</p>
            <p className="text-xs text-accent">{contact.role}</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="text-fg-3 hover:text-fg-2 transition-colors flex-shrink-0"
          aria-label="Edit contact"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      {/* Contact details */}
      <div className="space-y-1.5">
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-2 text-xs text-fg-2 hover:text-fg transition-colors group"
          >
            <svg className="w-3 h-3 text-fg-3 group-hover:text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {contact.phone}
          </a>
        )}
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-2 text-xs text-fg-2 hover:text-fg transition-colors group truncate"
          >
            <svg className="w-3 h-3 text-fg-3 group-hover:text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{contact.email}</span>
          </a>
        )}
        {contact.address && (
          <div className="flex items-start gap-2 text-xs text-fg-3">
            <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="leading-tight">{contact.address}</span>
          </div>
        )}
        {contact.notes && (
          <p className="text-xs text-fg-3 italic leading-snug pt-0.5 border-t border-surface-border">
            {contact.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function KeyContacts({ contacts }: { contacts: SerializedContact[] }) {
  const [modal, setModal] = useState<{ open: boolean; contact?: SerializedContact | null }>({ open: false });

  return (
    <>
      <div className="bg-surface-raised border border-surface-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
            <span>📇</span> Key Contacts
          </h3>
          <button
            onClick={() => setModal({ open: true, contact: null })}
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Contact
          </button>
        </div>

        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-2xl mb-2">📇</p>
            <p className="text-sm text-fg-2 font-medium">No contacts yet</p>
            <p className="text-xs text-fg-3 mt-1 mb-4">
              Save your doctors, therapists, and other health providers in one place.
            </p>
            <button
              onClick={() => setModal({ open: true, contact: null })}
              className="text-xs text-accent hover:underline"
            >
              Add your first contact →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {contacts.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                onEdit={() => setModal({ open: true, contact: c })}
              />
            ))}
          </div>
        )}
      </div>

      {modal.open && (
        <ContactModal contact={modal.contact} onClose={() => setModal({ open: false })} />
      )}
    </>
  );
}
