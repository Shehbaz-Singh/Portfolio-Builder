'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
  Bold,
  Code,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  Quote,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import {
  COVER_MAX_BYTES,
  COVER_TYPES,
  POST_BODY_MAX,
  POST_EXCERPT_MAX,
  POST_TITLE_MAX,
  postInputSchema,
  type MyPost,
  type MyPostSummary,
  type PostStatus,
  type PostType,
} from '@parichay/shared';
import { api } from '@/lib/client-api';
import { applyFormat, type Format } from '@/lib/markdown-format';
import { Markdown } from '../../Markdown';
import { Button, Card, ErrorText, Input, SlowNotice, Tabs, Textarea, useConfirm } from '../../ui';
import { cx } from '../../ui/cx';
import { errorText, useEditor, useReportDirty } from '../editor-context';

type Fields = {
  title: string;
  type: PostType;
  excerpt: string;
  body: string;
  externalUrl: string;
};
type FieldName = keyof Fields;

const BLANK: Fields = { title: '', type: 'post', excerpt: '', body: '', externalUrl: '' };

const toFields = (post: MyPost): Fields => ({
  title: post.title,
  type: post.type,
  excerpt: post.excerpt ?? '',
  body: post.body ?? '',
  externalUrl: post.externalUrl ?? '',
});

// The list in the editor holds posts without their bodies.
const summaryOf = (post: MyPost): MyPostSummary => ({
  id: post.id,
  title: post.title,
  slug: post.slug,
  type: post.type,
  excerpt: post.excerpt,
  externalUrl: post.externalUrl,
  coverImageUrl: post.coverImageUrl,
  status: post.status,
  publishedAt: post.publishedAt,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
});

const TYPE_OPTIONS: { value: PostType; label: string; hint: string }[] = [
  { value: 'post', label: 'Write a post', hint: 'Write it here, in Markdown' },
  { value: 'link', label: 'Link to an article', hint: 'Point to something you wrote elsewhere' },
];

const TOOLS: { format: Format; label: string; Icon: LucideIcon }[] = [
  { format: 'bold', label: 'Bold', Icon: Bold },
  { format: 'italic', label: 'Italic', Icon: Italic },
  { format: 'heading', label: 'Heading', Icon: Heading2 },
  { format: 'link', label: 'Link', Icon: Link2 },
  { format: 'list', label: 'Bulleted list', Icon: List },
  { format: 'quote', label: 'Quote', Icon: Quote },
  { format: 'code', label: 'Code', Icon: Code },
];

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-note`} role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-note`} className="mt-1 text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

// The formatting buttons. They only change the text in the box (and keep it selected); the Markdown
// stays visible and editable, so nothing is hidden behind them.
function Toolbar({ onFormat }: { onFormat: (format: Format) => void }) {
  return (
    <div
      role="toolbar"
      data-mod-k-own=""
      aria-label="Formatting"
      aria-controls="post-body"
      className="mb-2 flex flex-wrap gap-1"
    >
      {TOOLS.map(({ format, label, Icon }) => (
        <Button
          key={format}
          size="sm"
          variant="ghost"
          aria-label={label}
          title={label}
          onClick={() => onFormat(format)}
          className="size-8 px-0!"
        >
          <Icon aria-hidden="true" className="size-4" />
        </Button>
      ))}
    </div>
  );
}

function CoverImage({
  postId,
  cover,
  setCover,
}: {
  postId: string | null;
  cover: string | null;
  setCover: (url: string | null) => void;
}) {
  const { update, notify } = useEditor();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const remember = (url: string | null) =>
    update((p) => ({
      ...p,
      posts: p.posts.map((post) => (post.id === postId ? { ...post, coverImageUrl: url } : post)),
    }));

  async function onFile(file: File | undefined) {
    if (!file || !postId) return;
    if (!(COVER_TYPES as readonly string[]).includes(file.type))
      return notify('error', "That file type won't work. Choose a JPG, PNG or WebP image.");
    if (file.size > COVER_MAX_BYTES)
      return notify('error', 'That image is over 2 MB. Choose a smaller one, or shrink it first.');
    const form = new FormData();
    form.append('cover', file);
    setBusy(true);
    try {
      const { coverImageUrl } = await api<{ coverImageUrl: string }>(
        `/profile/me/posts/${postId}/cover`,
        { method: 'POST', form },
      );
      setCover(coverImageUrl);
      remember(coverImageUrl);
      notify('success', 'Cover image saved.');
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    if (!postId) return;
    setBusy(true);
    try {
      await api(`/profile/me/posts/${postId}/cover`, { method: 'DELETE' });
      setCover(null);
      remember(null);
      notify('success', 'Cover image removed.');
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Cover image (optional)</p>
      {cover && (
        // A plain <img>, like the avatar: the address is Cloudinary's.
        <img
          src={cover}
          alt="Cover for this post"
          referrerPolicy="no-referrer"
          className="aspect-[40/21] w-full max-w-sm rounded-card object-cover"
        />
      )}
      <input
        ref={input}
        type="file"
        accept={COVER_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = ''; // choosing the same file again should still work
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button disabled={!postId || busy} onClick={() => input.current?.click()}>
          <ImagePlus aria-hidden="true" className="size-4" />
          {busy ? 'Working…' : cover ? 'Change image' : 'Add an image'}
        </Button>
        {cover && (
          <Button variant="danger" disabled={busy} onClick={onRemove}>
            <Trash2 aria-hidden="true" className="size-4" />
            Remove image
          </Button>
        )}
      </div>
      <p className="text-xs text-muted">
        {postId
          ? 'JPG, PNG or WebP, up to 2 MB. It is cropped to 1200 × 630.'
          : 'Save the draft first, then you can add an image.'}
      </p>
      <SlowNotice pending={busy} />
    </div>
  );
}

function PostForm({ initial, onClose }: { initial: MyPost | null; onClose: () => void }) {
  const { update, notify } = useEditor();
  const confirm = useConfirm();
  const [postId, setPostId] = useState(initial?.id ?? null);
  const [status, setStatus] = useState<PostStatus>(initial?.status ?? 'draft');
  const [cover, setCover] = useState(initial?.coverImageUrl ?? null);
  const [fields, setFields] = useState<Fields>(initial ? toFields(initial) : BLANK);
  const [saved, setSaved] = useState<Fields>(fields); // what the server has
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<PostStatus | null>(null);
  const [tab, setTab] = useState('write');
  const body = useRef<HTMLTextAreaElement>(null);
  const selection = useRef<{ start: number; end: number } | null>(null);

  const dirty = JSON.stringify(fields) !== JSON.stringify(saved);
  useReportDirty(dirty);

  const set = <K extends FieldName>(name: K, value: Fields[K]) => {
    setFields((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  // After a formatting button changes the text, put the selection back in the box.
  useLayoutEffect(() => {
    const pending = selection.current;
    if (!pending || !body.current) return;
    selection.current = null;
    body.current.focus();
    body.current.setSelectionRange(pending.start, pending.end);
  }, [fields.body]);

  function format(kind: Format) {
    const box = body.current;
    if (!box) return;
    const edit = applyFormat(box.value, box.selectionStart, box.selectionEnd, kind);
    selection.current = { start: edit.start, end: edit.end };
    set('body', edit.text);
  }

  async function submit(next: PostStatus) {
    const parsed = postInputSchema.safeParse({
      ...fields,
      externalUrl: fields.externalUrl.trim() || null,
      status: next,
    });
    if (!parsed.success) {
      const found: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) {
        const name = issue.path[0] as FieldName;
        found[name] ??= issue.message;
      }
      setErrors(found);
      setFormError(null);
      const first = (['title', 'externalUrl', 'body', 'excerpt'] as FieldName[]).find(
        (name) => found[name],
      );
      if (first === 'body') setTab('write');
      requestAnimationFrame(() => document.getElementById(`post-${first}`)?.focus());
      return;
    }

    const sent = fields;
    const wasDraft = status === 'draft';
    setSaving(next);
    setFormError(null);
    try {
      const result = await api<MyPost>(
        postId ? `/profile/me/posts/${postId}` : '/profile/me/posts',
        { method: postId ? 'PUT' : 'POST', body: parsed.data },
      );
      const isNew = !postId;
      setPostId(result.id);
      setStatus(result.status);
      setCover(result.coverImageUrl);
      setSaved(toFields(result));
      // Keep what was typed while the request was on its way; otherwise show what the server kept.
      setFields((current) =>
        JSON.stringify(current) === JSON.stringify(sent) ? toFields(result) : current,
      );
      update((p) => ({
        ...p,
        posts: isNew
          ? [summaryOf(result), ...p.posts]
          : p.posts.map((post) => (post.id === result.id ? summaryOf(result) : post)),
      }));
      if (next === 'published' && wasDraft) {
        notify(
          'success',
          'Published. It shows on your page while the Writing section is switched on.',
        );
        onClose();
      } else {
        notify('success', next === 'published' ? 'Changes saved.' : 'Draft saved.');
      }
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setSaving(null);
    }
  }

  async function back() {
    if (
      dirty &&
      !(await confirm({
        title: 'Discard your changes?',
        message: 'You have changes that are not saved. Go back to the list and lose them?',
        confirmLabel: 'Discard',
        cancelLabel: 'Keep editing',
        danger: true,
      }))
    ) {
      return;
    }
    onClose();
  }

  const isLink = fields.type === 'link';
  const published = status === 'published';

  return (
    <section aria-labelledby="post-editor-heading" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="post-editor-heading" className="type-section">
          {initial || postId ? 'Edit' : 'New'} {isLink ? 'link' : 'post'}
        </h2>
        <Button variant="ghost" onClick={back}>
          Back to the list
        </Button>
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-medium">What are you adding?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {TYPE_OPTIONS.map((option) => (
            // The radio and its words are both inside the label.
            // eslint-disable-next-line jsx-a11y/label-has-associated-control
            <label
              key={option.value}
              className={cx(
                'flex cursor-pointer items-start gap-2 rounded-control border border-line px-3 py-2 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-fg',
              )}
            >
              <input
                type="radio"
                name="post-type"
                value={option.value}
                checked={fields.type === option.value}
                onChange={() => set('type', option.value)}
                className="mt-1 accent-accent"
              />
              <span>
                <span className="block font-medium">{option.label}</span>
                <span className="block text-xs text-muted">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        id="post-title"
        label="Title"
        error={errors.title}
        hint={`${fields.title.length}/${POST_TITLE_MAX}`}
      >
        <Input
          id="post-title"
          value={fields.title}
          maxLength={POST_TITLE_MAX}
          placeholder={
            isLink
              ? 'e.g. How we cut our build times in half'
              : 'e.g. What I learned from my first year as a designer'
          }
          aria-invalid={errors.title ? true : undefined}
          aria-describedby="post-title-note"
          onChange={(e) => set('title', e.target.value)}
        />
      </Field>

      {isLink && (
        <Field
          id="post-externalUrl"
          label="Link to the article"
          error={errors.externalUrl}
          hint="Where it was published. Starts with https://"
        >
          <Input
            id="post-externalUrl"
            type="url"
            value={fields.externalUrl}
            placeholder="https://"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={errors.externalUrl ? true : undefined}
            aria-describedby="post-externalUrl-note"
            onChange={(e) => set('externalUrl', e.target.value)}
          />
        </Field>
      )}

      <Field
        id="post-excerpt"
        label="Short summary (optional)"
        error={errors.excerpt}
        hint={`One or two sentences that make someone want to read it. ${fields.excerpt.length}/${POST_EXCERPT_MAX}`}
      >
        <Textarea
          id="post-excerpt"
          rows={2}
          value={fields.excerpt}
          maxLength={POST_EXCERPT_MAX}
          aria-invalid={errors.excerpt ? true : undefined}
          aria-describedby="post-excerpt-note"
          onChange={(e) => set('excerpt', e.target.value)}
        />
      </Field>

      {!isLink && (
        <div>
          <Tabs
            label="Write or preview"
            idBase="post-body"
            tabs={[
              { id: 'write', label: 'Write' },
              { id: 'preview', label: 'Preview' },
            ]}
            value={tab}
            onChange={setTab}
          >
            {tab === 'write' ? (
              <Field
                id="post-body"
                label="Post"
                error={errors.body}
                hint={`Markdown: **bold**, _italic_, # headings, [links](https://…), lists, > quotes and code. Raw HTML and images are not shown. ${fields.body.length}/${POST_BODY_MAX}`}
              >
                <Toolbar onFormat={format} />
                <Textarea
                  id="post-body"
                  data-mod-k-own=""
                  ref={body}
                  rows={14}
                  value={fields.body}
                  maxLength={POST_BODY_MAX}
                  spellCheck
                  aria-invalid={errors.body ? true : undefined}
                  aria-describedby="post-body-note"
                  onChange={(e) => set('body', e.target.value)}
                  className="font-mono"
                />
              </Field>
            ) : (
              <div className="min-h-40 rounded-control border border-line p-4">
                {fields.body.trim() ? (
                  <Markdown>{fields.body}</Markdown>
                ) : (
                  <p className="text-sm text-muted">
                    Nothing to preview yet. Write something first.
                  </p>
                )}
              </div>
            )}
          </Tabs>
        </div>
      )}

      <CoverImage postId={postId} cover={cover} setCover={setCover} />

      <Card tone="tint" padding="sm" className="text-sm">
        {published
          ? 'This one is published. Saving changes updates it right away.'
          : 'This one is a draft. Only you can see it until you publish it.'}
      </Card>

      <ErrorText>{formError ?? undefined}</ErrorText>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          loading={saving === 'published'}
          disabled={saving !== null}
          onClick={() => void submit('published')}
        >
          {saving === 'published' ? 'Saving…' : published ? 'Save changes' : 'Publish'}
        </Button>
        <Button
          loading={saving === 'draft'}
          disabled={saving !== null}
          onClick={() => void submit('draft')}
        >
          {saving === 'draft' ? 'Saving…' : published ? 'Switch back to draft' : 'Save draft'}
        </Button>
        {dirty && <span className="text-sm text-muted">You have unsaved changes.</span>}
      </div>
    </section>
  );
}

// Opens a saved post (fetching it, with its body) or a blank form.
export function PostEditor({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [post, setPost] = useState<MyPost | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    api<MyPost>(`/profile/me/posts/${id}`, { signal: controller.signal }).then(setPost, (err) => {
      if (!controller.signal.aborted) {
        console.error(err);
        setFailed(true);
      }
    });
    return () => controller.abort();
  }, [id]);

  if (!id) return <PostForm initial={null} onClose={onClose} />;
  if (failed) {
    return (
      <Card tone="danger" role="alert" className="space-y-3">
        <p>We couldn’t open that post. Please go back and try again.</p>
        <Button onClick={onClose}>Back to the list</Button>
      </Card>
    );
  }
  if (!post) return <p role="status">Getting your post…</p>;
  return <PostForm key={post.id} initial={post} onClose={onClose} />;
}
