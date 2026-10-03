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
  LayoutGrid, 
  UserPlus, 
  Key, 
  ShieldCheck, 
  Share2, 
  Receipt, 
  Sparkles, 
  Copy 
} from 'lucide-react';

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const DAY_NAMES_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

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
  const [artists, setArtists] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nautilus_active_session_v9');
      return saved ? JSON.parse(saved) : null;
    } catch(e) { return null; }
  });

  const [appointments, setAppointments] = useState([]);
  const [expenses, setExpenses] = useState([]);

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
      const saved = localStorage.getItem('nautilus_avatars_v9');
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

  // Kullanıcı Ekleme / Düzenleme Modal State'i
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'artist',
    color: '#10b981',
    commission_rate: 50
  });

  // Gider Ekleme Modal State'i
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseFormData, setExpenseFormData] = useState({
    title: '',
    amount: '',
    category: 'Sarf Malzeme',
    date: new Date().toISOString().slice(0, 10)
  });

  const [copiedSummary, setCopiedSummary] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('2026-10-01');

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const [formData, setFormData] = useState({
    artist_id: '',
    client_name: '',
    phone: '',
    date: '2026-10-01',
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

  // Verileri Çek
  const fetchArtists = async () => {
    try {
      const { data, error } = await supabase.from('artists').select('*').order('created_at', { ascending: true });
      if (!error && data) {
        setArtists(data);
      }
    } catch (err) {}
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase.from('appointments').select('*').order('date', { ascending: true });
      if (!error && data) {
        setAppointments(data);
      }
    } catch (err) {}
  };

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (!error && data) {
        setExpenses(data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchArtists();
    fetchAppointments();
    fetchExpenses();

    const apptChannel = supabase
      .channel('realtime-appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newDoc = payload.new;
            const artist = artists.find(a => a.id === newDoc.artist_id);
            showNotification('Yeni Randevu!', `${artist ? artist.name : 'Bir sanatçı'} için ${newDoc.client_name} randevusu eklendi.`);
          }
          fetchAppointments();
        }
      )
      .subscribe();

    const artistChannel = supabase
      .channel('realtime-artists')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'artists' },
        () => {
          fetchArtists();
        }
      )
      .subscribe();

    const expenseChannel = supabase
      .channel('realtime-expenses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        () => {
          fetchExpenses();
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      fetchAppointments();
      fetchArtists();
      fetchExpenses();
    }, 6000);

    return () => {
      supabase.removeChannel(apptChannel);
      supabase.removeChannel(artistChannel);
      supabase.removeChannel(expenseChannel);
      clearInterval(interval);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanUser = usernameInput.trim().toLowerCase();

    if (cleanUser === 'bosside' && passwordInput === 'nautilus081025') {
      const bossObj = { id: 'admin', name: 'Dükkan Sahibi', username: 'bosside', password: 'nautilus081025', role: 'admin', color: '#e6edf3', commission_rate: 0 };
      setCurrentUser(bossObj);
      localStorage.setItem('nautilus_active_session_v9', JSON.stringify(bossObj));
      setUsernameInput('');
      setPasswordInput('');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .ilike('username', cleanUser)
        .single();

      if (!error && data && data.password === passwordInput) {
        setCurrentUser(data);
        localStorage.setItem('nautilus_active_session_v9', JSON.stringify(data));
        setUsernameInput('');
        setPasswordInput('');
        return;
      }
    } catch (err) {}

    setLoginError('Kullanıcı adı veya şifre hatalı!');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('nautilus_active_session_v9');
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        const newAvatars = { ...avatars, [currentUser.id]: base64 };
        setAvatars(newAvatars);
        localStorage.setItem('nautilus_avatars_v9', JSON.stringify(newAvatars));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPassMsg('');
    setPassLoading(true);

    try {
      if (currentUser.id === 'admin') {
        setPassMsg('Yönetici ana şifresi sistem tarafından korunmaktadır.');
        setPassLoading(false);
        return;
      }

      const { data: dbUser } = await supabase
        .from('artists')
        .select('password')
        .eq('id', currentUser.id)
        .single();

      if (dbUser && dbUser.password !== currentPass) {
        setPassMsg('Mevcut şifreniz hatalı!');
        setPassLoading(false);
        return;
      }

      if (newPass.length < 4) {
        setPassMsg('Yeni şifre en az 4 haneli olmalıdır.');
        setPassLoading(false);
        return;
      }

      const { error: updateErr } = await supabase
        .from('artists')
        .update({ password: newPass })
        .eq('id', currentUser.id);

      if (updateErr) {
        setPassMsg('Hata: ' + updateErr.message);
      } else {
        const updatedUser = { ...currentUser, password: newPass };
        setCurrentUser(updatedUser);
        localStorage.setItem('nautilus_active_session_v9', JSON.stringify(updatedUser));
        setPassMsg('Şifreniz buluta kaydedildi!');
        setCurrentPass('');
        setNewPass('');
        fetchArtists();
      }
    } catch (err) {
      setPassMsg('Bağlantı hatası.');
    } finally {
      setPassLoading(false);
    }
  };

  // Kullanıcı Yönetimi
  const openNewUserModal = () => {
    setEditingArtist(null);
    setUserFormData({
      name: '',
      username: '',
      password: '',
      role: 'artist',
      color: '#10b981',
      commission_rate: 50
    });
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (art) => {
    setEditingArtist(art);
    setUserFormData({
      name: art.name,
      username: art.username,
      password: art.password,
      role: art.role || 'artist',
      color: art.color || '#10b981',
      commission_rate: art.commission_rate || 50
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const cleanUser = userFormData.username.trim().toLowerCase();

    if (editingArtist) {
      const { error } = await supabase.from('artists').update({
        name: userFormData.name,
        username: cleanUser,
        password: userFormData.password,
        role: userFormData.role,
        color: userFormData.color,
        commission_rate: Number(userFormData.commission_rate)
      }).eq('id', editingArtist.id);

      if (error) {
        alert('Kullanıcı güncellenemedi: ' + error.message);
        return;
      }
    } else {
      const newId = 'art_' + Date.now();
      const { error } = await supabase.from('artists').insert([{
        id: newId,
        name: userFormData.name,
        username: cleanUser,
        password: userFormData.password,
        role: userFormData.role,
        color: userFormData.color,
        commission_rate: Number(userFormData.commission_rate)
      }]);

      if (error) {
        alert('Kullanıcı eklenemedi: ' + error.message);
        return;
      }
    }

    setIsUserModalOpen(false);
    setEditingArtist(null);
    await fetchArtists();
  };

  const handleDeleteUser = async (id, name) => {
    if (confirm(`${name} isimli kullanıcıyı silmek istediğinize emin misiniz?`)) {
      const { error } = await supabase.from('artists').delete().eq('id', id);
      if (error) {
        alert('Silme hatası: ' + error.message);
      } else {
        await fetchArtists();
      }
    }
  };

  // Gider Yönetimi
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    const newExp = {
      id: 'exp_' + Date.now(),
      title: expenseFormData.title,
      amount: Number(expenseFormData.amount) || 0,
      category: expenseFormData.category,
      date: expenseFormData.date
    };

    const { error } = await supabase.from('expenses').insert([newExp]);
    if (error) {
      alert('Gider kaydedilemedi: ' + error.message);
      return;
    }

    setIsExpenseModalOpen(false);
    setExpenseFormData({
      title: '',
      amount: '',
      category: 'Sarf Malzeme',
      date: new Date().toISOString().slice(0, 10)
    });
    fetchExpenses();
  };

  const handleDeleteExpense = async (id) => {
    if (confirm('Bu gider kaydını silmek istediğinize emin misiniz?')) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (!error) {
        fetchExpenses();
      }
    }
  };

  // Randevu İşlemleri
  const handleSaveAppointment = async (e) => {
    e.preventDefault();
    const defaultArtistId = artists.find(a => a.role !== 'admin')?.id || 'art1';
    const payload = {
      ...formData,
      artist_id: currentUser.role === 'admin' ? (formData.artist_id || defaultArtistId) : currentUser.id,
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

  // WhatsApp Randevu Hatırlatması (Sanatçı İmzalı)
  const sendWhatsApp = (appt) => {
    if (!appt.phone) {
      alert('Bu randevuda kayıtlı telefon numarası bulunmuyor.');
      return;
    }
    const cleanPhone = appt.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('90') ? cleanPhone : (cleanPhone.startsWith('0') ? '9' + cleanPhone : '90' + cleanPhone);
    const artist = artists.find(a => a.id === appt.artist_id);
    const senderName = artist ? artist.name : (currentUser ? currentUser.name : 'Sanatçınız');

    const text = `Merhaba ${appt.client_name}, ${appt.date} günü saat ${appt.time ? appt.time.slice(0, 5) : ''}'te benimle (${senderName}) Nautilus Tattoo'daki dövme seansınız planlanmıştır. Seans saatinden önce iyi dinlenmiş ve tok gelmenizi, bol su tüketmenizi rica ederim. Görüşmek üzere!`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // WhatsApp Seans Sonrası Bakım (Aftercare) Mesajı (Sanatçı İmzalı)
  const sendAftercareWhatsApp = (appt) => {
    if (!appt.phone) {
      alert('Bu randevuda kayıtlı telefon numarası bulunmuyor.');
      return;
    }
    const cleanPhone = appt.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('90') ? cleanPhone : (cleanPhone.startsWith('0') ? '9' + cleanPhone : '90' + cleanPhone);
    const artist = artists.find(a => a.id === appt.artist_id);
    const senderName = artist ? artist.name : (currentUser ? currentUser.name : 'Sanatçınız');

    const text = `Merhaba ${appt.client_name}, yeni dövmen hayırlı olsun! ✨\n\nBen ${senderName}. Dövmenin en kusursuz ve sağlıklı şekilde iyileşmesi için dikkat etmeni istediğim adımlar:\n\n1. Taktığımız koruyucu filmi belirttiğim süreden önce kesinlikle çıkarma.\n2. Filmi çıkardıktan sonra dövmeni ılık su ve antibakteriyel sabunla nazikçe yıkayıp temiz bir havlu kağıtla tamponlayarak kurula.\n3. İlk 2-3 hafta günde 2-3 kez ince bir tabaka halinde önerdiğim bakım kremini uygula.\n4. Tamamen iyileşene kadar dövmeni kaşıma, kabukları soyma; deniz, havuz, sauna ve direkt güneş ışığından koru.\n\nİyileşme sürecinde aklına takılan her şeyi bana buradan doğrudan iletebilirsin. Güzel günlerde taşı!`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // YENİ: Tek Tıkla WhatsApp Kasa Özeti Kopyalama / Paylaşma
  const copyKasaSummary = () => {
    let summaryText = `📅 Nautilus Tattoo - Stüdyo Kasa & Hakediş Raporu\n`;
    summaryText += `--------------------------------\n`;
    
    artists.filter(a => a.role !== 'admin').forEach(art => {
      const aAppts = appointments.filter(a => a.artist_id === art.id);
      const rev = aAppts.reduce((acc, a) => acc + Number(a.price || 0), 0);
      const cut = rev * (art.commission_rate / 100);
      const artistCut = rev - cut;
      summaryText += `• ${art.name}: ${aAppts.length} Seans | Ciro: ${rev.toLocaleString('tr-TR')} ₺ | Hakediş: ${artistCut.toLocaleString('tr-TR')} ₺\n`;
    });

    summaryText += `--------------------------------\n`;
    summaryText += `💰 Toplam Ciro: ${allRevenue.toLocaleString('tr-TR')} ₺\n`;
    summaryText += `📥 Alınan Kaporalar: ${allDeposits.toLocaleString('tr-TR')} ₺\n`;
    summaryText += `💸 Ortak Giderler: ${totalExpenses.toLocaleString('tr-TR')} ₺\n`;
    summaryText += `🏛️ Net Dükkan Kârı: ${netStudioFinalProfit.toLocaleString('tr-TR')} ₺\n`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);

    const shareUrl = `https://wa.me/?text=${encodeURIComponent(summaryText)}`;
    window.open(shareUrl, '_blank');
  };

  const openNewModal = (defaultDate = null) => {
    const defaultArtistId = artists.find(a => a.role !== 'admin')?.id || 'art1';
    setSelectedAppt(null);
    setFormData({
      artist_id: currentUser.role === 'admin' ? defaultArtistId : currentUser.id,
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
  const studioGrossProfit = appointments.reduce((acc, a) => {
    const art = artists.find(i => i.id === a.artist_id);
    const r = art ? art.commission_rate : 50;
    return acc + (Number(a.price || 0) * (r / 100));
  }, 0);

  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const netStudioFinalProfit = studioGrossProfit - totalExpenses;

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
                placeholder="bosside, aylin, egecan..." 
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
            Dükkan Masası & Kasa
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
                {artists.filter(a => a.role !== 'admin').map(art => (
                  <button key={art.id} onClick={() => setFilterArtist(art.id)} style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', border: filterArtist === art.id ? `1px solid ${art.color}` : `1px solid ${currentTheme.border}`, backgroundColor: currentTheme.subCard, color: filterArtist === art.id ? currentTheme.text : currentTheme.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: art.color }}></span>
                    {art.name}
                  </button>
                ))}
              </div>
            </div>

            {/* TAKVİM DÜZENİ */}
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
                    const art = artists.find(i => i.id === appt.artist_id);
                    const canSeePrice = isSuperAdmin || appt.artist_id === currentUser.id;
                    const price = Number(appt.price || 0);
                    const deposit = Number(appt.deposit || 0);
                    const remaining = Math.max(0, price - deposit);
                    const isPaid = appt.payment_status === 'completed';

                    return (
                      <div key={appt.id} style={{ backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderLeft: `4px solid ${art?.color || currentTheme.muted}`, borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: art?.color || '#10b981' }}></span>
                            <span style={{ fontSize: '12px', color: art?.color || currentTheme.text, fontWeight: 700 }}>
                              {art?.name || 'Sanatçı Belirtilmedi'}
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: currentTheme.muted, display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {appt.time ? appt.time.slice(0, 5) : ''}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: currentTheme.text }}>{appt.client_name}</div>
                            <div style={{ fontSize: '12px', color: currentTheme.muted }}>Bölge: <span style={{ color: currentTheme.text }}>{appt.body_part}</span></div>
                          </div>

                          {/* İkili WhatsApp Butonları: 1. Randevu Hatırlatma, 2. Seans Sonrası Bakım */}
                          {appt.phone && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => sendWhatsApp(appt)} title="Randevu Onayı / Hatırlatma Gönder" style={{ backgroundColor: '#238636', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '6px 8px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                <MessageCircle size={13} /> Onay
                              </button>
                              <button onClick={() => sendAftercareWhatsApp(appt)} title="Seans Sonrası Dövme Bakım Rehberi Gönder" style={{ backgroundColor: '#1f6feb', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '6px 8px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                <Sparkles size={13} /> Bakım
                              </button>
                            </div>
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

              {/* 1. Arka Plan Teması */}
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
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: currentTheme.text }}>Kendi Şifremi Değiştir</h4>
              <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="password" required placeholder="Mevcut Şifre" value={currentPass} onChange={e => setCurrentPass(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '10px', padding: '10px', color: currentTheme.text, fontSize: '13px' }} />
                <input type="password" required placeholder="Yeni Şifre" value={newPass} onChange={e => setNewPass(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '10px', padding: '10px', color: currentTheme.text, fontSize: '13px' }} />
                {passMsg && <p style={{ fontSize: '12px', margin: 0, color: passMsg.includes('buluta kaydedildi') ? '#10b981' : '#f85149' }}>{passMsg}</p>}
                <button type="submit" disabled={passLoading} style={{ backgroundColor: currentTheme.subCard, border: `1px solid ${currentTheme.border}`, color: currentTheme.text, padding: '10px', borderRadius: '10px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', opacity: passLoading ? 0.6 : 1 }}>
                  {passLoading ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* DÜKKAN SAHİBİ MASASI & KASA YÖNETİMİ */}
        {activeTab === 'admin_panel' && isSuperAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Kasa Finans Kartları (Ciro, Kapora, Giderler, Net Kâr) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
              <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '16px', padding: '14px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
                <span style={{ fontSize: '11px', color: currentTheme.muted, textTransform: 'uppercase' }}>Stüdyo Toplam Ciro</span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '6px 0 0 0', color: currentTheme.text }}>{allRevenue.toLocaleString('tr-TR')} ₺</h3>
              </div>
              <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '16px', padding: '14px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
                <span style={{ fontSize: '11px', color: currentTheme.muted, textTransform: 'uppercase' }}>Toplanan Kapora</span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '6px 0 0 0', color: '#059669' }}>{allDeposits.toLocaleString('tr-TR')} ₺</h3>
              </div>
              <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '16px', padding: '14px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
                <span style={{ fontSize: '11px', color: currentTheme.muted, textTransform: 'uppercase' }}>Ortak Giderler</span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '6px 0 0 0', color: '#f85149' }}>{totalExpenses.toLocaleString('tr-TR')} ₺</h3>
              </div>
              <div style={{ backgroundColor: currentTheme.card, border: '1px solid #10b981', borderRadius: '16px', padding: '14px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
                <span style={{ fontSize: '11px', color: '#059669', textTransform: 'uppercase', fontWeight: 700 }}>Net Stüdyo Kârı</span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '6px 0 0 0', color: '#059669' }}>{netStudioFinalProfit.toLocaleString('tr-TR')} ₺</h3>
              </div>
            </div>

            {/* TEK TIKLA WHATSAPP KASA VE HAKEDİŞ ÖZETİ BUTONU */}
            <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '18px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: currentTheme.text }}>Haftalık Kasa & Hakediş Raporu</h4>
                <p style={{ fontSize: '12px', color: currentTheme.muted, margin: '2px 0 0 0' }}>Tek tıkla tüm sanatçıların seanslarını ve kasa durumunu WhatsApp'a aktar.</p>
              </div>
              <button onClick={copyKasaSummary} style={{ backgroundColor: '#238636', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <Share2 size={15} /> {copiedSummary ? 'Kopyalandı & Açılıyor!' : 'WhatsApp Raporu'}
              </button>
            </div>

            {/* ORTAK GİDER / MASRAF TAKİP MODÜLÜ */}
            <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '18px', padding: '16px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={18} style={{ color: '#f85149' }} />
                  <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: currentTheme.text }}>Ortak Giderler & Sarf Malzeme ({expenses.length})</h4>
                </div>
                <button onClick={() => setIsExpenseModalOpen(true)} style={{ backgroundColor: currentTheme.subCard, color: currentTheme.text, border: `1px solid ${currentTheme.border}`, borderRadius: '10px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Plus size={14} /> Gider Ekle
                </button>
              </div>

              {expenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '18px', color: currentTheme.muted, fontSize: '12px' }}>Henüz kaydedilmiş bir gider bulunmuyor.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {expenses.slice(0, 5).map(exp => (
                    <div key={exp.id} style={{ backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: currentTheme.text }}>{exp.title}</div>
                        <div style={{ fontSize: '11px', color: currentTheme.muted }}>{exp.category} • {exp.date}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 700, color: '#f85149', fontSize: '13px' }}>-{Number(exp.amount).toLocaleString('tr-TR')} ₺</span>
                        <button onClick={() => handleDeleteExpense(exp.id)} style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', padding: 0 }}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                  {expenses.length > 5 && (
                    <span style={{ fontSize: '11px', color: currentTheme.muted, textAlign: 'center' }}>+ {expenses.length - 5} daha fazla gider kaydı mevcut</span>
                  )}
                </div>
              )}
            </div>

            {/* EKİP VE KULLANICI YÖNETİM MODÜLÜ */}
            <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '18px', padding: '16px', boxShadow: currentTheme.isLight ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} style={{ color: accentColor }} />
                  <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: currentTheme.text }}>Ekip & Sanatçı Yönetimi</h4>
                </div>
                <button onClick={openNewUserModal} style={{ backgroundColor: accentColor, color: accentTextColor, border: 'none', borderRadius: '10px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserPlus size={14} /> Yeni Sanatçı Ekle
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {artists.filter(a => a.role !== 'admin').map(art => (
                  <div key={art.id} style={{ backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: art.color || '#10b981' }}></span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: currentTheme.text }}>{art.name} <span style={{ fontSize: '11px', color: currentTheme.muted }}>({art.role === 'assistant' ? 'Asistan' : 'Sanatçı'})</span></div>
                        <div style={{ fontSize: '11px', color: currentTheme.muted, display: 'flex', gap: '8px', marginTop: '2px' }}>
                          <span>K.Adı: <strong style={{ color: currentTheme.text }}>{art.username}</strong></span>
                          <span>•</span>
                          <span>Şifre: <strong style={{ color: '#60a5fa' }}>{art.password}</strong></span>
                          <span>•</span>
                          <span>Dükkan Payı: <strong style={{ color: '#059669' }}>%{art.commission_rate}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button onClick={() => openEditUserModal(art)} title="Düzenle / Şifre Değiştir" style={{ backgroundColor: currentTheme.subCard, border: `1px solid ${currentTheme.border}`, color: currentTheme.text, padding: '6px 8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                        <Key size={13} /> Düzenle
                      </button>
                      <button onClick={() => handleDeleteUser(art.id, art.name)} title="Kullanıcıyı Sil" style={{ backgroundColor: 'transparent', border: 'none', color: '#f85149', padding: '6px', cursor: 'pointer' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sanatçı Hasılat & Hakediş Tablosu */}
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
                    {artists.filter(a => a.role !== 'admin').map(art => {
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

      {/* GİDER EKLEME MODAL */}
      {isExpenseModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 120 }}>
          <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '18px', width: '100%', maxWidth: '360px', padding: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0', color: currentTheme.text }}>Yeni Ortak Gider Ekle</h3>
            <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '4px' }}>Gider Başlığı</label>
                <input type="text" required placeholder="örn: İğne & Boya Siparişi, Kahve Çekirdeği" value={expenseFormData.title} onChange={e => setExpenseFormData({ ...expenseFormData, title: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '8px', color: currentTheme.text, fontSize: '13px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '4px' }}>Tutar (₺)</label>
                  <input type="number" required placeholder="1250" value={expenseFormData.amount} onChange={e => setExpenseFormData({ ...expenseFormData, amount: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '8px', color: currentTheme.text, fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '4px' }}>Kategori</label>
                  <select value={expenseFormData.category} onChange={e => setExpenseFormData({ ...expenseFormData, category: e.target.value })} style={{ width: '100%', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '8px', color: currentTheme.text, fontSize: '13px' }}>
                    <option value="Sarf Malzeme">Sarf Malzeme</option>
                    <option value="Dükkan Gideri">Dükkan Gideri</option>
                    <option value="Kahve & İkram">Kahve & İkram</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '4px' }}>Tarih</label>
                <input type="date" required value={expenseFormData.date} onChange={e => setExpenseFormData({ ...expenseFormData, date: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '8px', color: currentTheme.text, fontSize: '13px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} style={{ backgroundColor: currentTheme.subCard, border: 'none', color: currentTheme.muted, padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>İptal</button>
                <button type="submit" style={{ backgroundColor: '#f85149', border: 'none', color: '#ffffff', fontWeight: 700, padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>Gideri Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KULLANICI EKLE / DÜZENLE MODAL (DÜKKAN SAHİBİ İÇİN) */}
      {isUserModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 110 }}>
          <div style={{ backgroundColor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: '18px', width: '100%', maxWidth: '380px', padding: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0', color: currentTheme.text }}>
              {editingArtist ? `${editingArtist.name} Bilgilerini Düzenle` : 'Yeni Sanatçı / Asistan Ekle'}
            </h3>
            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '4px' }}>Ad Soyad</label>
                <input type="text" required placeholder="örn: Aylin" value={userFormData.name} onChange={e => setUserFormData({ ...userFormData, name: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '8px', color: currentTheme.text, fontSize: '13px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '4px' }}>Kullanıcı Adı</label>
                  <input type="text" required placeholder="aylin" value={userFormData.username} onChange={e => setUserFormData({ ...userFormData, username: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '8px', color: currentTheme.text, fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '4px' }}>Şifre</label>
                  <input type="text" required placeholder="aylin123" value={userFormData.password} onChange={e => setUserFormData({ ...userFormData, password: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '8px', color: currentTheme.text, fontSize: '13px' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '4px' }}>Rol</label>
                  <select value={userFormData.role} onChange={e => setUserFormData({ ...userFormData, role: e.target.value })} style={{ width: '100%', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '8px', color: currentTheme.text, fontSize: '13px' }}>
                    <option value="artist">Sanatçı</option>
                    <option value="assistant">Asistan</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '4px' }}>Dükkan Payı (%)</label>
                  <input type="number" required min="0" max="100" placeholder="60" value={userFormData.commission_rate} onChange={e => setUserFormData({ ...userFormData, commission_rate: Number(e.target.value) })} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: currentTheme.bg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '8px', color: currentTheme.text, fontSize: '13px' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: currentTheme.muted, marginBottom: '4px' }}>Takvim Etiket Rengi</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {['#10b981', '#3b82f6', '#f43f5e', '#a78bfa', '#f59e0b', '#2dd4bf', '#ec4899', '#eab308'].map(color => (
                    <button key={color} type="button" onClick={() => setUserFormData({ ...userFormData, color })} style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: color, border: userFormData.color === color ? '2px solid #ffffff' : 'none', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsUserModalOpen(false)} style={{ backgroundColor: currentTheme.subCard, border: 'none', color: currentTheme.muted, padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>İptal</button>
                <button type="submit" style={{ backgroundColor: accentColor, border: 'none', color: accentTextColor, fontWeight: 700, padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  {editingArtist ? 'Kaydet' : 'Kullanıcıyı Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    {artists.filter(a => a.role !== 'admin').map(art => (
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
