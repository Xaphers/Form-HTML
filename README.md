# Form Management — HTML Edition

Versi ringan dari aplikasi Form Management. Frontend menggunakan **HTML, CSS, dan Vanilla JavaScript** tanpa Next.js, React, atau build step. Data tetap dikelola oleh Google Apps Script dan disimpan di Google Sheets.

## Arsitektur
- Static frontend: HTML/CSS/JavaScript.
- API proxy: Vercel Serverless Function di `api/backend.js`, tersedia pada `/api/backend`.
- Data/API: Google Apps Script.
- Database: Google Sheets.

## Deploy ke Vercel
1. Import repository `Xaphers/Form-HTML` dari GitHub di Vercel.
2. Framework Preset: **Other**.
3. Build Command: kosongkan.
4. Output Directory: kosongkan (root project).
5. Tambahkan Environment Variable:
   - Name: `APPS_SCRIPT_URL`
   - Value: URL Web App Google Apps Script yang berakhiran `/exec`.
   - Environment: Production (tambahkan Preview juga jika diperlukan).
6. Deploy.

Vercel otomatis mendeteksi `api/backend.js` sebagai Serverless Function. Frontend memanggil endpoint tersebut melalui `/api/backend`.

## Catatan
- Cookie sesi `nfc_session` disimpan sebagai HttpOnly, Secure, SameSite=Lax selama 6 jam.
- Jangan menaruh URL Apps Script atau token sesi di file frontend.
- Google Apps Script harus sudah di-deploy sebagai Web App dan dapat menerima POST JSON dengan format `{ action, data }`.
- Aksi yang dipakai mengikuti project sebelumnya: auth.*, events.*, stands.*, questions.*, responses.*, analytics.*, users.*, public.review.*.
- Link halaman publik: `/review/{standId}`.
- Untuk pertanyaan yang memiliki pilihan, Apps Script sebaiknya mengembalikan `options` sebagai array; frontend juga mendukung string pilihan yang dipisah koma.

## Status
Implementasi awal frontend dan proxy sudah disiapkan. Integrasi dengan Apps Script tetap perlu diuji menggunakan URL Web App yang sebenarnya.
