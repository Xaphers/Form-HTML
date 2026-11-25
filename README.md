# Form Management — HTML Edition

Versi ringan dari aplikasi Form Management. Frontend menggunakan **HTML, CSS, dan Vanilla JavaScript** (tanpa Next.js, React, atau build step). Data tetap dikelola oleh Google Apps Script dan disimpan di Google Sheets.

## Arsitektur
- Static frontend: HTML/CSS/JavaScript.
- Backend proxy: Cloudflare Pages Functions di `functions/api/backend.js`.
- Data/API: Google Apps Script yang sudah dipakai project lama.
- Database: Google Sheets (tidak ada migrasi data).

## Deploy ke Cloudflare Pages
1. Hubungkan repository `Xaphers/Form-HTML` ke Cloudflare Pages.
2. Framework preset: **None**.
3. Build command: kosongkan.
4. Build output directory: `/` (root).
5. Tambahkan Environment Variable di Pages > Settings > Variables:
   - `APPS_SCRIPT_URL` = URL Web App Google Apps Script yang lama.
6. Deploy ulang.

Cloudflare Pages akan menjalankan function pada `/api/backend` dan menyajikan file statis dari root repository.

## Catatan
- Cookie sesi `nfc_session` disimpan sebagai HttpOnly, Secure, SameSite=Lax selama 6 jam.
- Jangan menaruh URL Apps Script atau token sesi di file frontend.
- Google Apps Script harus sudah di-deploy sebagai Web App dan dapat menerima POST JSON dengan format `{ action, data }`.
- Aksi yang dipakai mengikuti project sebelumnya: auth.*, events.*, stands.*, questions.*, responses.*, analytics.*, users.*, public.review.*.
- Link halaman publik: `/review/{standId}`.
- Untuk pertanyaan yang memiliki pilihan, Apps Script sebaiknya mengembalikan `options` sebagai array; frontend juga mendukung string pilihan yang dipisah koma.
