import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const STORAGE_KEY = 'sarika50_photos_v3';

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getInitialView() {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (['home', 'album', 'admin', 'messages'].includes(hash)) return hash;
  const path = window.location.pathname.toLowerCase();
  if (path.includes('/admin')) return 'admin';
  if (path.includes('/album')) return 'album';
  return 'home';
}

function readPhotos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function App() {
  const [view, setView] = useState(getInitialView());
  const [photos, setPhotos] = useState(readPhotos);

  useEffect(() => {
    const onHash = () => setView(getInitialView());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  }, [photos]);

  const publishedPhotos = useMemo(
    () => photos.filter((p) => p.published).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [photos]
  );

  function navigate(nextView) {
    window.location.hash = nextView;
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function addFiles(fileList) {
    const files = Array.from(fileList || []).filter((file) => file.type.startsWith('image/'));
    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos((current) => [
          ...current,
          {
            id: uid(),
            src: reader.result,
            name: file.name,
            caption: '',
            chapter: 'Golden 50',
            published: true,
            featured: current.length === 0 && index === 0,
            sortOrder: current.length + index + 1,
            reactions: { like: 0, heart: 0, wow: 0 },
            comments: [],
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }

  function updatePhoto(id, patch) {
    setPhotos((current) => current.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function deletePhoto(id) {
    setPhotos((current) => current.filter((p) => p.id !== id));
  }

  function reactToPhoto(id, reaction) {
    setPhotos((current) =>
      current.map((p) =>
        p.id === id
          ? { ...p, reactions: { ...p.reactions, [reaction]: (p.reactions?.[reaction] || 0) + 1 } }
          : p
      )
    );
  }

  function addComment(id, comment) {
    const trimmed = comment.trim();
    if (!trimmed) return;
    setPhotos((current) =>
      current.map((p) =>
        p.id === id
          ? { ...p, comments: [...(p.comments || []), { id: uid(), text: trimmed, name: 'Guest' }] }
          : p
      )
    );
  }

  return (
    <div className="app-shell">
      <Header navigate={navigate} />
      {view === 'home' && <Home navigate={navigate} publishedCount={publishedPhotos.length} />}
      {view === 'album' && <Album photos={publishedPhotos} onReact={reactToPhoto} onComment={addComment} navigate={navigate} />}
      {view === 'messages' && <Messages />}
      {view === 'admin' && (
        <Admin
          photos={photos}
          addFiles={addFiles}
          updatePhoto={updatePhoto}
          deletePhoto={deletePhoto}
          navigate={navigate}
        />
      )}
      <BottomNav view={view} navigate={navigate} />
    </div>
  );
}

function Header({ navigate }) {
  return (
    <header className="topbar">
      <button className="brand" type="button" onClick={() => navigate('home')}>
        <span>Sarika</span>
        <small>Golden • 50</small>
      </button>
      <button className="pill" type="button" onClick={() => navigate('admin')}>Admin</button>
    </header>
  );
}

function Home({ navigate, publishedCount }) {
  return (
    <main className="hero page">
      <div className="gold-orb" />
      <p className="eyebrow">A luxury digital keepsake</p>
      <h1>Sarika<br />Golden 50</h1>
      <p className="subtitle">A mobile-first birthday album for portraits, memories, love notes, reactions, and 30-second video tributes.</p>
      <div className="button-row">
        <button className="primary" type="button" onClick={() => navigate('album')}>View Album</button>
        <button className="secondary" type="button" onClick={() => navigate('admin')}>Upload Photos</button>
      </div>
      <div className="status-card">
        <strong>{publishedCount}</strong>
        <span>published photos</span>
      </div>
    </main>
  );
}

function Album({ photos, onReact, onComment, navigate }) {
  if (!photos.length) {
    return (
      <main className="page empty-state">
        <h2>No photos published yet</h2>
        <p>Use the admin upload manager to add photos, captions, chapters, and sort order.</p>
        <button className="primary" type="button" onClick={() => navigate('admin')}>Go to Admin Uploads</button>
      </main>
    );
  }

  return (
    <main className="page">
      <p className="eyebrow">Digital Album</p>
      <h2 className="section-title">Golden Moments</h2>
      <section className="photo-grid">
        {photos.map((photo) => <PhotoCard key={photo.id} photo={photo} onReact={onReact} onComment={onComment} />)}
      </section>
    </main>
  );
}

function PhotoCard({ photo, onReact, onComment }) {
  const [comment, setComment] = useState('');
  return (
    <article className="photo-card">
      <img src={photo.src} alt={photo.caption || photo.name || 'Sarika50 photo'} />
      <div className="photo-copy">
        <p className="chapter">{photo.chapter || 'Golden 50'}</p>
        <h3>{photo.caption || 'Untitled moment'}</h3>
        <div className="reaction-row">
          <button type="button" onClick={() => onReact(photo.id, 'like')}>👍 {photo.reactions?.like || 0}</button>
          <button type="button" onClick={() => onReact(photo.id, 'heart')}>❤️ {photo.reactions?.heart || 0}</button>
          <button type="button" onClick={() => onReact(photo.id, 'wow')}>😮 {photo.reactions?.wow || 0}</button>
        </div>
        <form className="comment-form" onSubmit={(e) => { e.preventDefault(); onComment(photo.id, comment); setComment(''); }}>
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Leave a kind comment" />
          <button type="submit">Post</button>
        </form>
        {!!photo.comments?.length && (
          <div className="comments">
            {photo.comments.slice(-3).map((c) => <p key={c.id}><strong>{c.name}:</strong> {c.text}</p>)}
          </div>
        )}
      </div>
    </article>
  );
}

function Admin({ photos, addFiles, updatePhoto, deletePhoto, navigate }) {
  return (
    <main className="page admin-page">
      <p className="eyebrow">Admin Portal</p>
      <h2 className="section-title">Upload & Curate Photos</h2>
      <p className="admin-note">This version stores photos in your browser for layout testing. Next step is persistent Supabase or Cloudflare R2 storage.</p>

      <label className="upload-box">
        <input type="file" accept="image/*" multiple onChange={(e) => addFiles(e.target.files)} />
        <span>Tap to upload photos</span>
        <small>Select one or multiple images from your phone or computer.</small>
      </label>

      <div className="admin-actions">
        <button className="secondary" type="button" onClick={() => navigate('album')}>Preview Album</button>
        <button className="secondary" type="button" onClick={() => navigate('home')}>Back Home</button>
        <button className="danger" type="button" onClick={() => { if (confirm('Clear all uploaded test photos?')) localStorage.removeItem(STORAGE_KEY); location.reload(); }}>Clear Test Photos</button>
      </div>

      <section className="admin-list">
        {photos.map((photo, index) => (
          <div className="admin-item" key={photo.id}>
            <img src={photo.src} alt={photo.name || 'Uploaded photo'} />
            <div className="admin-fields">
              <label>Caption
                <input value={photo.caption} onChange={(e) => updatePhoto(photo.id, { caption: e.target.value })} placeholder="Add caption" />
              </label>
              <label>Chapter
                <input value={photo.chapter} onChange={(e) => updatePhoto(photo.id, { chapter: e.target.value })} placeholder="Golden 50" />
              </label>
              <label>Sort Order
                <input type="number" value={photo.sortOrder || index + 1} onChange={(e) => updatePhoto(photo.id, { sortOrder: Number(e.target.value) })} />
              </label>
              <div className="toggle-row">
                <label><input type="checkbox" checked={!!photo.published} onChange={(e) => updatePhoto(photo.id, { published: e.target.checked })} /> Published</label>
                <label><input type="checkbox" checked={!!photo.featured} onChange={(e) => updatePhoto(photo.id, { featured: e.target.checked })} /> Featured</label>
              </div>
              <button className="danger" type="button" onClick={() => deletePhoto(photo.id)}>Delete</button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

function Messages() {
  return (
    <main className="page empty-state">
      <p className="eyebrow">Video Messages</p>
      <h2>30-second tributes</h2>
      <p>This page is reserved for the next phase: guest video recording, admin review, and approved memory wall playback.</p>
    </main>
  );
}

function BottomNav({ view, navigate }) {
  const items = [
    ['home', 'Home'],
    ['album', 'Album'],
    ['messages', 'Messages'],
    ['admin', 'Admin'],
  ];
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map(([key, label]) => (
        <button key={key} type="button" className={view === key ? 'active' : ''} onClick={() => navigate(key)}>
          {label}
        </button>
      ))}
    </nav>
  );
}

createRoot(document.getElementById('root')).render(<App />);
