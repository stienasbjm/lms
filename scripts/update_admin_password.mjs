/**
 * Script untuk update password admin di Firestore
 * Jalankan: node scripts/update_admin_password.mjs
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDITlobzgm52tNwHUa7j5Z070DY4vJOJBw",
  authDomain: "lms-stienas.firebaseapp.com",
  projectId: "lms-stienas",
  storageBucket: "lms-stienas.firebasestorage.app",
  messagingSenderId: "1039609038510",
  appId: "1:1039609038510:web:18536257413fe47b448f3f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateAdminPassword() {
  console.log('🔐 Memulai update password admin di Firestore...\n');

  // Daftar akun yang perlu diupdate passwordnya
  const adminUpdates = [
    {
      docId: 'user-admin-1',
      email: 'admin@stienas.ac.id',
      newPassword: 'admin126',
      role: 'SUPER_ADMIN',
      name: 'Administrator Sistem (Super Admin)'
    }
  ];

  // Update berdasarkan docId langsung
  for (const adminData of adminUpdates) {
    try {
      const docRef = doc(db, 'users', adminData.docId);
      const snap = await getDoc(docRef);
      
      if (snap.exists()) {
        const currentData = snap.data();
        console.log(`✓ Ditemukan dokumen: ${adminData.docId} (${currentData.email})`);
        console.log(`  Password lama: ${currentData.password || '(tidak ada)'}`);
        
        await setDoc(docRef, { password: adminData.newPassword }, { merge: true });
        console.log(`  Password baru : admin126`);
        console.log(`  ✅ Berhasil diupdate!\n`);
      } else {
        console.log(`⚠️  Dokumen ${adminData.docId} tidak ditemukan, mencoba buat baru...`);
        await setDoc(docRef, {
          uid: adminData.docId,
          id: adminData.docId,
          email: adminData.email,
          password: adminData.newPassword,
          role: adminData.role,
          name: adminData.name,
          username: 'admin',
          isActive: true,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log(`  ✅ Dokumen dibuat dengan password baru!\n`);
      }
    } catch (err) {
      console.error(`❌ Error update ${adminData.docId}:`, err.message);
    }
  }

  // Cari juga berdasarkan email (fallback jika docId berbeda)
  try {
    console.log('🔍 Mencari berdasarkan email admin@stienas.ac.id...');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', 'admin@stienas.ac.id'));
    const querySnap = await getDocs(q);
    
    if (!querySnap.empty) {
      for (const d of querySnap.docs) {
        if (d.id !== 'user-admin-1') {
          // Dokumen admin ditemukan dengan ID berbeda
          console.log(`  Ditemukan dokumen admin dengan ID: ${d.id}`);
          await setDoc(doc(db, 'users', d.id), { password: 'admin126' }, { merge: true });
          console.log(`  ✅ Password juga diupdate untuk dokumen ID: ${d.id}\n`);
        }
      }
      if (querySnap.empty) {
        console.log('  Tidak ada dokumen admin lain ditemukan.\n');
      }
    } else {
      console.log('  Tidak ada dokumen dengan email tersebut di koleksi users.\n');
    }
  } catch (err) {
    console.error('❌ Error query email:', err.message);
  }

  console.log('✅ Selesai! Password admin telah diupdate ke: admin126');
  process.exit(0);
}

updateAdminPassword().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
