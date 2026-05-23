import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const STORAGE_KEY = 'sarika50_photos_v1'

function readPhotos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function savePhotos(photos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(photos))
}

function App() {
  const [route, setRoute] = useState(getRoute())
  const [photos, setPhotos] = useState(readPhotos)

  useEffect(() => {
    savePhotos(photos)
  }, [photos])

  useEffect(() => {
    const onRoute = () => setRoute(getRoute())
    window.addEventListener('popstate', onRoute)
    window.addEventListener('hashchange', onRoute)
    return () => {
      window.removeEventListener('popstate', onRoute)
      window.removeEventListener('hashchange', onRoute)
    }
  }, [])

  const navigate = (next) => {
    window.history.pushState({}, '', next)
    setRoute(getRoute())
  }

  return (
    <div className="app-shell">
      <Header navigate={navigate} />
      {route === 'admin' ? (
        <Admin photos={photos} setPhotos={setPhotos} />
      ) : route === 'album' ? (
        <Album photos={photos} />
      ) : (
        <Home photos={photos} navigate={navigate} />
      )}
      <BottomNav route={route} navigate={navigate} />
    </div>
  )
}

function getRoute() {
  const hash = window.location.hash.replace('#', '').replace('/', '').toLowerCase()
  const path = window.location.pathname.toLowerCase()
  if (hash === 'admin' || path.endsWith('/admin')) return 'admin'
  if (hash === 'album' || path.endsWith('/album')) return 'album'
  return 'home'
}

function Header({ navigate }) {
  return (
    <header className="topbar">
      <button className="brand" onClick={() => navigate('/')}>Sarika<span>50</span></button>
      <nav>
        <button onClick={() => navigate('/#album')}>Album</button>
        <button className="admin-link" onClick={() => navigate('/#admin')}>Admin</button>
      </nav>
    </header>
  )
}

function Home({ photos, navigate }) {
  const featured = photos.find(p => p.featured && p.published) || photos.find(p => p.published)
  return (
    <main className="hero-page">
      <section className="hero-card">
        {featured?.src ? <img src={featured.src} className="hero-photo" alt={featured.caption || 'Sarika Golden 50'} /> : null}
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow">A Golden Birthday Experience</p>
          <h1>Sarika<br /><span>Golden • 50</span></h1>
          <p className="intro">A luxury mobile-first digital album, memory wall, and keepsake for Sarika’s 50th birthday.</p>
          <div className="hero-actions">
            <button onClick={() => navigate('/#album')}>View Album</button>
            <button className="secondary" onClick={() => navigate('/#admin')}>Upload Photos</button>
          </div>
        </div>
      </section>
      <section className="status-card">
        <strong>{photos.length}</strong> photos added locally on this device. Use Admin to upload and caption images.
      </section>
    </main>
  )
}

function Admin({ photos, setPhotos }) {
  const [caption, setCaption] = useState('')
  const [chapter, setChapter] = useState('Golden 50')

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []).filter(file => file.type.startsWith('image/'))
    const converted = await Promise.all(files.map(file => fileToDataUrl(file).then(src => ({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      src,
      caption,
      chapter,
      published: true,
      featured: photos.length === 0,
      createdAt: new Date().toISOString()
    }))))
    setPhotos([...converted, ...photos])
    event.target.value = ''
    setCaption('')
  }

  const updatePhoto = (id, patch) => setPhotos(photos.map(p => p.id === id ? { ...p, ...patch } : p))
  const removePhoto = (id) => setPhotos(photos.filter(p => p.id !== id))
  const move = (id, direction) => {
    const index = photos.findIndex(p => p.id === id)
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= photos.length) return
    const next = [...photos]
    const [item] = next.splice(index, 1)
    next.splice(nextIndex, 0, item)
    setPhotos(next)
  }

  return (
    <main className="page admin-page">
      <section className="section-head">
        <p className="eyebrow">Admin Portal</p>
        <h1>Upload & Curate Photos</h1>
        <p>This first version stores photos locally in your browser for layout testing. Next we’ll connect Supabase or Cloudflare R2 for permanent uploads.</p>
      </section>

      <section className="upload-panel">
        <label>
          Default caption
          <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="A beautiful golden moment..." />
        </label>
        <label>
          Chapter
          <select value={chapter} onChange={e => setChapter(e.target.value)}>
            <option>Golden 50</option>
            <option>Radiance</option>
            <option>Family</option>
            <option>Heart</option>
            <option>Khmer Elegance</option>
            <option>Lantern Night</option>
          </select>
        </label>
        <label className="file-drop">
          <span>Tap to upload photos</span>
          <small>JPG, PNG, HEIC converted by browser when supported</small>
          <input type="file" accept="image/*" multiple onChange={handleFiles} />
        </label>
      </section>

      <section className="admin-grid">
        {photos.map((photo) => (
          <article className="admin-card" key={photo.id}>
            <img src={photo.src} alt={photo.caption || 'Uploaded'} />
            <input value={photo.caption} onChange={e => updatePhoto(photo.id, { caption: e.target.value })} placeholder="Caption" />
            <input value={photo.chapter} onChange={e => updatePhoto(photo.id, { chapter: e.target.value })} placeholder="Chapter" />
            <div className="toggles">
              <label><input type="checkbox" checked={photo.published} onChange={e => updatePhoto(photo.id, { published: e.target.checked })} /> Published</label>
              <label><input type="checkbox" checked={photo.featured} onChange={e => updatePhoto(photo.id, { featured: e.target.checked })} /> Featured</label>
            </div>
            <div className="card-actions">
              <button onClick={() => move(photo.id, -1)}>↑</button>
              <button onClick={() => move(photo.id, 1)}>↓</button>
              <button className="danger" onClick={() => removePhoto(photo.id)}>Remove</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

function Album({ photos }) {
  const published = useMemo(() => photos.filter(p => p.published), [photos])
  return (
    <main className="page album-page">
      <section className="section-head">
        <p className="eyebrow">Digital Album</p>
        <h1>Sarika Golden 50</h1>
        <p>{published.length ? `${published.length} published photos` : 'No photos published yet. Use Admin to add photos.'}</p>
      </section>
      <section className="album-grid">
        {published.map(photo => (
          <article className="photo-card" key={photo.id}>
            <img src={photo.src} alt={photo.caption || 'Sarika Golden 50'} />
            <div>
              <p className="chapter">{photo.chapter}</p>
              <h2>{photo.caption || 'A golden moment'}</h2>
              <div className="reactions"><button>👍</button><button>❤️</button><button>😮</button></div>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

function BottomNav({ route, navigate }) {
  return (
    <footer className="bottom-nav">
      <button className={route === 'home' ? 'active' : ''} onClick={() => navigate('/')}>Home</button>
      <button className={route === 'album' ? 'active' : ''} onClick={() => navigate('/#album')}>Album</button>
      <button className={route === 'admin' ? 'active' : ''} onClick={() => navigate('/#admin')}>Admin</button>
    </footer>
  )
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

createRoot(document.getElementById('root')).render(<App />)
