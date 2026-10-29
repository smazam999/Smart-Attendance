// config.js — safe to commit. No secrets here.
export const APP_CONFIG = {
  company: 'My Factory',
  supabaseUrl: 'https://fipeokokoruibkorudcu.supabase.co',
  supabaseKey: 'sb_publishable_QskFSArQ31aUVydn4-v4kQ_DW_CfDGi',
  googleClientId: '698616821021-uljmq3d5kcgrej1c583veqbss6320h6i.apps.googleusercontent.com',
  encryptionSalt: 'smart-attendance-v1',
  matchThreshold: 0.55,
  autoMarkThreshold: 0.48,
  livenessTimeout: 10000,
  modelUrls: [
    'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights',
    'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
  ]
};