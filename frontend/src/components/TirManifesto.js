import { useState } from 'react';
import { toplamaAPI } from '../api';

const DURUM_TR = {
  yolda: '🚛 Yolda', ulastu: '✅ Ulaştı', tamamlandi: '🏁 Tamamlandı',
  YOLDA: '🚛 Yolda', ULASTU: '✅ Ulaştı', TAMAMLANDI: '🏁 Tamamlandı',
};

export default function TirManifesto({ tirId, plaka }) {
  const [loading, setLoading] = useState(false);

  const handleManifesto = async () => {
    setLoading(true);
    try {
      const r = await toplamaAPI.getTirManifesto(tirId);
      const m = r.data;
      printManifesto(m);
    } catch (err) {
      alert('İrsaliye yüklenemedi: ' + (err.response?.data?.detail || err.message));
    }
    setLoading(false);
  };

  const printManifesto = (m) => {
    const tarih = new Date(m.created_at).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const stokSatirlar = m.stoklar.map((s, i) => `
      <tr style="background:${i % 2 === 0 ? '#f9fafb' : 'white'}">
        <td style="padding:8px 12px;border:1px solid #e5e7eb;">${i + 1}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">${s.urun_adi}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;">${s.marka || '—'}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;">${s.kategori || '—'}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right;font-family:monospace;font-weight:700;">${s.miktar.toLocaleString('tr-TR')}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;">${s.birim}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:11px;color:#6b7280;">
          ${s.gramaj ? s.gramaj + 'g' : ''}${s.litre ? s.litre + 'L' : ''}
        </td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Sevk İrsaliyesi — ${m.plaka}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; padding: 32px; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 3px solid #f97316; padding-bottom: 16px; }
    .logo { font-size: 22px; font-weight: 800; color: #f97316; }
    .logo span { color: #111; }
    .meta { text-align: right; font-size: 11px; color: #6b7280; }
    .manifesto-no { font-size: 20px; font-weight: 700; font-family: monospace; color: #111; }
    .durum-badge { display: inline-block; background: #f97316; color: white; padding: 3px 12px; border-radius: 20px; font-size: 12px; margin-top: 4px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
    .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-bottom: 4px; }
    .info-value { font-size: 14px; font-weight: 600; }
    .info-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead th { background: #111827; color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .total-row td { background: #f97316; color: white; font-weight: 700; padding: 8px 12px; }
    .footer { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; }
    .imza-kutu { border-top: 2px solid #e5e7eb; padding-top: 8px; }
    .imza-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .imza-ad { font-size: 13px; font-weight: 600; margin-top: 4px; }
    .watermark { position: fixed; bottom: 20px; right: 20px; font-size: 10px; color: #d1d5db; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="logo">🚨 Afet <span>Lojistik</span></div>
      <div style="font-size:12px;color:#6b7280;margin-top:4px;">Afet Sonrası Lojistik Yönetim Sistemi</div>
    </div>
    <div class="meta">
      <div class="manifesto-no">SEVKİYAT İRSALİYESİ #${m.tir_id}</div>
      <div class="durum-badge">${DURUM_TR[m.durum] || m.durum}</div>
      <div style="margin-top:8px;">${tarih}</div>
      <div style="margin-top:2px;font-weight:600;font-size:16px;font-family:monospace;">${m.plaka}</div>
    </div>
  </div>

  <!-- Merkez Bilgileri -->
  <div class="section">
    <div class="section-title">Güzergah Bilgileri</div>
    <div class="info-grid">
      <div class="info-box">
        <div class="info-label">📦 Kaynak (Toplama) Merkezi</div>
        <div class="info-value">${m.kaynak_merkez?.ad || '—'}</div>
        <div class="info-sub">${m.kaynak_merkez?.il || ''} / ${m.kaynak_merkez?.ilce || ''}</div>
        ${m.kaynak_merkez?.tam_adres ? `<div class="info-sub">${m.kaynak_merkez.tam_adres}</div>` : ''}
      </div>
      <div class="info-box">
        <div class="info-label">🏪 Hedef (Dağıtım) Merkezi</div>
        <div class="info-value">${m.hedef_merkez?.ad || '—'}</div>
        <div class="info-sub">${m.hedef_merkez?.il || ''} / ${m.hedef_merkez?.ilce || ''}</div>
        ${m.hedef_merkez?.tam_adres ? `<div class="info-sub">${m.hedef_merkez.tam_adres}</div>` : ''}
      </div>
    </div>
  </div>

  <!-- Araç & Şoför -->
  <div class="section">
    <div class="section-title">Araç & Şoför Bilgileri</div>
    <div class="info-grid">
      <div class="info-box">
        <div class="info-label">🚛 Araç Plakası</div>
        <div class="info-value" style="font-family:monospace;font-size:18px;">${m.plaka}</div>
      </div>
      <div class="info-box">
        <div class="info-label">🧑‍✈️ Şoför</div>
        <div class="info-value">${m.sofor_ad || '—'}</div>
        <div class="info-sub">${m.sofor_telefon || ''}</div>
      </div>
    </div>
    ${m.kayit_yapan ? `
    <div style="margin-top:8px;font-size:12px;color:#6b7280;">
      Kaydı oluşturan: <strong>${m.kayit_yapan}</strong>
      ${m.aciklama ? ` · Not: ${m.aciklama}` : ''}
    </div>` : ''}
  </div>

  <!-- Stok Listesi -->
  <div class="section">
    <div class="section-title">Taşınan Malzeme Listesi</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Ürün Adı</th>
          <th>Marka</th>
          <th>Kategori</th>
          <th style="text-align:right">Miktar</th>
          <th>Birim</th>
          <th>Detay</th>
        </tr>
      </thead>
      <tbody>
        ${stokSatirlar}
        <tr class="total-row">
          <td colspan="4">TOPLAM</td>
          <td style="text-align:right">${m.stoklar.reduce((a, s) => a + s.miktar, 0).toLocaleString('tr-TR')}</td>
          <td colspan="2">kalem</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- İmza Alanları -->
  <div class="footer">
    <div class="imza-kutu">
      <div class="imza-label">Hazırlayan Yetkili</div>
      <div class="imza-ad">${m.kayit_yapan || '________________________'}</div>
      <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:4px;font-size:10px;color:#9ca3af;">İmza / Tarih</div>
    </div>
    <div class="imza-kutu">
      <div class="imza-label">Şoför</div>
      <div class="imza-ad">${m.sofor_ad || '________________________'}</div>
      <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:4px;font-size:10px;color:#9ca3af;">İmza / Tarih</div>
    </div>
    <div class="imza-kutu">
      <div class="imza-label">Teslim Alan Yetkili</div>
      <div class="imza-ad">________________________</div>
      <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:4px;font-size:10px;color:#9ca3af;">İmza / Tarih</div>
    </div>
  </div>

  <div class="watermark">Afet Lojistik Yönetim Sistemi · Sevk İrsaliyesi #${m.tir_id}</div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  return (
    <button
      className="btn btn-secondary btn-sm"
      onClick={handleManifesto}
      disabled={loading}
      title="Sevk İrsaliyesi"
    >
      {loading ? '...' : '📄'}
    </button>
  );
}
