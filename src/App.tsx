import { useEffect, useMemo, useRef, useState } from 'react'
import { Disc3, FolderOpen, ListMusic, Mic, Moon, Pause, Play, Radio, Search, SkipBack, SkipForward, Sparkles, Volume2, VolumeX, Waves, X } from 'lucide-react'
import Webamp from 'webamp'
import './App.css'

type Station = { id: string; name: string; genre: string; location: string; listeners: string; accent: string; stream: string; bitrate: number }
type LocalTrack = { name: string; url: string; size: string }
type RemoteSkin = { name: string; url: string; hash: string }

const stationAccents = ['#e0ff4f', '#71f6d2', '#c4a7ff', '#ff6b9d', '#ffb86b']

function secureStreamUrl(url: string) {
  return url.replace(/^http:\/\//i, 'https://').replace(/^(https:\/\/[^/]+):80\b/i, '$1')
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '00:00'
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
}

function App() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const webampHostRef = useRef<HTMLDivElement>(null)
  const webampRef = useRef<Webamp | null>(null)
  const skinObjectUrlRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null)
  const [stations, setStations] = useState<Station[]>([])
  const [activeStation, setActiveStation] = useState<Station | null>(null)
  const [stationsLoading, setStationsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'stations' | 'library'>('stations')
  const [query, setQuery] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.72)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackError, setPlaybackError] = useState('')
  const skin = 'acid'
  const [showSkinCatalog, setShowSkinCatalog] = useState(false)
  const [showWebamp, setShowWebamp] = useState(false)
  const [remoteSkins, setRemoteSkins] = useState<RemoteSkin[]>([])
  const [skinsLoading, setSkinsLoading] = useState(false)
  const [skinError, setSkinError] = useState('')
  const [selectedRemoteSkin, setSelectedRemoteSkin] = useState<RemoteSkin | null>(null)
  const [localTracks, setLocalTracks] = useState<LocalTrack[]>([])
  const [currentTrack, setCurrentTrack] = useState<LocalTrack | null>(null)
  const filteredStations = stations
  const filteredTracks = useMemo(() => localTracks.filter((track) => track.name.toLowerCase().includes(query.toLowerCase())), [localTracks, query])
  const title = currentTrack?.name || activeStation?.name || 'Shoutcast Directory'
  const subtitle = currentTrack ? 'LOCAL MP3' : activeStation ? `${activeStation.genre.toUpperCase()} / SHOUTCAST DIRECTORY` : 'CONNECTING TO SHOUTCAST'

  useEffect(() => { const audio = audioRef.current; if (audio) { audio.volume = volume; audio.muted = muted } }, [volume, muted])
  useEffect(() => { const audio = audioRef.current; if (!audio || (!currentTrack && !activeStation?.stream)) return; audio.src = currentTrack?.url || activeStation?.stream || ''; audio.load(); if (isPlaying) audio.play().catch(() => setIsPlaying(false)) }, [activeStation, currentTrack])
  useEffect(() => {
    const endpoint = query.trim() ? '/api/shoutcast/search' : '/api/shoutcast/top'
    const body = query.trim() ? `query=${encodeURIComponent(query.trim())}` : ''
    setStationsLoading(true)
    fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
      .then((response) => response.json())
      .then((items: Array<{ ID: number; Name: string; Genre: string; Listeners: number; Bitrate: number }>) => {
        const nextStations = items.map((item, index) => ({ id: String(item.ID), name: item.Name, genre: item.Genre || 'Misc', location: `${item.Bitrate || 0} KBPS`, listeners: Number(item.Listeners || 0).toLocaleString(), accent: stationAccents[index % stationAccents.length], stream: '', bitrate: item.Bitrate || 0 }))
        setStations(nextStations)
        if (!activeStation && nextStations[0]) {
          const firstStation = nextStations[0]
          fetch('/api/shoutcast/stream', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `station=${encodeURIComponent(firstStation.id)}` })
            .then((streamResponse) => streamResponse.json())
            .then((streamUrl) => {
              if (typeof streamUrl === 'string' && streamUrl) {
                setActiveStation({ ...firstStation, stream: secureStreamUrl(streamUrl) })
                setIsPlaying(false)
              }
            })
        }
      })
      .catch(() => setStations([]))
      .finally(() => setStationsLoading(false))
  }, [query])
  useEffect(() => () => localTracks.forEach((track) => URL.revokeObjectURL(track.url)), [localTracks])
  useEffect(() => {
    if (!showSkinCatalog || remoteSkins.length) return
    setSkinsLoading(true)
    fetch('/api/remote-skins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        params: 'query=&hitsPerPage=1000&attributesToRetrieve=objectID,fileName,color,nsfw&typoTolerance=min',
      }),
    })
      .then((response) => response.json())
      .then((payload) => {
        const skins = (payload.hits || []).filter((skin: { nsfw?: boolean }) => !skin.nsfw).map((skin: { objectID: string; fileName: string }) => {
          const filename = skin.fileName.replace(/\.zip$/i, '.wsz').replace(/\.wsz$/i, '.wsz')
          const url = `https://r2.webampskins.org/skins/${skin.objectID}.wsz`
          return { name: filename.replace(/\.wsz$/i, '').replace(/[_-]+/g, ' '), url, hash: skin.objectID }
        })
        setRemoteSkins(skins)
        if (!skins.length) setSkinError('No skins were returned by the remote catalog.')
      })
      .catch(() => setSkinError('The remote catalog could not be reached. Use the full catalog link below.'))
      .finally(() => setSkinsLoading(false))
  }, [showSkinCatalog, remoteSkins.length])
  useEffect(() => () => { webampRef.current?.dispose(); if (skinObjectUrlRef.current) URL.revokeObjectURL(skinObjectUrlRef.current) }, [])

  const togglePlayback = async () => {
    const audio = audioRef.current
    const source = currentTrack?.url || activeStation?.stream
    if (!audio || !source) return
    if (isPlaying) { audio.pause(); setIsPlaying(false); return }
    setPlaybackError('')
    if (audio.src !== source) { audio.src = source; audio.load() }
    try {
      await audio.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
      setPlaybackError('LIVE STREAM COULD NOT START. TRY ANOTHER STATION.')
    }
  }
  const selectStation = async (station: Station) => {
    setCurrentTrack(null)
    setActiveStation(station)
    setIsPlaying(false)
    const response = await fetch('/api/shoutcast/stream', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `station=${encodeURIComponent(station.id)}` })
    const streamUrl = await response.json()
    if (typeof streamUrl === 'string' && streamUrl) { setActiveStation({ ...station, stream: secureStreamUrl(streamUrl) }); setIsPlaying(false) }
  }
  const selectTrack = (track: LocalTrack) => { setCurrentTrack(track); setIsPlaying(true) }
  const addFiles = (files: FileList | null) => { if (!files?.length) return; const tracks = Array.from(files).filter((file) => file.type.startsWith('audio/')).map((file) => ({ name: file.name.replace(/\.[^/.]+$/, ''), url: URL.createObjectURL(file), size: `${(file.size / 1024 / 1024).toFixed(1)} MB` })); setLocalTracks((current) => [...current, ...tracks]); if (tracks[0]) selectTrack(tracks[0]) }
  const startVoiceSearch = () => { const speechWindow = window as Window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any }; const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition; if (!SpeechRecognition) return; if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return }; const recognition = new SpeechRecognition(); recognition.continuous = false; recognition.interimResults = false; recognition.onresult = (event: any) => setQuery(event.results[0][0].transcript); recognition.onend = () => setIsListening(false); recognition.onerror = () => setIsListening(false); recognitionRef.current = recognition; recognition.start(); setIsListening(true) }
  const applyRemoteSkin = async (remoteSkin: RemoteSkin) => {
    setSelectedRemoteSkin(remoteSkin)
    setShowSkinCatalog(false)
    setShowWebamp(true)
    const response = await fetch(`/api/remote-skin/${remoteSkin.hash}.wsz`)
    if (!response.ok) throw new Error(`Skin download failed with HTTP ${response.status}`)
    const skinBlob = await response.blob()
    if (skinObjectUrlRef.current) URL.revokeObjectURL(skinObjectUrlRef.current)
    skinObjectUrlRef.current = URL.createObjectURL(skinBlob)
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    if (!webampHostRef.current) return
    webampRef.current?.dispose()
    const webamp = new Webamp({ initialSkin: { url: skinObjectUrlRef.current } })
    webampRef.current = webamp
    await webamp.renderInto(webampHostRef.current)
  }

  return <main className={`app-shell skin-${skin}`}>
    {showWebamp && <div className="webamp-stage"><div className="webamp-toolbar"><span>REMOTE SKIN // {selectedRemoteSkin?.name}</span><button onClick={() => setShowWebamp(false)}>RETURN TO RADIOCORE</button></div><div className="webamp-host" ref={webampHostRef} /></div>}
    <audio ref={audioRef} preload="none" onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onError={() => { setIsPlaying(false); setPlaybackError('LIVE STREAM COULD NOT LOAD. TRY ANOTHER STATION.') }} onEnded={() => setIsPlaying(false)} />
    <section className="player-window">
      <header className="title-bar"><div className="brand-mark"><Disc3 size={18} /><span>W3</span></div><div className="window-title">WINAMP // RADIOCORE <span>v3.0.7</span></div><div className="window-actions"><button aria-label="Minimize"><Moon size={13} /></button><button aria-label="Close"><X size={14} /></button></div></header>
      <div className="now-playing"><div className="art-orb" style={{ '--accent': activeStation?.accent || '#e0ff4f' } as React.CSSProperties}><Waves size={43} strokeWidth={1.2} /></div><div className="track-info"><p className="eyebrow"><span className="live-dot" /> {currentTrack ? 'LOCAL FILE' : 'LIVE BROADCAST'}</p><h1>{title}</h1><p>{subtitle}</p><div className="meter">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div></div><div className="clock"><span>TIME</span>{formatTime(elapsed)}</div></div>
      <div className="seek-row"><span>{formatTime(elapsed)}</span><input type="range" min="0" max={duration || 1} value={Math.min(elapsed, duration || 1)} onChange={(event) => { const time = Number(event.target.value); if (audioRef.current) audioRef.current.currentTime = time; setElapsed(time) }} /><span>{currentTrack ? formatTime(duration) : 'LIVE'}</span></div>
      <div className="transport"><button aria-label="Previous station"><SkipBack size={15} /></button><button className="play-button" aria-label={isPlaying ? 'Pause' : 'Play'} onClick={togglePlayback}>{isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}</button><button aria-label="Next station" onClick={() => { if (stations.length) selectStation(stations[(stations.findIndex((station) => station.id === activeStation?.id) + 1) % stations.length]) }}><SkipForward size={15} /></button><div className="volume-control"><button aria-label="Mute" onClick={() => setMuted(!muted)}>{muted ? <VolumeX size={14} /> : <Volume2 size={14} />}</button><input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume} onChange={(event) => { setMuted(false); setVolume(Number(event.target.value)) }} /></div><span className="stereo">STEREO <b>●</b></span></div>
      <nav className="source-tabs"><button className={activeTab === 'stations' ? 'active' : ''} onClick={() => setActiveTab('stations')}><Radio size={14} /> LIVE STATIONS <span>{stations.length}</span></button><button className={activeTab === 'library' ? 'active' : ''} onClick={() => setActiveTab('library')}><ListMusic size={14} /> LOCAL LIBRARY <span>{localTracks.length}</span></button></nav>
      <div className="search-row"><div className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the airwaves..." /><button aria-label="Voice search" className={isListening ? 'listening' : ''} onClick={startVoiceSearch}><Mic size={15} /></button></div><button className="skin-button" onClick={() => setShowSkinCatalog(true)}><Sparkles size={14} /> SKINS</button></div>
      <div className="content-list">{activeTab === 'stations' ? (stationsLoading ? <p className="catalog-status">PULLING LIVE SHOUTCAST STATIONS...</p> : filteredStations.map((station) => <button className={`station-row ${activeStation?.id === station.id && !currentTrack ? 'selected' : ''}`} key={station.id} onClick={() => selectStation(station)}><span className="station-icon" style={{ '--accent': station.accent } as React.CSSProperties}><Radio size={16} /></span><span className="station-name"><strong>{station.name}</strong><small>{station.genre} <em>•</em> {station.location}</small></span><span className="listeners"><i /> {station.listeners}</span><span className="row-arrow">↗</span></button>)) : <>{filteredTracks.length ? filteredTracks.map((track) => <button className={`station-row ${currentTrack?.name === track.name ? 'selected' : ''}`} key={track.url} onClick={() => selectTrack(track)}><span className="station-icon local"><FolderOpen size={16} /></span><span className="station-name"><strong>{track.name}</strong><small>{track.size} <em>•</em> MP3 AUDIO</small></span><span className="row-arrow">↗</span></button>) : <div className="empty-library"><FolderOpen size={24} /><p>Your local library is quiet.</p><button onClick={() => fileInputRef.current?.click()}>ADD MP3 FILES</button></div>}</>}</div>{playbackError && <p className="catalog-status">{playbackError}</p>}
      <footer className="player-footer"><span>RADIOCORE ENGINE <b>ONLINE</b></span><button onClick={() => fileInputRef.current?.click()}><FolderOpen size={13} /> ADD LOCAL MP3</button><input ref={fileInputRef} type="file" accept="audio/*" multiple hidden onChange={(event) => addFiles(event.target.files)} /><span>CPU 0.4% / 128 MB</span></footer>
    </section><p className="outside-label">WINAMP 3 // THE FUTURE OF MUSIC, RECOMPILED</p>
    {showSkinCatalog && <div className="skin-overlay" role="dialog" aria-modal="true" aria-label="Webamp skin catalog"><div className="skin-modal"><header><div><span className="eyebrow">REMOTE CATALOG</span><h2>WEBAMP SKINS <small>{remoteSkins.length ? `// ${remoteSkins.length} LOADED` : ''}</small></h2></div><button aria-label="Close skin catalog" onClick={() => setShowSkinCatalog(false)}><X size={17} /></button></header><div className="remote-skin-list">{skinsLoading && <p className="catalog-status">PULLING LIVE CATALOG...</p>}{skinError && <p className="catalog-status">{skinError}</p>}{remoteSkins.map((remoteSkin) => <button key={remoteSkin.url} onClick={() => applyRemoteSkin(remoteSkin)}><span className="skin-swatch" /><span>{remoteSkin.name}</span><b>APPLY TO AMP</b></button>)}</div><footer><span>LIVE FROM SKINS.WEBAMP.ORG</span><a href="https://skins.webamp.org/" target="_blank" rel="noreferrer">OPEN FULL CATALOG ↗</a></footer></div></div>}
  </main>
}

export default App
