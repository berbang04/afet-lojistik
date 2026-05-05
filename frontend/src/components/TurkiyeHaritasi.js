import { useEffect, useRef } from 'react';

const IL_KOORDINATLAR = {
  "Adana": [37.0, 35.32], "Adıyaman": [37.76, 38.27], "Afyonkarahisar": [38.75, 30.54],
  "Ağrı": [39.72, 43.05], "Amasya": [40.65, 35.83], "Ankara": [39.92, 32.85],
  "Antalya": [36.9, 30.7], "Artvin": [41.18, 41.82], "Aydın": [37.85, 27.84],
  "Balıkesir": [39.65, 27.89], "Bilecik": [40.15, 29.98], "Bingöl": [38.88, 40.5],
  "Bitlis": [38.4, 42.12], "Bolu": [40.73, 31.6], "Burdur": [37.72, 30.29],
  "Bursa": [40.19, 29.07], "Çanakkale": [40.15, 26.41], "Çankırı": [40.6, 33.61],
  "Çorum": [40.55, 34.96], "Denizli": [37.77, 29.09], "Diyarbakır": [37.91, 40.23],
  "Edirne": [41.68, 26.56], "Elazığ": [38.68, 39.23], "Erzincan": [39.75, 39.5],
  "Erzurum": [39.9, 41.27], "Eskişehir": [39.78, 30.52], "Gaziantep": [37.06, 37.38],
  "Giresun": [40.91, 38.39], "Gümüşhane": [40.46, 39.48], "Hakkari": [37.57, 43.74],
  "Hatay": [36.4, 36.35], "Isparta": [37.76, 30.55], "Mersin": [36.8, 34.63],
  "İstanbul": [41.01, 28.97], "İzmir": [38.42, 27.14], "Kars": [40.6, 43.1],
  "Kastamonu": [41.37, 33.78], "Kayseri": [38.73, 35.49], "Kırklareli": [41.73, 27.22],
  "Kırşehir": [39.15, 34.17], "Kocaeli": [40.85, 29.88], "Konya": [37.87, 32.49],
  "Kütahya": [39.42, 29.98], "Malatya": [38.35, 38.31], "Manisa": [38.61, 27.43],
  "Kahramanmaraş": [37.59, 36.93], "Mardin": [37.31, 40.74], "Muğla": [37.21, 28.36],
  "Muş": [38.73, 41.49], "Nevşehir": [38.62, 34.71], "Niğde": [37.97, 34.68],
  "Ordu": [40.98, 37.88], "Rize": [41.02, 40.52], "Sakarya": [40.69, 30.43],
  "Samsun": [41.29, 36.33], "Siirt": [37.93, 41.95], "Sinop": [42.02, 35.15],
  "Sivas": [39.75, 37.02], "Tekirdağ": [41.77, 27.51], "Tokat": [40.31, 36.55],
  "Trabzon": [40.99, 39.73], "Tunceli": [39.11, 39.55], "Şanlıurfa": [37.16, 38.8],
  "Uşak": [38.68, 29.41], "Van": [38.49, 43.38], "Yozgat": [39.82, 34.81],
  "Zonguldak": [41.45, 31.79], "Aksaray": [38.37, 34.03], "Bayburt": [40.26, 40.23],
  "Karaman": [37.18, 33.22], "Kırıkkale": [39.85, 33.52], "Batman": [37.88, 41.13],
  "Şırnak": [37.52, 42.46], "Bartın": [41.63, 32.34], "Ardahan": [41.11, 42.7],
  "Iğdır": [39.92, 44.05], "Yalova": [40.65, 29.27], "Karabük": [41.2, 32.62],
  "Kilis": [36.72, 37.12], "Osmaniye": [37.07, 36.25], "Düzce": [40.84, 31.16],
};

// Bölge → iller eşleşmesi
const BOLGE_ILLER = {
  'Marmara': ['İstanbul','Bursa','Tekirdağ','Edirne','Kırklareli','Balıkesir','Çanakkale','Yalova','Kocaeli','Sakarya','Düzce','Bilecik','Bolu'],
  'Ege': ['İzmir','Aydın','Denizli','Manisa','Muğla','Uşak','Afyonkarahisar','Kütahya'],
  'Akdeniz': ['Antalya','Adana','Mersin','Hatay','Kahramanmaraş','Osmaniye','Burdur','Isparta'],
  'İç Anadolu': ['Ankara','Konya','Kayseri','Sivas','Yozgat','Kırıkkale','Kırşehir','Nevşehir','Niğde','Aksaray','Karaman','Eskişehir','Çankırı'],
  'Karadeniz': ['Samsun','Trabzon','Ordu','Giresun','Rize','Artvin','Zonguldak','Bartın','Kastamonu','Sinop','Çorum','Amasya','Tokat','Gümüşhane','Bayburt','Karabük','Bolu'],
  'Doğu Anadolu': ['Malatya','Elazığ','Van','Erzurum','Erzincan','Tunceli','Bingöl','Bitlis','Muş','Hakkari','Iğdır','Kars','Ardahan','Ağrı'],
  'Güneydoğu Anadolu': ['Gaziantep','Şanlıurfa','Diyarbakır','Mardin','Batman','Şırnak','Siirt','Kilis','Adıyaman'],
};

export default function TurkiyeHaritasi({ merkezler = [], dagitimLog = [], mod = 'merkezler', bolge = null, bolgeKoordinatlar = null, acilBolgeler = [] }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef([]);
  const linesRef = useRef([]);
  const geojsonLayersRef = useRef([]);

  useEffect(() => {
    loadLeaflet(() => {
      if (!leafletMap.current) initMap();
    });
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!leafletMap.current || !window.L) return;
    setTimeout(() => renderMarkers(), 100);
  }, [merkezler, dagitimLog, mod, bolge]);

  const loadLeaflet = (cb) => {
    if (window.L) { cb(); return; }
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[src*="leaflet"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = cb;
      document.head.appendChild(script);
    } else {
      const check = setInterval(() => { if (window.L) { clearInterval(check); cb(); } }, 100);
    }
  };

  const initMap = () => {
    if (!mapRef.current || leafletMap.current || !window.L) return;
    const L = window.L;
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
    const map = L.map(mapRef.current, {
      zoomControl: true, scrollWheelZoom: true, preferCanvas: false,
    }).setView([39.1, 35.5], 6);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO', maxZoom: 18,
    }).addTo(map);
    leafletMap.current = map;
    map.whenReady(() => setTimeout(() => renderMarkers(), 200));
  };

  const clearMap = () => {
    markersRef.current.forEach(m => { try { m.remove(); } catch(e) {} });
    linesRef.current.forEach(l => { try { l.remove(); } catch(e) {} });
    geojsonLayersRef.current.forEach(l => { try { l.remove(); } catch(e) {} });
    markersRef.current = [];
    linesRef.current = [];
    geojsonLayersRef.current = [];
  };

  // GeoJSON koordinatlarını Leaflet formatına çevir (lng,lat → lat,lng)
  const convertCoords = (coords) => {
    if (!coords || !coords.length) return [];
    if (Array.isArray(coords[0][0])) {
      return coords.map(ring => ring.map(c => [c[1], c[0]]));
    }
    return coords.map(c => [c[1], c[0]]);
  };

  const renderBolgeGeoJSON = (bolgeAdi) => {
    const L = window.L;
    if (!L || !window._trGeoJSON) return;

    const bolgeIller = BOLGE_ILLER[bolgeAdi] || [];

    window._trGeoJSON.features.forEach(feature => {
      const ilAdi = feature.properties.name;
      const ilBolgede = bolgeIller.includes(ilAdi);

      const geom = feature.geometry;
      let coords;

      try {
        if (geom.type === 'Polygon') {
          coords = convertCoords(geom.coordinates[0]);
          if (coords.length < 3) return;
          const poly = L.polygon(coords, {
            color: ilBolgede ? '#3b82f6' : '#374151',
            fillColor: ilBolgede ? '#3b82f6' : '#111827',
            fillOpacity: ilBolgede ? 0.25 : 0.4,
            weight: ilBolgede ? 2 : 0.5,
            opacity: ilBolgede ? 0.8 : 0.3,
          }).addTo(leafletMap.current);
          if (ilBolgede) {
            poly.bindTooltip(ilAdi, { permanent: false, direction: 'center', className: 'leaflet-il-tooltip' });
          }
          geojsonLayersRef.current.push(poly);
        } else if (geom.type === 'MultiPolygon') {
          geom.coordinates.forEach(polygonCoords => {
            if (!polygonCoords[0] || polygonCoords[0].length < 3) return;
            const coords2 = convertCoords(polygonCoords[0]);
            const poly = L.polygon(coords2, {
              color: ilBolgede ? '#3b82f6' : '#374151',
              fillColor: ilBolgede ? '#3b82f6' : '#111827',
              fillOpacity: ilBolgede ? 0.25 : 0.4,
              weight: ilBolgede ? 2 : 0.5,
              opacity: ilBolgede ? 0.8 : 0.3,
            }).addTo(leafletMap.current);
            if (ilBolgede) {
              poly.bindTooltip(ilAdi, { permanent: false, direction: 'center', className: 'leaflet-il-tooltip' });
            }
            geojsonLayersRef.current.push(poly);
          });
        }
      } catch(e) {}
    });
  };

  const loadGeoJSON = (cb) => {
    if (window._trGeoJSON) { cb(); return; }
    fetch('https://raw.githubusercontent.com/cihadturhan/tr-geojson/master/geo/tr-cities-utf8.json')
      .then(r => r.json())
      .then(data => { window._trGeoJSON = data; cb(); })
      .catch(() => cb()); // GeoJSON yoksa normale devam et
  };

  const renderMarkers = () => {
    const L = window.L;
    if (!L || !leafletMap.current) return;
    clearMap();

    // Bölge poligonu varsa direkt çiz, yoksa GeoJSON ile il sınırlarını çiz
    if (bolgeKoordinatlar && bolgeKoordinatlar.length >= 3) {
      renderBolgePoligon(bolgeKoordinatlar);
      renderAcilBolgeler();
      renderMerkezler();
    } else if (bolge) {
      loadGeoJSON(() => {
        renderBolgeGeoJSON(bolge);
        renderAcilBolgeler();
        renderMerkezler();
      });
    } else {
      renderAcilBolgeler();
      renderMerkezler();
    }
  };



  const renderBolgePoligon = (koordinatlar) => {
    const L = window.L;
    if (!L || !leafletMap.current) return;
    try {
      const latlngs = koordinatlar.map(c => [c[0], c[1]]);
      const poly = L.polygon(latlngs, {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        weight: 2.5,
        opacity: 0.9,
      }).addTo(leafletMap.current);
      geojsonLayersRef.current.push(poly);
      // Haritayı bölgeye odakla
      leafletMap.current.fitBounds(poly.getBounds(), { padding: [30, 30] });
    } catch(e) {}
  };

  const renderAcilBolgeler = () => {
    const L = window.L;
    if (!L || !leafletMap.current || !acilBolgeler.length) return;

    acilBolgeler.forEach(ab => {
      if (!ab.koordinatlar || ab.koordinatlar.length < 3) return;
      try {
        const latlngs = ab.koordinatlar.map(c => [c[0], c[1]]);
        const poly = L.polygon(latlngs, {
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.15,
          weight: 2,
          opacity: 0.9,
          dashArray: '6,4',
        }).addTo(leafletMap.current);

        const mudurBilgi = ab.mudur_adi ? "<div style='font-size:11px;color:#94a3b8;margin-top:4px;'>Operasyon Müdürü: " + ab.mudur_adi + "</div>" : '';
        poly.bindPopup(
          "<div style='font-family:sans-serif;min-width:200px;background:#111827;border-radius:8px;padding:12px;color:#e2e8f0;'>" +
          "<div style='font-size:14px;font-weight:700;color:#ef4444;margin-bottom:4px;'>🚨 " + ab.ad + "</div>" +
          (ab.aciklama ? "<div style='font-size:12px;color:#94a3b8;'>" + ab.aciklama + "</div>" : '') +
          mudurBilgi +
          "</div>"
        );
        geojsonLayersRef.current.push(poly);

        // Bölge adı etiketi
        const center = poly.getBounds().getCenter();
        const label = L.divIcon({
          html: "<div style='background:rgba(239,68,68,0.85);color:white;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:700;white-space:nowrap;'>🚨 " + ab.ad + "</div>",
          className: '', iconAnchor: [0, 0]
        });
        const labelMarker = L.marker(center, { icon: label }).addTo(leafletMap.current);
        geojsonLayersRef.current.push(labelMarker);
      } catch(e) {}
    });
  };

  const renderMerkezler = () => {
    const L = window.L;
    if (!L || !leafletMap.current) return;

    if (mod === 'merkezler') {
      merkezler.forEach(m => {
        let lat, lng;
        if (m.enlem && m.boylam) {
          lat = parseFloat(m.enlem);
          lng = parseFloat(m.boylam);
        } else {
          const koord = IL_KOORDINATLAR[m.il];
          if (!koord) return;
          const offset = (m.id % 10) * 0.05;
          lat = koord[0] + offset * Math.cos(m.id);
          lng = koord[1] + offset * Math.sin(m.id);
        }
        const renk = m.tip === 'toplama' ? '#3b82f6' : '#22c55e';
        const ikon = m.tip === 'toplama' ? '📦' : '🏪';

        const marker = L.circleMarker([lat, lng], {
          radius: 10, fillColor: renk, color: '#fff',
          weight: 2, opacity: 1, fillOpacity: 0.9,
        }).addTo(leafletMap.current);

        marker.bindPopup(`
          <div style="font-family:sans-serif;min-width:200px;background:#111827;border-radius:8px;padding:12px;color:#e2e8f0;">
            <div style="font-size:15px;font-weight:700;margin-bottom:4px;">${ikon} ${m.ad}</div>
            <div style="font-size:11px;color:${renk};text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
              ${m.tip === 'toplama' ? 'Toplama Merkezi' : 'Dağıtım Merkezi'}
            </div>
            <div style="font-size:12px;color:#94a3b8;margin-bottom:2px;">📍 ${m.il} / ${m.ilce}</div>
            ${m.yetkili_adi ? `<div style="font-size:12px;color:#94a3b8;margin-bottom:2px;">👤 ${m.yetkili_adi}</div>` : ''}
            <div style="font-size:12px;color:#94a3b8;">📦 ${m.stok_sayisi || 0} stok kalemi</div>
          </div>
        `);
        markersRef.current.push(marker);
      });
    } else {
      // Tır rotaları
      const rotaGruplari = {};
      dagitimLog.forEach(t => {
        if (!t.kaynak_merkez || !t.hedef_merkez) return;
        const key = `${t.kaynak_merkez.il}→${t.hedef_merkez.il}`;
        if (!rotaGruplari[key]) rotaGruplari[key] = [];
        rotaGruplari[key].push(t);
      });

      Object.entries(rotaGruplari).forEach(([rota, tirListesi]) => {
        const t0 = tirListesi[0];
        const kaynakKoord = IL_KOORDINATLAR[t0.kaynak_merkez.il];
        const hedefKoord = IL_KOORDINATLAR[t0.hedef_merkez.il];
        if (!kaynakKoord || !hedefKoord) return;

        const enCritik = tirListesi.find(t => t.durum === 'yolda' || t.durum === 'YOLDA') ||
                         tirListesi.find(t => t.durum === 'ulastu' || t.durum === 'ULASTU') ||
                         tirListesi[0];
        const renk = (enCritik.durum === 'tamamlandi' || enCritik.durum === 'TAMAMLANDI') ? '#22c55e' :
                     (enCritik.durum === 'ulastu' || enCritik.durum === 'ULASTU') ? '#f59e0b' : '#3b82f6';
        const tirSayisi = tirListesi.length;

        try {
          const line = L.polyline([kaynakKoord, hedefKoord], {
            color: renk, weight: tirSayisi > 1 ? 3 : 2, opacity: 0.8,
            dashArray: enCritik.durum === 'yolda' || enCritik.durum === 'YOLDA' ? '6,4' : null,
          }).addTo(leafletMap.current);

          const tirlerHtml = tirListesi.map(t => {
            const stokOzet = t.stoklar?.slice(0,2).map(s => `${s.urun_adi} (${s.miktar} ${s.birim})`).join(', ') || '—';
            const tRenk = (t.durum === 'tamamlandi' || t.durum === 'TAMAMLANDI') ? '#22c55e' :
                          (t.durum === 'ulastu' || t.durum === 'ULASTU') ? '#f59e0b' : '#3b82f6';
            return `<div style="border-top:1px solid #1e2d47;padding-top:8px;margin-top:8px;">
              <div style="font-weight:700;font-family:monospace;color:${tRenk};">${t.plaka}</div>
              ${t.gonderen_adi ? `<div style="font-size:11px;color:#94a3b8;">👤 ${t.gonderen_adi}</div>` : ''}
              <div style="font-size:11px;color:#94a3b8;margin-top:4px;">📦 ${stokOzet}</div>
            </div>`;
          }).join('');

          line.bindPopup(`
            <div style="font-family:sans-serif;min-width:240px;background:#111827;border-radius:8px;padding:12px;color:#e2e8f0;">
              <div style="font-size:13px;font-weight:700;margin-bottom:4px;">
                📤 ${t0.kaynak_merkez.ad} → 📥 ${t0.hedef_merkez.ad}
              </div>
              <div style="font-size:11px;color:#64748b;margin-bottom:8px;">
                ${t0.kaynak_merkez.il} → ${t0.hedef_merkez.il} · ${tirSayisi} tır
              </div>
              ${tirlerHtml}
            </div>
          `);
          linesRef.current.push(line);
        } catch(e) {}

        const marker = L.circleMarker(hedefKoord, {
          radius: tirSayisi > 1 ? 10 : 7,
          fillColor: renk, color: '#fff', weight: 1.5, fillOpacity: 0.9,
        }).addTo(leafletMap.current);

        if (tirSayisi > 1) {
          const icon = L.divIcon({
            html: `<div style="background:${renk};color:white;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid white;">${tirSayisi}</div>`,
            iconSize: [20, 20], iconAnchor: [10, 10], className: ''
          });
          const numMarker = L.marker(hedefKoord, { icon }).addTo(leafletMap.current);
          markersRef.current.push(numMarker);
        }

        marker.bindPopup(`
          <div style="font-family:sans-serif;min-width:220px;background:#111827;border-radius:8px;padding:12px;color:#e2e8f0;">
            <div style="font-size:13px;font-weight:700;margin-bottom:4px;">
              📥 ${t0.hedef_merkez.ad} (${t0.hedef_merkez.il})
            </div>
            <div style="font-size:11px;color:#64748b;margin-bottom:8px;">${tirSayisi} tır bu noktaya geliyor</div>
            ${tirListesi.map(t => `<div style="font-size:12px;color:#94a3b8;padding:4px 0;border-top:1px solid #1e2d47;">🚛 ${t.plaka} · ${t.durum}</div>`).join('')}
          </div>
        `);
        markersRef.current.push(marker);
      });
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapRef} style={{
        height: 480, width: '100%', borderRadius: 10,
        background: '#0a0e1a', border: '1px solid var(--border)'
      }} />
      <div style={{
        position: 'absolute', bottom: 16, left: 16, zIndex: 1000,
        background: 'rgba(17,24,39,0.95)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '10px 14px', fontSize: 12,
      }}>
        {bolge && (
          <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 16, height: 10, background: 'rgba(59,130,246,0.3)', border: '2px solid #3b82f6', display: 'inline-block', borderRadius: 2 }} />
              <span style={{ color: '#3b82f6', fontWeight: 600 }}>{bolge} Bölgesi</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 16, height: 10, background: 'rgba(17,24,39,0.8)', border: '1px solid #374151', display: 'inline-block', borderRadius: 2 }} />
              <span style={{ color: 'var(--text3)' }}>Diğer İller</span>
            </div>
          </div>
        )}
        {mod === 'merkezler' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
              <span style={{ color: 'var(--text2)' }}>Toplama Merkezi</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ color: 'var(--text2)' }}>Dağıtım Merkezi</span>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 20, height: 3, background: '#3b82f6', display: 'inline-block', borderRadius: 2 }} />
              <span style={{ color: 'var(--text2)' }}>Yolda</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 20, height: 3, background: '#f59e0b', display: 'inline-block', borderRadius: 2 }} />
              <span style={{ color: 'var(--text2)' }}>Ulaştı</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 20, height: 3, background: '#22c55e', display: 'inline-block', borderRadius: 2 }} />
              <span style={{ color: 'var(--text2)' }}>Tamamlandı</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
