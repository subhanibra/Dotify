import { useEffect, useState } from 'react'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set } from 'firebase/database'

// TODO: add your Firebase config here
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DB_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

export default function OneDot() {
  const SIZE = 100

  const [pixels, setPixels] = useState(Array.from({ length: SIZE }, () => '#ffffff'))
  const [selected, setSelected] = useState('#3b82f6')
  const [cooldown, setCooldown] = useState(0)

  // Load from Firebase (realtime)
  useEffect(() => {
    const pixelRef = ref(db, 'pixels')

    onValue(pixelRef, (snapshot) => {
      const data = snapshot.val()
      if (data) setPixels(data)
    })
  }, [])

  // cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => {
      setCooldown(v => Math.max(0, v - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [cooldown])

  // paint pixel + sync
  const paint = (i) => {
    if (cooldown > 0) return

    const next = [...pixels]
    next[i] = selected
    setPixels(next)

    // send to Firebase (shared world)
    set(ref(db, 'pixels'), next)

    setCooldown(300) // 5 minutes
  }

  return (
    <div className='min-h-screen bg-black text-white p-8 font-sans'>
      <h1 className='text-5xl font-bold mb-2'>OneDot</h1>
      <p className='text-zinc-400 mb-6'>One pixel every 5 minutes — everyone shares the same canvas.</p>

      {/* Color picker */}
      <div className='flex gap-2 mb-4'>
        {['#ef4444','#22c55e','#3b82f6','#eab308','#ffffff','#000000'].map(c => (
          <button
            key={c}
            onClick={() => setSelected(c)}
            className='w-8 h-8 rounded-full border-2'
            style={{ background: c }}
          />
        ))}
      </div>

      <div className='mb-4 text-sm text-zinc-300'>
        Cooldown: {Math.floor(cooldown / 60)}:{String(cooldown % 60).padStart(2, '0')}
      </div>

      {/* Canvas */}
      <div className='grid grid-cols-10 gap-1 w-fit bg-zinc-800 p-2 rounded-2xl'>
        {pixels.map((color, i) => (
          <button
            key={i}
            onClick={() => paint(i)}
            className='w-8 h-8 border border-zinc-700'
            style={{ background: color }}
          />
        ))}
      </div>

      <p className='mt-6 text-xs text-zinc-500'>Realtime multiplayer enabled (Firebase)</p>
    </div>
  )
}
