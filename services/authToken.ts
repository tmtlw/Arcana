import { auth } from './firebase';

/** Az aktuális Firebase ID token Authorization fejlécként a PHP végpontokhoz. */
export const getAuthHeaders = async (extra: Record<string, string> = {}): Promise<Record<string, string>> => {
    const user = auth?.currentUser;
    if (!user) throw new Error('Nem vagy bejelentkezve.');
    const token = await user.getIdToken();
    return { ...extra, Authorization: `Bearer ${token}` };
};
