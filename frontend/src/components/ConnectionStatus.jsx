import { useState, useEffect } from 'react'
import { healthAPI } from '../services/api'

function ConnectionStatus() {
  const [status, setStatus] = useState('checking')
  const [lastChecked, setLastChecked] = useState(null)

  useEffect(() => {
    checkConnection()
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkConnection = async () => {
    try {
      setStatus('checking')
      await healthAPI.check()
      setStatus('connected')
      setLastChecked(new Date())
    } catch (error) {
      setStatus('disconnected')
      setLastChecked(new Date())
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'success'
      case 'disconnected': return 'danger'
      case 'checking': return 'warning'
      default: return 'secondary'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Backend Connected'
      case 'disconnected': return 'Backend Disconnected'
      case 'checking': return 'Checking Connection...'
      default: return 'Unknown Status'
    }
  }

  return (
    <div className={`alert alert-${getStatusColor()} d-flex justify-content-between align-items-center mb-3`}>
      <div>
        <strong>{getStatusText()}</strong>
        {lastChecked && (
          <small className="d-block">
            Last checked: {lastChecked.toLocaleTimeString()}
          </small>
        )}
      </div>
      <button 
        className={`btn btn-outline-${getStatusColor()} btn-sm`}
        onClick={checkConnection}
        disabled={status === 'checking'}
      >
        {status === 'checking' ? 'Checking...' : 'Refresh'}
      </button>
    </div>
  )
}

export default ConnectionStatus
