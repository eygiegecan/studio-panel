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
  MessageCircle, 
  CheckCircle2, 
  Bell, 
  Palette, 
  LayoutGrid 
} from 'lucide-react';

const INITIAL_ARTISTS = [
  { id: 'admin', name: 'Dükkan Sahibi', username: 'bosside', password: 'nautilus081025', role: 'admin', color: '#e6edf3', commission_rate: 0 },
  { id: 'art1', name: 'Ege Can', username: 'egecan', password: 'egecan123', role: 'artist', color: '#10b981', commission_rate: 50 },
  { id: 'art2', name: 'Yasin', username: 'yasin', password: 'yasin123', role: 'artist', color: '#3b82f6', commission_rate: 30 },
  { id: 'art3', name: 'Asil', username: 'asil', password: 'asil123', role: 'artist', color: '#f43f5e', commission_rate: 50 },
  { id: 'art4', name: 'Yeşim', username: 'yesim', password: 'yesim123', role: 'artist', color: '#a78bfa', commission_rate: 30 },
  { id: 'art5', name: 'Oğuz', username: 'oguz', password: 'oguz123', role: 'artist', color: '#2dd4bf', commission_rate: 50 }
];

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const DAY_NAMES_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

// Hem Koyu Hem Açık Premium Temalar
const THEMES = {
  obsidian: {
    name: 'Obsidian',
    isLight: false,
    bg: '#0d1117',
    card: '#161b22',
    border: '#30363d',
    subCard: '#21262d',
    text: '#f0f6fc',
    muted: '#8b949e'
  },
  midnight: {
    name: 'Midnight',
    isLight: false,
    bg: '#0a0f1d',
    card: '#111827',
    border: '#1f293d',
    subCard: '#1a2236',
    text: '#f3f4f6',
    muted: '#94a3b8'
  },
  slate: {
    name: 'Slate',
    isLight: false,
    bg: '#121417',
    card: '#1a1d23',
    border: '#2a2f38',
    subCard: '#242933',
    text: '#f8fafc',
    muted: '#94a3b8'
  },
  atelier: {
    name: 'Atelier (Açık)',
    isLight: true,
    bg: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    subCard: '#f1f5f9',
    text: '#0f172a',
    muted: '#64748b'
  },
  sand: {
    name: 'Warm Sand (Krem)',
    isLight: true,
    bg: '#f7f5f0',
    card: '#ffffff',
    border: '#e6e2d8',
    subCard: '#ede9df',
    text: '#292524',
    muted: '#78716c'
  }
};

const ACCENT_COLORS = [
  { name: 'Siyah / Beyaz Dinamik', darkVal: '#f0f6fc', lightVal: '#0f172a', textDark: '#0d1117', textLight: '#ffffff' },
  { name: 'Zümrüt', darkVal: '#10b981', lightVal: '#059669', textDark: '#ffffff', textLight: '#ffffff' },
  { name: 'Okyanus', darkVal: '#3b82f6', lightVal: '#2563eb', textDark: '#ffffff', textLight: '#ffffff' },
  { name: 'Gül', darkVal: '#f43f5e', lightVal: '#e11d48', textDark: '#ffffff', textLight: '#ffffff' },
  { name: 'Lavanta', darkVal: '#a855f7', lightVal: '#9333ea', textDark: '#ffffff', textLight: '#ffffff' },
  { name: 'Amber', darkVal: '#f59e0b', lightVal: '#d97706', textDark: '#0d1117', textLight: '#ffffff' }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nautilus_active_session_v7');
      return saved ? JSON.parse(saved) : null;
    } catch(e) { return null; }
  });

  const [appointments, setAppointments] = useState([]);

  // Tema Tercihleri
  const [themeKey, setThemeKey] = useState(() => {
    return localStorage.getItem('nautilus_theme_key') || 'obsidian';
  });

  const [accentIndex, setAccentIndex] = useState(() => {
    const saved = localStorage.getItem('nautilus_accent_index');
    return saved !== null ? Number(saved) : 0;
  });

  const [calendarViewMode, setCalendarViewMode] = useState(() => {
    return localStorage.getItem('nautilus_calendar_view') || 'compact';
  });

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

  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 30));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('2026-09-30');

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState('');

  const [formData, setFormData] = useState({
    artist_id: '',
    client_name: '',
    phone: '',
    date: '2026-09-30',
    time: '14:00',
    body_part: 'Ön Kol',
    price: 3500,
    deposit: 500,
    payment_status: 'pending',
    reported: false,
    status: 'pending'
  });

  const currentTheme = THEMES[themeKey] || THEMES.obsidian;
  const selectedAccent = ACCENT_COLORS[accentIndex] || ACCENT_COLORS[0];
  const accentColor = currentTheme.isLight ? selectedAccent.lightVal : selectedAccent.darkVal;
  const accentTextColor = currentTheme.isLight ? selectedAccent.textLight : selectedAccent.textDark;

  const changeTheme = (key) => {
    setThemeKey(key);
    localStorage.setItem('nautilus_theme_key', key);
  };

  const changeAccent = (index) => {
    setAccentIndex(index);
    localStorage.setItem('nautilus_accent_index', String(index));
  };

  const changeCalendarView = (mode) => {
    setCalendarViewMode(mode);
    localStorage.setItem('nautilus_calendar_view', mode);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification('Nautilus Studio Portal', {
          body: 'Randevu bildirimleri başarıyla aktifleştirildi!',
          icon: '/favicon.ico'
        });
      }
    }
  };

  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase.from('appointments').select('*').order('date', { ascending: true });
      if (!error && data) {
        setAppointments(data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel('realtime-appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newDoc = payload.new;
            const artist = INITIAL_ARTISTS.find(a => a.id === newDoc.artist_id);
            showNotification('Yeni Randevu!', `${artist ? artist.name : 'Bir sanatçı'} için ${newDoc.client_name} randevusu eklendi.`);
          }
          fetchAppointments();
        }
      )
      .subscribe();

    const interval = setInterval(fetchAppointments, 8000);

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
      price: Number(formData.price) || 0,
      deposit: Number(formData.deposit) || 0
    };

    if (selectedAppt) {
      const { error } = await supabase.from('appointments').update(payload).eq('id', selectedAppt.id);
      if (error) {
        alert('Güncelleme hatası: ' + error.message);
        return;
      }
    } else {
      const newId = 'apt_' + Date.now();
      const newEntry = { ...payload, id: newId };
      const { error } = await supabase.from('appointments').insert([newEntry]);
      if (error) {
        alert('Kayıt hatası: ' + error.message);
        return;
      }
    }
    setIsModalOpen(false);
    setSelectedAppt(null);
    fetchAppointments();
  };

  const togglePaymentStatus = async (appt) => {
    const nextStatus = appt.payment_status === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase.from('appointments').update({ payment_status: nextStatus }).eq('id', appt.id);
    if (!error) {
      fetchAppointments();
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Bu randevuyu silmek istediğinize emin misiniz?')) {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) {
        alert('Silme hatası: ' + error.message);
      } else {
        fetchAppointments();
      }
    }
  };

  const sendWhatsApp = (appt) => {
    if (!appt.phone) {
      alert('Bu randevuda kayıtlı telefon numarası bulunmuyor.');
      return;
    }
    const cleanPhone = appt.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('90') ? cleanPhone : (cleanPhone.startsWith('0') ? '9' + cleanPhone : '90' + cleanPhone);
    const artist = INITIAL_ARTISTS.find(a => a.id === appt.artist_id);
    const artistName = artist ? artist.name : 'Nautilus Tattoo Ekibi';

    const text = `Merhaba ${appt.client_name}, Nautilus Tattoo'da ${appt.date} günü saat ${appt.time ? appt.time.slice(0, 5) : ''}'de ${artistName} ile dövme seansınız planlanmıştır. Randevu saatinden önce tok gelmenizi ve bol su tüketmenizi rica ederiz. Görüşmek üzere!`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const openNewModal = (defaultDate = null) => {
    setSelectedAppt(null);
    setFormData({
      artist_id: currentUser.role === 'admin' ? 'art1' : currentUser.id,
      client_name: '',
      phone: '',
      date: defaultDate || selectedCalendarDate,
      time: '14:00',
      body_part: 'Ön Kol',
      price: 3500,
      deposit: 500,
      payment_status: 'pending',
      reported: false,
      status: 'pending'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (appt) => {
    setSelectedAppt(appt);
    setFormData({
      ...appt,
      phone: appt.phone || '',
      deposit: appt.deposit || 0,
      payment_status: appt.payment_status || 'pending'
    });
    setIsModalOpen(true);
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (new Date(year, month, 1).getDay() + 6) % 7;

  const isSuperAdmin = currentUser?.role === 'admin';
  const filteredAppointments = appointments.filter(a => filterArtist === 'all' || a.artist_id === filterArtist);
  const dayAppointments = filteredAppointments.filter(a => a.date === selectedCalendarDate);

  const myAppts = appointments.filter(a => a.artist_id === currentUser?.id);
  const myRevenue = myAppts.reduce((acc, a) => acc + Number(a.price || 0), 0);
  const myRate = currentUser?.commission_rate || 50;
  const myCut = myRevenue - (myRevenue * (myRate / 100));

  const allRevenue = appointments.reduce((acc, a) => acc + Number(a.price || 0), 0);
  const allDeposits = appointments.reduce((acc, a) => acc + Number(a.deposit || 0), 0);
  const studioNetProfit = appointments.reduce((acc, a) => {
    const art = INITIAL_ARTISTS.find(i => i.id === a.artist_id);
    const r = art ? art.commission_rate : 50;
    return acc + (Number(a.price || 0) * (r / 100));
  }, 0);

  if (!currentUser) {
    return (
      <div style={{ backgroundColor: currentTheme.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '380px', backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '24px', padding: '32px 26px', boxShadow: currentTheme.isLight ? '0 10px 30px rgba(0,0,0,0.06)' : '0 20px 45px rgba(0,0,0,0.8)' }}>
          <div style={{ textAlign: 'center', marginBottom: '26px' }}>
            <div style={{ display: 'inline-flex', padding: '14px', borderRadius: '18px', backgroundColor: currentTheme.subCard, color: accentColor, border: `1px solid ${currentTheme.border}`, marginBottom: '12px' }}>
              <CalendarIcon size={28} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: currentTheme.text, margin: 0 }}>Studio Portal</h1>
            <p style={{ color: currentTheme.muted, fontSize: '13px', marginTop: '4px' }}>Sanatçı & Yönetici Girişi</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '5px' }}>Kullanıcı Adı</label>
              <input 
                type="text" 
                required 
                value={usernameInput} 
                onChange={e => setUsernameInput(e.target.value)} 
                placeholder="bosside, yasin, egecan..." 
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '12px', padding: '12px', color: currentTheme.text, fontSize: '14px' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '5px' }}>Şifre</label>
              <input 
                type="password" 
                required 
                value={passwordInput} 
                onChange={e => setPasswordInput(e.target.value)} 
                placeholder="••••••••" 
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '12px', padding: '12px', color: currentTheme.text, fontSize: '14px' }} 
              />
            </div>

            {loginError && <p style={{ color: '#f85149', fontSize: '12px', margin: 0 }}>{loginError}</p>}

            <button type="submit" style={{ backgroundColor: accentColor, color: accentTextColor, fontWeight: 700, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', marginTop: '6px', fontSize: '14px' }}>
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: currentTheme.bg, color: currentTheme.text, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${currentTheme.border}`, backgroundColor: currentTheme.card, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => setActiveTab('profile')}>
          {avatars[currentUser.id] ? (
            <img src={avatars[currentUser.id]} alt="Profil" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accentColor}`, cursor: 'pointer' }} />
          ) : (
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: currentTheme.subCard, border: `2px solid ${accentColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: currentTheme.text, cursor: 'pointer' }}>
              {currentUser.name.charAt(0)}
            </div>
          )}
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: currentTheme.text }}>Studio Portal</h2>
            <span style={{ fontSize: '12px', color: currentTheme.muted }}>{currentUser.name}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => openNewModal()} style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: accentColor, color: accentTextColor, padding: '8px 12px', borderRadius: '10px', fontWeight: 600, fontSize: '12px', border: 'none', cursor: 'pointer' }}>
            <Plus size={15} /> Ekle
          </button>
          <button onClick={handleLogout} style={{ padding: '8px', borderRadius: '10px', backgroundColor: currentTheme.subCard, border: `1px solid ${currentTheme.border}`, color: currentTheme.muted, cursor: 'pointer' }}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Navigasyon Sekmeleri */}
      <div style={{ borderBottom: `1px solid ${currentTheme.border}`, backgroundColor: currentTheme.card, padding: '0 16px', display: 'flex', gap: '16px', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('calendar')} style={{ padding: '12px 2px', borderBottom: activeTab === 'calendar' ? `2px solid ${accentColor}` : '2px solid transparent', color: activeTab === 'calendar' ? (currentTheme.isLight ? currentTheme.text : accentColor) : currentTheme.muted, fontWeight: 700, fontSize: '13px', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}>
          Takvim
        </button>
        <button onClick={() => setActiveTab('profile')} style={{ padding: '12px 2px', borderBottom: activeTab === 'profile' ? `2px solid ${accentColor}` : '2px solid transparent', color: activeTab === 'profile' ? (currentTheme.isLight ? currentTheme.text : accentColor) : currentTheme.muted, fontWeight: 700, fontSize: '13px', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}>
          Profilim & Analiz
        </button>
        {isSuperAdmin && (
          <button onClick={() => setActiveTab('admin_panel')} style={{ padding: '12px 2px', borderBottom: activeTab === 'admin_panel' ? `2px solid ${accentColor}` : '2px solid transparent', color: activeTab === 'admin_panel' ? (currentTheme.isLight ? currentTheme.text : accentColor) : currentTheme.muted, fontWeight: 700, fontSize: '13px', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}>
            Dükkan Masası
          </button>
        )}
      </div>

      {/* Gövde */}
      <main style={{ flex: 1, padding: '16px', maxWidth: '850px', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
        
        {/* TAKVİM SEKMESİ */}
        {activeTab === 'calendar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Ay ve Sanatçı Filtresi */}
            <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '18px', padding: '14px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: currentTheme.text }}>{MONTH_NAMES[month]} {year}</h3>
                  <button onClick={() => changeCalendarView(calendarViewMode === 'compact' ? 'grid' : 'compact')} style={{ background: currentTheme.subCard, border: `1px solid ${currentTheme.border}`, color: currentTheme.muted, borderRadius: '8px', padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <LayoutGrid size={12} /> {calendarViewMode === 'compact' ? 'Genişlet' : 'Kompakt'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={prevMonth} style={{ padding: '6px 10px', borderRadius: '8px', backgroundColor: currentTheme.subCard, border: `1px solid ${currentTheme.border}`, color: currentTheme.text, cursor: 'pointer' }}><ChevronLeft size={16} /></button>
                  <button onClick={nextMonth} style={{ padding: '6px 10px', borderRadius: '8px', backgroundColor: currentTheme.subCard, border: `1px solid ${currentTheme.border}`, color: currentTheme.text, cursor: 'pointer' }}><ChevronRight size={16} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                <button onClick={() => setFilterArtist('all')} style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', border: filterArtist === 'all' ? `1px solid ${accentColor}` : `1px solid ${currentTheme.border}`, backgroundColor: filterArtist === 'all' ? accentColor : currentTheme.subCard, color: filterArtist === 'all' ? accentTextColor : currentTheme.muted, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>Tümü</button>
                {INITIAL_ARTISTS.filter(a => a.role !== 'admin').map(art => (
                  <button key={art.id} onClick={() => setFilterArtist(art.id)} style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', border: filterArtist === art.id ? `1px solid ${art.color}` : `1px solid ${currentTheme.border}`, backgroundColor: currentTheme.subCard, color: filterArtist === art.id ? currentTheme.text : currentTheme.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: art.color }}></span>
                    {art.name}
                  </button>
                ))}
              </div>
            </div>

            {/* TAKVİM DÜZENİ: GENİŞ IZGARA VEYA KOMPAKT ŞERİT */}
            {calendarViewMode === 'grid' ? (
              <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '18px', padding: '14px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
                  {DAY_NAMES_SHORT.map((d, i) => (
                    <span key={i} style={{ fontSize: '11px', color: currentTheme.muted, fontWeight: 600 }}>{d}</span>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={'empty_' + i} style={{ height: '52px', borderRadius: '12px', opacity: 0.2, backgroundColor: currentTheme.subCard }}></div>
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const dayAppts = filteredAppointments.filter(a => a.date === dateStr);
                    const isSelected = selectedCalendarDate === dateStr;

                    return (
                      <button 
                        key={dateStr} 
                        onClick={() => setSelectedCalendarDate(dateStr)} 
                        style={{ 
                          height: '52px', 
                          borderRadius: '12px', 
                          backgroundColor: isSelected ? accentColor : currentTheme.subCard, 
                          border: isSelected ? `1px solid ${accentColor}` : `1px solid ${currentTheme.border}`, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '6px 2px', 
                          cursor: 'pointer' 
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? accentTextColor : currentTheme.text }}>
                          {dayNum}
                        </span>
                        {dayAppts.length > 0 ? (
                          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                            {dayAppts.slice(0, 3).map((a, i) => (
                              <span key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isSelected ? accentTextColor : '#3b82f6' }}></span>
                            ))}
                            {dayAppts.length > 3 && (
                              <span style={{ fontSize: '9px', fontWeight: 700, color: isSelected ? accentTextColor : currentTheme.muted }}>+</span>
                            )}
                          </div>
                        ) : <span style={{ height: '5px' }}></span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '18px', padding: '14px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const dayOfWeek = (new Date(year, month, dayNum).getDay() + 6) % 7;
                    const dayAppts = filteredAppointments.filter(a => a.date === dateStr);
                    const isSelected = selectedCalendarDate === dateStr;

                    return (
                      <button key={dateStr} onClick={() => setSelectedCalendarDate(dateStr)} style={{ minWidth: '52px', padding: '10px 4px', borderRadius: '14px', backgroundColor: isSelected ? accentColor : currentTheme.bg, border: isSelected ? `1px solid ${accentColor}` : `1px solid ${currentTheme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', color: isSelected ? accentTextColor : currentTheme.muted, fontWeight: 600 }}>{DAY_NAMES_SHORT[dayOfWeek]}</span>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: isSelected ? accentTextColor : currentTheme.text }}>{dayNum}</span>
                        {dayAppts.length > 0 ? (
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {dayAppts.slice(0, 3).map((a, i) => (
                              <span key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: isSelected ? accentTextColor : '#3b82f6' }}></span>
                            ))}
                          </div>
                        ) : <span style={{ width: '4px', height: '4px' }}></span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Randevu Kartları */}
            <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '18px', padding: '16px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: currentTheme.text }}>{selectedCalendarDate} Seansları</h4>
                <button onClick={() => openNewModal(selectedCalendarDate)} style={{ backgroundColor: currentTheme.subCard, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>+ Yeni Randevu</button>
              </div>

              {dayAppointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: currentTheme.muted, fontSize: '13px' }}>Bu tarihte randevu bulunmuyor.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {dayAppointments.map(appt => {
                    const art = INITIAL_ARTISTS.find(i => i.id === appt.artist_id);
                    const canSeePrice = isSuperAdmin || appt.artist_id === currentUser.id;
                    const price = Number(appt.price || 0);
                    const deposit = Number(appt.deposit || 0);
                    const remaining = Math.max(0, price - deposit);
                    const isPaid = appt.payment_status === 'completed';

                    return (
                      <div key={appt.id} style={{ backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderLeft: `4px solid ${art?.color || currentTheme.muted}`, borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: art?.color, fontWeight: 700 }}>{art?.name}</span>
                          <span style={{ fontSize: '12px', color: currentTheme.muted, display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {appt.time ? appt.time.slice(0, 5) : ''}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: currentTheme.text }}>{appt.client_name}</div>
                            <div style={{ fontSize: '12px', color: currentTheme.muted }}>Bölge: <span style={{ color: currentTheme.text }}>{appt.body_part}</span></div>
                          </div>

                          {appt.phone && (
                            <button onClick={() => sendWhatsApp(appt)} style={{ backgroundColor: '#238636', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                              <MessageCircle size={14} /> WhatsApp
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', paddingTop: '8px', borderTop: `1px solid ${currentTheme.border}` }}>
                          <div>
                            {canSeePrice ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                <span style={{ fontWeight: 700, color: currentTheme.text }}>{price.toLocaleString('tr-TR')} ₺</span>
                                <span style={{ color: '#059669', backgroundColor: currentTheme.isLight ? '#d1fae5' : '#0f2d1e', padding: '2px 6px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>Kapora: {deposit.toLocaleString('tr-TR')} ₺</span>
                                <span style={{ color: isPaid ? currentTheme.muted : '#d97706', fontSize: '11px', fontWeight: 600 }}>
                                  {isPaid ? 'Ödendi' : `Kalan: ${remaining.toLocaleString('tr-TR')} ₺`}
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: currentTheme.muted, fontSize: '12px' }}><Lock size={12} style={{ display: 'inline' }} /> Fiyat Gizli</span>
                            )}
                          </div>

                          {canSeePrice && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button onClick={() => togglePaymentStatus(appt)} title="Ödeme Durumu Değiştir" style={{ background: 'none', border: 'none', color: isPaid ? '#10b981' : currentTheme.muted, cursor: 'pointer', padding: 0 }}>
                                <CheckCircle2 size={16} />
                              </button>
                              <button onClick={() => openEditModal(appt)} style={{ background: 'none', border: 'none', color: currentTheme.muted, cursor: 'pointer', padding: 0 }}><Edit3 size={15} /></button>
                              <button onClick={() => handleDelete(appt.id)} style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', padding: 0 }}><Trash2 size={15} /></button>
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

        {/* PROFİLİM & ANALİZ SEKMESİ */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Profil Kartı */}
            <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '18px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
              <div style={{ position: 'relative' }}>
                {avatars[currentUser.id] ? (
                  <img src={avatars[currentUser.id]} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${accentColor}` }} />
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: currentTheme.subCard, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: currentTheme.text }}>
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <label htmlFor="user-avatar" style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: accentColor, color: accentTextColor, borderRadius: '50%', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={14} />
                </label>
                <input id="user-avatar" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: currentTheme.text }}>{currentUser.name}</h3>
                <span style={{ fontSize: '12px', color: currentTheme.muted }}>@{currentUser.username} {isSuperAdmin ? '• Yönetici' : `• %${100 - myRate} Sanatçı Payı`}</span>
              </div>
              <button onClick={requestNotificationPermission} style={{ backgroundColor: currentTheme.subCard, border: `1px solid ${currentTheme.border}`, color: '#2563eb', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <Bell size={14} /> Yeni Randevu Bildirimlerini Aç
              </button>
            </div>

            {/* ARAYÜZ & TEMA KİŞİSELLEŞTİRME KARTI */}
            <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '18px', padding: '16px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                <Palette size={16} style={{ color: accentColor }} />
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: currentTheme.text }}>Arayüz & Tema Ayarları</h4>
              </div>

              {/* 1. Arka Plan Teması (Açık ve Koyu Seçenekler) */}
              <div style={{ marginBottom: '14px' }}>
                <span style={{ display: 'block', fontSize: '12px', color: currentTheme.muted, marginBottom: '8px' }}>Atmosfer (Açık & Koyu Temalar)</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                  {Object.entries(THEMES).map(([key, t]) => (
                    <button 
                      key={key} 
                      onClick={() => changeTheme(key)} 
                      style={{ 
                        padding: '10px 8px', 
                        borderRadius: '12px', 
                        backgroundColor: t.card, 
                        border: themeKey === key ? `2px solid ${accentColor}` : `1px solid ${t.border}`, 
                        color: t.text, 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        cursor: 'pointer' 
                      }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Vurgu Rengi */}
              <div style={{ marginBottom: '14px' }}>
                <span style={{ display: 'block', fontSize: '12px', color: currentTheme.muted, marginBottom: '8px' }}>Vurgu Rengi (Accent)</span>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {ACCENT_COLORS.map((c, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => changeAccent(idx)} 
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        backgroundColor: currentTheme.isLight ? c.lightVal : c.darkVal, 
                        border: accentIndex === idx ? (currentTheme.isLight ? '3px solid #0f172a' : '3px solid #ffffff') : '2px solid transparent', 
                        cursor: 'pointer', 
                        flexShrink: 0 
                      }} 
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* 3. Takvim Varsayılan Görünümü */}
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: currentTheme.muted, marginBottom: '8px' }}>Takvim Düzeni</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button 
                    onClick={() => changeCalendarView('compact')} 
                    style={{ 
                      padding: '8px', 
                      borderRadius: '10px', 
                      backgroundColor: calendarViewMode === 'compact' ? currentTheme.subCard : currentTheme.bg, 
                      border: calendarViewMode === 'compact' ? `1px solid ${accentColor}` : `1px solid ${currentTheme.border}`, 
                      color: calendarViewMode === 'compact' ? currentTheme.text : currentTheme.muted, 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      cursor: 'pointer' 
                    }}
                  >
                    Kompakt (Şerit)
                  </button>
                  <button 
                    onClick={() => changeCalendarView('grid')} 
                    style={{ 
                      padding: '8px', 
                      borderRadius: '10px', 
                      backgroundColor: calendarViewMode === 'grid' ? currentTheme.subCard : currentTheme.bg, 
                      border: calendarViewMode === 'grid' ? `1px solid ${accentColor}` : `1px solid ${currentTheme.border}`, 
                      color: calendarViewMode === 'grid' ? currentTheme.text : currentTheme.muted, 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      cursor: 'pointer' 
                    }}
                  >
                    Geniş (Aylık Izgara)
                  </button>
                </div>
              </div>
            </div>

            {/* Kişisel Finans Özeti */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '16px', padding: '14px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
                <span style={{ fontSize: '11px', color: currentTheme.muted, textTransform: 'uppercase' }}>Kişisel Ciro</span>
                <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '6px 0 0 0', color: currentTheme.text }}>{myRevenue.toLocaleString('tr-TR')} ₺</h4>
              </div>

              {!isSuperAdmin && (
                <div style={{ backgroundColor: currentTheme.card, border: '1px solid #10b981', borderRadius: '16px', padding: '14px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
                  <span style={{ fontSize: '11px', color: '#059669', textTransform: 'uppercase' }}>Net Hakedişim</span>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '6px 0 0 0', color: '#059669' }}>{myCut.toLocaleString('tr-TR')} ₺</h4>
                </div>
              )}

              <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '16px', padding: '14px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
                <span style={{ fontSize: '11px', color: currentTheme.muted, textTransform: 'uppercase' }}>Toplam Seans</span>
                <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '6px 0 0 0', color: currentTheme.text }}>{myAppts.length} Seans</h4>
              </div>

              <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '16px', padding: '14px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
                <span style={{ fontSize: '11px', color: currentTheme.muted, textTransform: 'uppercase' }}>Ortalama Seans</span>
                <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '6px 0 0 0', color: '#2563eb' }}>{myAppts.length > 0 ? Math.round(myRevenue / myAppts.length).toLocaleString('tr-TR') : 0} ₺</h4>
              </div>
            </div>

            {/* Şifre Değiştir */}
            <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '18px', padding: '16px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: currentTheme.text }}>Şifre Değiştir</h4>
              <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="password" required placeholder="Mevcut Şifre" value={currentPass} onChange={e => setCurrentPass(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '10px', padding: '10px', color: currentTheme.text, fontSize: '13px' }} />
                <input type="password" required placeholder="Yeni Şifre" value={newPass} onChange={e => setNewPass(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '10px', padding: '10px', color: currentTheme.text, fontSize: '13px' }} />
                {passMsg && <p style={{ fontSize: '12px', margin: 0, color: passMsg.includes('başarıyla') ? '#10b981' : '#f85149' }}>{passMsg}</p>}
                <button type="submit" style={{ backgroundColor: currentTheme.subCard, border: `1px solid ${currentTheme.border}`, color: currentTheme.text, padding: '10px', borderRadius: '10px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Şifreyi Güncelle</button>
              </form>
            </div>
          </div>
        )}

        {/* DÜKKAN SAHİBİ MASASI */}
        {activeTab === 'admin_panel' && isSuperAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '16px', padding: '16px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
                <span style={{ fontSize: '11px', color: currentTheme.muted, textTransform: 'uppercase' }}>Stüdyo Toplam Ciro</span>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '6px 0 0 0', color: currentTheme.text }}>{allRevenue.toLocaleString('tr-TR')} ₺</h3>
              </div>
              <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '16px', padding: '16px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
                <span style={{ fontSize: '11px', color: currentTheme.muted, textTransform: 'uppercase' }}>Toplanan Kapora</span>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '6px 0 0 0', color: '#059669' }}>{allDeposits.toLocaleString('tr-TR')} ₺</h3>
              </div>
            </div>

            <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '18px', padding: '16px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: currentTheme.text }}>Sanatçı Hasılat & Hakedişleri</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${currentTheme.border}`, color: currentTheme.muted, textAlign: 'left' }}>
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
                        <tr key={art.id} style={{ borderBottom: `1px solid ${currentTheme.border}` }}>
                          <td style={{ padding: '8px 4px', fontWeight: 600, color: currentTheme.text }}>{art.name}</td>
                          <td style={{ padding: '8px 4px', color: currentTheme.text }}>{aAppts.length}</td>
                          <td style={{ padding: '8px 4px', color: currentTheme.text }}>{rev.toLocaleString('tr-TR')} ₺</td>
                          <td style={{ padding: '8px 4px', color: currentTheme.muted }}>{cut.toLocaleString('tr-TR')} ₺</td>
                          <td style={{ padding: '8px 4px', color: '#059669', fontWeight: 700 }}>{(rev - cut).toLocaleString('tr-TR')} ₺</td>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
          <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '18px', width: '100%', maxWidth: '380px', padding: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0', color: currentTheme.text }}>{selectedAppt ? 'Randevuyu Düzenle' : 'Yeni Randevu Ekle'}</h3>
            <form onSubmit={handleSaveAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isSuperAdmin && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '4px' }}>Sanatçı</label>
                  <select value={formData.artist_id} onChange={e => setFormData({ ...formData, artist_id: e.target.value })} style={{ width: '100%', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '8px', color: currentTheme.text, fontSize: '13px' }}>
                    {INITIAL_ARTISTS.filter(a => a.role !== 'admin').map(art => (
                      <option key={art.id} value={art.id}>{art.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '4px' }}>Müşteri Adı</label>
                <input type="text" required value={formData.client_name} onChange={e => setFormData({ ...formData, client_name: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '8px', color: currentTheme.text, fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '4px' }}>Telefon (WhatsApp İçin)</label>
                <input type="tel" placeholder="05xxxxxxxxx" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '8px', color: currentTheme.text, fontSize: '13px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '4px' }}>Tarih</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '8px', color: currentTheme.text, fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '4px' }}>Saat</label>
                  <input type="time" required value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '8px', color: currentTheme.text, fontSize: '13px' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '4px' }}>Bölge / Model</label>
                <input type="text" value={formData.body_part} onChange={e => setFormData({ ...formData, body_part: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '8px', color: currentTheme.text, fontSize: '13px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '4px' }}>Toplam Ücret (₺)</label>
                  <input type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '8px', color: currentTheme.text, fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '4px' }}>Alınan Kapora (₺)</label>
                  <input type="number" value={formData.deposit} onChange={e => setFormData({ ...formData, deposit: Number(e.target.value) })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '8px', color: currentTheme.text, fontSize: '13px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ backgroundColor: currentTheme.subCard, border: 'none', color: currentTheme.muted, padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>İptal</button>
                <button type="submit" style={{ backgroundColor: accentColor, border: 'none', color: accentTextColor, fontWeight: 700, padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
