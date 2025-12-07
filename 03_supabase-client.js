// ============================================================================
// SUPABASE CLIENT - Módulo de conexión y operaciones
// ============================================================================

// IMPORTANTE: Reemplaza estas credenciales con las tuyas
const SUPABASE_URL = 'https://bcysmnqojlmqbbrsfxbk.supabase.co';  // ej: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeXNtbnFvamxtcWJicnNmeGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNzQ0MDAsImV4cCI6MjA4MDY1MDQwMH0.tFOXuVFwVbmMF6_tQERqgazPnoDND1FgOOFrUjtbetY';  // Tu anon/public key

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// MÓDULO DE AUTENTICACIÓN
// ============================================================================

const SupabaseAuth = {
  // Registrar nuevo usuario
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData  // Metadata adicional (nombre, negocio, etc.)
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error en signUp:', error);
      return { success: false, error: error.message };
    }
  },

  // Iniciar sesión
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error en signIn:', error);
      return { success: false, error: error.message };
    }
  },

  // Cerrar sesión
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error en signOut:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener usuario actual
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return null;
    }
  },

  // Verificar si hay sesión activa
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Error obteniendo sesión:', error);
      return null;
    }
  },

  // Listener de cambios de autenticación
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// ============================================================================
// MÓDULO DE TRANSACCIONES
// ============================================================================

const SupabaseTransactions = {
  // Crear nueva transacción
  async create(transaction) {
    try {
      const user = await SupabaseAuth.getCurrentUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          ...transaction,
          user_id: user.id,
          synced_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Transacción guardada en Supabase:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error guardando transacción:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener todas las transacciones del usuario
  async getAll() {
    try {
      const user = await SupabaseAuth.getCurrentUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error obteniendo transacciones:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Eliminar transacción
  async delete(transactionId) {
    try {
      const user = await SupabaseAuth.getCurrentUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('transaction_id', transactionId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error eliminando transacción:', error);
      return { success: false, error: error.message };
    }
  },

  // Suscribirse a cambios en tiempo real
  subscribe(callback) {
    return supabase
      .channel('transactions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions'
      }, callback)
      .subscribe();
  }
};

// ============================================================================
// MÓDULO DE TRANSACCIONES PENDIENTES
// ============================================================================

const SupabasePending = {
  // Crear pendiente
  async create(pending) {
    try {
      const user = await SupabaseAuth.getCurrentUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('pending_transactions')
        .insert([{
          ...pending,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creando pendiente:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener todos los pendientes
  async getAll() {
    try {
      const user = await SupabaseAuth.getCurrentUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('pending_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error obteniendo pendientes:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Eliminar pendiente
  async delete(transactionId) {
    try {
      const user = await SupabaseAuth.getCurrentUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('pending_transactions')
        .delete()
        .eq('transaction_id', transactionId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error eliminando pendiente:', error);
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// MÓDULO DE CRÉDITOS
// ============================================================================

const SupabaseCredits = {
  // Crear crédito
  async create(credit) {
    try {
      const user = await SupabaseAuth.getCurrentUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('credits')
        .insert([{
          ...credit,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creando crédito:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener créditos activos
  async getActive() {
    try {
      const user = await SupabaseAuth.getCurrentUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('credits')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('next_due_date', { ascending: true });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error obteniendo créditos:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Actualizar crédito
  async update(creditId, updates) {
    try {
      const user = await SupabaseAuth.getCurrentUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('credits')
        .update(updates)
        .eq('credit_id', creditId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error actualizando crédito:', error);
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// MÓDULO DE PERFIL DE USUARIO
// ============================================================================

const SupabaseProfile = {
  // Obtener perfil
  async get() {
    try {
      const user = await SupabaseAuth.getCurrentUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      return { success: false, error: error.message };
    }
  },

  // Actualizar perfil
  async update(updates) {
    try {
      const user = await SupabaseAuth.getCurrentUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// EXPORTAR MÓDULOS
// ============================================================================

window.SupabaseAuth = SupabaseAuth;
window.SupabaseTransactions = SupabaseTransactions;
window.SupabasePending = SupabasePending;
window.SupabaseCredits = SupabaseCredits;
window.SupabaseProfile = SupabaseProfile;

console.log('✅ Supabase client inicializado');
