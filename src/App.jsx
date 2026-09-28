import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Plus, 
  TrendingUp, 
  LogOut, 
  Clock, 
  Crown, 
  Trash2, 
  Edit3, 
  KeyRound,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';

const ARTISTS_LIST = [
  { id: 'admin', name: 'Dükkan Sahibi', username: 'bosside', password: 'nautilus081025', role: 'admin', color: '#e6edf3', commission_rate: 0 },
  { id: 'art1', name: 'Ege Can', username: 'egecan', password: 'egecan123', role: 'artist', color: '#10b981', commission_rate: 50 },
  { id: 'art2', name: 'Yasin', username: 'yasin', password: 'yasin123', role: 'artist', color: '#60a5fa', commission_rate: 30 },
  { id: 'art3', name: 'Asil', username: 'asil', password: 'asil123', role: 'artist', color: '#f43f5e', commission_rate: 50 },
  { id: 'art4', name: 'Yeşim', username: 'yesim', password: 'yesim123', role: 'artist', color: '#a78bfa', commission_rate: 30 },
  { id: 'art5', name: 'Oğuz', username: 'oguz', password: 'oguz123', role: 'artist', color: '#2dd4bf', commission_rate: 50 }
];

const INITIAL_APPOINTMENTS = [
  { id: '1', artist_id: 'art1', client_name: 'Caner Öz', date: '2026-09-29', time: '14:00', body_part: 'Ön Kol', price: 4500, reported: true, status: 'completed' },
  { id: '2', artist_id: 'art2', client_name: 'Selin Yılmaz', date: '2026-09-29', time: '16:30', body_part: 'Pazı / Sleeve', price: 6000, reported: false, status: 'pending' },
  { id: '3', artist_id: 'art3', client_name: 'Burak Demir', date: '2026-09-30', time: '13:00', body_part: 'Sırt', price: 9000, reported: true, status: 'pending' },
  { id: '4', artist_id: 'art1', client_name: 'Mert Ak', date: '2026-10-02', time: '15:00', body_part: 'Bacak', price: 5000, reported: false, status: 'pending' }
];

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const DAY_NAMES_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function App() {
  const [artists, setArtists] = useState(ARTISTS_LIST);
  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem('nautilus_appointments_v5');
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('nautilus_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('calendar');
  const [filterArtist, setFilterArtist] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState({ type: '', message: '' });

  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 29));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('2026-09-29');

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

  useEffect(() => {
    localStorage.setItem('nautilus_appointments_v5', JSON.stringify(appointments));
  }, [appointments]);

  const selectUserDirectly = (user) => {
    setCurrentUser(user);
    localStorage.setItem('nautilus_session', JSON.stringify(user));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanUser = usernameInput.trim().toLowerCase();
    const user = artists.find(a => a.username.toLowerCase() === cleanUser && a.password === passwordInput);
    if (user) {
      selectUserDirectly(user);
      setUsernameInput('');
      setPasswordInput('');
    } else {
      setLoginError('Kullanıcı adı veya şifre hatalı!');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('nautilus_session');
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setPasswordChangeStatus({ type: '', message: '' });

    if (currentPasswordInput !== currentUser.password) {
      setPasswordChangeStatus({ type: 'error', message: 'Mevcut şifrenizi yanlış girdiniz!' });
      return;
    }
    if (newPasswordInput.length < 4) {
      setPasswordChangeStatus({ type: 'error', message: 'Yeni şifre en az 4 karakter olmalıdır!' });
      return;
    }
    if (newPasswordInput !== newPasswordConfirm) {
      setPasswordChangeStatus({ type: 'error', message: 'Yeni şifreler eşleşmiyor!' });
      return;
    }

    const updatedUser = { ...currentUser, password: newPasswordInput };
    setArtists(prev => prev.map(a => a.id === currentUser.id ? updatedUser : a));
    setCurrentUser(updatedUser);
    localStorage.setItem('nautilus_session', JSON.stringify(updatedUser));
    setPasswordChangeStatus({ type: 'success', message: 'Şifreniz güncellendi!' });
    setTimeout(() => {
      setIsPasswordModalOpen(false);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setNewPasswordConfirm('');
      setPasswordChangeStatus({ type: '', message: '' });
    }, 1200);
  };

  const handleSaveAppointment = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      artist_id: currentUser.role === 'admin' ? (formData.artist_id || artists[1]?.id) : currentUser.id,
      price: Number(formData.price)
    };

    if (selectedAppt) {
      setAppointments(prev => prev.map(a => a.id === selectedAppt.id ? { ...payload, id: a.id } : a));
    } else {
      const newId = 'apt_' + Date.now();
      setAppointments(prev => [{ ...payload, id: newId }, ...prev]);
    }
    setIsModalOpen(false);
    setSelectedAppt(null);
  };

  const handleDelete = (id) => {
    if (confirm('Bu randevuyu silmek istediğinize emin misiniz?')) {
      setAppointments(prev => prev.filter(a => a.id !== id));
    }
  };

  const openNewModal = (defaultDate = null) => {
    setSelectedAppt(null);
    setFormData({
      artist_id: currentUser.role === 'admin' ? artists.find(a => a.role !== 'admin')?.id : currentUser.id,
      client_name: '',
      date: defaultDate || selectedCalendarDate || '2026-09-29',
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

  const myCommissionRate = currentUser ? (currentUser.commission_rate || 50) : 0;
  const myAppointments = appointments.filter(a => a.artist_id === currentUser?.id);
  const myTotalRevenue = myAppointments.filter(a => a.status !== 'cancelled').reduce((acc, a) => acc + Number(a.price || 0), 0);
  const myStudioCut = myTotalRevenue * (myCommissionRate / 100);
  const myNetEarning = myTotalRevenue - myStudioCut;
  const myReportedRevenue = myAppointments.filter(a => a.reported && a.status !== 'cancelled').reduce((acc, a) => acc + Number(a.price || 0), 0);

  const studioTotalRevenue = appointments.filter(a => a.status !== 'cancelled').reduce((acc, a) => acc + Number(a.price || 0), 0);
  const studioNetRevenue = appointments.filter(a => a.status !== 'cancelled').reduce((acc, a) => {
    const art = artists.find(item => item.id === a.artist_id);
    const rate = art ? (art.commission_rate || 50) : 50;
    return acc + (Number(a.price || 0) * (rate / 100));
  }, 0);

  // Günün randevuları
  const dayAppointments = filteredAppointments.filter(a => a.date === selectedCalendarDate);

  if (!currentUser) {
    return (
      <div style={{ backgroundColor: '#0d1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '390px', backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '24px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'inline-flex', padding: '14px', borderRadius: '18px', backgroundColor: '#21262d', color: '#f0f6fc', border: '1px solid #30363d', marginBottom: '12px' }}>
              <CalendarIcon size={28} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f0f6fc', margin: 0, letterSpacing: '-0.3px' }}>Studio Portal</h1>
            <p style={{ color: '#8b949e', fontSize: '13px', marginTop: '6px' }}>Giriş yapmak için profilinizi seçin:</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '22px' }}>
            {artists.map(art => (
              <button
                key={art.id}
                onClick={() => selectUserDirectly(art)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '13px 16px', 
                  borderRadius: '14px', 
                  backgroundColor: art.role === 'admin' ? '#21262d' : '#161b22', 
                  border: art.role === 'admin' ? '1px solid #f0f6fc' : '1px solid #30363d', 
                  color: '#f0f6fc', 
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: art.color }}></span>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{art.name}</span>
                </div>
                <span style={{ fontSize: '12px', color: '#8b949e', fontWeight: 500 }}>
                  {art.role === 'admin' ? 'Yönetici' : `%${100 - art.commission_rate} Pay`}
                </span>
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #21262d', paddingTop: '16px' }}>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                type="text" 
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                placeholder="Kullanıcı adı"
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '12px', padding: '11px', color: '#f0f6fc', fontSize: '13px', outline: 'none' }}
              />
              <input 
                type="password" 
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Şifre"
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '12px', padding: '11px', color: '#f0f6fc', fontSize: '13px', outline: 'none' }}
              />
              {loginError && <p style={{ color: '#f85149', fontSize: '12px', margin: 0 }}>{loginError}</p>}
              <button 
                type="submit"
                style={{ backgroundColor: '#f0f6fc', color: '#0d1117', fontWeight: 600, padding: '11px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '13px' }}
              >
                Şifreyle Giriş Yap
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0d1117', color: '#f0f6fc', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Üst Header */}
      <header style={{ borderBottom: '1px solid #21262d', backgroundColor: '#161b22', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#21262d', color: '#f0f6fc', border: '1px solid #30363d' }}>
            {isSuperAdmin ? <Crown size={18} /> : <CalendarIcon size={18} />}
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#f0f6fc' }}>Studio Portal</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: currentUser.color || '#10b981' }}></span>
              <span style={{ fontSize: '12px', color: '#8b949e' }}>{currentUser.name}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            onClick={() => openNewModal()}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f0f6fc', color: '#0d1117', padding: '8px 12px', borderRadius: '10px', fontWeight: 600, fontSize: '12px', border: 'none', cursor: 'pointer' }}
          >
            <Plus size={15} /> Ekle
          </button>

          <button 
            onClick={() => {
              setPasswordChangeStatus({ type: '', message: '' });
              setIsPasswordModalOpen(true);
            }}
            style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#21262d', border: '1px solid #30363d', color: '#8b949e', cursor: 'pointer' }}
            title="Şifre Değiştir"
          >
            <KeyRound size={16} />
          </button>

          <button 
            onClick={handleLogout}
            style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#21262d', border: '1px solid #30363d', color: '#8b949e', cursor: 'pointer' }}
            title="Çıkış"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Üst Sekmeler */}
      <div style={{ borderBottom: '1px solid #21262d', backgroundColor: '#161b22', padding: '0 16px', display: 'flex', gap: '14px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <button 
          onClick={() => setActiveTab('calendar')}
          style={{ padding: '12px 2px', borderBottom: activeTab === 'calendar' ? '2px solid #f0f6fc' : '2px solid transparent', color: activeTab === 'calendar' ? '#f0f6fc' : '#8b949e', fontWeight: 600, fontSize: '13px', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}
        >
          Takvim
        </button>

        <button 
          onClick={() => setActiveTab('my_stats')}
          style={{ padding: '12px 2px', borderBottom: activeTab === 'my_stats' ? '2px solid #f0f6fc' : '2px solid transparent', color: activeTab === 'my_stats' ? '#f0f6fc' : '#8b949e', fontWeight: 600, fontSize: '13px', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}
        >
          Kişisel Ciro & Hakediş
        </button>

        {isSuperAdmin && (
          <button 
            onClick={() => setActiveTab('admin_panel')}
            style={{ padding: '12px 2px', borderBottom: activeTab === 'admin_panel' ? '2px solid #f0f6fc' : '2px solid transparent', color: activeTab === 'admin_panel' ? '#f0f6fc' : '#8b949e', fontWeight: 600, fontSize: '13px', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}
          >
            Dükkan Masası
          </button>
        )}
      </div>

      {/* İçerik */}
      <main style={{ flex: 1, padding: '16px', maxWidth: '1000px', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
        
        {activeTab === 'calendar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Ay ve Sanatçı Filtresi */}
            <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '18px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#f0f6fc' }}>
                  {MONTH_NAMES[month]} {year}
                </h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={prevMonth} style={{ padding: '6px 10px', borderRadius: '8px', backgroundColor: '#21262d', border: '1px solid #30363d', color: '#f0f6fc', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
                  <button onClick={nextMonth} style={{ padding: '6px 10px', borderRadius: '8px', backgroundColor: '#21262d', border: '1px solid #30363d', color: '#f0f6fc', cursor: 'pointer' }}><ChevronRight size={16} /></button>
                </div>
              </div>

              {/* Sanatçı Filtre Çipleri */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                <button 
                  onClick={() => setFilterArtist('all')}
                  style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', border: filterArtist === 'all' ? '1px solid #f0f6fc' : '1px solid #30363d', backgroundColor: filterArtist === 'all' ? '#f0f6fc' : '#21262d', color: filterArtist === 'all' ? '#0d1117' : '#8b949e', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                >
                  Tümü
                </button>
                {artists.filter(a => a.role !== 'admin').map(art => (
                  <button 
                    key={art.id}
                    onClick={() => setFilterArtist(art.id)}
                    style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', border: filterArtist === art.id ? `1px solid ${art.color}` : '1px solid #30363d', backgroundColor: '#21262d', color: filterArtist === art.id ? '#f0f6fc' : '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                  >
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: art.color }}></span>
                    {art.name}
                  </button>
                ))}
              </div>
            </div>

            {/* MOBİL İÇİN YATAY AKICI GÜN ŞERİDİ (PARMAKLA SAĞA-SOLA KAYDIRILABİLİR) */}
            <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '18px', padding: '14px' }}>
              <div style={{ fontSize: '12px', color: '#8b949e', fontWeight: 600, textTransform: 'uppercase', marginBottom: '10px' }}>
                Gün Seçin
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayOfWeek = (new Date(year, month, dayNum).getDay() + 6) % 7;
                  const dayAppts = filteredAppointments.filter(a => a.date === dateStr);
                  const isSelected = selectedCalendarDate === dateStr;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedCalendarDate(dateStr)}
                      style={{
                        minWidth: '54px',
                        padding: '10px 4px',
                        borderRadius: '14px',
                        backgroundColor: isSelected ? '#f0f6fc' : '#0d1117',
                        border: isSelected ? '1px solid #f0f6fc' : '1px solid #30363d',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      <span style={{ fontSize: '11px', color: isSelected ? '#0d1117' : '#8b949e', fontWeight: 600 }}>
                        {DAY_NAMES_SHORT[dayOfWeek]}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: isSelected ? '#0d1117' : '#f0f6fc' }}>
                        {dayNum}
                      </span>
                      {dayAppts.length > 0 ? (
                        <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                          {dayAppts.slice(0, 3).map((a, i) => {
                            const art = artists.find(item => item.id === a.artist_id);
                            return (
                              <span key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isSelected ? '#0d1117' : (art?.color || '#38bdf8') }}></span>
                            );
                          })}
                        </div>
                      ) : (
                        <span style={{ width: '5px', height: '5px' }}></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SEÇİLEN GÜNÜN RANDEVULARI (AJANDA LİSTESİ) */}
            <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '18px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#f0f6fc' }}>
                    {selectedCalendarDate} Randevuları
                  </h4>
                  <span style={{ fontSize: '12px', color: '#8b949e' }}>
                    {dayAppointments.length} seans kayıtlı
                  </span>
                </div>
                <button 
                  onClick={() => openNewModal(selectedCalendarDate)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#21262d', color: '#f0f6fc', border: '1px solid #30363d', padding: '7px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Plus size={14} /> Ekle
                </button>
              </div>

              {dayAppointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#8b949e', fontSize: '13px' }}>
                  Bu tarihe kayıtlı randevu bulunmuyor.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {dayAppointments.map(appt => {
                    const art = artists.find(i => i.id === appt.artist_id);
                    const canSeePrice = isSuperAdmin || appt.artist_id === currentUser.id;

                    return (
                      <div 
                        key={appt.id} 
                        style={{ 
                          backgroundColor: '#0d1117', 
                          border: '1px solid #30363d', 
                          borderLeft: `4px solid ${art?.color || '#8b949e'}`, 
                          borderRadius: '14px', 
                          padding: '14px', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '8px' 
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: art?.color, fontWeight: 700 }}>
                            {art?.name}
                          </span>
                          <span style={{ fontSize: '12px', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} /> {appt.time}
                          </span>
                        </div>

                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#f0f6fc' }}>
                          {appt.client_name}
                        </div>

                        <div style={{ fontSize: '13px', color: '#8b949e' }}>
                          Bölge: <span style={{ color: '#c9d1d9' }}>{appt.body_part}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #21262d' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>
                            {canSeePrice ? `${Number(appt.price).toLocaleString('tr-TR')} ₺` : <span style={{ fontSize: '12px', color: '#8b949e' }}><Lock size={12} style={{ display: 'inline' }} /> Gizli</span>}
                          </span>

                          {canSeePrice && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => openEditModal(appt)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', padding: '4px' }}><Edit3 size={16} /></button>
                              <button onClick={() => handleDelete(appt.id)} style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
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

        {/* KİŞİSEL İSTATİSTİKLER (SİYAH - GRİ - KIRIK BEYAZ TEMA) */}
        {activeTab === 'my_stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', padding: '18px', borderRadius: '16px' }}>
                <span style={{ fontSize: '11px', color: '#8b949e', fontWeight: 600, textTransform: 'uppercase' }}>Kişisel Brüt Ciro</span>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#f0f6fc', margin: '8px 0 0 0' }}>{myTotalRevenue.toLocaleString('tr-TR')} ₺</h3>
              </div>

              {!isSuperAdmin && (
                <>
                  <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', padding: '18px', borderRadius: '16px' }}>
                    <span style={{ fontSize: '11px', color: '#8b949e', fontWeight: 600, textTransform: 'uppercase' }}>Komisyon Paylaşımı</span>
                    <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#f0f6fc', margin: '8px 0 0 0' }}>%{100 - myCommissionRate} Pay</h3>
                    <span style={{ fontSize: '11px', color: '#8b949e' }}>(Dükkan Payı: %{myCommissionRate})</span>
                  </div>

                  <div style={{ backgroundColor: '#161b22', border: '1px solid #10b981', padding: '18px', borderRadius: '16px' }}>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, textTransform: 'uppercase' }}>Net Hakedişim</span>
                    <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', margin: '8px 0 0 0' }}>{myNetEarning.toLocaleString('tr-TR')} ₺</h3>
                  </div>
                </>
              )}

              <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', padding: '18px', borderRadius: '16px' }}>
                <span style={{ fontSize: '11px', color: '#8b949e', fontWeight: 600, textTransform: 'uppercase' }}>Rapora Alınan Tutar</span>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#e6edf3', margin: '8px 0 0 0' }}>{myReportedRevenue.toLocaleString('tr-TR')} ₺</h3>
              </div>

              <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', padding: '18px', borderRadius: '16px' }}>
                <span style={{ fontSize: '11px', color: '#8b949e', fontWeight: 600, textTransform: 'uppercase' }}>Toplam Seansım</span>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#f0f6fc', margin: '8px 0 0 0' }}>{myAppointments.length}</h3>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN MASASI */}
        {activeTab === 'admin_panel' && isSuperAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', padding: '18px', borderRadius: '16px' }}>
                <span style={{ fontSize: '11px', color: '#8b949e', fontWeight: 600, textTransform: 'uppercase' }}>Stüdyo Toplam Brüt Ciro</span>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#f0f6fc', margin: '8px 0 0 0' }}>{studioTotalRevenue.toLocaleString('tr-TR')} ₺</h3>
              </div>
              <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', padding: '18px', borderRadius: '16px' }}>
                <span style={{ fontSize: '11px', color: '#8b949e', fontWeight: 600, textTransform: 'uppercase' }}>Dükkan Net Kâr Payı</span>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', margin: '8px 0 0 0' }}>{studioNetRevenue.toLocaleString('tr-TR')} ₺</h3>
              </div>
            </div>

            <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', padding: '18px', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, marginBottom: '14px', color: '#f0f6fc' }}>Sanatçı Hakediş ve Komisyon Tablosu</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #21262d', color: '#8b949e', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '8px' }}>Sanatçı</th>
                      <th style={{ padding: '8px' }}>Dükkan</th>
                      <th style={{ padding: '8px' }}>Oran</th>
                      <th style={{ padding: '8px' }}>Seans</th>
                      <th style={{ padding: '8px' }}>Ciro</th>
                      <th style={{ padding: '8px' }}>Dükkan Payı</th>
                      <th style={{ padding: '8px' }}>Hakediş</th>
                    </tr>
                  </thead>
                  <tbody>
                    {artists.filter(a => a.role !== 'admin').map(art => {
                      const appts = appointments.filter(a => a.artist_id === art.id && a.status !== 'cancelled');
                      const rev = appts.reduce((acc, a) => acc + Number(a.price || 0), 0);
                      const rate = art.commission_rate || 50;
                      const studioCut = rev * (rate / 100);
                      const artistCut = rev - studioCut;

                      return (
                        <tr key={art.id} style={{ borderBottom: '1px solid #21262d', color: '#c9d1d9' }}>
                          <td style={{ padding: '10px 8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: art.color }}></span>
                            {art.name}
                          </td>
                          <td style={{ padding: '10px 8px' }}>%{rate}</td>
                          <td style={{ padding: '10px 8px' }}>%{100 - rate}</td>
                          <td style={{ padding: '10px 8px' }}>{appts.length}</td>
                          <td style={{ padding: '10px 8px', color: '#f0f6fc', fontWeight: 600 }}>{rev.toLocaleString('tr-TR')} ₺</td>
                          <td style={{ padding: '10px 8px', color: '#e6edf3' }}>{studioCut.toLocaleString('tr-TR')} ₺</td>
                          <td style={{ padding: '10px 8px', color: '#10b981', fontWeight: 700 }}>{artistCut.toLocaleString('tr-TR')} ₺</td>
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

      {/* ŞİFRE DEĞİŞTİRME MODAL */}
      {isPasswordModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 110 }}>
          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '20px', width: '100%', maxWidth: '380px', padding: '22px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f0f6fc', margin: '0 0 14px 0' }}>Şifremi Değiştir</h3>
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>Mevcut Şifre</label>
                <input 
                  type="password" 
                  required
                  value={currentPasswordInput}
                  onChange={e => setCurrentPasswordInput(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '10px', padding: '10px', color: '#f0f6fc', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>Yeni Şifre</label>
                <input 
                  type="password" 
                  required
                  value={newPasswordInput}
                  onChange={e => setNewPasswordInput(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '10px', padding: '10px', color: '#f0f6fc', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>Yeni Şifre (Tekrar)</label>
                <input 
                  type="password" 
                  required
                  value={newPasswordConfirm}
                  onChange={e => setNewPasswordConfirm(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '10px', padding: '10px', color: '#f0f6fc', fontSize: '13px' }}
                />
              </div>

              {passwordChangeStatus.message && (
                <p style={{ color: passwordChangeStatus.type === 'error' ? '#f85149' : '#10b981', fontSize: '12px', margin: '4px 0 0 0' }}>
                  {passwordChangeStatus.message}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsPasswordModalOpen(false)}
                  style={{ backgroundColor: '#21262d', border: 'none', color: '#8b949e', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Vazgeç
                </button>
                <button 
                  type="submit"
                  style={{ backgroundColor: '#f0f6fc', border: 'none', color: '#0d1117', fontWeight: 700, padding: '10px 18px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RANDEVU EKLE / DÜZENLE MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
          <div style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '20px', width: '100%', maxWidth: '420px', padding: '22px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f0f6fc', margin: '0 0 14px 0' }}>
              {selectedAppt ? 'Randevuyu Güncelle' : 'Yeni Randevu Ekle'}
            </h3>

            <form onSubmit={handleSaveAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isSuperAdmin && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>Sanatçı Seçimi</label>
                  <select 
                    value={formData.artist_id}
                    onChange={e => setFormData({ ...formData, artist_id: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '10px', padding: '10px', color: '#f0f6fc', fontSize: '13px' }}
                  >
                    {artists.filter(a => a.role !== 'admin').map(art => (
                      <option key={art.id} value={art.id}>{art.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>Müşteri Adı</label>
                <input 
                  type="text" 
                  required
                  value={formData.client_name}
                  onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '10px', padding: '10px', color: '#f0f6fc', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>Tarih</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '10px', padding: '10px', color: '#f0f6fc', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>Saat</label>
                  <input 
                    type="time" 
                    required
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '10px', padding: '10px', color: '#f0f6fc', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>Dövme Bölgesi</label>
                  <input 
                    type="text" 
                    value={formData.body_part}
                    onChange={e => setFormData({ ...formData, body_part: e.target.value })}
                    placeholder="Örn: Ön Kol"
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '10px', padding: '10px', color: '#f0f6fc', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>Ücret (₺)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '10px', padding: '10px', color: '#f0f6fc', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input 
                  type="checkbox" 
                  id="modal-reported"
                  checked={formData.reported}
                  onChange={e => setFormData({ ...formData, reported: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="modal-reported" style={{ fontSize: '12px', color: '#c9d1d9', cursor: 'pointer' }}>Bu seans rapora alındı (muhasebeleştirildi)</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ backgroundColor: '#21262d', border: 'none', color: '#8b949e', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer' }}
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  style={{ backgroundColor: '#f0f6fc', border: 'none', color: '#0d1117', fontWeight: 700, padding: '10px 18px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
