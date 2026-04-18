'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus } from 'lucide-react';
import { saveSection, saveContactMethods, saveNavigation } from '@/app/admin/pages/actions';
import { MegaEditorDnd } from '@/components/admin/mega-editor-dnd';
import { ImageUpload } from '@/components/admin/image-upload';
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

type Tab = 'home' | 'global' | 'about' | 'contact' | 'nav' | 'mega';

type MegaSection = { section_heading: string; items: Array<{ product_slug: string; label: string }> };

export function PagesCmsEditor({
  sections,
  contacts,
  nav,
  megaByKey,
  products,
}: {
  sections: Record<string, any[]>;
  contacts: any[];
  nav: any[];
  megaByKey: Record<string, MegaSection[]>;
  products: Array<{ slug: string; name: string }>;
}) {
  const [tab, setTab] = useState<Tab>('home');

  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-neutral-200">
        {(['home', 'global', 'about', 'contact', 'nav', 'mega'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t px-4 py-2 text-xs font-bold transition-colors ${
              tab === t ? 'bg-ink text-white' : 'text-neutral-600 hover:text-ink'
            }`}
          >
            {t === 'home' && 'Home sections'}
            {t === 'global' && 'Global (announce + footer)'}
            {t === 'about' && 'About page'}
            {t === 'contact' && 'Contact methods'}
            {t === 'nav' && 'Navigation'}
            {t === 'mega' && 'Mega menu dropdowns'}
          </button>
        ))}
      </div>

      {tab === 'home' && (
        <div className="space-y-6">
          <SectionEditor
            pageKey="home"
            sectionKey="pain"
            title="Pain points"
            hint="Customer quotes on the homepage (dark section)."
            initial={sections['home:pain'] ?? []}
            fields={[
              { key: 'q', label: 'Quote', type: 'text' },
              { key: 'a', label: 'Answer', type: 'text' },
            ]}
          />
          <SectionEditor
            pageKey="home"
            sectionKey="steps"
            title="How it works steps"
            hint="The 4-step process grid."
            initial={sections['home:steps'] ?? []}
            fields={[
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'desc', label: 'Description', type: 'textarea' },
            ]}
          />
          <SectionEditor
            pageKey="home"
            sectionKey="why"
            title="Why us bullets (legacy)"
            hint="Legacy section for the old homepage. Not shown on v4."
            initial={sections['home:why'] ?? []}
            fields={[
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'desc', label: 'Description', type: 'textarea' },
            ]}
          />

          <SectionHeader label="v4 sections" />

          <SectionEditor
            pageKey="home"
            sectionKey="hero.split"
            title="Split hero (Print | Gifts)"
            hint="Two items — one per side. side=print or side=gifts."
            initial={sections['home:hero.split'] ?? []}
            fields={[
              { key: 'side', label: 'side (print | gifts)', type: 'text' },
              { key: 'kicker', label: 'Kicker (small label above headline)', type: 'text' },
              { key: 'headline', label: 'Headline (first line)', type: 'text' },
              { key: 'headline_accent', label: 'Headline accent (second line, coloured)', type: 'text' },
              { key: 'body', label: 'Body copy', type: 'textarea' },
              { key: 'cta_label', label: 'CTA label', type: 'text' },
              { key: 'cta_href', label: 'CTA URL', type: 'text' },
              { key: 'image_url', label: 'Image (URL or upload)', type: 'image' },
            ]}
          />

          <SectionEditor
            pageKey="home"
            sectionKey="ticker"
            title="Ticker marquee"
            hint="Horizontal scrolling labels (magenta bar)."
            initial={sections['home:ticker'] ?? []}
            fields={[{ key: 'text', label: 'Text', type: 'text' }]}
          />

          <SectionEditor
            pageKey="home"
            sectionKey="why.cards"
            title="Why cards (3)"
            hint="Three numbered brutalist why cards on cream background."
            initial={sections['home:why.cards'] ?? []}
            fields={[
              { key: 'num', label: 'Number (01, 02, 03)', type: 'text' },
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'body', label: 'Body', type: 'textarea' },
            ]}
          />

          <SectionEditor
            pageKey="home"
            sectionKey="proof.main"
            title="Proof — quote + stats"
            hint="Set kind=quote with text+cite, OR kind=stat with num, suffix, label."
            initial={sections['home:proof.main'] ?? []}
            fields={[
              { key: 'kind', label: 'Kind (quote | stat)', type: 'text' },
              { key: 'text', label: 'Quote text (if kind=quote)', type: 'textarea' },
              { key: 'cite', label: 'Attribution (if kind=quote)', type: 'text' },
              { key: 'num', label: 'Stat number (if kind=stat)', type: 'text' },
              { key: 'suffix', label: 'Stat suffix e.g. + or yrs (if kind=stat)', type: 'text' },
              { key: 'label', label: 'Stat label (if kind=stat)', type: 'text' },
            ]}
          />

          <SectionEditor
            pageKey="home"
            sectionKey="how.header"
            title="How it works header"
            hint="Left-column headline + CTA for the How it works section."
            initial={sections['home:how.header'] ?? []}
            fields={[
              { key: 'headline', label: 'Headline', type: 'text' },
              { key: 'headline_accent', label: 'Headline accent (last word, magenta)', type: 'text' },
              { key: 'body', label: 'Body', type: 'textarea' },
              { key: 'cta_label', label: 'CTA label', type: 'text' },
              { key: 'cta_href', label: 'CTA URL', type: 'text' },
            ]}
          />

          <SectionEditor
            pageKey="home"
            sectionKey="how.steps"
            title="How it works — step list"
            hint="Numbered steps shown to the right of the header."
            initial={sections['home:how.steps'] ?? []}
            fields={[
              { key: 'num', label: 'Number', type: 'text' },
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'body', label: 'Description', type: 'textarea' },
              { key: 'time', label: 'Time chip e.g. ~2 min', type: 'text' },
            ]}
          />

          <SectionEditor
            pageKey="home"
            sectionKey="faq.items"
            title="FAQ"
            hint="Accordion FAQs on the homepage."
            initial={sections['home:faq.items'] ?? []}
            fields={[
              { key: 'question', label: 'Question', type: 'text' },
              { key: 'answer', label: 'Answer', type: 'textarea' },
            ]}
          />

          <SectionEditor
            pageKey="home"
            sectionKey="location.main"
            title="Location details"
            hint="Address / hours / phone / email / MRT rows."
            initial={sections['home:location.main'] ?? []}
            fields={[
              { key: 'kind', label: 'Kind (address | hours | phone | email | mrt)', type: 'text' },
              { key: 'label', label: 'Row label', type: 'text' },
              { key: 'detail', label: 'Detail (supports \\n for line breaks)', type: 'textarea' },
              { key: 'href', label: 'Optional link (tel: / mailto: / https:)', type: 'text' },
            ]}
          />

          <SectionEditor
            pageKey="home"
            sectionKey="final_cta.main"
            title="Final CTA band"
            hint="Magenta band at the bottom of the homepage."
            initial={sections['home:final_cta.main'] ?? []}
            fields={[
              { key: 'headline', label: 'Headline', type: 'text' },
              { key: 'headline_accent', label: 'Headline accent (yellow)', type: 'text' },
              { key: 'body', label: 'Body', type: 'textarea' },
              { key: 'cta_label', label: 'CTA label', type: 'text' },
              { key: 'cta_href', label: 'CTA URL', type: 'text' },
            ]}
          />

          <div className="rounded border-2 border-dashed border-neutral-300 bg-neutral-50 p-4 text-xs text-neutral-600">
            <b className="text-ink">Category tiles</b> (the Print / Gifts tabs) use nested arrays and are not
            yet editable from this screen. To change which products are featured, edit{' '}
            <code className="rounded bg-white px-1 py-0.5">page_content</code> where{' '}
            <code className="rounded bg-white px-1 py-0.5">page_key=&#39;home&#39;</code> and{' '}
            <code className="rounded bg-white px-1 py-0.5">section_key=&#39;categories.tabs&#39;</code> via Supabase Studio.
          </div>
        </div>
      )}

      {tab === 'global' && (
        <div className="space-y-6">
          <SectionEditor
            pageKey="global"
            sectionKey="announce"
            title="Announcement bar"
            hint="Thin strip at the very top of every site page."
            initial={sections['global:announce'] ?? []}
            fields={[
              { key: 'text', label: 'Text', type: 'text' },
              { key: 'bold_part', label: 'Substring to colour yellow (optional)', type: 'text' },
            ]}
          />
          <SectionEditor
            pageKey="global"
            sectionKey="footer.brand"
            title="Footer brand tagline"
            hint="Single paragraph shown under the wordmark in the footer."
            initial={sections['global:footer.brand'] ?? []}
            fields={[{ key: 'tagline', label: 'Tagline', type: 'textarea' }]}
          />
          <SectionEditor
            pageKey="global"
            sectionKey="footer.company"
            title="Footer — Company column"
            hint="Left footer link column."
            initial={sections['global:footer.company'] ?? []}
            fields={[
              { key: 'label', label: 'Link label', type: 'text' },
              { key: 'href', label: 'Link URL', type: 'text' },
            ]}
          />
          <SectionEditor
            pageKey="global"
            sectionKey="footer.support"
            title="Footer — Support column"
            hint="Middle footer link column."
            initial={sections['global:footer.support'] ?? []}
            fields={[
              { key: 'label', label: 'Link label', type: 'text' },
              { key: 'href', label: 'Link URL', type: 'text' },
            ]}
          />
          <SectionEditor
            pageKey="global"
            sectionKey="footer.visit"
            title="Footer — Visit the shop column"
            hint="Address, hours, email, phone."
            initial={sections['global:footer.visit'] ?? []}
            fields={[
              { key: 'kind', label: 'Kind (address|hours|email|phone)', type: 'text' },
              { key: 'label', label: 'Label / heading', type: 'text' },
              { key: 'detail', label: 'Detail (supports \\n)', type: 'textarea' },
              { key: 'href', label: 'Optional link (tel: / mailto: / https:)', type: 'text' },
            ]}
          />
          <SectionEditor
            pageKey="global"
            sectionKey="footer.social"
            title="Footer — Socials"
            hint="2-letter label + URL for each social pill."
            initial={sections['global:footer.social'] ?? []}
            fields={[
              { key: 'label', label: 'Pill label e.g. IG, WA', type: 'text' },
              { key: 'href', label: 'Link URL', type: 'text' },
              { key: 'aria', label: 'Aria label', type: 'text' },
            ]}
          />
        </div>
      )}

      {tab === 'about' && (
        <div className="space-y-6">
          <SectionEditor
            pageKey="about"
            sectionKey="hero"
            title="Hero"
            hint="The big banner at the top of /about — tag, headline, subtitle, and 4 stats."
            initial={sections['about:hero'] ?? []}
            fields={[
              { key: 'tag', label: 'Tag (small uppercase above h1)', type: 'text' },
              { key: 'h1', label: 'Headline', type: 'textarea' },
              { key: 'sub', label: 'Subtitle', type: 'textarea' },
              { key: 'stat1_n', label: 'Stat 1 — Number', type: 'text' },
              { key: 'stat1_l', label: 'Stat 1 — Label', type: 'text' },
              { key: 'stat2_n', label: 'Stat 2 — Number', type: 'text' },
              { key: 'stat2_l', label: 'Stat 2 — Label', type: 'text' },
              { key: 'stat3_n', label: 'Stat 3 — Number', type: 'text' },
              { key: 'stat3_l', label: 'Stat 3 — Label', type: 'text' },
              { key: 'stat4_n', label: 'Stat 4 — Number', type: 'text' },
              { key: 'stat4_l', label: 'Stat 4 — Label', type: 'text' },
            ]}
          />
          <SectionEditor
            pageKey="about"
            sectionKey="story"
            title="Our Story"
            hint="Tag, headline, and story paragraphs."
            initial={sections['about:story'] ?? []}
            fields={[
              { key: 'tag', label: 'Tag', type: 'text' },
              { key: 'h2', label: 'Headline', type: 'textarea' },
              { key: 'para1', label: 'Paragraph 1', type: 'textarea' },
              { key: 'para2', label: 'Paragraph 2', type: 'textarea' },
              { key: 'para3', label: 'Paragraph 3', type: 'textarea' },
            ]}
          />
          <SectionEditor
            pageKey="about"
            sectionKey="values"
            title="Company values"
            hint="About page 'What we value' cards."
            initial={sections['about:values'] ?? []}
            fields={[
              { key: 'image_url', label: 'Icon image', type: 'image' },
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'desc', label: 'Description', type: 'textarea' },
            ]}
          />
          <SectionEditor
            pageKey="about"
            sectionKey="clients"
            title="Client types"
            hint="About page 'Who we serve' cards."
            initial={sections['about:clients'] ?? []}
            fields={[
              { key: 'image_url', label: 'Icon image', type: 'image' },
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'desc', label: 'Description', type: 'textarea' },
            ]}
          />
          <SectionEditor
            pageKey="about"
            sectionKey="cta"
            title="Bottom CTA strip"
            hint="Walk-in / contact block at the bottom of /about."
            initial={sections['about:cta'] ?? []}
            fields={[
              { key: 'h2', label: 'Headline', type: 'text' },
              { key: 'p', label: 'Paragraph', type: 'textarea' },
              { key: 'btn1_label', label: 'Button 1 label', type: 'text' },
              { key: 'btn1_href', label: 'Button 1 URL', type: 'text' },
              { key: 'btn2_label', label: 'Button 2 label', type: 'text' },
              { key: 'btn2_href', label: 'Button 2 URL', type: 'text' },
            ]}
          />
        </div>
      )}

      {tab === 'contact' && (
        <ContactEditor initial={contacts} />
      )}

      {tab === 'nav' && (
        <NavEditor initial={nav} />
      )}

      {tab === 'mega' && (
        <div className="space-y-6">
          <MegaEditor menuKey="print" heading="Print dropdown" initial={megaByKey.print ?? []} products={products} />
          <MegaEditor menuKey="gifts" heading="Gifts dropdown" initial={megaByKey.gifts ?? []} products={products} />
        </div>
      )}
    </div>
  );
}

function MegaEditor(props: {
  menuKey: string; heading: string; initial: MegaSection[];
  products: Array<{ slug: string; name: string }>;
}) {
  return <MegaEditorDnd {...props} />;
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="mt-4 border-t border-neutral-200 pt-4 text-[10px] font-black uppercase tracking-[0.2em] text-pink">
      {label}
    </div>
  );
}

type FieldDef = { key: string; label: string; type: 'text' | 'textarea' | 'image' };

function SectionEditor({ pageKey, sectionKey, title, hint, initial, fields }: {
  pageKey: string; sectionKey: string; title: string; hint: string;
  initial: any[]; fields: FieldDef[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<any[]>(initial);
  const [status, setStatus] = useState<string | null>(null);

  function save() {
    setStatus(null);
    startTransition(async () => {
      const result = await saveSection({ page_key: pageKey, section_key: sectionKey, items });
      if (result.ok) {
        setStatus('✓ Saved');
        setTimeout(() => setStatus(null), 2000);
        router.refresh();
      } else setStatus('✗ ' + (result.error ?? 'Failed'));
    });
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-ink">{title}</h2>
          <p className="text-xs text-neutral-500">{hint}</p>
        </div>
        <button onClick={save} disabled={isPending}
          className="rounded-full bg-pink px-4 py-1.5 text-xs font-bold text-white hover:bg-pink-dark disabled:opacity-50">
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="rounded border-2 border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
            No items yet.
          </div>
        )}
        {items.map((item, i) => (
          <div key={i} className="rounded border border-neutral-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500">Item {i + 1}</span>
              <button onClick={() => setItems(items.filter((_, j) => j !== i))}
                className="text-red-600 hover:text-red-700"><Trash2 size={14} /></button>
            </div>
            {fields.map((f) => (
              <div key={f.key} className="mb-2">
                <label className="text-[11px] font-bold text-neutral-500">{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea
                    value={item[f.key] ?? ''}
                    onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, [f.key]: e.target.value } : x))}
                    rows={2}
                    className={inputCls}
                  />
                ) : f.type === 'image' ? (
                  <ImageUpload
                    value={item[f.key] ?? ''}
                    onChange={(url) => setItems(items.map((x, j) => j === i ? { ...x, [f.key]: url } : x))}
                    prefix={`${pageKey}-${sectionKey}-${f.key}`}
                    aspect={1}
                    size="sm"
                    label={f.label}
                  />
                ) : (
                  <input
                    value={item[f.key] ?? ''}
                    onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, [f.key]: e.target.value } : x))}
                    className={inputCls}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button onClick={() => setItems([...items, Object.fromEntries(fields.map((f) => [f.key, '']))])}
          className="flex items-center gap-1 rounded border border-neutral-200 px-3 py-1 text-xs font-bold text-ink hover:border-ink">
          <Plus size={12} /> Add item
        </button>
        {status && <span className="text-xs">{status}</span>}
      </div>
    </section>
  );
}

function ContactEditor({ initial }: { initial: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [methods, setMethods] = useState<any[]>(initial);
  const [status, setStatus] = useState<string | null>(null);

  function save() {
    setStatus(null);
    startTransition(async () => {
      const result = await saveContactMethods(methods);
      if (result.ok) {
        setStatus('✓ Saved');
        setTimeout(() => setStatus(null), 2000);
        router.refresh();
      } else setStatus('✗ ' + (result.error ?? 'Failed'));
    });
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-ink">Contact methods</h2>
          <p className="text-xs text-neutral-500">Shown in footer + /contact page.</p>
        </div>
        <button onClick={save} disabled={isPending}
          className="rounded-full bg-pink px-4 py-1.5 text-xs font-bold text-white hover:bg-pink-dark disabled:opacity-50">
          {isPending ? 'Saving…' : 'Save all'}
        </button>
      </div>
      <div className="space-y-3">
        {methods.map((m, i) => (
          <div key={i} className="grid gap-2 rounded border border-neutral-200 p-3 md:grid-cols-[auto_1fr_1fr_1fr_auto_auto]">
            <select value={m.type} onChange={(e) => setMethods(methods.map((x, j) => j === i ? { ...x, type: e.target.value } : x))} className={`${inputCls} w-36`}>
              {['whatsapp', 'phone', 'email', 'instagram', 'facebook', 'tiktok', 'line', 'telegram', 'other'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input value={m.value} onChange={(e) => setMethods(methods.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} placeholder="Value" className={inputCls} />
            <input value={m.label ?? ''} onChange={(e) => setMethods(methods.map((x, j) => j === i ? { ...x, label: e.target.value || null } : x))} placeholder="Display label" className={inputCls} />
            <input value={m.note ?? ''} onChange={(e) => setMethods(methods.map((x, j) => j === i ? { ...x, note: e.target.value || null } : x))} placeholder="Note" className={inputCls} />
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={m.is_active} onChange={(e) => setMethods(methods.map((x, j) => j === i ? { ...x, is_active: e.target.checked } : x))} />
              Active
            </label>
            <button onClick={() => setMethods(methods.filter((_, j) => j !== i))}
              className="text-red-600 hover:text-red-700"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button onClick={() => setMethods([...methods, { type: 'whatsapp', value: '', label: null, note: null, is_active: true }])}
          className="flex items-center gap-1 rounded border border-neutral-200 px-3 py-1 text-xs font-bold text-ink hover:border-ink">
          <Plus size={12} /> Add method
        </button>
        {status && <span className="text-xs">{status}</span>}
      </div>
    </section>
  );
}

function NavEditor({ initial }: { initial: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nav, setNav] = useState<any[]>(initial);
  const [status, setStatus] = useState<string | null>(null);

  function save() {
    setStatus(null);
    startTransition(async () => {
      const result = await saveNavigation(nav);
      if (result.ok) {
        setStatus('✓ Saved');
        setTimeout(() => setStatus(null), 2000);
        router.refresh();
      } else setStatus('✗ ' + (result.error ?? 'Failed'));
    });
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-ink">Top navigation</h2>
          <p className="text-xs text-neutral-500">Header nav items. Links use action like "/shop". Dropdowns use mega_key (print / gifts).</p>
        </div>
        <button onClick={save} disabled={isPending}
          className="rounded-full bg-pink px-4 py-1.5 text-xs font-bold text-white hover:bg-pink-dark disabled:opacity-50">
          {isPending ? 'Saving…' : 'Save all'}
        </button>
      </div>
      <DndContext
        sensors={useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))}
        collisionDetection={closestCenter}
        onDragEnd={(e: DragEndEvent) => {
          const from = Number(e.active.id);
          const to = e.over ? Number(e.over.id) : -1;
          if (to >= 0 && from !== to) {
            setNav(arrayMove(nav, from, to).map((x, i) => ({ ...x, display_order: i })));
          }
        }}
      >
        <SortableContext items={nav.map((_, i) => i.toString())} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {nav.map((n, i) => (
              <SortableNavRow key={i} id={i.toString()}>
                <select value={n.type} onChange={(e) => setNav(nav.map((x, j) => j === i ? { ...x, type: e.target.value } : x))} className={`${inputCls} w-32`}>
                  <option value="link">Link</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="sep">Separator</option>
                </select>
                <input value={n.label ?? ''} onChange={(e) => setNav(nav.map((x, j) => j === i ? { ...x, label: e.target.value || null } : x))} placeholder="Label" className={inputCls} disabled={n.type === 'sep'} />
                <input value={n.action ?? ''} onChange={(e) => setNav(nav.map((x, j) => j === i ? { ...x, action: e.target.value || null } : x))} placeholder="Action (e.g. /shop)" className={inputCls} disabled={n.type !== 'link'} />
                <input value={n.mega_key ?? ''} onChange={(e) => setNav(nav.map((x, j) => j === i ? { ...x, mega_key: e.target.value || null } : x))} placeholder="Mega key (print/gifts)" className={inputCls} disabled={n.type !== 'dropdown'} />
                <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                  <input type="checkbox" checked={n.is_hidden} onChange={(e) => setNav(nav.map((x, j) => j === i ? { ...x, is_hidden: e.target.checked } : x))} />
                  Hidden
                </label>
                <button onClick={() => setNav(nav.filter((_, j) => j !== i))} className="text-red-600 hover:text-red-700"><Trash2 size={14} /></button>
              </SortableNavRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="mt-3 flex items-center justify-between">
        <button onClick={() => setNav([...nav, { type: 'link', label: '', action: '/', mega_key: null, is_hidden: false }])}
          className="flex items-center gap-1 rounded border border-neutral-200 px-3 py-1 text-xs font-bold text-ink hover:border-ink">
          <Plus size={12} /> Add nav item
        </button>
        {status && <span className="text-xs">{status}</span>}
      </div>
    </section>
  );
}

const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-400';

function SortableNavRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="flex items-stretch gap-0 rounded border border-neutral-200 bg-white">
      <div
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center rounded-l bg-neutral-50 px-2 text-neutral-400 hover:text-ink active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </div>
      <div className="grid flex-1 gap-2 p-3 md:grid-cols-[128px_1fr_1fr_1fr_auto_auto]">
        {children}
      </div>
    </div>
  );
}
