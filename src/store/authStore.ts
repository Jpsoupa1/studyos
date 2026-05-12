import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id:          string
  name:        string
  email:       string
  course:      string
  institution: string
  semester:    string
  avatarColor: string
}

interface SignUpData {
  email:       string
  password:    string
  name:        string
  course:      string
  institution: string
  semester:    string
  avatarColor: string
}

interface AuthStore {
  user:    UserProfile | null
  loading: boolean
  error:   string
  setUser:                (u: UserProfile | null) => void
  /** Carrega perfil usando sessão já disponível — sem chamada de rede extra */
  loadProfileFromSession: (session: Session) => Promise<void>
  signIn:                 (email: string, password: string) => Promise<void>
  signUp:                 (data: SignUpData) => Promise<{ success: boolean; requireEmailConfirm: boolean } | void>
  signOut:                () => Promise<void>
  updateProfile:          (data: Partial<UserProfile>) => Promise<void>
  clearError:             () => void
}

function friendlyError(msg: string): string {
  if (msg.includes('Invalid login credentials'))  return 'E-mail ou senha incorretos.'
  if (msg.includes('Email not confirmed'))         return 'Confirme seu e-mail antes de entrar.'
  if (msg.includes('User already registered'))     return 'Este e-mail já está cadastrado.'
  if (msg.includes('Password should be'))          return 'A senha precisa ter pelo menos 6 caracteres.'
  if (msg.includes('rate limit'))                  return 'Muitas tentativas. Aguarde alguns minutos.'
  return msg
}

async function fetchOrCreateProfile(userId: string, userMeta: Record<string, string>, email: string): Promise<UserProfile> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (profile) {
    return {
      id:          userId,
      email,
      name:        profile.name        ?? '',
      course:      profile.course      ?? '',
      institution: profile.institution ?? '',
      semester:    profile.semester    ?? '',
      avatarColor: profile.avatar_color ?? '#D9B26A',
    }
  }

  // Fallback: trigger pode não ter rodado (ex: primeira vez após confirmação de email)
  const fallback = {
    id:           userId,
    name:         userMeta.full_name ?? email.split('@')[0] ?? '',
    course:       userMeta.course       ?? '',
    institution:  userMeta.institution  ?? '',
    semester:     userMeta.semester     ?? '',
    avatar_color: userMeta.avatar_color ?? '#D9B26A',
  }
  await supabase.from('profiles').upsert(fallback)
  await supabase.from('user_stats').upsert({ user_id: userId })

  return {
    id: userId, email,
    name:        fallback.name,
    course:      fallback.course,
    institution: fallback.institution,
    semester:    fallback.semester,
    avatarColor: fallback.avatar_color,
  }
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user:    null,
  loading: false,
  error:   '',

  setUser:    (user) => set({ user }),
  clearError: () => set({ error: '' }),

  // Recebe a Session do onAuthStateChange — sem nova chamada de rede extra
  loadProfileFromSession: async (session) => {
    const { user: authUser } = session
    const meta = (authUser.user_metadata ?? {}) as Record<string, string>

    // Perfil mínimo extraído da sessão (disponível offline, sem query)
    const fallback: UserProfile = {
      id:          authUser.id,
      email:       authUser.email ?? '',
      name:        meta.full_name ?? authUser.email?.split('@')[0] ?? '',
      course:      meta.course       ?? '',
      institution: meta.institution  ?? '',
      semester:    meta.semester     ?? '',
      avatarColor: meta.avatar_color ?? '#D9B26A',
    }

    // Aplica o fallback imediatamente para não bloquear o boot
    set({ user: fallback })

    // Tenta enriquecer com dados do banco em background (sem bloquear)
    fetchOrCreateProfile(authUser.id, meta, authUser.email ?? '')
      .then((profile) => set({ user: profile }))
      .catch(() => { /* já temos o fallback, sem problema */ })
  },

  signIn: async (email, password) => {
    set({ loading: true, error: '' })
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      set({ loading: false, error: friendlyError(error.message) })
    } else {
      set({ loading: false })
      // loadProfileFromSession é chamado automaticamente via onAuthStateChange (SIGNED_IN)
    }
  },

  signUp: async ({ email, password, name, course, institution, semester, avatarColor }) => {
    set({ loading: true, error: '' })

    const { data, error } = await supabase.auth.signUp({
      email:   email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: name, course, institution, semester, avatar_color: avatarColor },
      },
    })

    if (error) {
      set({ loading: false, error: friendlyError(error.message) })
      return { success: false, requireEmailConfirm: false }
    }
    if (!data.user) {
      set({ loading: false, error: 'Erro ao criar conta. Tente novamente.' })
      return { success: false, requireEmailConfirm: false }
    }
    if (!data.session) {
      set({ loading: false })
      return { success: true, requireEmailConfirm: true }
    }
    // Com session = confirmação desabilitada → onAuthStateChange cuida do resto
    set({ loading: false })
    return { success: true, requireEmailConfirm: false }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },

  updateProfile: async (data) => {
    const { user } = get()
    if (!user) return
    await supabase.from('profiles').update({
      name:         data.name         ?? user.name,
      course:       data.course       ?? user.course,
      institution:  data.institution  ?? user.institution,
      semester:     data.semester     ?? user.semester,
      avatar_color: data.avatarColor  ?? user.avatarColor,
    }).eq('id', user.id)
    set({ user: { ...user, ...data } })
  },
}))
