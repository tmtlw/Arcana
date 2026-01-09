
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, doc, updateDoc, increment, deleteDoc, setDoc, getDoc, where, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Reading, Spread, Comment, Lesson, CommunityBadge, BadgeRequest, TarotNotification, CommunityEvent } from '../types';

const COLLECTION_READINGS = 'public_readings';
const COLLECTION_SPREADS = 'public_spreads';
const COLLECTION_LESSONS = 'public_lessons';
const COLLECTION_BADGES = 'community_badges';
const COLLECTION_REQUESTS = 'badge_requests';
const COLLECTION_NOTIFICATIONS = 'notifications';
const COLLECTION_EVENTS = 'community_events';

export const CommunityService = {
    
    // --- Readings ---

    publishReading: async (reading: Reading) => {
        if (!db) return false;
        try {
            const docRef = doc(db, COLLECTION_READINGS, reading.id);
            const cleanReading = JSON.parse(JSON.stringify(reading));
            cleanReading.isPublic = true;
            cleanReading.likes = cleanReading.likes || 0;
            cleanReading.likedBy = []; 
            cleanReading.comments = []; 
            
            await setDoc(docRef, cleanReading);
            return true;
        } catch (e) {
            console.error("Error publishing reading (Check permissions):", e);
            return false;
        }
    },

    unpublishReading: async (readingId: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, COLLECTION_READINGS, readingId));
        } catch (e) {
            console.error("Error unpublishing reading:", e);
        }
    },

    deletePublicReadingsByUser: async (userId: string) => {
        if (!db) return;
        try {
            const q = query(collection(db, COLLECTION_READINGS), where('userId', '==', userId));
            const snap = await getDocs(q);
            if(snap.empty) return;
            const batch = writeBatch(db);
            snap.forEach(d => batch.delete(d.ref));
            await batch.commit();
        } catch (e) {
            console.error("Error wiping user readings:", e);
        }
    },

    deletePublicReading: async (readingId: string) => {
        if (!db) return false;
        try {
            await deleteDoc(doc(db, COLLECTION_READINGS, readingId));
            return true;
        } catch (e) {
            console.error("Admin delete error:", e);
            return false;
        }
    },

    getPublicReadings: async (limitCount: number = 30): Promise<Reading[]> => {
        if (!db) return [];
        try {
            const q = query(collection(db, COLLECTION_READINGS), orderBy('date', 'desc'), limit(limitCount));
            const querySnapshot = await getDocs(q);
            const readings: Reading[] = [];
            querySnapshot.forEach((doc) => {
                readings.push(doc.data() as Reading);
            });
            return readings;
        } catch (e) {
            console.error("Error fetching readings:", e);
            return [];
        }
    },

    // --- Like Logic ---
    toggleLike: async (readingId: string, userId: string): Promise<'added' | 'removed' | null> => {
        if (!db || !userId) return null;
        
        try {
            const docRef = doc(db, COLLECTION_READINGS, readingId);
            const snap = await getDoc(docRef);
            
            if (snap.exists()) {
                const data = snap.data();
                const likedBy = data.likedBy || [];
                
                if (likedBy.includes(userId)) {
                    await updateDoc(docRef, {
                        likedBy: arrayRemove(userId),
                        likes: increment(-1)
                    });
                    return 'removed';
                } else {
                    await updateDoc(docRef, {
                        likedBy: arrayUnion(userId),
                        likes: increment(1)
                    });
                    return 'added';
                }
            }
            return null;
        } catch (e) {
            console.error("Error toggling like:", e);
            return null;
        }
    },

    // --- Comments Logic ---

    addComment: async (readingId: string, comment: Comment): Promise<boolean> => {
        if (!db) return false;
        try {
            const docRef = doc(db, COLLECTION_READINGS, readingId);
            await updateDoc(docRef, {
                comments: arrayUnion(comment)
            });

            // --- Megjelölések (Mentions) felismerése és értesítés küldése ---
            const mentionRegex = /@\[([^\]]+):([^\]]+)\]/g;
            const matches = [...comment.text.matchAll(mentionRegex)];
            const uniqueUserIds = [...new Set(matches.map(m => m[1]))];

            for (const targetUid of uniqueUserIds) {
                if (targetUid === comment.userId) continue; // Saját magát ne értesítse
                
                const notif: TarotNotification = {
                    id: `mnt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    userId: targetUid,
                    type: 'mention',
                    title: 'Megjelöltek! 💬',
                    message: `${comment.userName} megemlített egy hozzászólásban a faliújságon.`,
                    link: readingId,
                    isRead: false,
                    createdAt: new Date().toISOString()
                };
                await CommunityService.addNotification(notif);
            }

            return true;
        } catch (e) {
            console.error("Error adding comment:", e);
            return false;
        }
    },

    deleteComment: async (readingId: string, comment: Comment): Promise<boolean> => {
        if (!db) return false;
        try {
            const docRef = doc(db, COLLECTION_READINGS, readingId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data() as Reading;
                const newComments = (data.comments || []).filter(c => c.id !== comment.id);
                await updateDoc(docRef, { comments: newComments });
            }
            return true;
        } catch (e) {
            console.error("Error deleting comment:", e);
            return false;
        }
    },

    updateComment: async (readingId: string, commentId: string, newText: string): Promise<boolean> => {
        if (!db) return false;
        try {
            const docRef = doc(db, COLLECTION_READINGS, readingId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data() as Reading;
                const comments = data.comments || [];
                const updatedComments = comments.map(c => 
                    c.id === commentId ? { ...c, text: newText, isEdited: true } : c
                );
                await updateDoc(docRef, { comments: updatedComments });
            }
            return true;
        } catch (e) {
            console.error("Error updating comment:", e);
            return false;
        }
    },

    // --- Events (Rituals, Circles) ---

    createEvent: async (event: CommunityEvent): Promise<boolean> => {
        if (!db) return false;
        try {
            await setDoc(doc(db, COLLECTION_EVENTS, event.id), event);
            return true;
        } catch (e) {
            console.error("Create event failed:", e);
            return false;
        }
    },

    getEvents: async (limitCount: number = 50): Promise<CommunityEvent[]> => {
        if (!db) return [];
        try {
            const q = query(collection(db, COLLECTION_EVENTS), orderBy('date', 'asc'), limit(limitCount));
            const snap = await getDocs(q);
            const events: CommunityEvent[] = [];
            snap.forEach(d => events.push(d.data() as CommunityEvent));
            return events;
        } catch (e) {
            console.error("Error fetching events:", e);
            return [];
        }
    },

    joinEvent: async (eventId: string, userId: string, userName: string, avatar?: string): Promise<boolean> => {
        if (!db || !userId) return false;
        try {
            const ref = doc(db, COLLECTION_EVENTS, eventId);
            await updateDoc(ref, {
                participants: arrayUnion(userId),
                participantDetails: arrayUnion({ uid: userId, name: userName, avatar })
            });
            return true;
        } catch (e) {
            console.error("Join event failed:", e);
            return false;
        }
    },

    leaveEvent: async (eventId: string, userId: string, userName: string, avatar?: string): Promise<boolean> => {
        if (!db || !userId) return false;
        try {
            const ref = doc(db, COLLECTION_EVENTS, eventId);
            await updateDoc(ref, {
                participants: arrayRemove(userId),
                participantDetails: arrayRemove({ uid: userId, name: userName, avatar })
            });
            return true;
        } catch (e) {
            console.error("Leave event failed:", e);
            return false;
        }
    },

    deleteEvent: async (eventId: string): Promise<boolean> => {
        if (!db) return false;
        try {
            await deleteDoc(doc(db, COLLECTION_EVENTS, eventId));
            return true;
        } catch (e) {
            return false;
        }
    },

    // --- Spreads (Marketplace) ---

    publishSpread: async (spread: Spread, authorName: string, userId: string) => {
        if (!db) return false;
        try {
            const docRef = doc(db, COLLECTION_SPREADS, spread.id);
            const publicSpread: Spread = {
                ...spread,
                author: authorName,
                userId: userId,
                isPublic: true,
                downloads: spread.downloads || 0
            };
            await setDoc(docRef, publicSpread);
            return true;
        } catch (e) {
            console.error("Publish spread failed:", e);
            return false;
        }
    },

    unpublishSpread: async (spreadId: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, COLLECTION_SPREADS, spreadId));
        } catch (e) {}
    },

    deleteSpreadsByUser: async (userId: string) => {
        if (!db) return;
        try {
            const q = query(collection(db, COLLECTION_SPREADS), where('userId', '==', userId));
            const snap = await getDocs(q);
            if(snap.empty) return;
            const batch = writeBatch(db);
            snap.forEach(d => batch.delete(d.ref));
            await batch.commit();
        } catch (e) {}
    },

    deletePublicSpread: async (spreadId: string) => {
        if (!db) return false;
        try {
            await deleteDoc(doc(db, COLLECTION_SPREADS, spreadId));
            return true;
        } catch (e) {
            return false;
        }
    },

    getPublicSpreads: async (): Promise<Spread[]> => {
        if (!db) return [];
        try {
            const q = query(collection(db, COLLECTION_SPREADS), limit(50));
            const querySnapshot = await getDocs(q);
            const spreads: Spread[] = [];
            querySnapshot.forEach((doc) => {
                spreads.push(doc.data() as Spread);
            });
            return spreads;
        } catch (e) {
            return [];
        }
    },

    downloadSpread: async (spreadId: string) => {
        if (!db) return;
        try {
            const docRef = doc(db, COLLECTION_SPREADS, spreadId);
            await updateDoc(docRef, {
                downloads: increment(1)
            });
        } catch (e) {}
    },

    // --- Ratings (General) ---
    rateItem: async (collectionName: string, itemId: string, userId: string, rating: number): Promise<boolean> => {
        if (!db) return false;
        try {
            // Store the rating in a subcollection to avoid document size limits and allow easy averaging
            const ratingRef = doc(collection(db, collectionName, itemId, 'ratings'), userId);

            // 1. Set the user's rating
            await setDoc(ratingRef, {
                userId,
                rating,
                timestamp: new Date().toISOString()
            });

            // 2. Update aggregate data on the main item (optional but good for performance)
            // Note: For precise averages, we might need a cloud function, but here we approximate or re-calc on load if needed.
            // For now, we will trust the client to re-fetch averages or handle it via a separate read.
            // Actually, let's just store the count and sum on the main doc for easy access.

            // To do this atomically is hard without a transaction reading all votes.
            // Simplified approach: Just add the rating to the subcollection.
            // The client will need to fetch ratings to calculate average, OR we trigger an aggregation.
            // Let's do a simple aggregation here by reading all ratings (assuming < 1000 ratings usually).

            const ratingsSnap = await getDocs(collection(db, collectionName, itemId, 'ratings'));
            let sum = 0;
            let count = 0;
            ratingsSnap.forEach(doc => {
                sum += doc.data().rating;
                count++;
            });

            await updateDoc(doc(db, collectionName, itemId), {
                ratingAvg: count > 0 ? sum / count : 0,
                ratingCount: count
            });

            return true;
        } catch (e) {
            console.error("Rate item failed:", e);
            return false;
        }
    },

    getItemRatings: async (collectionName: string, itemId: string, userId?: string): Promise<{ avg: number, count: number, userRating?: number }> => {
        if (!db) return { avg: 0, count: 0 };
        try {
            const ratingsSnap = await getDocs(collection(db, collectionName, itemId, 'ratings'));
            let sum = 0;
            let count = 0;
            let userRating = undefined;

            ratingsSnap.forEach(doc => {
                const data = doc.data();
                sum += data.rating;
                count++;
                if (userId && data.userId === userId) {
                    userRating = data.rating;
                }
            });

            return {
                avg: count > 0 ? sum / count : 0,
                count,
                userRating
            };
        } catch (e) {
            return { avg: 0, count: 0 };
        }
    },

    // --- Comments (General for Marketplace) ---
    addItemComment: async (collectionName: string, itemId: string, comment: Comment): Promise<boolean> => {
        if (!db) return false;
        try {
            const docRef = doc(db, collectionName, itemId);
            await updateDoc(docRef, {
                comments: arrayUnion(comment)
            });
            return true;
        } catch (e) {
            console.error("Add item comment failed:", e);
            return false;
        }
    },

    deleteItemComment: async (collectionName: string, itemId: string, comment: Comment): Promise<boolean> => {
        if (!db) return false;
        try {
            const docRef = doc(db, collectionName, itemId);
            // Firestore arrayRemove needs exact object match.
            // If checking exact object is hard, we might need to read-modify-write.
            const snap = await getDoc(docRef);
            if(snap.exists()) {
                const data = snap.data();
                const comments = data.comments || [];
                const newComments = comments.filter((c: Comment) => c.id !== comment.id);
                await updateDoc(docRef, { comments: newComments });
            }
            return true;
        } catch (e) {
            return false;
        }
    },

    // --- Lessons (Academy Marketplace) ---

    publishLesson: async (lesson: Lesson, authorName: string, userId: string) => {
        if (!db) return false;
        try {
            const docRef = doc(db, COLLECTION_LESSONS, lesson.id);
            const publicLesson: Lesson = {
                ...lesson,
                author: authorName,
                userId: userId,
                isPublic: true,
                downloads: lesson.downloads || 0
            };
            await setDoc(docRef, publicLesson);
            return true;
        } catch (e) {
            console.error("Publish lesson failed:", e);
            return false;
        }
    },

    getPublicLessons: async (): Promise<Lesson[]> => {
        if (!db) return [];
        try {
            const q = query(collection(db, COLLECTION_LESSONS), limit(50));
            const snap = await getDocs(q);
            const lessons: Lesson[] = [];
            snap.forEach((doc) => {
                lessons.push(doc.data() as Lesson);
            });
            return lessons;
        } catch (e) {
            return [];
        }
    },

    deleteLessonsByUser: async (userId: string) => {
        if (!db) return;
        try {
            const q = query(collection(db, COLLECTION_LESSONS), where('userId', '==', userId));
            const snap = await getDocs(q);
            if (snap.empty) return;
            const batch = writeBatch(db);
            snap.forEach(d => batch.delete(d.ref));
            await batch.commit();
        } catch (e) {}
    },

    downloadLesson: async (lessonId: string) => {
        if (!db) return;
        try {
            const docRef = doc(db, COLLECTION_LESSONS, lessonId);
            // Track download count
            await updateDoc(docRef, {
                downloads: increment(1)
            });
        } catch (e) {}
    },

    deletePublicLesson: async (lessonId: string) => {
        if (!db) return false;
        try {
            await deleteDoc(doc(db, COLLECTION_LESSONS, lessonId));
            return true;
        } catch (e) {
            return false;
        }
    },

    // --- Community Badges (New Feature) ---

    publishCommunityBadge: async (badge: CommunityBadge) => {
        if (!db) return false;
        try {
            await setDoc(doc(db, COLLECTION_BADGES, badge.id), badge);
            return true;
        } catch (e) {
            console.error("Publish badge failed:", e);
            return false;
        }
    },

    getCommunityBadges: async (): Promise<CommunityBadge[]> => {
        if (!db) return [];
        try {
            const q = query(collection(db, COLLECTION_BADGES), orderBy('likes', 'desc'), limit(50));
            const snap = await getDocs(q);
            const badges: CommunityBadge[] = [];
            snap.forEach(d => badges.push(d.data() as CommunityBadge));
            return badges;
        } catch (e) {
            return [];
        }
    },

    toggleBadgeLike: async (badgeId: string, userId: string): Promise<boolean> => {
        if (!db || !userId) return false;
        const ref = doc(db, COLLECTION_BADGES, badgeId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const likedBy = snap.data().likedBy || [];
            if (likedBy.includes(userId)) {
                await updateDoc(ref, { likedBy: arrayRemove(userId), likes: increment(-1) });
            } else {
                await updateDoc(ref, { likedBy: arrayUnion(userId), likes: increment(1) });
            }
            return true;
        }
        return false;
    },

    // --- Badge Requests (New Feature) ---

    submitBadgeRequest: async (request: BadgeRequest): Promise<boolean> => {
        if (!db) return false;
        try {
            // Check if already requested and pending
            const q = query(
                collection(db, COLLECTION_REQUESTS), 
                where('requesterId', '==', request.requesterId),
                where('badgeId', '==', request.badgeId),
                where('status', '==', 'pending')
            );
            const snap = await getDocs(q);
            if (!snap.empty) return false;

            await setDoc(doc(db, COLLECTION_REQUESTS, request.id), request);
            return true;
        } catch (e) {
            console.error("Submit request failed:", e);
            return false;
        }
    },

    getBadgeRequestsForCreator: async (creatorId: string): Promise<BadgeRequest[]> => {
        if (!db) return [];
        try {
            const q = query(
                collection(db, COLLECTION_REQUESTS), 
                where('creatorId', '==', creatorId),
                where('status', '==', 'pending'),
                orderBy('createdAt', 'desc')
            );
            const snap = await getDocs(q);
            const reqs: BadgeRequest[] = [];
            snap.forEach(d => reqs.push(d.data() as BadgeRequest));
            return reqs;
        } catch (e) {
            console.error("Fetch requests failed:", e);
            return [];
        }
    },

    resolveBadgeRequest: async (requestId: string, status: 'approved' | 'rejected'): Promise<boolean> => {
        if (!db) return false;
        try {
            const ref = doc(db, COLLECTION_REQUESTS, requestId);
            await updateDoc(ref, { status });
            return true;
        } catch (e) {
            return false;
        }
    },

    // --- Notifications (Notification Center) ---

    addNotification: async (notif: TarotNotification) => {
        if (!db) return false;
        try {
            await setDoc(doc(db, COLLECTION_NOTIFICATIONS, notif.id), notif);
            return true;
        } catch (e) {
            console.error("Error adding notification:", e);
            return false;
        }
    },

    markNotificationAsRead: async (id: string) => {
        if (!db) return;
        try {
            await updateDoc(doc(db, COLLECTION_NOTIFICATIONS, id), { isRead: true });
        } catch (e) {
            console.error("Error marking notification read:", e);
        }
    },

    markAllNotificationsAsRead: async (userId: string) => {
        if (!db) return;
        try {
            const q = query(
                collection(db, COLLECTION_NOTIFICATIONS), 
                where('userId', '==', userId),
                where('isRead', '==', false)
            );
            const snap = await getDocs(q);
            if (snap.empty) return;

            const batch = writeBatch(db);
            snap.forEach(d => batch.update(d.ref, { isRead: true }));
            await batch.commit();
        } catch (e) {
            console.error("Error marking all read:", e);
        }
    },

    // --- Global Settings (Admin) ---
    getGlobalSettings: async () => {
        if (!db) return null;
        try {
            const docRef = doc(db, 'settings', 'global');
            const snap = await getDoc(docRef);
            return snap.exists() ? snap.data() : null;
        } catch (e) {
            console.error("Error fetching settings:", e);
            return null;
        }
    },

    saveGlobalSettings: async (settings: any) => {
        if (!db) return;
        try {
            await setDoc(doc(db, 'settings', 'global'), settings, { merge: true });
        } catch (e) {
            console.error("Error saving settings:", e);
            throw e;
        }
    }
};
