# EarnSmart Daily — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Published-Only Public Read**: Unauthenticated and non-admin visitors may ONLY read documents in `/articles/{articleId}` where `status == 'published'` and documents in `/advertisements/{adId}` where `active == true`. Draft articles and inactive ad slots are strictly invisible to non-admins.
2. **Admin-Only Content Mutation**: Creating, updating, or deleting `/articles`, `/categories`, `/advertisements`, and `/settings/site` requires an authenticated, email-verified user (`request.auth.token.email_verified == true`) who is either the bootstrapped site owner (`subhankarhal007@gmail.com`) or listed in `/admins/{uid}`.
3. **PII Isolation on Subscribers**: `/subscribers/{subscriberId}` allows public `create` with strict email regex and key validation, but strictly denies `get`, `list`, `update`, and `delete` to public visitors and non-admins.
4. **Immutable Authorship & Timestamps**: On `/articles/{articleId}`, `authorUid` must equal `request.auth.uid` on create and remain immutable on update. `createdAt` must equal `request.time` on create and remain immutable on update. `updatedAt` must always equal `request.time`.
5. **No Shadow Fields or Oversized Payloads**: Every collection validates exact required and allowed keys (`hasAll` + `hasOnly`), string `.size()` bounds, bounded tag arrays (`<= 10`), and document ID format (`^[a-zA-Z0-9_-]+$`, `<= 128`).
6. **Zero Privilege Escalation**: Non-admins cannot create, read, update, or delete `/admins/{uid}` documents.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Unauthenticated Article Creation**: Anonymous visitor attempts `setDoc(/articles/hack-post, { ... })`.
2. **Unverified Admin Email Spoof**: Authenticated user with `email: 'subhankarhal007@gmail.com'` and `email_verified: false` attempts to write to `/articles/spoof`.
3. **Public Draft Leak (`get`)**: Public visitor attempts `getDoc(/articles/secret-draft)` where `status == 'draft'`.
4. **Public Draft Scraping (`list`)**: Public visitor attempts `getDocs(collection(db, 'articles'))` without `where('status', '==', 'published')`.
5. **Shadow Field Injection on Article**: Verified admin attempts to create an article with an extra ghost field `{ ..., isSuperFeatured: true }`.
6. **Author UID Spoofing**: Verified admin attempts to create an article with `authorUid: 'another-user-uid'`.
7. **Timestamp Forgery**: Verified admin attempts to create an article with backdated client `createdAt` (`new Date('2020-01-01')`) instead of `serverTimestamp()`.
8. **Immutable Field Tampering**: Verified admin attempts to modify `createdAt` or `authorUid` during an article update.
9. **ID Poisoning Attack**: Attacker attempts `setDoc(/subscribers/a*300, { ... })` with a 300-character or special-character document ID.
10. **PII Subscriber Enumeration**: Non-admin authenticated user attempts `getDoc(/subscribers/sub-1)` or `getDocs(collection(db, 'subscribers'))`.
11. **Self-Assigned Admin Escalation**: Regular signed-in user attempts `setDoc(/admins/{theirUid}, { role: 'admin', ... })`.
12. **Value Poisoning & Oversized Array**: Admin attempts to update an article's `tags` with 25 items or `title` with a 500-character string.
