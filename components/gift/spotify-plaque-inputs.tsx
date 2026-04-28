'use client';

import { useState } from 'react';
import { uploadSongLyricsPhoto } from '@/app/(site)/gift/actions';
import { parseSpotifyTrackId } from '@/lib/gifts/spotify-plaque-svg';

type Props = {
  songTitle: string;
  onSongTitle: (s: string) => void;
  artistName: string;
  onArtistName: (s: string) => void;
  /** Full Spotify URL pasted by the customer. Track ID parsed downstream. */
  spotifyUrl: string;
  onSpotifyUrl: (s: string) => void;
  photoUrl: string;
  onPhotoUrl: (s: string) => void;
  onPhotoAssetId: (id: string) => void;
  productSlug: string;
};

export function SpotifyPlaqueInputs({
  songTitle, onSongTitle,
  artistName, onArtistName,
  spotifyUrl, onSpotifyUrl,
  photoUrl, onPhotoUrl, onPhotoAssetId,
  productSlug,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const trackId = parseSpotifyTrackId(spotifyUrl);
  const urlIsValid = spotifyUrl.trim().length === 0 || trackId !== null;

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 4,
    fontSize: 11,
    fontFamily: 'var(--pv-f-mono)',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--pv-muted)',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: '#fff',
    border: '2px solid var(--pv-ink)',
    fontFamily: 'var(--pv-f-body)',
    fontSize: 14,
  };

  return (
    <div style={{ padding: '20px 22px', display: 'grid', gap: 14 }}>
      <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pv-magenta)' }}>
        Make your Spotify plaque
      </div>

      {/* Photo */}
      <label style={{ display: 'block' }}>
        <span style={labelStyle}>Photo (centre image)</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          disabled={uploading}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            if (f.size > 15 * 1024 * 1024) { setUploadError('Photo too large (max 15 MB).'); return; }
            setUploading(true);
            setUploadError(null);
            try {
              const fd = new FormData();
              fd.set('file', f);
              fd.set('product_slug', productSlug);
              const res = await uploadSongLyricsPhoto(fd);
              if (!res.ok) {
                setUploadError(res.error || 'Upload failed.');
                return;
              }
              onPhotoUrl(res.displayUrl);
              onPhotoAssetId(res.sourceAssetId);
            } catch {
              setUploadError('Upload failed — please try again.');
            } finally {
              setUploading(false);
            }
          }}
          style={{ ...inputStyle, fontFamily: 'var(--pv-f-mono)', fontSize: 12, cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.6 : 1 }}
        />
        {uploading && (
          <div style={{ marginTop: 6, fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-magenta)' }}>Uploading…</div>
        )}
        {uploadError && (
          <div style={{ marginTop: 6, fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: '#c00' }}>{uploadError}</div>
        )}
        {photoUrl && !uploading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <img src={photoUrl} alt="" style={{ width: 56, height: 56, objectFit: 'cover', border: '2px solid var(--pv-ink)' }} />
            <button
              type="button"
              onClick={() => { onPhotoUrl(''); onPhotoAssetId(''); }}
              style={{ background: 'transparent', border: '1px solid var(--pv-ink)', padding: '6px 12px', fontFamily: 'var(--pv-f-mono)', fontSize: 11, cursor: 'pointer' }}
            >
              Remove
            </button>
          </div>
        )}
      </label>

      {/* Song title */}
      <label style={{ display: 'block' }}>
        <span style={labelStyle}>Song title</span>
        <input
          type="text"
          value={songTitle}
          onChange={(e) => onSongTitle(e.target.value.slice(0, 50))}
          placeholder="Your Favourite Song"
          style={inputStyle}
        />
      </label>

      {/* Artist name */}
      <label style={{ display: 'block' }}>
        <span style={labelStyle}>Artist name</span>
        <input
          type="text"
          value={artistName}
          onChange={(e) => onArtistName(e.target.value.slice(0, 50))}
          placeholder="Artist's Name"
          style={inputStyle}
        />
      </label>

      {/* Spotify URL */}
      <label style={{ display: 'block' }}>
        <span style={labelStyle}>Spotify URL</span>
        <input
          type="text"
          value={spotifyUrl}
          onChange={(e) => onSpotifyUrl(e.target.value)}
          placeholder="https://open.spotify.com/track/…"
          style={{ ...inputStyle, borderColor: urlIsValid ? 'var(--pv-ink)' : '#c00' }}
        />
        {spotifyUrl.trim().length > 0 && !trackId && (
          <div style={{ marginTop: 6, fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: '#c00' }}>
            Couldn&apos;t find a track ID. Paste a link like
            {' '}<code>https://open.spotify.com/track/...</code>
          </div>
        )}
        {trackId && (
          <div style={{ marginTop: 6, fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)' }}>
            Track ID detected: <code>{trackId}</code> — scan code will lift live from Spotify.
          </div>
        )}
      </label>
    </div>
  );
}
