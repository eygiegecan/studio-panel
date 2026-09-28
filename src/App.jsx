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
  UserCheck
} from 'lucide-react';

const ARTISTS_LIST = [
  { id: 'admin', name: 'Dükkan Sahibi', username: 'bosside', password: 'nautilus081025', role: 'admin', color: '#f59e0b', commission_rate: 0 },
  { id: 'art1', name: 'Ege Can', username: 'egecan', password: 'egecan123', role: 'artist', color: '#10b981', commission_rate: 50 },
  { id: 'art2', name: 'Yasin', username: 'yasin', password: 'yasin123', role: 'artist', color: '#6366f1', commission_rate: 30 },
  { id: 'art3', name: 'Asil', username: 'asil', password: 'asil123', role: 'artist', color: '#ec4899', commission_rate: 50 },
  { id: 'art4', name: 'Yeşim', username: 'yesim', password: 'yesim123', role: 'artist', color: '#8b5cf6', commission_rate: 30 },
  { id: 'art5', name: 'Oğuz', username: 'oguz', password: 'oguz123', role: 'artist', color: '#06b6d4', commission_rate: 50 }
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

export default function App() {
  const [artists, setArtists] = useState(ARTISTS_LIST);
  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem('nautilus_appointments_v4');
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
    localStorage.setItem('nautilus_appointments_v4', JSON.stringify(appointments));
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
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
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

  if (!currentUser) {
    return (
      <div style={{ backgroundColor: '#090d16', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#11192e', border: '1px solid #1e293b', borderRadius: '24px', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '16px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', marginBottom: '10px' }}>
              <CalendarIcon size={30} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>Studio Portal</h1>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>Hızlı giriş yapmak için profilinize tıklayın:</p>
          </div>

          {/* TEK TIKLA GİRİŞ BUTONLARI */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {artists.map(art => (
              <button
                key={art.id}
                onClick={() => selectUserDirectly(art)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '12px 14px', 
                  borderRadius: '12px', 
                  backgroundColor: art.role === 'admin' ? '#1e293b' : '#0e1628', 
                  border: art.role === 'admin' ? '1px solid #f59e0b' : '1px solid #1e293b', 
                  color: '#fff', 
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: art.color }}></span>
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>{art.name}</span>
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {art.role === 'admin' ? '👑 Yönetici' : `%${100 - art.commission_rate} Pay`}
                </span>
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
            <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', margin: 0 }}>veya şifreyle giriş yapın:</p>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              <input 
                type="text" 
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                placeholder="Kullanıcı adı"
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '12px', outline: 'none' }}
              />
              <input 
                type="password" 
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Şifre"
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '12px', outline: 'none' }}
              />
              {loginError && <p style={{ color: '#fb7185', fontSize: '11px', margin: 0 }}>{loginError}</p>}
              <button 
                type="submit"
                style={{ backgroundColor: '#334155', color: '#fff', fontWeight: 600, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px' }}
              >
                Giriş
              </button>
            </form>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#090d16', color: '#f1f5f9', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #1e293b', backgroundColor: '#0d1424', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            {isSuperAdmin ? <Crown size={22} /> : <CalendarIcon size={22} />}
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>Studio Portal</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: currentUser.color || '#10b981' }}></span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{currentUser.name} {isSuperAdmin && '(Yönetici)'}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={() => openNewModal()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f59e0b', color: '#090d16', padding: '8px 14px', borderRadius: '10px', fontWeight: 600, fontSize: '13px', border: 'none', cursor: 'pointer' }}
          >
            <Plus size={16} /> Yeni Randevu
          </button>

          <button 
            onClick={() => {
              setPasswordChangeStatus({ type: '', message: '' });
              setIsPasswordModalOpen(true);
            }}
            style={{ padding: '8px 12px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <KeyRound size={15} /> Şifre Değiştir
          </button>

          <button 
            onClick={handleLogout}
            style={{ padding: '8px 12px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <LogOut size={15} /> Çıkış
          </button>
        </div>
      </header>

      <div style={{ borderBottom: '1px solid #1e293b', backgroundColor: '#0d1424', padding: '0 24px', display: 'flex', gap: '16px' }}>
        <button 
          onClick={() => setActiveTab('calendar')}
          style={{ padding: '14px 4px', borderBottom: activeTab === 'calendar' ? '2px solid #f59e0b' : '2px solid transparent', color: activeTab === 'calendar' ? '#f59e0b' : '#94a3b8', fontWeight: 600, fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <CalendarIcon size={16} /> Aylık Stüdyo Takvimi
        </button>

        <button 
          onClick={() => setActiveTab('my_stats')}
          style={{ padding: '14px 4px', borderBottom: activeTab === 'my_stats' ? '2px solid #f59e0b' : '2px solid transparent', color: activeTab === 'my_stats' ? '#f59e0b' : '#94a3b8', fontWeight: 600, fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <TrendingUp size={16} /> Kişisel Cirom & İstatistiklerim
        </button>

        {isSuperAdmin && (
          <button 
            onClick={() => setActiveTab('admin_panel')}
            style={{ padding: '14px 4px', borderBottom: activeTab === 'admin_panel' ? '2px solid #f59e0b' : '2px solid transparent', color: activeTab === 'admin_panel' ? '#f59e0b' : '#94a3b8', fontWeight: 600, fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Crown size={16} /> Dükkan Yönetim Masası
          </button>
        )}
      </div>

      <main style={{ flex: 1, padding: '24px', maxWidth: '1400px', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
        {activeTab === 'calendar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', backgroundColor: '#11192e', padding: '16px', borderRadius: '16px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#fff' }}>
                  {MONTH_NAMES[month]} {year}
                </h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={prevMonth} style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
                  <button onClick={nextMonth} style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', cursor: 'pointer' }}><ChevronRight size={16} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Filtrele:</span>
                <button 
                  onClick={() => setFilterArtist('all')}
                  style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', border: '1px solid #334155', backgroundColor: filterArtist === 'all' ? '#f59e0b' : '#1e293b', color: filterArtist === 'all' ? '#090d16' : '#94a3b8', fontWeight: 600, cursor: 'pointer' }}
                >
                  Tümü
                </button>
                {artists.filter(a => a.role !== 'admin').map(art => (
                  <button 
                    key={art.id}
                    onClick={() => setFilterArtist(art.id)}
                    style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', border: filterArtist === art.id ? `1px solid ${art.color}` : '1px solid #1e293b', backgroundColor: '#11192e', color: filterArtist === art.id ? '#fff' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: art.color }}></span>
                    {art.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: '#11192e', borderRadius: '16px', border: '1px solid #1e293b', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#0d1424', borderBottom: '1px solid #1e293b', textAlign: 'center', padding: '10px 0', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                <div>Pzt</div><div>Sal</div><div>Çar</div><div>Per</div><div>Cum</div><div>Cmt</div><div>Paz</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#1e293b' }}>
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div key={`empty-${idx}`} style={{ backgroundColor: '#0b1120', minHeight: '110px', padding: '8px', opacity: 0.3 }}></div>
                ))}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayAppts = filteredAppointments.filter(a => a.date === dateStr);
                  const isSelected = selectedCalendarDate === dateStr;

                  return (
                    <div 
                      key={dateStr}
                      onClick={() => setSelectedCalendarDate(dateStr)}
                      style={{ 
                        backgroundColor: isSelected ? '#16223d' : '#0e1628', 
                        minHeight: '110px', 
                        padding: '8px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '4px',
                        border: isSelected ? '1px solid #f59e0b' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: isSelected ? '#f59e0b' : '#94a3b8' }}>{dayNum}</span>
                        {dayAppts.length > 0 && (
                          <span style={{ fontSize: '10px', backgroundColor: '#1e293b', color: '#38bdf8', padding: '1px 5px', borderRadius: '4px' }}>
                            {dayAppts.length}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
                        {dayAppts.slice(0, 3).map(a => {
                          const art = artists.find(i => i.id === a.artist_id);
                          return (
                            <div 
                              key={a.id} 
                              style={{ 
                                backgroundColor: `${art?.color || '#64748b'}25`, 
                                borderLeft: `3px solid ${art?.color || '#64748b'}`, 
                                padding: '2px 4px', 
                                borderRadius: '4px', 
                                fontSize: '10px', 
                                color: '#fff',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>{a.time}</span> {a.client_name}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ backgroundColor: '#11192e', padding: '20px', borderRadius: '16px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#fff' }}>
                  {selectedCalendarDate} Randevuları
                </h4>
                <button 
                  onClick={() => openNewModal(selectedCalendarDate)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#1e293b', color: '#f59e0b', border: '1px solid #334155', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                >
                  <Plus size={14} /> Bu Güne Randevu Ekle
                </button>
              </div>

              {filteredAppointments.filter(a => a.date === selectedCalendarDate).length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Bu tarihe kayıtlı randevu bulunmuyor.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {filteredAppointments.filter(a => a.date === selectedCalendarDate).map(appt => {
                    const art = artists.find(i => i.id === appt.artist_id);
                    const canSeePrice = isSuperAdmin || appt.artist_id === currentUser.id;

                    return (
                      <div key={appt.id} style={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderLeft: `4px solid ${art?.color || '#64748b'}`, borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: art?.color, fontWeight: 'bold' }}>{art?.name}</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{appt.time}</span>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{appt.client_name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Bölge: <span style={{ color: '#cbd5e1' }}>{appt.body_part}</span></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid #1e293b' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#10b981' }}>
                            {canSeePrice ? `${Number(appt.price).toLocaleString('tr-TR')} ₺` : <span style={{ fontSize: '11px', color: '#64748b' }}><Lock size={12} style={{ display: 'inline' }} /> Gizli</span>}
                          </span>

                          {canSeePrice && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => openEditModal(appt)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Edit3 size={15} /></button>
                              <button onClick={() => handleDelete(appt.id)} style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer' }}><Trash2 size={15} /></button>
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

        {activeTab === 'my_stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ backgroundColor: '#11192e', padding: '20px', borderRadius: '16px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Kişisel Brüt Ciro</span>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: '8px 0 0 0' }}>{myTotalRevenue.toLocaleString('tr-TR')} ₺</h3>
              </div>

              {!isSuperAdmin && (
                <>
                  <div style={{ backgroundColor: '#11192e', padding: '20px', borderRadius: '16px', border: '1px solid #1e293b' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Komisyon Paylaşımı</span>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#38bdf8', margin: '8px 0 0 0' }}>%{100 - myCommissionRate} Pay</h3>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>(Dükkan Payı: %{myCommissionRate})</span>
                  </div>

                  <div style={{ backgroundColor: '#11192e', padding: '20px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, textTransform: 'uppercase' }}>Net Hakedişim</span>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', margin: '8px 0 0 0' }}>{myNetEarning.toLocaleString('tr-TR')} ₺</h3>
                  </div>
                </>
              )}

              <div style={{ backgroundColor: '#11192e', padding: '20px', borderRadius: '16px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Rapora Alınan Tutar</span>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', margin: '8px 0 0 0' }}>{myReportedRevenue.toLocaleString('tr-TR')} ₺</h3>
              </div>

              <div style={{ backgroundColor: '#11192e', padding: '20px', borderRadius: '16px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Toplam Seansım</span>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: '8px 0 0 0' }}>{myAppointments.length}</h3>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin_panel' && isSuperAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={{ backgroundColor: '#11192e', padding: '20px', borderRadius: '16px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Stüdyo Toplam Brüt Ciro</span>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', margin: '8px 0 0 0' }}>{studioTotalRevenue.toLocaleString('tr-TR')} ₺</h3>
              </div>
              <div style={{ backgroundColor: '#11192e', padding: '20px', borderRadius: '16px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Dükkan Net Kâr Payı</span>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', margin: '8px 0 0 0' }}>{studioNetRevenue.toLocaleString('tr-TR')} ₺</h3>
              </div>
            </div>

            <div style={{ backgroundColor: '#11192e', padding: '20px', borderRadius: '16px', border: '1px solid #1e293b' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, marginBottom: '16px', color: '#fff' }}>Sanatçı Hakediş ve Komisyon Tablosu</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px' }}>Sanatçı</th>
                      <th style={{ padding: '10px' }}>Dükkan Komisyonu</th>
                      <th style={{ padding: '10px' }}>Sanatçı Oranı</th>
                      <th style={{ padding: '10px' }}>Seans</th>
                      <th style={{ padding: '10px' }}>Toplam Ciro</th>
                      <th style={{ padding: '10px' }}>Dükkan Payı</th>
                      <th style={{ padding: '10px' }}>Sanatçı Hakedişi</th>
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
                        <tr key={art.id} style={{ borderBottom: '1px solid #1e293b', color: '#cbd5e1' }}>
                          <td style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: art.color }}></span>
                            {art.name}
                          </td>
                          <td style={{ padding: '12px 10px', color: '#f59e0b', fontWeight: 600 }}>%{rate}</td>
                          <td style={{ padding: '12px 10px', color: '#38bdf8', fontWeight: 600 }}>%{100 - rate}</td>
                          <td style={{ padding: '12px 10px' }}>{appts.length}</td>
                          <td style={{ padding: '12px 10px', color: '#fff', fontWeight: 600 }}>{rev.toLocaleString('tr-TR')} ₺</td>
                          <td style={{ padding: '12px 10px', color: '#f59e0b' }}>{studioCut.toLocaleString('tr-TR')} ₺</td>
                          <td style={{ padding: '12px 10px', color: '#10b981', fontWeight: 'bold' }}>{artistCut.toLocaleString('tr-TR')} ₺</td>
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

      {isPasswordModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 110 }}>
          <div style={{ backgroundColor: '#11192e', border: '1px solid #1e293b', borderRadius: '20px', width: '100%', maxWidth: '400px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <KeyRound size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', margin: 0 }}>Şifremi Değiştir</h3>
            </div>

            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Mevcut Şifre</label>
                <input 
                  type="password" 
                  required
                  value={currentPasswordInput}
                  onChange={e => setCurrentPasswordInput(e.target.value)}
                  placeholder="Şu anki şifreniz"
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Yeni Şifre</label>
                <input 
                  type="password" 
                  required
                  value={newPasswordInput}
                  onChange={e => setNewPasswordInput(e.target.value)}
                  placeholder="En az 4 karakter"
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Yeni Şifre (Tekrar)</label>
                <input 
                  type="password" 
                  required
                  value={newPasswordConfirm}
                  onChange={e => setNewPasswordConfirm(e.target.value)}
                  placeholder="Yeni şifrenizi tekrar yazın"
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              {passwordChangeStatus.message && (
                <p style={{ color: passwordChangeStatus.type === 'error' ? '#fb7185' : '#10b981', fontSize: '12px', margin: '4px 0 0 0' }}>
                  {passwordChangeStatus.message}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsPasswordModalOpen(false)}
                  style={{ backgroundColor: '#1e293b', border: 'none', color: '#94a3b8', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}
                >
                  Vazgeç
                </button>
                <button 
                  type="submit"
                  style={{ backgroundColor: '#f59e0b', border: 'none', color: '#090d16', fontWeight: 'bold', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}
                >
                  Şifreyi Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
          <div style={{ backgroundColor: '#11192e', border: '1px solid #1e293b', borderRadius: '20px', width: '100%', maxWidth: '460px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', margin: '0 0 16px 0' }}>
              {selectedAppt ? 'Randevuyu Güncelle' : 'Yeni Randevu Ekle'}
            </h3>

            <form onSubmit={handleSaveAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {isSuperAdmin && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Sanatçı Seçimi</label>
                  <select 
                    value={formData.artist_id}
                    onChange={e => setFormData({ ...formData, artist_id: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px' }}
                  >
                    {artists.filter(a => a.role !== 'admin').map(art => (
                      <option key={art.id} value={art.id}>{art.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Müşteri Adı</label>
                <input 
                  type="text" 
                  required
                  value={formData.client_name}
                  onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Tarih</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Saat</label>
                  <input 
                    type="time" 
                    required
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Dövme Bölgesi</label>
                  <input 
                    type="text" 
                    value={formData.body_part}
                    onChange={e => setFormData({ ...formData, body_part: e.target.value })}
                    placeholder="Örn: Ön Kol"
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Ücret (₺)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input 
                  type="checkbox" 
                  id="modal-reported"
                  checked={formData.reported}
                  onChange={e => setFormData({ ...formData, reported: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="modal-reported" style={{ fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>Bu seans rapora alındı (muhasebeleştirildi)</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ backgroundColor: '#1e293b', border: 'none', color: '#94a3b8', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  style={{ backgroundColor: '#f59e0b', border: 'none', color: '#090d16', fontWeight: 'bold', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}
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
