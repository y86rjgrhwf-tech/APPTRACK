import { useState } from 'react'
import Nav from './Nav'
import Today from './Today'
import Gym from './Gym'
import Journal from './Journal'
import History from './History'
import Stats from './Stats'

export default function App() {
  const [tab, setTab] = useState('today')

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      color: 'var(--t1)',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'today'   && <Today />}
        {tab === 'history' && <History />}
        {tab === 'gym' && <Gym />}
        {tab === 'journal' && <Journal />}
        {tab === 'stats' && <Stats />}
      </div>
      <Nav active={tab} onChange={setTab} />
    </div>
  )
}