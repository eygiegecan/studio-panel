import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Plus, 
  LogOut, 
  Clock, 
  Trash2, 
  Edit3, 
  Camera, 
  User, 
  BarChart3, 
  Award, 
  Lightbulb, 
  CheckCircle2, 
  CalendarDays 
} from 'lucide-react';

const INITIAL_ARTISTS = [
  { id: 'admin', name: 'Dükkan Sahibi', username: 'bosside', password: 'nautilus081025', role: 'admin', color: '#e6edf3', commission_rate: 0 },
  { id: 'art1', name: 'Ege Can', username: 'egecan', password: 'egecan123', role: 'artist', color: '#10b981', commission_rate: 50 },
  { id: 'art2', name: 'Yasin', username: 'yasin', password: 'yasin123', role: 'artist', color: '#60a5fa', commission_rate: 30 },
  { id: 'art3', name: 'Asil', username: 'asil', password: 'asil123', role: 'artist', color: '#f43f5e', commission_rate: 50 },
  { id: 'art4', name: 'Yeşim', username: 'yesim', password: 'yesim123', role: 'artist', color: '#a78bfa', commission_rate: 30 },
  { id: 'art5', name: 'Oğuz', username: 'oguz', password: 'oguz123', role: 'artist', color: '#2dd4bf', commission_rate: 50 }
];

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const DAY_NAMES_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nautilus_active_session_v7');
      return saved ? JSON.parse(saved) : null;
    } catch(e) { return null; }
  });

  const [appointments, setAppointments] = useState([]);
  const [avatars, setAvatars] = useState(() => {
    try {
      const saved = localStorage.getItem('nautilus_avatars_v7');
      return saved ? JSON.parse(saved) : {};
    } catch(e) { return {}; }
  });

  const [passwords, setPasswords] = useState(() => {
    try {
      const saved = localStorage.getItem('nautilus_passwords_v7');
      return saved ? JSON.parse(saved) : {};
    } catch(e) { return {}; }
  });

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('calendar');
  const [filterArtist, setFilterArtist] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 29));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('2026-09-29');

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState('');

  const [formData, setFormData] = useState({
    artist_id: '',
    client_name: '',
    date: '2026-09-29',
    time: '14:00',
    body_part: 'Ön Kol',
    price: 3500,
    reported: false,
    status: 'pending'
  });

  // Supabase Verilerini Çekme & Gerçek Zamanlı Senkronizasyon
  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase.from('appointments').select('*').order('date', { ascending: true });
      if (!error && data && data.length > 0) {
        setAppointments(data);
        localStorage.setItem('nautilus_cloud_cache_v7', JSON.stringify(data));
      } else {
        const local = localStorage.getItem('nautilus_cloud_cache_v7');
        if (local) setAppointments(JSON.parse(local));
      }
    } catch (err) {
      const local = localStorage.getItem('nautilus_cloud_cache_v7');
      if (local) setAppointments(JSON.parse(local));
    }
  };

  useEffect(() => {
    fetchAppointments();

    // Supabase Anlık Canlı Dinleme (Realtime)
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          fetchAppointments();
        }
      )
      .subscribe();

    const interval = setInterval(fetchAppointments, 6000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanUser = usernameInput.trim().toLowerCase();
    const user = INITIAL_ARTISTS.find(a => a.username.toLowerCase() === cleanUser);
    
    if (user) {
      const effectivePassword = passwords[user.id] || user.password;
      if (passwordInput === effectivePassword) {
        setCurrentUser(user);
        localStorage.setItem('nautilus_active_session_v7', JSON.stringify(user));
        setUsernameInput('');
        setPasswordInput('');
        return;
      }
    }
    setLoginError('Kullanıcı adı veya şifre hatalı!');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('nautilus_active_session_v7');
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        const newAvatars = { ...avatars, [currentUser.id]: base64 };
        setAvatars(newAvatars);
        localStorage.setItem('nautilus_avatars_v7', JSON.stringify(newAvatars));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    setPassMsg('');
    const currentValidPass = passwords[currentUser.id] || currentUser.password;
    if (currentPass !== currentValidPass) {
      setPassMsg('Mevcut şifre hatalı!');
      return;
    }
    if (newPass.length < 4) {
      setPassMsg('Yeni şifre en az 4 haneli olmalıdır.');
      return;
    }
    const updated = { ...passwords, [currentUser.id]: newPass };
    setPasswords(updated);
    localStorage.setItem('nautilus_passwords_v7', JSON.stringify(updated));
    setPassMsg('Şifreniz başarıyla değiştirildi.');
    setCurrentPass('');
    setNewPass('');
  };

  const handleSaveAppointment = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      artist_id: currentUser.role === 'admin' ? (formData.artist_id || 'art1') : currentUser.id,
      price: Number(formData.price)
    };

    if (selectedAppt) {
      setAppointments(prev => prev.map(a => a.id === selectedAppt.id ? { ...payload, id: a.id } : a));
      try {
        await supabase.from('appointments').update(payload).eq('id', selectedAppt.id);
      } catch (err) {}
    } else {
      const tempId = 'apt_' + Date.now();
      const newEntry = { ...payload, id: tempId };
      try {
        const { error } = await supabase.from('appointments').insert([newEntry]);
        if (error) {
          alert('Supabase Kayıt Hatası: ' + error.message);
        } else {
          setAppointments(prev => [newEntry, ...prev]);
        }
      } catch (err) {
        alert('Bağlantı Hatası: ' + err.message);
      }
    }
    setIsModalOpen(false);
    setSelectedAppt(null);
    fetchAppointments();
  };

  const handleDelete = async (id) => {
    if (confirm('Bu randevuyu silmek istediğinize emin misiniz?')) {
      setAppointments(prev => prev.filter(a => a.id !== id));
      try {
        await supabase.from('appointments').delete().eq('id', id);
      } catch (err) {}
    }
  };

  const openNewModal = (defaultDate = null) => {
    setSelectedAppt(null);
    setFormData({
      artist_id: currentUser.role === 'admin' ? 'art1' : currentUser.id,
      client_name: '',
      date: defaultDate || selectedCalendarDate,
      time: '14:00',
      body_part: 'Ön Kol',
      price: 3500,
      reported: false,
      status: 'pending'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (appt) => {
    setSelectedAppt(appt);
    setFormData(appt);
    setIsModalOpen(true);
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const isSuperAdmin = currentUser?.role === 'admin';
  const filteredAppointments = appointments.filter(a => filterArtist === 'all' || a.artist_id === filterArtist);
  const dayAppointments = filteredAppointments.filter(a => a.date === selectedCalendarDate);

  const myAppts = appointments.filter(a => a.artist_id === currentUser?.id);
  const myRevenue = myAppts.reduce((acc, a) => acc + Number(a.price || 0), 0);
  const myRate = currentUser?.commission_rate || 50;
  const myCut = myRevenue - (myRevenue * (myRate / 100));

  const allRevenue = appointments.reduce((acc, a) => acc + Number(a.price || 0), 0);
  const studioNetProfit = appointments.reduce((acc, a) => {
    const art = INITIAL_ARTISTS.find(i => i.id === a.artist_id);
    const r = art ? art.commission_rate : 50;
    return acc + (Number(a.price || 0) * (r / 100));
  }, 0);

  if (!currentUser) {
    return (
      <div style={{ backgroundColor: '#0d1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '380px', backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '24px', padding: '32px 26px', boxShadow: '0 20px 45px rgba(0,0,0,0.8)' }}>
          <div style={{ textAlign: 'center', marginBottom: '26px' }}>
            <div style={{ display: 'inline-flex', padding: '14px', borderRadius: '18px', backgroundColor: '#21262d', color: '#f0f6fc', border: '1px solid #30363d', marginBottom: '12px' }}>
              <CalendarIcon size={28} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f0f6fc', margin: 0 }}>Studio Portal</h1>
            <p style={{ color: '#8b949e', fontSize: '13px', marginTop: '4px' }}>Sanatçı & Yönetici Girişi</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', marginBottom: '5px' }}>Kullanıcı Adı</label>
              <input 
                type="text" 
                required 
                value={usernameInput} 
                onChange={e => setUsernameInput(e.target.value)} 
                placeholder="örn: bosside, yasin, egecan..." 
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '12px', padding: '12px', color: '#f0f6fc', fontSize: '14px' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', marginBottom: '5px' }}>Şifre</label>
              <input 
                type="password" 
                required 
                value={passwordInput} 
                onChange={e => setPasswordInput(e.target.value)} 
                placeholder="••••••••" 
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '12px', padding: '12px', color: '#f0f6fc', fontSize: '14px' }} 
              />
            </div>

            {loginError && <p style={{ color: '#f85149', fontSize: '12px', margin: 0 }}>{loginError}</p>}

            <button type="submit" style={{ backgroundColor: '#f0f6fc', color: '#0d1117', fontWeight: 700, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', marginTop: '6px', fontSize: '14px' }}>
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0d1117', color: '#f0f6fc', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <header style={{ borderBottom: '1px solid #21262d', backgroundColor: '#161b22', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => setActiveTab('profile')}>
          {avatars[currentUser.id] ? (
            <img src={avatars[currentUser.id]} alt="Profil" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #30363d', cursor: 'pointer' }} />
          ) : (
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#21262d', border: '2px solid #30363d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#f0f6fc', cursor: 'pointer' }}>
              {currentUser.name.charAt(0)}
            </div>
          )}
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#f0f6fc' }}>Studio Portal</h2>
            <span style={{ fontSize: '12px', color: '#8b949e' }}>{currentUser.name}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => openNewModal()} style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f0f6fc', color: '#0d1117', padding: '8px 12px', borderRadius: '10px', fontWeight: 600, fontSize: '12px', border: 'none', cursor: 'pointer' }}>
            <Plus size={15} /> Ekle
          </button>
          <button onClick={handleLogout} style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#21262d', border: '1px solid #30363d', color: '#8b949e', cursor: 'pointer' }}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Navigasyon Sekmeleri */}
      <div style={{ borderBottom: '1px solid #21262d', backgroundColor: '#161b22', padding: '0 16px', display: 'flex', gap: '16px', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('calendar')} style={{ padding: '12px 2px', borderBottom: activeTab === 'calendar' ? '2px solid #f0f6fc' : '2px solid transparent', color: activeTab === 'calendar' ? '#f0f6fc' : '#8b949e', fontWeight: 600, fontSize: '13px', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}>
          Takvim
        </button>
        <button onClick={() => setActiveTab('profile')} style={{ padding: '12px 2px', borderBottom: activeTab === 'profile' ? '2px solid #f0f6fc' : '2px solid transparent', color: activeTab === 'profile' ? '#f0f6fc' : '#8b949e', fontWeight: 600, fontSize: '13px', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}>
          Profilim & Analiz
        </button>
        {isSuperAdmin && (
          <button onClick={() => setActiveTab('admin_panel')} style={{ padding: '12px 2px', borderBottom: activeTab === 'admin_panel' ? '2px solid #f0f6fc' : '2px solid transparent', color: activeTab === 'admin_panel' ? '#f0f6fc' : '#8b949e', fontWeight: 600, fontSize: '13px', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}>
            Dükkan Masası
          </button>
        )}
      </div>

      {/* Gövde */}
      <main style={{ flex: 1, padding: '16px', maxWidth: '800px', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
        
        {/* TAKVİM SEKMESİ */}
        {activeTab === 'calendar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '18px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{MONTH_NAMES[month]} {year}</h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={prevMonth} style={{ padding: '6px 10px', borderRadius: '8px', backgroundColor: '#21262d', border: '1px solid #30363d', color: '#f0f6fc', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
                  <button onClick={nextMonth} style={{ padding: '6px 10px', borderRadius: '8px', backgroundColor: '#21262d', border: '1px solid #30363d', color: '#f0f6fc', cursor: 'pointer' }}><ChevronRight size={16} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                <button onClick={() => setFilterArtist('all')} style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', border: filterArtist === 'all' ? '1px solid #f0f6fc' : '1px solid #30363d', backgroundColor: filterArtist === 'all' ? '#f0f6fc' : '#21262d', color: filterArtist === 'all' ? '#0d1117' : '#8b949e', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>Tümü</button>
                {INITIAL_ARTISTS.filter(a => a.role !== 'admin').map(art => (
                  <button key={art.id} onClick={() => setFilterArtist(art.id)} style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', border: filterArtist === art.id ? `1px solid ${art.color}` : '1px solid #30363d', backgroundColor: '#21262d', color: filterArtist === art.id ? '#f0f6fc' : '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: art.color }}></span>
                    {art.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Yatay Gün Seçimi */}
            <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '18px', padding: '14px' }}>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayOfWeek = (new Date(year, month, dayNum).getDay() + 6) % 7;
                  const dayAppts = filteredAppointments.filter(a => a.date === dateStr);
                  const isSelected = selectedCalendarDate === dateStr;

                  return (
                    <button key={dateStr} onClick={() => setSelectedCalendarDate(dateStr)} style={{ minWidth: '52px', padding: '10px 4px', borderRadius: '14px', backgroundColor: isSelected ? '#f0f6fc' : '#0d1117', border: isSelected ? '1px solid #f0f6fc' : '1px solid #30363d', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', color: isSelected ? '#0d1117' : '#8b949e', fontWeight: 600 }}>{DAY_NAMES_SHORT[dayOfWeek]}</span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: isSelected ? '#0d1117' : '#f0f6fc' }}>{dayNum}</span>
                      {dayAppts.length > 0 ? (
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {dayAppts.slice(0, 3).map((a, i) => (
                            <span key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: isSelected ? '#0d1117' : '#60a5fa' }}></span>
                          ))}
                        </div>
                      ) : <span style={{ width: '4px', height: '4px' }}></span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Randevu Kartları */}
            <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '18px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>{selectedCalendarDate} Seansları</h4>
                <button onClick={() => openNewModal(selectedCalendarDate)} style={{ backgroundColor: '#21262d', color: '#f0f6fc', border: '1px solid #30363d', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>+ Yeni Randevu</button>
              </div>

              {dayAppointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#8b949e', fontSize: '13px' }}>Bu tarihte randevu bulunmuyor.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {dayAppointments.map(appt => {
                    const art = INITIAL_ARTISTS.find(i => i.id === appt.artist_id);
                    const canSeePrice = isSuperAdmin || appt.artist_id === currentUser.id;

                    return (
                      <div key={appt.id} style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', borderLeft: `4px solid ${art?.color || '#8b949e'}`, borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: art?.color, fontWeight: 700 }}>{art?.name}</span>
                          <span style={{ fontSize: '12px', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {appt.time}</span>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#f0f6fc' }}>{appt.client_name}</div>
                        <div style={{ fontSize: '12px', color: '#8b949e' }}>Bölge: <span style={{ color: '#c9d1d9' }}>{appt.body_part}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '6px', borderTop: '1px solid #21262d' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                            {canSeePrice ? `${Number(appt.price).toLocaleString('tr-TR')} ₺` : <span style={{ color: '#8b949e', fontSize: '12px' }}><Lock size={12} style={{ display: 'inline' }} /> Gizli</span>}
                          </span>
                          {canSeePrice && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => openEditModal(appt)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}><Edit3 size={15} /></button>
                              <button onClick={() => handleDelete(appt.id)} style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer' }}><Trash2 size={15} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* KİŞİSEL PROFİL & ANALİZ SEKMESİ */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '18px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                {avatars[currentUser.id] ? (
                  <img src={avatars[currentUser.id]} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #30363d' }} />
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#21262d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: '#f0f6fc' }}>
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <label htmlFor="user-avatar" style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#f0f6fc', color: '#0d1117', borderRadius: '50%', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={14} />
                </label>
                <input id="user-avatar" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{currentUser.name}</h3>
                <span style={{ fontSize: '12px', color: '#8b949e' }}>@{currentUser.username} {isSuperAdmin ? '• Yönetici' : `• %${100 - myRate} Sanatçı Payı`}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '16px', padding: '14px' }}>
                <span style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase' }}>Kişisel Ciro</span>
                <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '6px 0 0 0', color: '#f0f6fc' }}>{myRevenue.toLocaleString('tr-TR')} ₺</h4>
              </div>

              {!isSuperAdmin && (
                <div style={{ backgroundColor: '#161b22', border: '1px solid #10b981', borderRadius: '16px', padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#10b981', textTransform: 'uppercase' }}>Net Hakedişim</span>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '6px 0 0 0', color: '#10b981' }}>{myCut.toLocaleString('tr-TR')} ₺</h4>
                </div>
              )}

              <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '16px', padding: '14px' }}>
                <span style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase' }}>Toplam Seans</span>
                <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '6px 0 0 0', color: '#f0f6fc' }}>{myAppts.length} Seans</h4>
              </div>

              <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '16px', padding: '14px' }}>
                <span style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase' }}>Ortalama Seans</span>
                <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '6px 0 0 0', color: '#60a5fa' }}>{myAppts.length > 0 ? Math.round(myRevenue / myAppts.length).toLocaleString('tr-TR') : 0} ₺</h4>
              </div>
            </div>

            <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '18px', padding: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0' }}>Şifre Değiştir</h4>
              <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="password" required placeholder="Mevcut Şifre" value={currentPass} onChange={e => setCurrentPass(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '10px', padding: '10px', color: '#f0f6fc', fontSize: '13px' }} />
                <input type="password" required placeholder="Yeni Şifre" value={newPass} onChange={e => setNewPass(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '10px', padding: '10px', color: '#f0f6fc', fontSize: '13px' }} />
                {passMsg && <p style={{ fontSize: '12px', margin: 0, color: passMsg.includes('başarıyla') ? '#10b981' : '#f85149' }}>{passMsg}</p>}
                <button type="submit" style={{ backgroundColor: '#21262d', border: '1px solid #30363d', color: '#f0f6fc', padding: '10px', borderRadius: '10px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Şifreyi Güncelle</button>
              </form>
            </div>
          </div>
        )}

        {/* DÜKKAN SAHİBİ MASASI */}
        {activeTab === 'admin_panel' && isSuperAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '16px', padding: '16px' }}>
                <span style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase' }}>Stüdyo Toplam Ciro</span>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '6px 0 0 0', color: '#f0f6fc' }}>{allRevenue.toLocaleString('tr-TR')} ₺</h3>
              </div>
              <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '16px', padding: '16px' }}>
                <span style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase' }}>Dükkan Net Kârı</span>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '6px 0 0 0', color: '#10b981' }}>{studioNetProfit.toLocaleString('tr-TR')} ₺</h3>
              </div>
            </div>

            <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '18px', padding: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0' }}>Sanatçı Hasılat & Hakedişleri</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #21262d', color: '#8b949e', textAlign: 'left' }}>
                      <th style={{ padding: '8px 4px' }}>Sanatçı</th>
                      <th style={{ padding: '8px 4px' }}>Seans</th>
                      <th style={{ padding: '8px 4px' }}>Ciro</th>
                      <th style={{ padding: '8px 4px' }}>Dükkan Payı</th>
                      <th style={{ padding: '8px 4px' }}>Hakediş</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INITIAL_ARTISTS.filter(a => a.role !== 'admin').map(art => {
                      const aAppts = appointments.filter(a => a.artist_id === art.id);
                      const rev = aAppts.reduce((acc, a) => acc + Number(a.price || 0), 0);
                      const cut = rev * (art.commission_rate / 100);
                      return (
                        <tr key={art.id} style={{ borderBottom: '1px solid #21262d' }}>
                          <td style={{ padding: '8px 4px', fontWeight: 600 }}>{art.name}</td>
                          <td style={{ padding: '8px 4px' }}>{aAppts.length}</td>
                          <td style={{ padding: '8px 4px' }}>{rev.toLocaleString('tr-TR')} ₺</td>
                          <td style={{ padding: '8px 4px', color: '#c9d1d9' }}>{cut.toLocaleString('tr-TR')} ₺</td>
                          <td style={{ padding: '8px 4px', color: '#10b981', fontWeight: 700 }}>{(rev - cut).toLocaleString('tr-TR')} ₺</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Randevu Ekle / Düzenle Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '18px', width: '100%', maxWidth: '380px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0' }}>{selectedAppt ? 'Randevuyu Düzenle' : 'Yeni Randevu Ekle'}</h3>
            <form onSubmit={handleSaveAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isSuperAdmin && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>Sanatçı</label>
                  <select value={formData.artist_id} onChange={e => setFormData({ ...formData, artist_id: e.target.value })} style={{ width: '100%', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', padding: '8px', color: '#f0f6fc', fontSize: '13px' }}>
                    {INITIAL_ARTISTS.filter(a => a.role !== 'admin').map(art => (
                      <option key={art.id} value={art.id}>{art.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>Müşteri Adı</label>
                <input type="text" required value={formData.client_name} onChange={e => setFormData({ ...formData, client_name: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', padding: '8px', color: '#f0f6fc', fontSize: '13px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>Tarih</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', padding: '8px', color: '#f0f6fc', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>Saat</label>
                  <input type="time" required value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', padding: '8px', color: '#f0f6fc', fontSize: '13px' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>Bölge</label>
                  <input type="text" value={formData.body_part} onChange={e => setFormData({ ...formData, body_part: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', padding: '8px', color: '#f0f6fc', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>Ücret (₺)</label>
                  <input type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', padding: '8px', color: '#f0f6fc', fontSize: '13px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ backgroundColor: '#21262d', border: 'none', color: '#8b949e', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>İptal</button>
                <button type="submit" style={{ backgroundColor: '#f0f6fc', border: 'none', color: '#0d1117', fontWeight: 700, padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
