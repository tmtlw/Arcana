// components/UpdateNotification.tsx
import React, { useEffect, useState } from 'react';
import { UpdateService, UpdateResponse } from '../services/UpdateService';
import { useTarot } from '../context/TarotContext';

export const UpdateNotification: React.FC = () => {
  const { currentUser } = useTarot();
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [details, setDetails] = useState<{local: string, remote: string} | null>(null);
  const [showBackupList, setShowBackupList] = useState<boolean>(false);
  const [backups, setBackups] = useState<string[]>([]);

  useEffect(() => {
    // Csak adminnak ellenőrizzük
    if (currentUser?.isAdmin) {
      check();
    }
  }, [currentUser]);

  const check = async () => {
    const result = await UpdateService.checkForUpdates();
    if (result.status === 'success' && result.has_update) {
      setUpdateAvailable(true);
      setDetails({
        local: result.local_sha || 'Ismeretlen',
        remote: result.remote_sha || 'Ismeretlen'
      });
    }
  };

  const handleUpdate = async () => {
    if (!window.confirm("Biztosan frissíteni szeretnéd a rendszert? A folyamat előtt biztonsági mentés készül.")) return;

    setLoading(true);
    setMessage("Frissítés folyamatban... Kérlek ne zárd be az ablakot.");

    const result = await UpdateService.performUpdate();
    setLoading(false);

    if (result.status === 'success') {
      setMessage(`Sikeres frissítés! (Backup ID: ${result.backup_id}) Az oldal újratöltődik...`);
      setTimeout(() => window.location.reload(), 3000);
    } else {
      setMessage(`Hiba történt: ${result.message}`);
    }
  };

  const fetchBackups = async () => {
    const result = await UpdateService.listBackups();
    if (result.status === 'success' && result.backups) {
      setBackups(result.backups);
      setShowBackupList(true);
    }
  };

  const handleRestore = async (id: string) => {
    if (!window.confirm(`Biztosan visszaállítod ezt a verziót: ${id}? A jelenlegi állapot elveszhet.`)) return;

    setLoading(true);
    setMessage("Visszaállítás folyamatban...");
    const result = await UpdateService.restoreBackup(id);
    setLoading(false);

    if (result.status === 'success') {
      setMessage("Sikeres visszaállítás! Az oldal újratöltődik...");
      setTimeout(() => window.location.reload(), 3000);
    } else {
      setMessage(`Hiba történt: ${result.message}`);
    }
  };

  // Ha nem admin, vagy nincs frissítés/üzenet/lista, ne jelenjen meg
  if (!currentUser?.isAdmin) return null;
  if (!updateAvailable && !showBackupList && !message) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#2c3e50',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 9999,
      maxWidth: '300px',
      fontFamily: 'sans-serif'
    }}>
      {message && <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>{message}</div>}

      {updateAvailable && !loading && (
        <div>
          <h4 style={{ margin: '0 0 10px 0' }}>Új verzió elérhető!</h4>
          <p style={{ fontSize: '0.8em', margin: '0 0 10px 0' }}>
            Jelenlegi: {details?.local.substring(0, 7)}...<br/>
            Új: {details?.remote.substring(0, 7)}...
          </p>
          <button
            onClick={handleUpdate}
            style={{
              background: '#27ae60',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%',
              marginBottom: '5px'
            }}
          >
            Frissítés most
          </button>
        </div>
      )}

      {!loading && (
        <div style={{ marginTop: '10px', borderTop: '1px solid #34495e', paddingTop: '5px' }}>
          {!showBackupList ? (
            <button
              onClick={fetchBackups}
              style={{
                background: 'transparent',
                color: '#bdc3c7',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8em',
                textDecoration: 'underline'
              }}
            >
              Mentések kezelése
            </button>
          ) : (
            <div>
              <h5 style={{ margin: '5px 0' }}>Elérhető mentések:</h5>
              <ul style={{ listStyle: 'none', padding: 0, maxHeight: '100px', overflowY: 'auto', fontSize: '0.8em' }}>
                {backups.length === 0 ? <li>Nincs mentés.</li> : backups.map(b => (
                  <li key={b} style={{ marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{b}</span>
                    <button onClick={() => handleRestore(b)} style={{ background: '#c0392b', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.8em' }}>Vissza</button>
                  </li>
                ))}
              </ul>
              <button onClick={() => setShowBackupList(false)} style={{ fontSize: '0.8em', background: 'transparent', color: '#bdc3c7', border: 'none', cursor: 'pointer' }}>Bezár</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
