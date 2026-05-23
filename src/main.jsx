import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Heart, Home, Image, MessageCircle, Shield, ThumbsUp, SmilePlus, Video, Upload, Crown, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import './styles.css';

const SAMPLE_PHOTOS = [
  { id: 1, chapter: 'Radiance', title: 'Golden Light', caption: 'A portrait worthy of the cover.', src: '/placeholder-gold.svg', reactions: { like: 12, heart: 28, wow: 9 } },
  { id: 2, chapter: 'Heart', title: 'Family Warmth', caption: 'The love that surrounds her.', src: '/placeholder-ivory.svg', reactions: { like: 9, heart: 21, wow: 4 } },
  { id: 3, chapter: 'Golden 50', title: 'The Celebration', caption: 'A night designed around beauty, joy, and legacy.', src: '/placeholder-black.svg', reactions: { like: 18, heart: 33, wow: 15 } },
];

function App() {
  const [view, setView] = useState('home');
  const [viewer, setViewer] = useState(() => JSON.parse(localStorage.getItem('sarika50_viewer') || 'null'));
  const [comments, setComments] = useState([{ name: 'Family', text: 'Can’t wait to celebrate Sarika!'}]);

  const saveViewer = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const profile = { firstName: form.get('firstName'), email: form.get('email') };
    localStorage.setItem('sarika50_viewer', JSON.stringify(profile));
    setViewer(profile);
  };

  return <main>
    <BackgroundGlow />
    {view === 'home' && <HomePage viewer={viewer} saveViewer={saveViewer} setView={setView} />}
    {view === 'album' && <AlbumPage photos={SAMPLE_PHOTOS} viewer={viewer} comments={comments} setComments={setComments} />}
    {view === 'messages' && <VideoMessages viewer={viewer} />}
    {view === 'admin' && <AdminPortal />}
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

function AlbumPage({ photos, viewer, comments, setComments }) {
  return <section className="screen album"><header><p className="eyebrow">Digital Photo Book</p><h2>Curated Moments</h2></header>
    <div className="photo-feed">{photos.map(photo => <PhotoCard key={photo.id} photo={photo} viewer={viewer} comments={comments} setComments={setComments} />)}</div>
  </section>;
}

function PhotoCard({ photo, viewer, comments, setComments }) {
  const [localReactions, setLocalReactions] = useState(photo.reactions);
  const addComment = (e) => { e.preventDefault(); const text = new FormData(e.currentTarget).get('comment'); if(!text.trim()) return; setComments([{ name: viewer?.firstName || 'Guest', text }, ...comments]); e.currentTarget.reset(); };
  const react = key => setLocalReactions({...localReactions, [key]: localReactions[key] + 1});
  return <article className="photo-card">
    <img src={photo.src} alt={photo.title} />
    <div className="photo-copy"><p className="chapter">{photo.chapter}</p><h3>{photo.title}</h3><p>{photo.caption}</p>
      <div className="reactions"><button onClick={()=>react('like')}><ThumbsUp/> {localReactions.like}</button><button onClick={()=>react('heart')}><Heart/> {localReactions.heart}</button><button onClick={()=>react('wow')}><SmilePlus/> {localReactions.wow}</button></div>
      <form className="comment-form" onSubmit={addComment}><input name="comment" placeholder={viewer ? 'Leave a comment' : 'Sign in to comment'} disabled={!viewer}/><button disabled={!viewer}>Post</button></form>
      <div className="comments">{comments.slice(0,2).map((c,i)=><p key={i}><b>{c.name}</b> {c.text}</p>)}</div>
    </div>
  </article>;
}

function VideoMessages({ viewer }) {
  return <section className="screen messages"><header><p className="eyebrow">Memory Wall</p><h2>Leave Sarika a 30-second video message</h2></header>
    <div className="panel"><Video className="large-icon"/><p>Guests will record or upload a short tribute. In production, this connects to Cloudflare Stream Direct Creator Uploads with admin review before publishing.</p>
    <button disabled={!viewer}>Record Message</button>{!viewer && <small>Please sign in from the Home screen first.</small>}</div>
  </section>;
}

function AdminPortal() {
  return <section className="screen admin"><header><p className="eyebrow">Protected by Cloudflare Access</p><h2>Admin Portal</h2></header>
    <div className="grid"><AdminTile icon={<Upload/>} title="Upload & Curate" text="Bulk upload images, reorder photos, create chapters, publish/unpublish."/><AdminTile icon={<MessageCircle/>} title="Moderate" text="Approve comments and 30-second video messages before public display."/><AdminTile icon={<QrCode/>} title="Menu QR Code" text="Generate and place QR code on the printed menu invitation linking to this site."/><AdminTile icon={<Shield/>} title="Privacy" text="Viewers use first name + email only. Email addresses are never displayed publicly."/></div>
  </section>;
}
function AdminTile({icon,title,text}){ return <div className="tile">{icon}<h3>{title}</h3><p>{text}</p></div> }
function BottomNav({ view, setView }) { const items=[['home',Home,'Home'],['album',Image,'Album'],['messages',Video,'Messages'],['admin',Shield,'Admin']]; return <nav className="bottom-nav">{items.map(([key,Icon,label])=><button className={view===key?'active':''} key={key} onClick={()=>setView(key)}><Icon/><span>{label}</span></button>)}</nav> }

createRoot(document.getElementById('root')).render(<App />);
