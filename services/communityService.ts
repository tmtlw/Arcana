
import { store, Ops } from './data';
import { Reading, Spread, Comment, Lesson, CommunityBadge, BadgeRequest, TarotNotification, CommunityEvent, ShopItem, User } from '../types';

const COLLECTION_READINGS = 'public_readings';
const COLLECTION_SPREADS = 'public_spreads';
const COLLECTION_LESSONS = 'public_lessons';
const COLLECTION_BADGES = 'community_badges';
const COLLECTION_REQUESTS = 'badge_requests';
const COLLECTION_NOTIFICATIONS = 'notifications';
const COLLECTION_EVENTS = 'community_events';
const COLLECTION_MARKET = 'market_items'; // New collection for generic market items

export const CommunityService = {
    
    // --- Readings ---

    publishReading: async (reading: Reading) => {
        if (!store.available) return false;
        try {
            const docRef = [COLLECTION_READINGS, reading.id];
            const cleanReading = JSON.parse(JSON.stringify(reading));
            cleanReading.isPublic = true;
            cleanReading.likes = cleanReading.likes || 0;
            cleanReading.likedBy = []; 
            cleanReading.comments = []; 
            
            await store.set(docRef, cleanReading);
            return true;
        } catch (e) {
            console.error("Error publishing reading (Check permissions):", e);
            return false;
        }
    },

    unpublishReading: async (readingId: string) => {
        if (!store.available) return;
        try {
            await store.remove([COLLECTION_READINGS, readingId]);
        } catch (e) {
            console.error("Error unpublishing reading:", e);
        }
    },

    deletePublicReadingsByUser: async (userId: string) => {
        if (!store.available) return;
        try {
            const docs = await store.list([COLLECTION_READINGS], { where: [['userId', '==', userId]] });
            if (docs.length === 0) return;
            const batch = store.batch();
            docs.forEach(d => batch.remove(d.path));
            await batch.commit();
        } catch (e) {
            console.error("Error wiping user readings:", e);
        }
    },

    deletePublicReading: async (readingId: string) => {
        if (!store.available) return false;
        try {
            await store.remove([COLLECTION_READINGS, readingId]);
            return true;
        } catch (e) {
            console.error("Admin delete error:", e);
            return false;
        }
    },

    getPublicReadings: async (limitCount: number = 30): Promise<Reading[]> => {
        if (!store.available) return [];
        try {
            const docs = await store.list<Reading>([COLLECTION_READINGS], { orderBy: [['date', 'desc']], limit: limitCount });
            return docs.map(d => d.data);
        } catch (e) {
            console.error("Error fetching readings:", e);
            return [];
        }
    },

    // --- Like Logic ---
    toggleLike: async (readingId: string, userId: string): Promise<'added' | 'removed' | null> => {
        if (!store.available || !userId) return null;
        
        try {
            const docRef = [COLLECTION_READINGS, readingId];
            const data = await store.get<any>(docRef);

            if (data) {
                const likedBy = data.likedBy || [];
                
                if (likedBy.includes(userId)) {
                    await store.update(docRef, {
                        likedBy: Ops.arrayRemove(userId),
                        likes: Ops.increment(-1)
                    });
                    return 'removed';
                } else {
                    await store.update(docRef, {
                        likedBy: Ops.arrayUnion(userId),
                        likes: Ops.increment(1)
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
        if (!store.available) return false;
        try {
            const docRef = [COLLECTION_READINGS, readingId];
            await store.update(docRef, {
                comments: Ops.arrayUnion(comment)
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
        if (!store.available) return false;
        try {
            const docRef = [COLLECTION_READINGS, readingId];
            const data = await store.get<Reading>(docRef);
            if (data) {
                const newComments = (data.comments || []).filter(c => c.id !== comment.id);
                await store.update(docRef, { comments: newComments });
            }
            return true;
        } catch (e) {
            console.error("Error deleting comment:", e);
            return false;
        }
    },

    updateComment: async (readingId: string, commentId: string, newText: string): Promise<boolean> => {
        if (!store.available) return false;
        try {
            const docRef = [COLLECTION_READINGS, readingId];
            const data = await store.get<Reading>(docRef);
            if (data) {
                const comments = data.comments || [];
                const updatedComments = comments.map(c => 
                    c.id === commentId ? { ...c, text: newText, isEdited: true } : c
                );
                await store.update(docRef, { comments: updatedComments });
            }
            return true;
        } catch (e) {
            console.error("Error updating comment:", e);
            return false;
        }
    },

    // --- Events (Rituals, Circles) ---

    createEvent: async (event: CommunityEvent): Promise<boolean> => {
        if (!store.available) return false;
        try {
            await store.set([COLLECTION_EVENTS, event.id], event);
            return true;
        } catch (e) {
            console.error("Create event failed:", e);
            return false;
        }
    },

    getEvents: async (limitCount: number = 50): Promise<CommunityEvent[]> => {
        if (!store.available) return [];
        try {
            const docs = await store.list<CommunityEvent>([COLLECTION_EVENTS], { orderBy: [['date', 'asc']], limit: limitCount });
            return docs.map(d => d.data);
        } catch (e) {
            console.error("Error fetching events:", e);
            return [];
        }
    },

    joinEvent: async (eventId: string, userId: string, userName: string, avatar?: string): Promise<boolean> => {
        if (!store.available || !userId) return false;
        try {
            const ref = [COLLECTION_EVENTS, eventId];
            await store.update(ref, {
                participants: Ops.arrayUnion(userId),
                participantDetails: Ops.arrayUnion({ uid: userId, name: userName, avatar })
            });
            return true;
        } catch (e) {
            console.error("Join event failed:", e);
            return false;
        }
    },

    leaveEvent: async (eventId: string, userId: string, userName: string, avatar?: string): Promise<boolean> => {
        if (!store.available || !userId) return false;
        try {
            const ref = [COLLECTION_EVENTS, eventId];
            await store.update(ref, {
                participants: Ops.arrayRemove(userId),
                participantDetails: Ops.arrayRemove({ uid: userId, name: userName, avatar })
            });
            return true;
        } catch (e) {
            console.error("Leave event failed:", e);
            return false;
        }
    },

    deleteEvent: async (eventId: string): Promise<boolean> => {
        if (!store.available) return false;
        try {
            await store.remove([COLLECTION_EVENTS, eventId]);
            return true;
        } catch (e) {
            return false;
        }
    },

    // --- Spreads (Marketplace) ---

    publishSpread: async (spread: Spread, authorName: string, userId: string, price: number = 0) => {
        if (!store.available) return false;
        try {
            const docRef = [COLLECTION_SPREADS, spread.id];
            const publicSpread: Spread = {
                ...spread,
                author: authorName,
                userId: userId,
                isPublic: true,
                downloads: spread.downloads || 0,
                price
            };
            await store.set(docRef, publicSpread);
            return true;
        } catch (e) {
            console.error("Publish spread failed:", e);
            return false;
        }
    },

    unpublishSpread: async (spreadId: string) => {
        if (!store.available) return;
        try {
            await store.remove([COLLECTION_SPREADS, spreadId]);
        } catch (e) {}
    },

    deleteSpreadsByUser: async (userId: string) => {
        if (!store.available) return;
        try {
            const docs = await store.list([COLLECTION_SPREADS], { where: [['userId', '==', userId]] });
            if (docs.length === 0) return;
            const batch = store.batch();
            docs.forEach(d => batch.remove(d.path));
            await batch.commit();
        } catch (e) {}
    },

    deletePublicSpread: async (spreadId: string) => {
        if (!store.available) return false;
        try {
            await store.remove([COLLECTION_SPREADS, spreadId]);
            return true;
        } catch (e) {
            return false;
        }
    },

    getPublicSpreads: async (): Promise<Spread[]> => {
        if (!store.available) return [];
        try {
            const docs = await store.list<Spread>([COLLECTION_SPREADS], { limit: 50 });
            return docs.map(d => d.data);
        } catch (e) {
            return [];
        }
    },

    downloadSpread: async (spreadId: string) => {
        if (!store.available) return;
        try {
            const docRef = [COLLECTION_SPREADS, spreadId];
            await store.update(docRef, {
                downloads: Ops.increment(1)
            });
        } catch (e) {}
    },

    // --- Ratings (General) ---
    rateItem: async (collectionName: string, itemId: string, userId: string, rating: number): Promise<boolean> => {
        if (!store.available) return false;
        try {
            // Store the rating in a subcollection to avoid document size limits and allow easy averaging
            const ratingRef = [collectionName, itemId, 'ratings', userId];

            // 1. Set the user's rating
            await store.set(ratingRef, {
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

            const ratings = await store.list<{ rating: number }>([collectionName, itemId, 'ratings']);
            let sum = 0;
            let count = 0;
            ratings.forEach(r => {
                sum += r.data.rating;
                count++;
            });

            await store.update([collectionName, itemId], {
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
        if (!store.available) return { avg: 0, count: 0 };
        try {
            const ratings = await store.list<{ rating: number; userId?: string }>([collectionName, itemId, 'ratings']);
            let sum = 0;
            let count = 0;
            let userRating = undefined;

            ratings.forEach(r => {
                const data = r.data;
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
        if (!store.available) return false;
        try {
            const docRef = [collectionName, itemId];
            await store.update(docRef, {
                comments: Ops.arrayUnion(comment)
            });
            return true;
        } catch (e) {
            console.error("Add item comment failed:", e);
            return false;
        }
    },

    deleteItemComment: async (collectionName: string, itemId: string, comment: Comment): Promise<boolean> => {
        if (!store.available) return false;
        try {
            const docRef = [collectionName, itemId];
            // Firestore arrayRemove needs exact object match.
            // If checking exact object is hard, we might need to read-modify-write.
            const data = await store.get<any>(docRef);
            if (data) {
                const comments = data.comments || [];
                const newComments = comments.filter((c: Comment) => c.id !== comment.id);
                await store.update(docRef, { comments: newComments });
            }
            return true;
        } catch (e) {
            return false;
        }
    },

    // --- Lessons (Academy Marketplace) ---

    publishLesson: async (lesson: Lesson, authorName: string, userId: string, price: number = 0) => {
        if (!store.available) return false;
        try {
            const docRef = [COLLECTION_LESSONS, lesson.id];
            const publicLesson: Lesson = {
                ...lesson,
                author: authorName,
                userId: userId,
                isPublic: true,
                downloads: lesson.downloads || 0,
                price
            };
            await store.set(docRef, publicLesson);
            return true;
        } catch (e) {
            console.error("Publish lesson failed:", e);
            return false;
        }
    },

    getPublicLessons: async (): Promise<Lesson[]> => {
        if (!store.available) return [];
        try {
            const docs = await store.list<Lesson>([COLLECTION_LESSONS], { limit: 50 });
            return docs.map(d => d.data);
        } catch (e) {
            return [];
        }
    },

    deleteLessonsByUser: async (userId: string) => {
        if (!store.available) return;
        try {
            const docs = await store.list([COLLECTION_LESSONS], { where: [['userId', '==', userId]] });
            if (docs.length === 0) return;
            const batch = store.batch();
            docs.forEach(d => batch.remove(d.path));
            await batch.commit();
        } catch (e) {}
    },

    downloadLesson: async (lessonId: string) => {
        if (!store.available) return;
        try {
            const docRef = [COLLECTION_LESSONS, lessonId];
            // Track download count
            await store.update(docRef, {
                downloads: Ops.increment(1)
            });
        } catch (e) {}
    },

    deletePublicLesson: async (lessonId: string) => {
        if (!store.available) return false;
        try {
            await store.remove([COLLECTION_LESSONS, lessonId]);
            return true;
        } catch (e) {
            return false;
        }
    },

    // --- Generic Marketplace Items (Backgrounds, Covers) ---

    createMarketplaceItem: async (item: ShopItem & { createdBy: string }) => {
        if (!store.available) return false;
        try {
            await store.set([COLLECTION_MARKET, item.id], item);
            return true;
        } catch (e) {
            console.error("Create market item failed:", e);
            return false;
        }
    },

    getMarketplaceItems: async (type?: string): Promise<ShopItem[]> => {
        if (!store.available) return [];
        try {
            const docs = await store.list<ShopItem>([COLLECTION_MARKET], type ? { where: [['type', '==', type]] } : undefined);
            return docs.map(d => d.data);
        } catch (e) {
            console.error("Fetch market items failed:", e);
            return [];
        }
    },

    deleteMarketplaceItem: async (itemId: string): Promise<boolean> => {
        if (!store.available) return false;
        try {
            await store.remove([COLLECTION_MARKET, itemId]);
            return true;
        } catch (e) {
            return false;
        }
    },

    // --- Community Badges (New Feature) ---

    publishCommunityBadge: async (badge: CommunityBadge) => {
        if (!store.available) return false;
        try {
            await store.set([COLLECTION_BADGES, badge.id], badge);
            return true;
        } catch (e) {
            console.error("Publish badge failed:", e);
            return false;
        }
    },

    getCommunityBadges: async (): Promise<CommunityBadge[]> => {
        if (!store.available) return [];
        try {
            const docs = await store.list<CommunityBadge>([COLLECTION_BADGES], { orderBy: [['likes', 'desc']], limit: 50 });
            const badges: CommunityBadge[] = [];
            docs.forEach(d => badges.push(d.data));
            return badges;
        } catch (e) {
            return [];
        }
    },

    toggleBadgeLike: async (badgeId: string, userId: string): Promise<boolean> => {
        if (!store.available || !userId) return false;
        const ref = [COLLECTION_BADGES, badgeId];
        const badge = await store.get<any>(ref);
        if (badge) {
            const likedBy = badge.likedBy || [];
            if (likedBy.includes(userId)) {
                await store.update(ref, { likedBy: Ops.arrayRemove(userId), likes: Ops.increment(-1) });
            } else {
                await store.update(ref, { likedBy: Ops.arrayUnion(userId), likes: Ops.increment(1) });
            }
            return true;
        }
        return false;
    },

    // --- Badge Requests (New Feature) ---

    submitBadgeRequest: async (request: BadgeRequest): Promise<boolean> => {
        if (!store.available) return false;
        try {
            // Check if already requested and pending
            const existing = await store.list([COLLECTION_REQUESTS], {
                where: [
                    ['requesterId', '==', request.requesterId],
                    ['badgeId', '==', request.badgeId],
                    ['status', '==', 'pending']
                ]
            });
            if (existing.length > 0) return false;

            await store.set([COLLECTION_REQUESTS, request.id], request);
            return true;
        } catch (e) {
            console.error("Submit request failed:", e);
            return false;
        }
    },

    getBadgeRequestsForCreator: async (creatorId: string): Promise<BadgeRequest[]> => {
        if (!store.available) return [];
        try {
            const docs = await store.list<BadgeRequest>([COLLECTION_REQUESTS], {
                where: [
                    ['creatorId', '==', creatorId],
                    ['status', '==', 'pending']
                ],
                orderBy: [['createdAt', 'desc']]
            });
            return docs.map(d => d.data);
        } catch (e) {
            console.error("Fetch requests failed:", e);
            return [];
        }
    },

    resolveBadgeRequest: async (requestId: string, status: 'approved' | 'rejected'): Promise<boolean> => {
        if (!store.available) return false;
        try {
            const ref = [COLLECTION_REQUESTS, requestId];
            await store.update(ref, { status });
            return true;
        } catch (e) {
            return false;
        }
    },

    // --- Notifications (Notification Center) ---

    addNotification: async (notif: TarotNotification) => {
        if (!store.available) return false;
        try {
            await store.set([COLLECTION_NOTIFICATIONS, notif.id], notif);
            return true;
        } catch (e) {
            console.error("Error adding notification:", e);
            return false;
        }
    },

    markNotificationAsRead: async (id: string) => {
        if (!store.available) return;
        try {
            await store.update([COLLECTION_NOTIFICATIONS, id], { isRead: true });
        } catch (e) {
            console.error("Error marking notification read:", e);
        }
    },

    markAllNotificationsAsRead: async (userId: string) => {
        if (!store.available) return;
        try {
            const docs = await store.list([COLLECTION_NOTIFICATIONS], {
                where: [
                    ['userId', '==', userId],
                    ['isRead', '==', false]
                ]
            });
            if (docs.length === 0) return;

            const batch = store.batch();
            docs.forEach(d => batch.update(d.path, { isRead: true }));
            await batch.commit();
        } catch (e) {
            console.error("Error marking all read:", e);
        }
    },

    // --- Global Settings (Admin) ---
    getCommunityCardStats: async () => {
        if (!store.available) return {};
        try {
            const docs = await store.list<Reading>(['public_readings'], { limit: 100 });
            const stats: Record<string, number> = {};
            docs.forEach(d => {
                const r = d.data;
                r.cards.forEach(c => {
                    stats[c.cardId] = (stats[c.cardId] || 0) + 1;
                });
            });
            return stats;
        } catch (e) {
            return {};
        }
    },

    getGlobalSettings: async () => {
        if (!store.available) return null;
        try {
            const docRef = ['settings', 'global'];
            return await store.get(docRef);
        } catch (e) {
            console.error("Error fetching settings:", e);
            return null;
        }
    },

    saveGlobalSettings: async (settings: any) => {
        if (!store.available) return;
        try {
            await store.set(['settings', 'global'], settings, { merge: true });
        } catch (e) {
            console.error("Error saving settings:", e);
            throw e;
        }
    },

    getUserByUsername: async (username: string): Promise<User | null> => {
        if (!store.available) return null;
        try {
            const docs = await store.list<User>(['users'], {
                where: [['username', '==', username], ['isPublicProfile', '==', true]],
                limit: 1
            });
            return docs.length ? docs[0].data : null;
        } catch (e) {
            console.error("Error fetching user by username:", e);
            return null;
        }
    }
};
