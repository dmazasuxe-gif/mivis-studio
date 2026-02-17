"use client";

import { useState, useEffect } from 'react';
import {
    Users, Plus, Trash2, ChevronRight, DollarSign,
    TrendingUp, X, Settings, Wallet,
    ArrowDownCircle, ArrowUpCircle, Camera, RotateCcw,
    Calendar, Clock, CheckCircle2, Cloud, Lock, LogOut, Store, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Playfair_Display, Inter } from 'next/font/google';

// 🔥 FIREBASE IMPORTS
import { db } from '@/lib/firebase';
import {
    initializeApp, getApps, getApp
} from "firebase/app";
import {
    collection, addDoc, deleteDoc, updateDoc, doc,
    onSnapshot, query, orderBy, getDocs, getDoc, setDoc, enableIndexedDbPersistence
} from 'firebase/firestore';

const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap' }); // Preload font

// --- Tipos Adaptados para Firebase ---
type Employee = { id: string; name: string; role: string; photo?: string; avatarSeed: string; commission: number | string; };
type SimpleExpense = { id: string; category: string; amount: number; description: string; date: Date; };
type Transaction = { id: string; employeeId: string; serviceName: string; price: number; date: Date; };
type Booking = { id: string; clientName: string; clientPhone: string; service: string; professionalId: string; date: Date; status: 'confirmed' | 'pending'; };
type ServiceItem = { id: string; name: string; };

const EXPENSE_CATS = ["Pago Personal", "Luz", "Agua", "Internet", "Local", "Insumos", "Otros"];

export default function StudioSystem() {
    // Datos
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [expenses, setExpenses] = useState<SimpleExpense[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [adminPin, setAdminPin] = useState("1234"); // Default PIN

    // UI State
    const [view, setView] = useState<'LANDING' | 'PIN_ENTRY' | 'ADMIN_DASHBOARD' | 'CLIENT_BOOKING'>('LANDING');
    const [activeTab, setActiveTab] = useState<'HOME' | 'FINANCE' | 'REPORTS' | 'BOOKINGS'>('HOME'); // Sub-tabs for Admin
    const [pinInput, setPinInput] = useState("");
    const [pinError, setPinError] = useState(false);
    const [isOffline, setIsOffline] = useState(false); // New Offline State

    // Admin Actions State
    const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [newPin, setNewPin] = useState('');

    // Inputs CRUD
    const [newEmpName, setNewEmpName] = useState('');
    const [newEmpRole, setNewEmpRole] = useState('');
    const [newEmpComm, setNewEmpComm] = useState('40');
    const [newEmpPhoto, setNewEmpPhoto] = useState<string | null>(null);
    const [selService, setSelService] = useState<string | null>(null);
    const [manPrice, setManPrice] = useState('');
    const [isManaging, setIsManaging] = useState(false);
    const [newServName, setNewServName] = useState('');

    // 🔥 1. CONEXIÓN REAL-TIME CON FIREBASE (Optimized)
    useEffect(() => {
        // Try to enable offline persistence (Turboload features)
        // Note: This might fail in some browsers or if multiple tabs open, catch silently
        try { enableIndexedDbPersistence(db).catch(() => { }); } catch (e) { }

        const loadSettings = async () => {
            try {
                const docRef = doc(db, "settings", "config");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) setAdminPin(docSnap.data().pin || "1234");
            } catch (e) { setIsOffline(true); }
        };
        loadSettings();

        // Listeners start immediately (loading state removed for perceived speed)
        const unsubEmp = onSnapshot(collection(db, "employees"), (snap) => setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() } as Employee))));
        const unsubServ = onSnapshot(collection(db, "services"), (snap) => setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceItem))));
        const unsubTrans = onSnapshot(query(collection(db, "transactions"), orderBy("date", "desc")), (snap) => setTransactions(snap.docs.map(d => { const data = d.data(); return { id: d.id, ...data, date: data.date?.toDate ? data.date.toDate() : new Date(data.date) } as Transaction; })));
        const unsubExp = onSnapshot(query(collection(db, "expenses"), orderBy("date", "desc")), (snap) => setExpenses(snap.docs.map(d => { const data = d.data(); return { id: d.id, ...data, date: data.date?.toDate ? data.date.toDate() : new Date(data.date) } as SimpleExpense; })));
        const unsubBook = onSnapshot(query(collection(db, "bookings")), (snap) => {
            setBookings(snap.docs.map(d => { const data = d.data(); return { id: d.id, ...data, date: data.date?.toDate ? data.date.toDate() : new Date(data.date) } as Booking; }));
        });

        return () => { unsubEmp(); unsubServ(); unsubTrans(); unsubExp(); unsubBook(); };
    }, []);

    // --- LOGIC ---

    const handlePinSubmit = () => {
        if (pinInput === adminPin) {
            setView('ADMIN_DASHBOARD');
            setPinInput("");
            setPinError(false);
        } else {
            setPinError(true);
            setPinInput("");
            setTimeout(() => setPinError(false), 1000);
        }
    };

    const handleSeedDB = async () => {
        if (confirm("¿Inicializar Base de Datos con ejemplos?")) {
            await addDoc(collection(db, "employees"), { name: 'Diana', role: 'Estilista Senior', avatarSeed: 'Diana', commission: 40 });
            await addDoc(collection(db, "employees"), { name: 'Yolita', role: 'Maquilladora', avatarSeed: 'Yolita', commission: 40 });
            ["Cortes", "Maquillaje", "Manicure", "Pedicure", "Laceados", "Tintes"].forEach(async s => await addDoc(collection(db, "services"), { name: s }));
        }
    };

    const handleUpdatePin = async () => {
        if (newPin.length < 4) return alert("El PIN debe tener al menos 4 dígitos");
        await setDoc(doc(db, "settings", "config"), { pin: newPin }, { merge: true });
        setAdminPin(newPin);
        setNewPin('');
        setShowSettingsModal(false);
        alert("🔒 ¡Contraseña Actualizada Correctamente!");
    };

    // ... (Resto de Handlers CRUD igual que antes, simplificados para brevedad) ...
    const handleRegisterExpense = async (newExp: any) => await addDoc(collection(db, "expenses"), { ...newExp, date: new Date() });
    const handleDeleteExpense = async (id: string) => { if (confirm('¿Eliminar gasto?')) await deleteDoc(doc(db, "expenses", id)); };
    // FIX: Employee Create now closes modal
    const handleCreateEmployee = async () => {
        if (!newEmpName) return;
        await addDoc(collection(db, "employees"), { name: newEmpName, role: newEmpRole || 'Profesional', photo: newEmpPhoto || null, avatarSeed: newEmpName, commission: Number(newEmpComm) || 40 });
        setNewEmpName(''); setNewEmpRole(''); setNewEmpComm('40'); setNewEmpPhoto(null);
        setShowAddModal(false); // Close Modal Automatically!
        alert("✅ Trabajador Creado Correctamente");
    };
    // FIX: Service Create now clears input
    const handleCreateService = async () => {
        if (newServName) {
            await addDoc(collection(db, "services"), { name: newServName });
            setNewServName(''); // Clear input automatically!
        }
    };

    const handleEmployeeDelete = async (id: string, e: React.MouseEvent) => { e.stopPropagation(); if (confirm('⚠️ ¿Eliminar miembro?')) await deleteDoc(doc(db, "employees", id)); };
    const handleBooking = async (book: any) => {
        await addDoc(collection(db, "bookings"), { ...book, status: 'confirmed' });
        alert("✨ ¡Reserva Enviada! Te esperamos pronto.");
        if (view === 'CLIENT_BOOKING') setView('LANDING'); // Volver al inicio despues de reservar
    };

    const handleDeleteService = async (id: string) => await deleteDoc(doc(db, "services", id));
    const handleTransaction = async () => { const p = parseFloat(manPrice); if (!selectedEmp || isNaN(p) || p <= 0) return; await addDoc(collection(db, "transactions"), { employeeId: selectedEmp.id, serviceName: selService, price: p, date: new Date() }); setSelService(null); setManPrice(''); alert('Cobro registrado ☁️'); };
    const handleUpdateCommission = async (id: string, val: string) => await updateDoc(doc(db, "employees", id), { commission: val });
    const handleDeleteBooking = async (id: string) => { if (confirm("¿Cancelar cita?")) await deleteDoc(doc(db, "bookings", id)); };
    const handleResetFinances = async () => alert("Contacta soporte para reset masivo seguro.");

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setNewEmpPhoto(reader.result as string); reader.readAsDataURL(file); } };

    // TURBO MODE: No loading screen blocking interaction. 
    // We render the UI immediately, data will pop in when ready.

    // --- VISTAS ---

    // 1. LANDING PAGE
    if (view === 'LANDING') {
        return (
            <div className="min-h-screen bg-[#061814] text-emerald-50 flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2669&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#061814] via-[#061814]/80 to-transparent"></div>

                <div className="relative z-10 max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="mb-8">
                        <h1 className={`${playfair.className} text-5xl md:text-6xl text-yellow-500 mb-2 drop-shadow-lg`}>MIVIS</h1>
                        <p className="text-emerald-200/80 tracking-[0.4em] text-sm uppercase">Studio & Beauty</p>
                    </div>

                    <div className="space-y-4">
                        <button onClick={() => setView('CLIENT_BOOKING')} className="w-full bg-white text-[#061814] hover:bg-emerald-100 py-4 rounded-xl font-bold text-lg shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all flex items-center justify-center gap-3">
                            <Calendar className="w-5 h-5" /> Reservar Cita
                        </button>
                        <button onClick={() => setView('PIN_ENTRY')} className="w-full bg-transparent border border-white/10 text-white/40 hover:text-white hover:border-white/30 py-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2">
                            <Lock className="w-4 h-4" /> Soy Administrador
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // 2. PIN ENTRY (ADMIN LOGIN)
    if (view === 'PIN_ENTRY') {
        return (
            <div className="min-h-screen bg-[#0f2a24] flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="max-w-xs w-full bg-black/20 p-8 rounded-3xl border border-white/5 backdrop-blur-xl text-center">
                    <Lock className="w-8 h-8 text-yellow-500 mx-auto mb-6" />
                    <h2 className={`${playfair.className} text-2xl text-white mb-6`}>Acceso Privado</h2>
                    <div className="flex justify-center gap-2 mb-8">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className={`w-3 h-3 rounded-full transition-all ${pinInput.length > i ? 'bg-yellow-500' : 'bg-white/10'}`}></div>
                        ))}
                    </div>
                    {pinError && <p className="text-red-400 text-xs mb-4 animate-shake">Contraseña Incorrecta</p>}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <button key={n} onClick={() => setPinInput(prev => (prev.length < 6 ? prev + n : prev))} className="h-14 rounded-full bg-white/5 hover:bg-white/10 text-xl font-bold text-white transition-colors">{n}</button>
                        ))}
                        <div className="col-start-2"><button onClick={() => setPinInput(prev => (prev.length < 6 ? prev + 0 : prev))} className="w-full h-14 rounded-full bg-white/5 hover:bg-white/10 text-xl font-bold text-white transition-colors">0</button></div>
                        <div className="col-start-3"><button onClick={() => setPinInput(prev => prev.slice(0, -1))} className="w-full h-14 rounded-full flex items-center justify-center text-white/30 hover:text-white transition-colors"><X className="w-6 h-6" /></button></div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setView('LANDING')} className="flex-1 py-3 rounded-xl border border-white/10 text-xs text-white/50 hover:bg-white/5">Cancelar</button>
                        <button onClick={handlePinSubmit} className="flex-1 py-3 rounded-xl bg-yellow-600 text-black font-bold text-sm hover:bg-yellow-500">Entrar</button>
                    </div>
                    <p className="text-[10px] text-white/20 mt-4">Clave por defecto: 1234</p>
                </motion.div>
            </div>
        )
    }

    // 3. CLIENT BOOKING VIEW (UPDATED 💎 WITH CUSTOM BG)
    if (view === 'CLIENT_BOOKING') {
        return (
            <div className="min-h-screen bg-[#061814] text-[#e0e7e4] font-sans flex flex-col relative overflow-hidden">
                {/* 🏷️ Fondo Personalizado: Asegúrate de guardar 'fondo.jpg' en la carpeta public */}
                <div className="absolute inset-0 bg-[url('/fondo.jpeg')] bg-cover bg-center opacity-40 blur-[3px]"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#061814]/90 via-[#061814]/60 to-transparent"></div>

                <div className="p-6 relative z-10"><button onClick={() => setView('LANDING')} className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white hover:bg-white/20 hover:scale-105 transition-all flex items-center gap-2 text-sm border border-white/5 shadow-lg"><ChevronRight className="rotate-180 w-4 h-4" /> Volver al Inicio</button></div>

                <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-[#0f2a24]/60 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        <div className="text-center mb-8">
                            <h1 className={`${playfair.className} text-4xl text-yellow-500 mb-2 drop-shadow-sm`}>Tu Cita</h1>
                            <div className="h-1 w-16 bg-gradient-to-r from-transparent via-emerald-500 to-transparent mx-auto rounded-full mb-3"></div>
                            <p className="text-emerald-100/70 text-sm font-light">Completa tus datos para brillar hoy.</p>
                        </div>
                        <BookingForm services={services} employees={employees} onSubmit={handleBooking} isClient={true} />
                    </motion.div>
                </div>
            </div>
        )
    }

    // 4. ADMIN DASHBOARD (The Full System)
    return (
        <div className={`min-h-screen bg-[#0f2a24] text-[#e0e7e4] font-sans pb-20 selection:bg-yellow-500 selection:text-black`}>
            {/* Admin Header */}
            <header className="sticky top-0 z-20 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center bg-[#0f2a24]/80">
                <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-yellow-500" />
                    <div>
                        <h1 className={`${playfair.className} text-xl text-white font-medium`}>MIVIS ADMIN</h1>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="hidden sm:flex gap-1 bg-black/20 p-1 rounded-full border border-white/5">
                        <NavBtn icon={<Users />} label="Equipo" active={activeTab === 'HOME'} onClick={() => setActiveTab('HOME')} />
                        <NavBtn icon={<Calendar />} label="Agenda" active={activeTab === 'BOOKINGS'} onClick={() => setActiveTab('BOOKINGS')} />
                        <NavBtn icon={<Wallet />} label="Finanzas" active={activeTab === 'FINANCE'} onClick={() => setActiveTab('FINANCE')} />
                        <NavBtn icon={<TrendingUp />} label="Reportes" active={activeTab === 'REPORTS'} onClick={() => setActiveTab('REPORTS')} />
                    </div>
                    <button onClick={() => setShowSettingsModal(true)} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full border border-transparent hover:border-white/10 transition-all ml-2"><Settings className="w-4 h-4" /></button>
                    <button onClick={() => setView('LANDING')} className="p-2 text-red-400 hover:bg-red-500/10 rounded-full border border-transparent hover:border-red-500/20 transition-all ml-2"><LogOut className="w-4 h-4" /></button>
                </div>
            </header>

            {/* Mobile Tab Bar */}
            <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/80 backdrop-blur-xl p-2 rounded-full border border-white/10 shadow-2xl z-30">
                <NavBtn icon={<Users />} label="" active={activeTab === 'HOME'} onClick={() => setActiveTab('HOME')} />
                <NavBtn icon={<Calendar />} label="" active={activeTab === 'BOOKINGS'} onClick={() => setActiveTab('BOOKINGS')} />
                <NavBtn icon={<Wallet />} label="" active={activeTab === 'FINANCE'} onClick={() => setActiveTab('FINANCE')} />
                <NavBtn icon={<TrendingUp />} label="" active={activeTab === 'REPORTS'} onClick={() => setActiveTab('REPORTS')} />
            </div>

            <main className="max-w-6xl mx-auto p-6">
                {/* Empty State / Offline Notice */}
                {employees.length === 0 && <div className="text-center py-6 text-white/30 text-sm">Cargando base de datos... </div>}
                {employees.length === 0 && <button onClick={handleSeedDB} className="mx-auto block bg-blue-600 px-6 py-3 rounded-full mb-8 text-xs">🛠️ Inicializar DB</button>}

                <AnimatePresence mode='wait'>
                    {activeTab === 'BOOKINGS' && (
                        <BookingSection bookings={bookings} employees={employees} services={services} onAdd={handleBooking} onDelete={handleDeleteBooking} />
                    )}

                    {activeTab === 'FINANCE' && (
                        <FinanceSection transactions={transactions} expenses={expenses} onAdd={handleRegisterExpense} onDelete={handleDeleteExpense} onReset={handleResetFinances} />
                    )}

                    {activeTab === 'REPORTS' && <ReportSection employees={employees} transactions={transactions} onUpdateComm={handleUpdateCommission} />}

                    {activeTab === 'HOME' && (
                        <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4"><h2 className={`${playfair.className} text-2xl text-emerald-100 italic`}>Tu Equipo</h2>
                                <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-black px-5 py-2 rounded-full font-bold text-sm transition-all shadow-lg shadow-yellow-900/20"><Plus className="w-4 h-4" /> Nuevo</button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {employees.map(emp => {
                                    const totalToday = transactions.filter(t => t.employeeId === emp.id && t.date >= new Date(new Date().setHours(0, 0, 0, 0))).reduce((s, t) => s + t.price, 0);
                                    return (
                                        <motion.div layoutId={emp.id} key={emp.id} onClick={() => { setSelectedEmp(emp); setSelService(null); setIsManaging(false); }} className="group relative bg-white/5 border border-white/10 hover:border-yellow-500/50 rounded-2xl p-6 flex flex-col items-center gap-4 cursor-pointer backdrop-blur-sm transition-all hover:bg-white/10">
                                            <button onClick={(e) => handleEmployeeDelete(emp.id, e)} className="absolute top-2 right-2 p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"><Trash2 className="w-4 h-4" /></button>
                                            <div className="w-24 h-24 rounded-full p-1 border border-emerald-500/30 group-hover:border-yellow-500 transition-colors overflow-hidden relative"><img src={emp.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.avatarSeed}`} className="w-full h-full rounded-full bg-[#1a3830] object-cover" alt={emp.name} /></div>
                                            <div className="text-center"><h3 className={`text-xl text-emerald-50 ${playfair.className}`}>{emp.name}</h3><p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mt-1">{emp.role}</p></div>
                                            <div className="w-full mt-2 pt-4 border-t border-white/5 flex justify-between items-end"><div><p className="text-[10px] text-white/40 font-bold uppercase">Hoy</p><p className="font-mono text-yellow-500 font-bold text-lg">S/. {totalToday}</p></div><ChevronRight className="w-5 h-5 text-emerald-500/50 group-hover:text-yellow-500 transition-colors" /></div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* MODALES & UTILS */}
                <AnimatePresence>
                    {showSettingsModal && (
                        <Modal onClose={() => setShowSettingsModal(false)}>
                            <h3 className={`${playfair.className} text-2xl text-yellow-500 mb-2 text-center`}>Seguridad</h3>
                            <p className="text-white/50 text-xs text-center mb-6">Cambia tu clave de acceso de administrador.</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-white/50 uppercase ml-1 block mb-1">Nueva Clave (PIN)</label>
                                    <input type="text" placeholder="Ej. 2024" className="input-modern text-center tracking-[0.5em] font-bold text-lg" maxLength={6} value={newPin} onChange={e => setNewPin(e.target.value)} />
                                </div>
                            </div>
                            <button onClick={handleUpdatePin} className="btn-primary w-full py-4 mt-6">Actualizar Clave</button>
                        </Modal>
                    )}
                    {showAddModal && <Modal onClose={() => setShowAddModal(false)}><h3 className={`${playfair.className} text-2xl text-yellow-500 mb-6 text-center`}>Nuevo Talento</h3><div className="flex justify-center mb-6"><label className="relative w-24 h-24 rounded-full bg-black/40 border-2 border-dashed border-white/20 hover:border-yellow-500 cursor-pointer flex items-center justify-center overflow-hidden transition-colors group">{newEmpPhoto ? <img src={newEmpPhoto} className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-white/30 group-hover:text-yellow-500 transition-colors" />}<input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} /></label></div><div className="space-y-4"><input type="text" placeholder="Nombre" className="input-modern" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} /><input type="text" placeholder="Cargo" className="input-modern" value={newEmpRole} onChange={e => setNewEmpRole(e.target.value)} /><input type="number" placeholder="Comisión %" className="input-modern" value={newEmpComm} onChange={e => setNewEmpComm(e.target.value)} /></div><button onClick={handleCreateEmployee} className="btn-primary w-full py-4 mt-6">Crear</button></Modal>}
                    {selectedEmp && (
                        <Modal onClose={() => setSelectedEmp(null)}>
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10"><div className="flex items-center gap-3"><img src={selectedEmp.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedEmp.avatarSeed}`} className="w-12 h-12 object-cover rounded-full bg-[#1a3830]" /><div><h3 className={`${playfair.className} text-xl text-white`}>{selectedEmp.name}</h3></div></div><button onClick={() => setIsManaging(!isManaging)} className="p-2 text-emerald-400 hover:bg-white/5 rounded-full"><Settings className="w-5 h-5" /></button></div>
                            {!selService || isManaging ? (
                                <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">{isManaging && <div className="flex gap-2 mb-4"><input type="text" className="input-modern flex-1 text-sm py-2" placeholder="Nuevo Servicio..." value={newServName} onChange={e => setNewServName(e.target.value)} /><button onClick={handleCreateService} className="btn-primary px-4 py-2 text-xs">OK</button></div>}{services.map(s => <button key={s.id} onClick={() => !isManaging && setSelService(s.name)} className={`w-full text-left p-4 rounded-xl border flex justify-between items-center transition-all ${isManaging ? 'border-dashed border-white/20 text-white/50' : 'bg-white/5 border-white/5 hover:border-yellow-500 hover:bg-white/10 text-emerald-100'}`}>{s.name}{isManaging && <span onClick={(e) => { e.stopPropagation(); handleDeleteService(s.id) }} className="text-red-400 p-1"><Trash2 className="w-4 h-4" /></span>}</button>)}</div>
                            ) : (
                                <div className="flex flex-col items-center animate-in fade-in zoom-in-95"><button onClick={() => setSelService(null)} className="self-start text-xs text-emerald-400 mb-8 hover:underline">← Volver</button><h4 className={`${playfair.className} text-2xl text-yellow-500 mb-6 text-center`}>{selService}</h4><div className="relative w-full max-w-[180px] mb-8"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-2xl text-white/30 font-serif">S/.</span><input autoFocus type="number" placeholder="0" className="w-full bg-transparent text-center text-5xl font-playfair text-white border-b-2 border-white/20 focus:border-yellow-500 outline-none pb-2" value={manPrice} onChange={e => setManPrice(e.target.value)} /></div><button onClick={handleTransaction} className="btn-primary w-full py-4 flex justify-center gap-2"><DollarSign className="w-5 h-5" /> Cobrar</button></div>
                            )}
                        </Modal>
                    )}
                </AnimatePresence>
            </main>
            <style jsx global>{` .input-modern { @apply w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-yellow-500 transition-colors placeholder:text-white/20; } .btn-primary { @apply bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded-xl shadow-lg shadow-yellow-900/40 hover:scale-[1.02] transition-transform; } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-white/10 rounded-full; } .calendar-fix { color-scheme: dark; } `}</style></div>
    );
}

// --- SUB-COMPONENTES AUXILIARES ---
// (BookingSection, BookingForm, FinanceSection, etc. se mantienen igual pero integrados en el dashboard)
function BookingSection({ bookings, employees, services, onAdd, onDelete }: any) {
    const sortedBookings = [...bookings].sort((a: any, b: any) => a.date.getTime() - b.date.getTime());
    return (
        <div className="grid md:grid-cols-2 gap-8 animate-in fade-in">
            <div className="space-y-6">
                <h2 className={`${playfair.className} text-2xl text-emerald-200`}>Agendar Cita (Manual)</h2>
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                    <BookingForm employees={employees} services={services} onSubmit={onAdd} isClient={false} />
                </div>
            </div>
            <div className="space-y-6">
                <h2 className={`${playfair.className} text-2xl text-yellow-500`}>Próximas Citas</h2>
                {sortedBookings.length === 0 ? (
                    <p className="text-white/30 text-center py-10 italic">No hay citas pendientes.</p>
                ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">{sortedBookings.map((b: Booking) => {
                        const emp = employees.find((e: Employee) => e.id === b.professionalId);
                        return (
                            <div key={b.id} className="bg-white/5 border-l-4 border-l-yellow-600 p-4 rounded-r-xl flex justify-between items-center group">
                                <div>
                                    <h4 className="font-bold text-white">{b.clientName}</h4>
                                    <div className="flex items-center gap-2 text-xs text-emerald-400 mt-1"><Clock className="w-3 h-3" /> {b.date.toLocaleDateString()} - {b.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    <div className="text-[10px] text-white/40 mt-1 flex gap-2"><span>{b.service}</span> • <span className="text-yellow-500/80">{emp?.name}</span></div>
                                </div>
                                <button onClick={() => onDelete(b.id)} className="p-2 hover:bg-white/10 rounded-full text-white/20 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        )
                    })}</div>
                )}
            </div>
        </div>
    )
}

function BookingForm({ employees, services, onSubmit, isClient }: any) {
    const [cName, setCName] = useState('');
    const [cPhone, setCPhone] = useState('');
    const [bService, setBService] = useState('');
    const [bProf, setBProf] = useState('');
    const [bDate, setBDate] = useState('');
    const [bTime, setBTime] = useState('');

    const handleSubmit = () => {
        if (!cName || !bService || !bProf || !bDate || !bTime) return alert("Completa todos los campos");
        const dateObj = new Date(bDate + 'T' + bTime);
        onSubmit({ clientName: cName, clientPhone: cPhone, service: bService, professionalId: bProf, date: dateObj });
        setCName(''); setCPhone(''); setBDate(''); setBTime(''); setBService(''); setBProf('');
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="text-xs text-emerald-100/50 font-bold uppercase ml-2 mb-1 block">Tus Datos</label>
                <div className="space-y-3">
                    <input placeholder="Nombre Completo" className="input-modern bg-black/40 border-white/10 focus:bg-black/60 focus:border-yellow-500/50 py-4 px-5 rounded-2xl" value={cName} onChange={e => setCName(e.target.value)} />
                    <input placeholder="Teléfono" type="tel" className="input-modern bg-black/40 border-white/10 focus:bg-black/60 focus:border-yellow-500/50 py-4 px-5 rounded-2xl" value={cPhone} onChange={e => setCPhone(e.target.value)} />
                </div>
            </div>

            <div>
                <label className="text-xs text-emerald-100/50 font-bold uppercase ml-2 mb-1 block">¿Qué te harás hoy?</label>
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <select className="input-modern w-full appearance-none bg-black/40 border-white/10 py-4 px-5 rounded-2xl focus:border-yellow-500/50" value={bService} onChange={e => setBService(e.target.value)}><option value="">Servicio...</option>{services.map((s: ServiceItem) => <option key={s.id} value={s.name} className="bg-neutral-900">{s.name}</option>)}</select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">▼</div>
                    </div>
                    <div className="relative">
                        <select className="input-modern w-full appearance-none bg-black/40 border-white/10 py-4 px-5 rounded-2xl focus:border-yellow-500/50" value={bProf} onChange={e => setBProf(e.target.value)}><option value="">Especialista...</option>{employees.map((e: Employee) => <option key={e.id} value={e.id} className="bg-neutral-900">{e.name}</option>)}</select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">▼</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-emerald-100/50 font-bold uppercase ml-2 mb-1 block">Fecha</label>
                    <input type="date" className="input-modern calendar-fix w-full bg-white text-black font-bold py-4 px-4 rounded-2xl border-none focus:ring-2 focus:ring-yellow-500" value={bDate} onChange={e => setBDate(e.target.value)} />
                </div>
                <div>
                    <label className="text-xs text-emerald-100/50 font-bold uppercase ml-2 mb-1 block">Hora</label>
                    <input type="time" className="input-modern calendar-fix w-full bg-white text-black font-bold py-4 px-4 rounded-2xl border-none focus:ring-2 focus:ring-yellow-500" value={bTime} onChange={e => setBTime(e.target.value)} />
                </div>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} className="btn-primary w-full py-4 mt-4 flex justify-center gap-3 items-center text-sm uppercase tracking-widest shadow-xl shadow-yellow-600/20 hover:shadow-yellow-600/40">
                {isClient ? 'Confirmar Cita' : 'Agendar Reserva'} <CheckCircle2 className="w-5 h-5" />
            </motion.button>
        </div>
    )
}

function FinanceSection({ transactions, expenses, onAdd, onDelete, onReset }: any) {
    const [amt, setAmt] = useState(''); const [desc, setDesc] = useState(''); const [cat, setCat] = useState(EXPENSE_CATS[0]);
    const now = new Date(); const isCurrentMonth = (d: Date) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    const monthlyIncome = transactions.filter((t: any) => isCurrentMonth(t.date)).reduce((acc: number, t: any) => acc + t.price, 0);
    const monthlyExpenses = expenses.filter((e: any) => isCurrentMonth(e.date)).reduce((acc: number, e: any) => acc + e.amount, 0);
    const profit = monthlyIncome - monthlyExpenses;
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h2 className={`text-3xl text-yellow-500 ${playfair.className}`}>Finanzas: {now.toLocaleDateString('es-PE', { month: 'long' })}</h2>
                <button onClick={onReset} className="text-xs text-red-400 border border-red-500/30 px-3 py-1 rounded-full hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2"><RotateCcw className="w-3 h-3" /> Reset</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><StatCard label="Ingresos" val={monthlyIncome} icon={<ArrowDownCircle />} color="text-emerald-400" bg="bg-emerald-500/10" /><StatCard label="Gastos" val={monthlyExpenses} icon={<ArrowUpCircle />} color="text-rose-400" bg="bg-rose-500/10" /><StatCard label="Caja Neta" val={profit} icon={<Wallet />} color={profit >= 0 ? "text-white" : "text-red-400"} bg={profit >= 0 ? "bg-white/10" : "bg-red-500/10"} /></div>
            <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl h-fit"><h3 className="font-bold text-emerald-200 mb-4 flex items-center gap-2"><Plus className="w-5 h-5" /> Registrar Salida</h3><div className="space-y-4"><div><label className="text-xs font-bold text-white/50 uppercase ml-1 block mb-1">Concepto</label><select className="input-modern" value={cat} onChange={e => setCat(e.target.value)}>{EXPENSE_CATS.map(c => <option key={c} value={c} className="bg-[#0f2a24]">{c}</option>)}</select></div><div><label className="text-xs font-bold text-white/50 uppercase ml-1 block mb-1">Monto (S/.)</label><input type="number" placeholder="0.00" className="input-modern font-mono font-bold text-lg" value={amt} onChange={e => setAmt(e.target.value)} /></div><div><label className="text-xs font-bold text-white/50 uppercase ml-1 block mb-1">Nota (Opcional)</label><input type="text" placeholder="Ej. Pago recibo..." className="input-modern" value={desc} onChange={e => setDesc(e.target.value)} /></div><button onClick={() => { if (!amt) return; onAdd({ category: cat, amount: parseFloat(amt), description: desc }); setAmt(''); setDesc(''); }} className="btn-primary w-full py-4 mt-2 bg-rose-600 from-rose-600 to-rose-500 shadow-rose-900/30 text-white">Guardar Gasto</button></div></div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col max-h-[500px]"><h3 className="text-xs font-bold text-white/40 uppercase mb-4 sticky top-0">Historial (Mes Actual)</h3><div className="overflow-y-auto flex-1 custom-scrollbar space-y-2 pr-2">{[...expenses].filter((e: any) => isCurrentMonth(e.date)).sort((a: any, b: any) => b.date.getTime() - a.date.getTime()).map((exp: any) => (<div key={exp.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-colors group"><div><p className="font-bold text-rose-300">{exp.category}</p><p className="text-[10px] text-white/50 truncate w-32">{exp.description || exp.date.toLocaleDateString()}</p></div><div className="flex items-center gap-3"><span className="font-mono text-white font-bold">- S/. {exp.amount.toFixed(2)}</span><button onClick={() => onDelete(exp.id)} className="text-white/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button></div></div>))}</div></div>
            </div>
        </motion.div>
    );
}

function ReportSection({ employees, transactions, onUpdateComm }: any) {
    const [tab, setTab] = useState<'day' | 'week' | 'month'>('week'); const [offset, setOffset] = useState(0); const now = new Date();
    const getRange = () => { const d = new Date(now); d.setHours(0, 0, 0, 0); let start = new Date(d); let end = new Date(d); if (tab === 'day') { start.setDate(d.getDate() + offset); end = new Date(start); } else if (tab === 'week') { const currentDay = d.getDay(); const diffParsed = d.getDate() - currentDay + (currentDay === 0 ? -6 : 1) + (offset * 7); start.setDate(diffParsed); end = new Date(start); end.setDate(start.getDate() + 6); } else { start.setMonth(start.getMonth() + offset); start.setDate(1); end = new Date(start); end.setMonth(end.getMonth() + 1); end.setDate(0); } end.setHours(23, 59, 59, 999); return { start, end }; };
    const { start, end } = getRange();
    let rangeLabel = ""; if (tab === 'day') rangeLabel = start.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }); else if (tab === 'week') rangeLabel = `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString('es-PE', { month: 'short' })}`; else rangeLabel = start.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });

    const handleWhatsApp = (emp: Employee) => {
        // Calculate WEEKLY stats specifically for the report message, regardless of current tab view to match user preference
        const d = new Date(); d.setHours(0, 0, 0, 0);
        const currentDay = d.getDay();
        const diffParsed = d.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
        const weekStart = new Date(d); weekStart.setDate(diffParsed);
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);

        const empTrans = transactions.filter((t: any) => t.employeeId === emp.id && t.date >= weekStart && t.date <= weekEnd);
        const total = empTrans.reduce((acc: number, t: any) => acc + t.price, 0); const comm = Number(emp.commission) || 0; const pay = (total * comm) / 100;

        const weekLabel = `${weekStart.getDate()} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('es-PE', { month: 'short' })}`;

        const msg = `*Reporte Semanal MIVIS STUDIO* 💄\n\nHola ${emp.name},\nResumen de la semana: ${weekLabel}\n\n✅ *Servicios:* ${empTrans.length}\n💰 *Ventas Totales:* S/. ${total.toFixed(2)}\n📊 *Comisión:* ${comm}%\n\n💵 *Total a Pagar:* S/. ${pay.toFixed(2)}\n\nGracias por tu trabajo! ✨`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white space-y-6">
            <div className="flex justify-between items-center"><h2 className={`text-2xl text-yellow-500 ${playfair.className}`}>Reportes</h2><div className="flex bg-white/5 p-1 rounded-lg">{['day', 'week', 'month'].map((t: any) => (<button key={t} onClick={() => { setTab(t); setOffset(0) }} className={`px-3 py-1 text-xs uppercase font-bold rounded ${tab === t ? 'bg-emerald-500 text-black' : 'text-white/50'}`}>{t === 'day' ? 'Diario' : t === 'week' ? 'Semana' : 'Mes'}</button>))}</div></div>
            <div className="flex justify-center items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5"><button onClick={() => setOffset(offset - 1)} className="p-2 hover:bg-white/10 rounded-full"><ChevronRight className="rotate-180 w-5 h-5" /></button><span className="font-playfair text-xl capitalize min-w-[200px] text-center">{rangeLabel}</span><button onClick={() => setOffset(offset + 1)} className="p-2 hover:bg-white/10 rounded-full"><ChevronRight className="w-5 h-5" /></button></div>
            {tab === 'month' ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-4 bg-emerald-900/40 p-3 text-xs font-bold uppercase text-emerald-200/60 border-b border-emerald-500/10"> <div className="col-span-1">Colaborador</div> <div className="text-right">Ventas</div> <div className="text-right text-emerald-400">Pago (Com)</div> <div className="text-right text-yellow-500">Ganancia Local</div> </div>
                    <div className="divide-y divide-white/5">
                        {employees.map((emp: Employee) => { const empTrans = transactions.filter((t: any) => t.employeeId === emp.id && t.date >= start && t.date <= end); const totalGen = empTrans.reduce((acc: number, t: any) => acc + t.price, 0); const commValue = Number(emp.commission) || 0; const pay = (totalGen * commValue) / 100; const profit = totalGen - pay; return (<div key={emp.id} className="grid grid-cols-4 p-4 items-center hover:bg-white/5 transition-colors"><div className="flex items-center gap-2"><img src={emp.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.avatarSeed}`} className="w-8 h-8 rounded-full object-cover" /><div className="truncate text-sm font-bold">{emp.name}</div></div><div className="text-right font-mono text-sm text-white/70">{totalGen.toFixed(2)}</div><div className="text-right font-mono text-sm text-emerald-400">{pay.toFixed(2)}</div><div className="text-right font-mono text-sm text-yellow-500 font-bold">{profit.toFixed(2)}</div></div>) })}
                        <div className="grid grid-cols-4 p-4 bg-white/5 font-bold border-t border-white/10 mt-2"><div className="text-xs uppercase text-white/50">Total Mes</div><div className="text-right text-white">{employees.reduce((acc: number, emp: Employee) => acc + transactions.filter((t: any) => t.employeeId === emp.id && t.date >= start && t.date <= end).reduce((s: number, t: any) => s + t.price, 0), 0).toFixed(0)}</div><div className="text-right text-emerald-500">{employees.reduce((acc: number, emp: Employee) => acc + (transactions.filter((t: any) => t.employeeId === emp.id && t.date >= start && t.date <= end).reduce((s: number, t: any) => s + t.price, 0) * (Number(emp.commission) || 0) / 100), 0).toFixed(0)}</div><div className="text-right text-yellow-500">{employees.reduce((acc: number, emp: Employee) => { const total = transactions.filter((t: any) => t.employeeId === emp.id && t.date >= start && t.date <= end).reduce((s: number, t: any) => s + t.price, 0); const pay = (total * (Number(emp.commission) || 0) / 100); return acc + (total - pay); }, 0).toFixed(0)}</div></div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">{employees.map((emp: Employee) => {
                    const empTrans = transactions.filter((t: any) => t.employeeId === emp.id && t.date >= start && t.date <= end); const totalGen = empTrans.reduce((acc: number, t: any) => acc + t.price, 0); const commValue = emp.commission === '' ? 0 : Number(emp.commission); const payment = (totalGen * commValue) / 100; return (<div key={emp.id} className="bg-white/5 border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-yellow-500/30 transition-colors"><div className="flex items-center gap-3"><img src={emp.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.avatarSeed}`} className="w-10 h-10 object-cover rounded-full bg-[#1a3830]" /><div><p className="font-bold text-emerald-100">{emp.name}</p><p className="text-[10px] text-white/50 uppercase">{empTrans.length} Servicios</p></div></div><div className="flex items-center gap-4 justify-end">
                        <button onClick={() => handleWhatsApp(emp)} className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white p-2 rounded-full transition-all border border-green-500/30"><Send className="w-4 h-4" /></button>
                        <div className="text-right"><p className="text-[10px] text-white/40 uppercase font-bold">Generado</p><p className="font-mono text-emerald-200">S/. {totalGen}</p></div><div className="text-right"><p className="text-[10px] text-white/40 uppercase font-bold">% Comision</p><div className="flex items-center justify-end gap-1"><input type="text" className="w-10 bg-transparent border-b border-white/20 text-right font-bold text-yellow-500 focus:border-yellow-500 outline-none" value={emp.commission} onChange={(e) => onUpdateComm(emp.id, e.target.value)} /><span className="text-xs text-yellow-600">%</span></div></div><div className="text-right pl-4 border-l border-white/10"><p className="text-[10px] text-white/40 uppercase font-bold">A Pagar</p><p className="font-mono text-xl font-bold text-emerald-400">S/. {payment.toFixed(2)}</p></div></div></div>);
                })}</div>
            )}
        </motion.div>
    );
}

function StatCard({ label, val, icon, color, bg }: any) { return (<div className={`p-6 rounded-2xl border border-white/5 ${bg}`}><div className={`flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider ${color}`}>{icon} {label}</div><div className={`text-3xl font-mono font-bold ${color}`}>S/. {val.toFixed(2)}</div></div>); }
function NavBtn({ icon, label, active, onClick }: any) { return (<button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium ${active ? 'bg-emerald-900/80 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-emerald-950/30 border-white/5 text-white/40 hover:text-white hover:border-white/20'}`}>{icon}{label && <span className="hidden leading-none sm:inline">{label}</span>}</button>) }
function Modal({ children, onClose }: any) { return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a1f1a]/90 backdrop-blur-md" onClick={onClose}><motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-[#132f29] w-full max-w-sm rounded-[2rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-yellow-500/50 blur-[10px] rounded-full"></div>{children}</motion.div></div>) }
