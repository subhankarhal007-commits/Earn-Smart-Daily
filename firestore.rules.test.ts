/**
 * Security Rule Verification Suite — EarnSmart Daily
 * Verifies all "Dirty Dozen" adversarial payloads are rejected with PERMISSION_DENIED.
 * Intended to run against the Firebase Firestore Emulator (`@firebase/rules-unit-testing`).
 */

export interface AdversarialCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid?: string; email?: string; email_verified?: boolean } | null;
  docId: string;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: AdversarialCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Article Creation',
    collection: 'articles',
    operation: 'create',
    auth: null,
    docId: 'unauthorized-post',
    payload: { title: 'Injected Post', status: 'published' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Admin Email Spoof',
    collection: 'articles',
    operation: 'create',
    auth: { uid: 'spoof-uid', email: 'subhankarhal007@gmail.com', email_verified: false },
    docId: 'spoofed-post',
    payload: { title: 'Spoofed Post', status: 'published' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Public Draft Leak (get)',
    collection: 'articles',
    operation: 'get',
    auth: null,
    docId: 'internal-draft-post',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Public Draft Scraping (list without published filter)',
    collection: 'articles',
    operation: 'list',
    auth: null,
    docId: '*',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Shadow Field Injection on Article',
    collection: 'articles',
    operation: 'create',
    auth: { uid: 'admin-1', email: 'subhankarhal007@gmail.com', email_verified: true },
    docId: 'shadow-post',
    payload: { slug: 'shadow-post', ghostField: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Author UID Spoofing',
    collection: 'articles',
    operation: 'create',
    auth: { uid: 'admin-1', email: 'subhankarhal007@gmail.com', email_verified: true },
    docId: 'spoofed-author',
    payload: { authorUid: 'different-uid' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Client Timestamp Forgery',
    collection: 'articles',
    operation: 'create',
    auth: { uid: 'admin-1', email: 'subhankarhal007@gmail.com', email_verified: true },
    docId: 'forged-time',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Immutable Field Tampering on Update',
    collection: 'articles',
    operation: 'update',
    auth: { uid: 'admin-1', email: 'subhankarhal007@gmail.com', email_verified: true },
    docId: 'existing-post',
    payload: { authorUid: 'hijacked-uid' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Document ID Poisoning on Subscriber',
    collection: 'subscribers',
    operation: 'create',
    auth: null,
    docId: 'invalid$id$with$special$chars$'.repeat(10),
    payload: { email: 'user@example.com', region: 'USA', source: 'home' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'PII Subscriber Enumeration by Non-Admin',
    collection: 'subscribers',
    operation: 'list',
    auth: { uid: 'reader-1', email: 'reader@example.com', email_verified: true },
    docId: '*',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Self-Assigned Admin Privilege Escalation',
    collection: 'admins',
    operation: 'create',
    auth: { uid: 'attacker-1', email: 'attacker@example.com', email_verified: true },
    docId: 'attacker-1',
    payload: { email: 'attacker@example.com', name: 'Attacker', role: 'admin', addedBy: 'attacker-1' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Oversized Tags Array & Value Poisoning',
    collection: 'articles',
    operation: 'update',
    auth: { uid: 'admin-1', email: 'subhankarhal007@gmail.com', email_verified: true },
    docId: 'existing-post',
    payload: { tags: Array.from({ length: 20 }, (_, i) => `tag-${i}`) },
    expected: 'PERMISSION_DENIED',
  },
];
