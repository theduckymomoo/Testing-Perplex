import { StyleSheet } from 'react-native';

const createStyles = (isDarkMode) => StyleSheet.create({

  container: { flex: 1, backgroundColor: '#0b0b0c', paddingHorizontal: 14 },
  sectionHeader: { color: '#d1d5db', marginTop: 20, marginBottom: 8, fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rowIcon: { width: 28, textAlign: 'center', fontSize: 18 },
  rowTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  rowSubtitle: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  rowRight: { minWidth: 24, alignItems: 'flex-end' },
  disclosure: { color: '#6b7280', fontSize: 24, paddingHorizontal: 6 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.56)', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#111214', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 16 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  cardSubtitle: { color: '#a1a1aa', fontSize: 13, marginTop: 6, marginBottom: 10 },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    marginTop: 10,
    textAlignVertical: 'top',
  },
  rowActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  btn: { backgroundColor: '#10b981', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  btnText: { color: '#0b0b0c', fontSize: 14, fontWeight: '800' },
  btnGhost: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  btnGhostText: { color: '#e5e7eb', fontSize: 14, fontWeight: '600' },
  stars: { flexDirection: 'row', justifyContent: 'center', marginVertical: 8, gap: 4 },
  hint: { color: '#9ca3af', fontSize: 12, marginTop: 10 },
  aboutText: { color: '#cbd5e1', marginTop: 10, lineHeight: 20 }
});

export default createStyles;