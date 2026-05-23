import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Heart, Home, Image, MessageCircle, Shield, ThumbsUp, SmilePlus, Video, Upload, Crown, QrCode, Trash2, Eye, EyeOff, Star, Save, MoveUp, MoveDown } from 'lucide-react';
import { motion } from 'framer-motion';
import './styles.css';

const DB_NAME = 'sarika50_album_db';
const DB_VERSION = 1;
const PHOTO_STORE = 'photos';

const SAMPLE_PHOTOS = [
  { id: 'sample-1', chapter: 'Radiance', title: 'Golden Light', caption: 'A portrait worthy of the cover.', src: '/placeholder-gold.svg', reactions: { like: 12, heart: 28, wow: 9 }, published: true, featured: true, sortOrder: 1 },
  { id: 'sample-2', chapter: 'Heart', title: 'Family Warmth', caption: 'The love that surrounds her.', src: '/placeholder-ivory.svg', reactions: { like: 9, heart: 21, wow: 4 }, published: true, featured: false, sortOrder: 2 },
  { id: 'sample-3', chapter: 'Golden 50', title: 'The Celebration', caption: 'A night designed around beauty, joy, and legacy.', src: '/placeholder-black.svg', reactions: { like: 18, heart: 33, wow: 15 }, published: true, featured: false, sortOrder: 3 },
];

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbGetAllPhotos() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readonly');
    const req = tx.objectStore(PHOTO_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function dbPutPhoto(photo) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).put(photo);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDeletePhoto(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function App() {
  const [view, setView] = useState('home');
  const [viewer, setViewer] = useState(() => JSON.parse(localStorage.getItem('sarika50_viewer') || 'null'));
  const [comments, setComments] = useState(() => JSON.parse(localStorage.getItem('sarika50_comments') || '[]'));
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  useEffect(() => { loadPhotos(); }, []);
  useEffect(() => { localStorage.setItem('sarika50_comments', JSON.stringify(comments)); }, [comments]);

  async function loadPhotos() {
    setLoadingPhotos(true);
    try {
      const stored = await dbGetAllPhotos();
      stored.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setPhotos(stored);
    } finally {
      setLoadingPhotos(false);
    }
  }

  const saveViewer = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const profile = { firstName: form.get('firstName'), email: form.get('email') };
    localStorage.setItem('sarika50_viewer', JSON.stringify(profile));
    setViewer(profile);
  };

  const displayPhotos = photos.length ? photos : SAMPLE_PHOTOS;

  return <main>
    <BackgroundGlow />
    {view === 'home' && <HomePage viewer={viewer} saveViewer={saveViewer} setView={setView} />}
    {view === 'album' && <AlbumPage photos={displayPhotos.filter(p => p.published !== false)} viewer={viewer} comments={comments} setComments={setComments} loadingPhotos={loadingPhotos} />}
    {view === 'messages' && <VideoMessages viewer={viewer} />}
    {view === 'admin' && <AdminPortal photos={photos} loadPhotos={loadPhotos} />}
    <BottomNav view={view} setView={setView} />
  </main>;
}

function BackgroundGlow(){ return <div className="bg"><div className="orb one"/><div className="orb two"/></div>; }

function HomePage({ viewer, saveViewer, setView }) {
  return <section className="screen hero">
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.8}} className="hero-card">
      <Crown className="crown" />
      <p className="eyebrow">A Golden Birthday Experience</p>
      <h1>Sarika</h1>
      <h2>Golden • 50</h2>
      <p className="khmer">សារិកា</p>
      <p className="intro">A private mobile-first album, memory wall, and celebration companion.</p>
      {!viewer ? <form className="signin" onSubmit={saveViewer}>
        <input name="firstName" placeholder="First name" required />
        <input name="email" type="email" placeholder="Email address" required />
        <button>Enter Experience</button>
        <small>Only first name and email are requested to keep the guest experience simple and private.</small>
      </form> : <div className="welcome"><p>Welcome, {viewer.firstName}.</p><button onClick={() => setView('album')}>Open Album</button></div>}
    </motion.div>
  </section>;
}

function AlbumPage({ photos, viewer, comments, setComments, loadingPhotos }) {
  return <section className="screen album"><header><p className="eyebrow">Digital Photo Book</p><h2>Curated Moments</h2>{loadingPhotos && <p className="muted">Loading album…</p>}</header>
    <div className="photo-feed">{photos.map(photo => <PhotoCard key={photo.id} photo={photo} viewer={viewer} comments={comments} setComments={setComments} />)}</div>
  </section>;
}

function PhotoCard({ photo, viewer, comments, setComments }) {
  const [localReactions, setLocalReactions] = useState(photo.reactions || { like: 0, heart: 0, wow: 0 });
  const photoComments = comments.filter(c => c.photoId === photo.id);
  const addComment = (e) => { e.preventDefault(); const text = new FormData(e.currentTarget).get('comment'); if(!text.trim()) return; setComments([{ id: crypto.randomUUID(), photoId: photo.id, name: viewer?.firstName || 'Guest', text, createdAt: new Date().toISOString() }, ...comments]); e.currentTarget.reset(); };
  const react = key => setLocalReactions({...localReactions, [key]: (localReactions[key] || 0) + 1});
  return <article className="photo-card">
    <img src={photo.src} alt={photo.title || 'Sarika photo'} />
    <div className="photo-copy"><p className="chapter">{photo.chapter || 'Golden 50'}</p><h3>{photo.title || 'Untitled Moment'}</h3><p>{photo.caption || 'Add a caption in the admin portal.'}</p>
      <div className="reactions"><button onClick={()=>react('like')}><ThumbsUp/> {localReactions.like || 0}</button><button onClick={()=>react('heart')}><Heart/> {localReactions.heart || 0}</button><button onClick={()=>react('wow')}><SmilePlus/> {localReactions.wow || 0}</button></div>
      <form className="comment-form" onSubmit={addComment}><input name="comment" placeholder={viewer ? 'Leave a comment' : 'Sign in to comment'} disabled={!viewer}/><button disabled={!viewer}>Post</button></form>
      <div className="comments">{photoComments.slice(0,3).map((c)=><p key={c.id}><b>{c.name}</b> {c.text}</p>)}</div>
    </div>
  </article>;
}

function VideoMessages({ viewer }) {
  const inputRef = useRef(null);
  const [videoName, setVideoName] = useState('');
  return <section className="screen messages"><header><p className="eyebrow">Memory Wall</p><h2>Leave Sarika a 30-second video message</h2></header>
    <div className="panel"><Video className="large-icon"/><p>For this preview, guests can select a video file. The production version will limit recording to 30 seconds and store approved messages in Cloudflare Stream.</p>
    <input ref={inputRef} type="file" accept="video/*" capture="user" hidden onChange={(e)=>setVideoName(e.target.files?.[0]?.name || '')}/>
    <button disabled={!viewer} onClick={()=>inputRef.current?.click()}>Record or Select Message</button>{videoName && <small>Selected: {videoName}</small>}{!viewer && <small>Please sign in from the Home screen first.</small>}</div>
  </section>;
}

function AdminPortal({ photos, loadPhotos }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function handleFiles(e) {
    const files = [...(e.target.files || [])].filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    setBusy(true);
    setStatus(`Uploading ${files.length} image${files.length === 1 ? '' : 's'}…`);
    try {
      const existingCount = photos.length;
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const src = await fileToDataUrl(file);
        await dbPutPhoto({
          id: crypto.randomUUID(),
          fileName: file.name,
          title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
          caption: '',
          chapter: 'Golden 50',
          src,
          published: true,
          featured: false,
          sortOrder: existingCount + index + 1,
          reactions: { like: 0, heart: 0, wow: 0 },
          createdAt: new Date().toISOString()
        });
      }
      await loadPhotos();
      setStatus('Upload complete. Add captions and reorder below.');
      e.target.value = '';
    } catch (err) {
      console.error(err);
      setStatus('Upload failed. Try smaller image files or fewer images at one time.');
    } finally {
      setBusy(false);
    }
  }

  async function savePhoto(photo, updates) {
    await dbPutPhoto({ ...photo, ...updates, updatedAt: new Date().toISOString() });
    await loadPhotos();
  }

  async function removePhoto(id) {
    if (!confirm('Remove this photo from the browser album?')) return;
    await dbDeletePhoto(id);
    await loadPhotos();
  }

  async function movePhoto(photo, direction) {
    const sorted = [...photos].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const idx = sorted.findIndex(p => p.id === photo.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    await dbPutPhoto({ ...photo, sortOrder: other.sortOrder });
    await dbPutPhoto({ ...other, sortOrder: photo.sortOrder });
    await loadPhotos();
  }

  const publishedCount = useMemo(() => photos.filter(p => p.published !== false).length, [photos]);

  return <section className="screen admin"><header><p className="eyebrow">Protected by Cloudflare Access</p><h2>Admin Portal</h2><p className="muted">{photos.length} uploaded • {publishedCount} published</p></header>
    <div className="admin-upload-panel">
      <Upload className="large-icon" />
      <h3>Upload Sarika50 Photos</h3>
      <p>Choose images from your computer or phone. This preview stores them in the browser using IndexedDB. Later we will connect this same UI to Supabase or Cloudflare R2 for permanent shared storage.</p>
      <label className="upload-label"><input type="file" accept="image/*" multiple onChange={handleFiles} disabled={busy}/>Select Photos</label>
      {status && <small>{status}</small>}
    </div>

    {photos.length === 0 ? <div className="grid"><AdminTile icon={<Upload/>} title="No uploads yet" text="Upload a few photos, then open the Album tab to preview the experience."/><AdminTile icon={<QrCode/>} title="Menu QR Code" text="The QR code will point to the final Cloudflare site URL."/><AdminTile icon={<Shield/>} title="Privacy" text="The public album will never show viewer email addresses."/></div> : <div className="admin-list">
      {photos.map((photo, index) => <EditablePhoto key={photo.id} photo={photo} index={index} savePhoto={savePhoto} removePhoto={removePhoto} movePhoto={movePhoto} />)}
    </div>}
  </section>;
}

function EditablePhoto({ photo, index, savePhoto, removePhoto, movePhoto }) {
  const [draft, setDraft] = useState(photo);
  useEffect(() => setDraft(photo), [photo]);
  const changed = JSON.stringify({title:draft.title, caption:draft.caption, chapter:draft.chapter, published:draft.published, featured:draft.featured}) !== JSON.stringify({title:photo.title, caption:photo.caption, chapter:photo.chapter, published:photo.published, featured:photo.featured});
  return <article className="admin-photo">
    <img src={photo.src} alt={photo.title || 'Uploaded'} />
    <div className="admin-fields">
      <div className="row between"><p className="chapter">#{index + 1} {photo.fileName}</p><div className="icon-actions"><button title="Move up" onClick={()=>movePhoto(photo, -1)}><MoveUp/></button><button title="Move down" onClick={()=>movePhoto(photo, 1)}><MoveDown/></button></div></div>
      <input value={draft.title || ''} onChange={e=>setDraft({...draft, title:e.target.value})} placeholder="Photo title" />
      <input value={draft.chapter || ''} onChange={e=>setDraft({...draft, chapter:e.target.value})} placeholder="Chapter, e.g. Radiance" />
      <textarea value={draft.caption || ''} onChange={e=>setDraft({...draft, caption:e.target.value})} placeholder="Caption" />
      <div className="row wrap">
        <button className={draft.published !== false ? 'pill active' : 'pill'} onClick={()=>setDraft({...draft, published: !(draft.published !== false)})}>{draft.published !== false ? <Eye/> : <EyeOff/>}{draft.published !== false ? 'Published' : 'Hidden'}</button>
        <button className={draft.featured ? 'pill active' : 'pill'} onClick={()=>setDraft({...draft, featured: !draft.featured})}><Star/> Featured</button>
        <button disabled={!changed} onClick={()=>savePhoto(photo, draft)}><Save/> Save</button>
        <button className="danger" onClick={()=>removePhoto(photo.id)}><Trash2/> Delete</button>
      </div>
    </div>
  </article>;
}

function AdminTile({icon,title,text}){ return <div className="tile">{icon}<h3>{title}</h3><p>{text}</p></div> }
function BottomNav({ view, setView }) { const items=[['home',Home,'Home'],['album',Image,'Album'],['messages',Video,'Messages'],['admin',Shield,'Admin']]; return <nav className="bottom-nav">{items.map(([key,Icon,label])=><button className={view===key?'active':''} key={key} onClick={()=>setView(key)}><Icon/><span>{label}</span></button>)}</nav> }

createRoot(document.getElementById('root')).render(<App />);
