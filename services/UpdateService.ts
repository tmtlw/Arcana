// src/services/UpdateService.ts
import { getAuthHeaders } from './authToken';

export interface UpdateResponse {
  status: 'success' | 'error';
  message: string;
  has_update?: boolean;
  local_sha?: string;
  remote_sha?: string;
  backup_id?: string;
  backups?: string[];
}

// Abszolút útvonal a gyökérben lévő PHP fájlhoz (javítva relatívra a subdirectory támogatás miatt)
const UPDATER_URL = './updater.php';
// A szerver Firebase ID tokennel azonosít és az admin allowlistet ellenőrzi (lásd lib/bootstrap.php).
const getHeaders = () => getAuthHeaders({ 'Content-Type': 'application/json' });

export const UpdateService = {
  /**
   * Ellenőrzi, van-e elérhető frissítés.
   */
  async checkForUpdates(): Promise<UpdateResponse> {
    try {
      const response = await fetch(`${UPDATER_URL}?action=check`, {
          method: 'GET',
          headers: await getHeaders()
      });
      if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Update check failed:", error);
      return { status: 'error', message: 'Nem sikerült ellenőrizni a frissítéseket.' };
    }
  },

  /**
   * Elindítja a frissítési folyamatot.
   */
  async performUpdate(): Promise<UpdateResponse> {
    try {
      const response = await fetch(`${UPDATER_URL}?action=update`, {
          method: 'POST', // POST a módosításhoz
          headers: await getHeaders()
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error("Update failed:", error);
      return { status: 'error', message: 'A frissítés sikertelen volt.' };
    }
  },

  /**
   * Lekéri a korábbi biztonsági mentéseket.
   */
  async listBackups(): Promise<UpdateResponse> {
    try {
      const response = await fetch(`${UPDATER_URL}?action=list_backups`, {
          headers: await getHeaders()
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      return { status: 'error', message: 'Nem sikerült lekérni a mentéseket.' };
    }
  },

  /**
   * Visszaállít egy korábbi mentést.
   */
  async restoreBackup(backupId: string): Promise<UpdateResponse> {
    try {
      const response = await fetch(`${UPDATER_URL}?action=restore&id=${encodeURIComponent(backupId)}`, {
          method: 'POST',
          headers: await getHeaders()
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      return { status: 'error', message: 'A visszaállítás sikertelen volt.' };
    }
  }
};
