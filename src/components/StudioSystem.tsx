"use client";

import { useState, useEffect } from 'react';
import {
    Users, Plus, Trash2, ChevronRight, DollarSign,
    TrendingUp, X, Settings, Wallet,
    ArrowDownCircle, ArrowUpCircle, Camera, RotateCcw,
    Calendar, Clock, CheckCircle2, Cloud, Lock, LogOut, Store, Send, Printer
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
type Transaction = { id: string; employeeId: string; serviceName: string; price: number; date: Date; paymentMethod?: string; }; // Added paymentMethod
type Booking = { id: string; clientName: string; clientPhone: string; service: string; professionalId: string; date: Date; status: 'confirmed' | 'pending'; paymentMethod?: string; }; // Added paymentMethod
type ServiceItem = { id: string; name: string; };

const EXPENSE_CATS = ["Pago Personal", "Luz", "Agua", "Internet", "Local", "Insumos", "Otros"];
const PAY_METHODS = ["EFECTIVO", "YAPE", "PLIN", "POS", "TARJETA"];

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
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
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
    const [transPayment, setTransPayment] = useState(PAY_METHODS[0]);
    const [isManaging, setIsManaging] = useState(false);
    const [newServName, setNewServName] = useState('');

    // Split Payment State
    const [isSplit, setIsSplit] = useState(false);
    const [splitParts, setSplitParts] = useState<{ method: string, amount: number }[]>([]);
    const [splitAmount, setSplitAmount] = useState('');

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

    const handleConfirmWhatsApp = (book: Booking) => {
        const msg = `Hola ${book.clientName}! 💅 Te escribimos de *Mivis Studio* para confirmar tu cita de hoy a las *${book.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}*. ¿Nos confirmas tu asistencia? ✨`;
        window.open(`https://wa.me/51${book.clientPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleDeleteService = async (id: string) => await deleteDoc(doc(db, "services", id));
    const handleTransaction = async () => {
        const totalP = parseFloat(manPrice);
        if (!selectedEmp || isNaN(totalP) || totalP <= 0) return;

        if (isSplit) {
            const currentTotal = splitParts.reduce((s, p) => s + p.amount, 0);
            if (Math.abs(currentTotal - totalP) > 0.1) return alert(`Los montos no coinciden. Faltan S/. ${(totalP - currentTotal).toFixed(2)}`);

            for (const part of splitParts) {
                await addDoc(collection(db, "transactions"), {
                    employeeId: selectedEmp.id,
                    serviceName: `${selService} (Part. ${part.method})`,
                    price: part.amount,
                    date: new Date(),
                    paymentMethod: part.method
                });
            }
        } else {
            await addDoc(collection(db, "transactions"), {
                employeeId: selectedEmp.id,
                serviceName: selService,
                price: totalP,
                date: new Date(),
                paymentMethod: transPayment
            });
        }

        setSelService(null);
        setManPrice('');
        setTransPayment(PAY_METHODS[0]);
        setIsSplit(false);
        setSplitParts([]);
        alert('Cobro registrado ☁️');
    };

    const addSplitPart = (method: string) => {
        const val = parseFloat(splitAmount);
        if (!val || val <= 0) return;
        setSplitParts([...splitParts, { method, amount: val }]);
        setSplitAmount('');
    };

    const removeSplitPart = (index: number) => {
        const n = [...splitParts];
        n.splice(index, 1);
        setSplitParts(n);
    };
    const handleUpdateCommission = async (id: string, val: string) => await updateDoc(doc(db, "employees", id), { commission: val });
    const handleDeleteBooking = async (id: string) => { if (confirm("¿Cancelar cita?")) await deleteDoc(doc(db, "bookings", id)); };
    const handleResetFinances = async () => {
        if (!confirm("⚠️ ¿ESTÁS SEGURA?\n\nEsto eliminará:\n- Todo el historial de cobros\n- Todas las citas\n- Todos los gastos\n\nLos empleados y servicios NO se borrarán.")) return;
        if (!confirm("⚠️ CONFIRMACIÓN FINAL\n\n¿Realmente deseas dejar el sistema en cero? Esta acción no se puede deshacer.")) return;

        try {
            // Delete Transactions
            const tQ = await getDocs(collection(db, "transactions"));
            tQ.forEach(async (d) => await deleteDoc(d.ref));

            // Delete Bookings
            const bQ = await getDocs(collection(db, "bookings"));
            bQ.forEach(async (d) => await deleteDoc(d.ref));

            // Delete Expenses
            const eQ = await getDocs(collection(db, "expenses"));
            eQ.forEach(async (d) => await deleteDoc(d.ref));

            alert("✨ Sistema reiniciado correctamente.\n¡Lista para un nuevo mes!");
            window.location.reload(); // Reload to refresh state cleanly
        } catch (e) {
            alert("Error al reiniciar. Intenta de nuevo.");
        }
    };

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
                        <BookingSection bookings={bookings} employees={employees} services={services} onAdd={handleBooking} onDelete={handleDeleteBooking} onSelect={setSelectedBooking} />
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

                                        <motion.div layoutId={emp.id} key={emp.id} onClick={() => { setSelectedEmp(emp); setSelService(null); setIsManaging(false); setTransPayment(PAY_METHODS[0]); setIsSplit(false); setSplitParts([]); }} className="group relative bg-white/5 border border-white/10 hover:border-yellow-500/50 rounded-2xl p-6 flex flex-col items-center gap-4 cursor-pointer backdrop-blur-sm transition-all hover:bg-white/10">
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

                            <div className="mt-8 pt-8 border-t border-white/10">
                                <h4 className="text-red-400 font-bold mb-2 text-center text-xs uppercase tracking-widest">Zona de Peligro</h4>
                                <button onClick={handleResetFinances} className="w-full border border-red-500/30 hover:bg-red-500/20 text-red-300 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs">
                                    <RotateCcw className="w-4 h-4" /> Reiniciar Mes (Borrar Historial)
                                </button>
                                <p className="text-[10px] text-white/30 text-center mt-2">Mantiene empleados y servicios. Solo borra cobros y citas.</p>
                            </div>
                        </Modal>
                    )}

                    {/* MODAL DETALLE DE CITA */}
                    {selectedBooking && (
                        <Modal onClose={() => setSelectedBooking(null)}>
                            <div className="text-center relative">
                                <h3 className={`${playfair.className} text-2xl text-yellow-500 mb-2`}>Detalle de Cita</h3>
                                {new Date().getTime() > selectedBooking.date.getTime() - 900000 && new Date().getTime() < selectedBooking.date.getTime() && (
                                    <div className="bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full inline-block mb-4 animate-pulse border border-red-500/50">
                                        ⚠️ ¡La cita es en 15 min!
                                    </div>
                                )}
                                <div className="space-y-6 text-left bg-black/20 p-6 rounded-2xl border border-white/5">
                                    <div>
                                        <p className="text-[10px] text-white/40 uppercase font-bold">Cliente</p>
                                        <p className="text-xl text-white font-medium">{selectedBooking.clientName}</p>
                                        <p className="text-sm text-emerald-400 font-mono">{selectedBooking.clientPhone}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] text-white/40 uppercase font-bold">Fecha</p>
                                            <p className="text-white">{selectedBooking.date.toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-white/40 uppercase font-bold">Hora</p>
                                            <p className="text-white text-lg font-bold text-yellow-500">{selectedBooking.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-white/40 uppercase font-bold">Servicio</p>
                                        <p className="text-white">{selectedBooking.service}</p>
                                        <p className="text-xs text-white/50">con {employees.find(e => e.id === selectedBooking.professionalId)?.name || 'Especialista'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-white/40 uppercase font-bold">Método de Pago Preferido</p>
                                        <div className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-md text-sm font-bold inline-block border border-yellow-500/20">
                                            {selectedBooking.paymentMethod || 'No especificado'}
                                        </div>
                                    </div>
                                </div>

                                <button onClick={() => handleConfirmWhatsApp(selectedBooking)} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold py-4 rounded-xl mt-6 flex items-center justify-center gap-2 shadow-lg transition-all">
                                    <Send className="w-5 h-5" /> Confirmar por WhatsApp
                                </button>

                                <button onClick={() => { handleDeleteBooking(selectedBooking.id); setSelectedBooking(null); }} className="w-full mt-3 py-3 text-red-400 text-xs hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20">
                                    Cancelar Cita
                                </button>
                            </div>
                        </Modal>
                    )}

                    {showAddModal && <Modal onClose={() => setShowAddModal(false)}><h3 className={`${playfair.className} text-2xl text-yellow-500 mb-6 text-center`}>Nuevo Talento</h3><div className="flex justify-center mb-6"><label className="relative w-24 h-24 rounded-full bg-black/40 border-2 border-dashed border-white/20 hover:border-yellow-500 cursor-pointer flex items-center justify-center overflow-hidden transition-colors group">{newEmpPhoto ? <img src={newEmpPhoto} className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-white/30 group-hover:text-yellow-500 transition-colors" />}<input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} /></label></div><div className="space-y-4"><input type="text" placeholder="Nombre" className="input-modern" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} /><input type="text" placeholder="Cargo" className="input-modern" value={newEmpRole} onChange={e => setNewEmpRole(e.target.value)} /><input type="number" placeholder="Comisión %" className="input-modern" value={newEmpComm} onChange={e => setNewEmpComm(e.target.value)} /></div><button onClick={handleCreateEmployee} className="btn-primary w-full py-4 mt-6">Crear</button></Modal>}
                    {selectedEmp && (
                        <Modal onClose={() => setSelectedEmp(null)}>
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10"><div className="flex items-center gap-3"><img src={selectedEmp.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedEmp.avatarSeed}`} className="w-12 h-12 object-cover rounded-full bg-[#1a3830]" /><div><h3 className={`${playfair.className} text-xl text-white`}>{selectedEmp.name}</h3></div></div><button onClick={() => setIsManaging(!isManaging)} className="p-2 text-emerald-400 hover:bg-white/5 rounded-full"><Settings className="w-5 h-5" /></button></div>
                            {!selService || isManaging ? (
                                <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">{isManaging && <div className="flex gap-2 mb-4"><input type="text" className="input-modern flex-1 text-sm py-2" placeholder="Nuevo Servicio..." value={newServName} onChange={e => setNewServName(e.target.value)} /><button onClick={handleCreateService} className="btn-primary px-4 py-2 text-xs">OK</button></div>}{services.map(s => <button key={s.id} onClick={() => !isManaging && setSelService(s.name)} className={`w-full text-left p-4 rounded-xl border flex justify-between items-center transition-all ${isManaging ? 'border-dashed border-white/20 text-white/50' : 'bg-white/5 border-white/5 hover:border-yellow-500 hover:bg-white/10 text-emerald-100'}`}>{s.name}{isManaging && <span onClick={(e) => { e.stopPropagation(); handleDeleteService(s.id) }} className="text-red-400 p-1"><Trash2 className="w-4 h-4" /></span>}</button>)}</div>
                            ) : (
                                <div className="flex flex-col items-center animate-in fade-in zoom-in-95">
                                    <button onClick={() => setSelService(null)} className="self-start text-xs text-emerald-400 mb-8 hover:underline">← Volver</button>
                                    <h4 className={`${playfair.className} text-2xl text-yellow-500 mb-6 text-center`}>{selService}</h4>
                                    <div className="relative w-full max-w-[180px] mb-8">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-2xl text-white/30 font-serif">S/.</span>
                                        <input autoFocus type="number" placeholder="0" className="w-full bg-transparent text-center text-5xl font-playfair text-white border-b-2 border-white/20 focus:border-yellow-500 outline-none pb-2" value={manPrice} onChange={e => setManPrice(e.target.value)} />
                                    </div>
                                    <div className="w-full mb-6 relative">
                                        <div className="flex justify-center mb-4">
                                            <button onClick={() => { setIsSplit(!isSplit); setSplitParts([]); }} className={`text-xs px-3 py-1 rounded-full border transition-all ${isSplit ? 'bg-yellow-500 text-black border-yellow-500 font-bold' : 'text-white/40 border-white/20 hover:border-white'}`}>
                                                🔀 Dividir Pago {isSplit && '(Activado)'}
                                            </button>
                                        </div>

                                        {isSplit ? (
                                            <div className="bg-black/20 p-4 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex justify-between text-xs text-white/50 mb-2 font-bold uppercase">
                                                    <span>Monto Total: S/. {manPrice || 0}</span>
                                                    <span className={`${(parseFloat(manPrice || '0') - splitParts.reduce((s, p) => s + p.amount, 0)) === 0 ? 'text-emerald-400' : 'text-red-400'}`}>Restante: S/. {(parseFloat(manPrice || '0') - splitParts.reduce((s, p) => s + p.amount, 0)).toFixed(2)}</span>
                                                </div>

                                                <div className="space-y-2 mb-4">
                                                    {splitParts.map((p, i) => (
                                                        <div key={i} className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg text-sm">
                                                            <span>{p.method}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono">S/. {p.amount}</span>
                                                                <button onClick={() => removeSplitPart(i)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex gap-2 mb-2">
                                                    <input type="number" placeholder="Monto Parcial" className="input-modern w-24 text-center py-1 text-sm font-mono" value={splitAmount} onChange={e => setSplitAmount(e.target.value)} />
                                                    <div className="flex-1 flex gap-1 overflow-x-auto custom-scrollbar pb-1">
                                                        {PAY_METHODS.map(pm => (
                                                            <button key={pm} onClick={() => addSplitPart(pm)} className="bg-emerald-900/40 border border-emerald-500/20 text-emerald-100 text-[10px] px-2 rounded hover:bg-emerald-500 hover:text-black whitespace-nowrap transition-colors">{pm}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <label className="text-xs text-white/40 uppercase font-bold block mb-2 text-center">Método de Pago</label>
                                                <div className="flex gap-2 justify-center flex-wrap">
                                                    {PAY_METHODS.map(pm => (
                                                        <button key={pm} onClick={() => setTransPayment(pm)} className={`px-3 py-1 rounded-full text-xs font-bold border ${transPayment === pm ? 'bg-yellow-500 text-black border-yellow-500' : 'text-white/40 border-white/10 hover:border-white/30'}`}>
                                                            {pm}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <button onClick={handleTransaction} disabled={isSplit && Math.abs(parseFloat(manPrice || '0') - splitParts.reduce((s, p) => s + p.amount, 0)) > 0.1} className="btn-primary w-full py-4 flex justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <DollarSign className="w-5 h-5" /> Cobrar
                                    </button>
                                </div>
                            )}
                        </Modal>
                    )}
                </AnimatePresence>
            </main>
            <style jsx global>{` .input-modern { @apply w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-yellow-500 transition-colors placeholder:text-white/20; } .btn-primary { @apply bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded-xl shadow-lg shadow-yellow-900/40 hover:scale-[1.02] transition-transform; } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-white/10 rounded-full; } .calendar-fix { color-scheme: dark; } `}</style></div >
    );
}

// --- SUB-COMPONENTES AUXILIARES ---
// (BookingSection, BookingForm, FinanceSection, etc. se mantienen igual pero integrados en el dashboard)
function BookingSection({ bookings, employees, services, onAdd, onDelete, onSelect }: any) {
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
                        // Alert Logic: Show red dot if appointment is within 15 minutes
                        const isSoon = new Date().getTime() > b.date.getTime() - 900000 && new Date().getTime() < b.date.getTime();

                        return (
                            <div key={b.id} onClick={() => onSelect(b)} className={`bg-white/5 border-l-4 p-4 rounded-r-xl flex justify-between items-center group cursor-pointer hover:bg-white/10 transition-colors ${isSoon ? 'border-l-red-500 bg-red-500/5' : 'border-l-yellow-600'}`}>
                                <div>
                                    <h4 className="font-bold text-white flex items-center gap-2">
                                        {b.clientName}
                                        {isSoon && <span className="animate-pulse w-2 h-2 rounded-full bg-red-500"></span>}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-emerald-400 mt-1"><Clock className="w-3 h-3" /> {b.date.toLocaleDateString()} - {b.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    <div className="text-[10px] text-white/40 mt-1 flex gap-2"><span>{b.service}</span> • <span className="text-yellow-500/80">{emp?.name}</span></div>
                                </div>
                                <div className="text-white/20 group-hover:text-yellow-500 transition-colors"><ChevronRight className="w-5 h-5" /></div>
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
    const [bPayment, setBPayment] = useState(PAY_METHODS[0]);

    const handleSubmit = () => {
        if (!cName || !bService || !bProf || !bDate || !bTime) return alert("Completa todos los campos");
        const dateObj = new Date(bDate + 'T' + bTime);
        onSubmit({ clientName: cName, clientPhone: cPhone, service: bService, professionalId: bProf, date: dateObj, paymentMethod: bPayment });
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
                <label className="text-xs text-emerald-100/50 font-bold uppercase ml-2 mb-1 block">¿Cómo prefieres pagar?</label>
                <div className="flex gap-2 flex-wrap">
                    {PAY_METHODS.map(pm => (
                        <button key={pm} onClick={() => setBPayment(pm)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${bPayment === pm ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-black/40 border-white/10 text-white/50 hover:bg-white/10'}`}>
                            {pm}
                        </button>
                    ))}
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
    const [selectedRepEmp, setSelectedRepEmp] = useState<Employee | null>(null); // State for Employee Details in Reports

    const getRange = () => { const d = new Date(now); d.setHours(0, 0, 0, 0); let start = new Date(d); let end = new Date(d); if (tab === 'day') { start.setDate(d.getDate() + offset); end = new Date(start); } else if (tab === 'week') { const currentDay = d.getDay(); const diffParsed = d.getDate() - currentDay + (currentDay === 0 ? -6 : 1) + (offset * 7); start.setDate(diffParsed); end = new Date(start); end.setDate(start.getDate() + 6); } else { start.setMonth(start.getMonth() + offset); start.setDate(1); end = new Date(start); end.setMonth(end.getMonth() + 1); end.setDate(0); } end.setHours(23, 59, 59, 999); return { start, end }; };
    const { start, end } = getRange();
    let rangeLabel = ""; if (tab === 'day') rangeLabel = start.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }); else if (tab === 'week') rangeLabel = `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString('es-PE', { month: 'short' })}`; else rangeLabel = start.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });

    // --- REPORTES WHATSAPP DETALLADOS ---
    const sendDetailedWhatsApp = (title: string, trans: Transaction[], empName: string, commission: number | string) => {
        if (trans.length === 0) return alert("No hay datos para reportar.");

        const total = trans.reduce((acc, t) => acc + t.price, 0);
        const commVal = Number(commission) || 0;
        const pay = (total * commVal) / 100;

        let msg = `*REPORTE ${title.toUpperCase()} - MIVIS STUDIO* 💄\n`;
        msg += `👩‍🎨 Colaborador: *${empName}*\n`;
        msg += `📅 Fecha: ${new Date().toLocaleDateString()}\n\n`;
        msg += `*DETALLE DE SERVICIOS:*\n`;

        trans.forEach(t => {
            msg += `• ${t.serviceName} - S/.${t.price} (${t.paymentMethod || 'Efec.'})\n`;
        });

        msg += `\n-----------------------\n`;
        msg += `✅ *Total Generado:* S/. ${total.toFixed(2)}\n`;
        msg += `📊 *Comisión (${commVal}%):* S/. ${pay.toFixed(2)}\n`;
        msg += `🚀 *A Pagar:* S/. ${pay.toFixed(2)}`;

        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    // --- REPORTE PDF MENSUAL ---
    const generateMonthlyPDF = () => {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        let htmlContent = `
        <html><head><title>Reporte Mensual - Mivis Studio</title><style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; }
            h1 { color: #0f2a24; text-align: center; border-bottom: 2px solid #eab308; padding-bottom: 10px; }
            .summary { background: #f0fdf4; padding: 20px; border-radius: 10px; margin-bottom: 30px; border: 1px solid #bbf7d0; }
            .emp-card { margin-bottom: 30px; border: 1px solid #eee; page-break-inside: avoid; }
            .emp-header { background: #0f2a24; color: white; padding: 10px 15px; font-weight: bold; display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #eee; text-align: left; padding: 8px; }
            td { padding: 8px; border-bottom: 1px solid #eee; }
            .total-row { font-weight: bold; background: #fffbeb; }
        </style></head><body>
        <h1>Reporte Mensual: ${monthStart.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }).toUpperCase()}</h1>
        `;

        employees.forEach((emp: Employee) => {
            const empTrans = transactions.filter((t: any) => t.employeeId === emp.id && t.date >= monthStart && t.date <= monthEnd);
            if (empTrans.length === 0) return;

            const total = empTrans.reduce((s: number, t: any) => s + t.price, 0);
            const comm = Number(emp.commission) || 0;
            const pay = (total * comm) / 100;

            htmlContent += `
            <div class="emp-card">
                <div class="emp-header"><span>${emp.name} (${emp.role})</span> <span>Comisión: ${comm}%</span></div>
                <table>
                    <thead><tr><th>Fecha</th><th>Servicio</th><th>Pago</th><th>Precio</th></tr></thead>
                    <tbody>
            `;

            empTrans.sort((a: any, b: any) => a.date - b.date).forEach((t: any) => {
                htmlContent += `<tr><td>${t.date.toLocaleDateString()} ${t.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td><td>${t.serviceName}</td><td>${t.paymentMethod || '-'}</td><td>S/. ${t.price}</td></tr>`;
            });

            htmlContent += `
                    <tr class="total-row"><td colspan="3" style="text-align:right">TOTAL GENERADO:</td><td>S/. ${total.toFixed(2)}</td></tr>
                    <tr class="total-row"><td colspan="3" style="text-align:right">A PAGAR (${comm}%):</td><td>S/. ${pay.toFixed(2)}</td></tr>
                    </tbody>
                </table>
            </div>`;
        });

        htmlContent += `<script>window.print();</script></body></html>`;

        const printWindow = window.open('', '', 'width=900,height=800');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white space-y-6">
            {/* MODAL DETALLADO DEL EMPLEADO */}
            <AnimatePresence>
                {selectedRepEmp && (
                    <Modal onClose={() => setSelectedRepEmp(null)}>
                        <h3 className={`${playfair.className} text-2xl text-yellow-500 text-center mb-1`}>{selectedRepEmp.name}</h3>
                        <p className="text-xs text-white/40 text-center mb-6 uppercase tracking-widest">Historial de Servicios</p>

                        <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                            {/* HOY */}
                            <ReportListBlock title="Hoy" transactions={transactions.filter((t: any) => t.date >= new Date(new Date().setHours(0, 0, 0, 0)) && t.employeeId === selectedRepEmp.id)} onSend={() => sendDetailedWhatsApp("Diario", transactions.filter((t: any) => t.date >= new Date(new Date().setHours(0, 0, 0, 0)) && t.employeeId === selectedRepEmp.id), selectedRepEmp.name, selectedRepEmp.commission)} />
                            {/* ESTA SEMANA */}
                            <ReportListBlock title="Esta Semana" transactions={transactions.filter((t: any) => {
                                const d = new Date(); d.setHours(0, 0, 0, 0); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                                const ws = new Date(d); ws.setDate(diff); const we = new Date(ws); we.setDate(ws.getDate() + 7);
                                return t.date >= ws && t.date <= we && t.employeeId === selectedRepEmp.id;
                            })} onSend={() => sendDetailedWhatsApp("Semanal", transactions.filter((t: any) => {
                                const d = new Date(); d.setHours(0, 0, 0, 0); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                                const ws = new Date(d); ws.setDate(diff); const we = new Date(ws); we.setDate(ws.getDate() + 7);
                                return t.date >= ws && t.date <= we && t.employeeId === selectedRepEmp.id;
                            }), selectedRepEmp.name, selectedRepEmp.commission)} />
                            {/* ESTE MES */}
                            <ReportListBlock title="Este Mes" transactions={transactions.filter((t: any) => {
                                const d = new Date(); return t.date.getMonth() === d.getMonth() && t.date.getFullYear() === d.getFullYear() && t.employeeId === selectedRepEmp.id;
                            })} onSend={() => sendDetailedWhatsApp("Mensual", transactions.filter((t: any) => {
                                const d = new Date(); return t.date.getMonth() === d.getMonth() && t.date.getFullYear() === d.getFullYear() && t.employeeId === selectedRepEmp.id;
                            }), selectedRepEmp.name, selectedRepEmp.commission)} />
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            <div className="flex justify-between items-center">
                <h2 className={`text-2xl text-yellow-500 ${playfair.className}`}>Reportes</h2>
                <div className="flex gap-2">
                    <button onClick={generateMonthlyPDF} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/5"><Printer className="w-4 h-4" /> PDF Mensual</button>
                    <div className="flex bg-white/5 p-1 rounded-lg">{['day', 'week', 'month'].map((t: any) => (<button key={t} onClick={() => { setTab(t); setOffset(0) }} className={`px-3 py-1 text-xs uppercase font-bold rounded ${tab === t ? 'bg-emerald-500 text-black' : 'text-white/50'}`}>{t === 'day' ? 'Diario' : t === 'week' ? 'Semana' : 'Mes'}</button>))}</div>
                </div>
            </div>

            <div className="flex justify-center items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5"><button onClick={() => setOffset(offset - 1)} className="p-2 hover:bg-white/10 rounded-full"><ChevronRight className="rotate-180 w-5 h-5" /></button><span className="font-playfair text-xl capitalize min-w-[200px] text-center">{rangeLabel}</span><button onClick={() => setOffset(offset + 1)} className="p-2 hover:bg-white/10 rounded-full"><ChevronRight className="w-5 h-5" /></button></div>
            {tab === 'month' ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-4 bg-emerald-900/40 p-3 text-xs font-bold uppercase text-emerald-200/60 border-b border-emerald-500/10"> <div className="col-span-1">Colaborador</div> <div className="text-right">Ventas</div> <div className="text-right text-emerald-400">Pago (Com)</div> <div className="text-right text-yellow-500">Ganancia Local</div> </div>
                    <div className="divide-y divide-white/5">
                        {employees.map((emp: Employee) => { const empTrans = transactions.filter((t: any) => t.employeeId === emp.id && t.date >= start && t.date <= end); const totalGen = empTrans.reduce((acc: number, t: any) => acc + t.price, 0); const commValue = Number(emp.commission) || 0; const pay = (totalGen * commValue) / 100; const profit = totalGen - pay; return (<div key={emp.id} onClick={() => setSelectedRepEmp(emp)} className="grid grid-cols-4 p-4 items-center hover:bg-white/5 transition-colors cursor-pointer"><div className="flex items-center gap-2"><img src={emp.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.avatarSeed}`} className="w-8 h-8 rounded-full object-cover" /><div className="truncate text-sm font-bold">{emp.name}</div></div><div className="text-right font-mono text-sm text-white/70">{totalGen.toFixed(2)}</div><div className="text-right font-mono text-sm text-emerald-400">{pay.toFixed(2)}</div><div className="text-right font-mono text-sm text-yellow-500 font-bold">{profit.toFixed(2)}</div></div>) })}
                        <div className="grid grid-cols-4 p-4 bg-white/5 font-bold border-t border-white/10 mt-2"><div className="text-xs uppercase text-white/50">Total Mes</div><div className="text-right text-white">{employees.reduce((acc: number, emp: Employee) => acc + transactions.filter((t: any) => t.employeeId === emp.id && t.date >= start && t.date <= end).reduce((s: number, t: any) => s + t.price, 0), 0).toFixed(0)}</div><div className="text-right text-emerald-500">{employees.reduce((acc: number, emp: Employee) => acc + (transactions.filter((t: any) => t.employeeId === emp.id && t.date >= start && t.date <= end).reduce((s: number, t: any) => s + t.price, 0) * (Number(emp.commission) || 0) / 100), 0).toFixed(0)}</div><div className="text-right text-yellow-500">{employees.reduce((acc: number, emp: Employee) => { const total = transactions.filter((t: any) => t.employeeId === emp.id && t.date >= start && t.date <= end).reduce((s: number, t: any) => s + t.price, 0); const pay = (total * (Number(emp.commission) || 0) / 100); return acc + (total - pay); }, 0).toFixed(0)}</div></div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">{employees.map((emp: Employee) => {
                    const empTrans = transactions.filter((t: any) => t.employeeId === emp.id && t.date >= start && t.date <= end); const totalGen = empTrans.reduce((acc: number, t: any) => acc + t.price, 0); const commValue = emp.commission === '' ? 0 : Number(emp.commission); const payment = (totalGen * commValue) / 100; return (<div key={emp.id} onClick={() => setSelectedRepEmp(emp)} className="bg-white/5 border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-yellow-500/30 transition-colors cursor-pointer"><div className="flex items-center gap-3"><img src={emp.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.avatarSeed}`} className="w-10 h-10 object-cover rounded-full bg-[#1a3830]" /><div><p className="font-bold text-emerald-100">{emp.name}</p><p className="text-[10px] text-white/50 uppercase">{empTrans.length} Servicios</p></div></div><div className="flex items-center gap-4 justify-end">
                        <button onClick={(e) => { e.stopPropagation(); sendDetailedWhatsApp("General", empTrans, emp.name, commValue); }} className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white p-2 rounded-full transition-all border border-green-500/30"><Send className="w-4 h-4" /></button>
                        <div className="text-right"><p className="text-[10px] text-white/40 uppercase font-bold">Generado</p><p className="font-mono text-emerald-200">S/. {totalGen}</p></div><div className="text-right"><p className="text-[10px] text-white/40 uppercase font-bold">% Comision</p><div className="flex items-center justify-end gap-1"><input type="text" onClick={e => e.stopPropagation()} className="w-10 bg-transparent border-b border-white/20 text-right font-bold text-yellow-500 focus:border-yellow-500 outline-none" value={emp.commission} onChange={(e) => onUpdateComm(emp.id, e.target.value)} /><span className="text-xs text-yellow-600">%</span></div></div><div className="text-right pl-4 border-l border-white/10"><p className="text-[10px] text-white/40 uppercase font-bold">A Pagar</p><p className="font-mono text-xl font-bold text-emerald-400">S/. {payment.toFixed(2)}</p></div></div></div>);
                })}</div>
            )}
        </motion.div>
    );
}

function ReportListBlock({ title, transactions, onSend }: any) {
    if (transactions.length === 0) return null;
    return (
        <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
            <h4 className="bg-emerald-900/30 p-2 text-[10px] font-bold uppercase text-emerald-400 tracking-wider flex justify-between items-center px-4">
                <span>{title}</span>
                <div className="flex items-center gap-4">
                    <span>S/. {transactions.reduce((s: number, t: any) => s + t.price, 0).toFixed(2)}</span>
                    <button onClick={onSend} className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white p-1 rounded-full transition-all"><Send className="w-3 h-3" /></button>
                </div>
            </h4>
            <div className="divide-y divide-white/5">
                {transactions.sort((a: any, b: any) => b.date - a.date).map((t: any) => (
                    <div key={t.id} className="p-3 flex justify-between items-center text-sm">
                        <div>
                            <p className="text-white font-medium">{t.serviceName || 'Servicio'}</p>
                            <p className="text-[10px] text-white/40">{t.date.toLocaleString()} • <span className="text-yellow-500/80">{t.paymentMethod || 'Efectivo'}</span></p>
                        </div>
                        <span className="font-mono text-emerald-200">S/. {t.price}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function StatCard({ label, val, icon, color, bg }: any) { return (<div className={`p-6 rounded-2xl border border-white/5 ${bg}`}><div className={`flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider ${color}`}>{icon} {label}</div><div className={`text-3xl font-mono font-bold ${color}`}>S/. {val.toFixed(2)}</div></div>); }
function NavBtn({ icon, label, active, onClick }: any) { return (<button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium ${active ? 'bg-emerald-900/80 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-emerald-950/30 border-white/5 text-white/40 hover:text-white hover:border-white/20'}`}>{icon}{label && <span className="hidden leading-none sm:inline">{label}</span>}</button>) }
function Modal({ children, onClose }: any) { return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a1f1a]/90 backdrop-blur-md" onClick={onClose}><motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-[#132f29] w-full max-w-sm rounded-[2rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-yellow-500/50 blur-[10px] rounded-full"></div>{children}</motion.div></div>) }
