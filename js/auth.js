const Auth = {
  currentUser: null,
  currentProfile: null,

  async init(onReady) {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session) {
      await this._loadProfile(session.user);
    }
    window.supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await this._loadProfile(session.user);
        onReady(true);
      } else {
        this.currentUser = null;
        this.currentProfile = null;
        onReady(false);
      }
    });
    onReady(!!session);
  },

  async _loadProfile(user) {
    this.currentUser = user;
    const { data } = await window.supabaseClient
      .from('profiles').select('*').eq('id', user.id).single();
    this.currentProfile = data;
  },

  async login(email, password) {
    const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
    return error;
  },

  async logout() {
    await window.supabaseClient.auth.signOut();
  },

  canWrite() {
    return this.currentProfile?.rol === 'completo';
  }
};
