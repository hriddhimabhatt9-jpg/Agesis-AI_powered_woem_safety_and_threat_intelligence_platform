/**
 * Shared in-memory store for demo mode.
 * This ensures that updates to user profiles are persisted across different route files
 * and requests even when MongoDB is not connected.
 */
class DemoStore {
  constructor() {
    this.users = new Map();
  }

  get(email) {
    return this.users.get(email);
  }

  getById(userId) {
    return Array.from(this.users.values()).find(u => u._id === userId || u.id === userId);
  }

  set(email, data) {
    this.users.set(email, data);
  }

  has(email) {
    return this.users.has(email);
  }

  update(userId, updates) {
    const user = this.getById(userId);
    if (user) {
      Object.assign(user, updates);
      return user;
    }
    return null;
  }
}

const demoStore = new DemoStore();
export default demoStore;
