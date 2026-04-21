/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  HardHat, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Clock, 
  FileText, 
  ChevronRight,
  Power,
  Library,
  Activity,
  Calendar,
  Settings,
  ArrowLeft,
  Check,
  Search,
  ShieldCheck,
  Cpu,
  Users,
  Bolt,
  Wrench,
  ChevronLeft,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './lib/firebase';
import { signInAnonymously, signOut } from 'firebase/auth';
import { doc, setDoc, updateDoc, onSnapshot, collection, query, orderBy, getDocs, deleteDoc, getDocFromServer, where, Timestamp } from 'firebase/firestore';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { MaintenanceTask, UserProfile, ROLE_PINS, GROUNDING_LISTS, PROFILES_LIST, BANCO_DE_DADOS_CRONOGRAMA, SafetyAlert } from './types';
import { WeatherWidget } from './components/WeatherWidget';
import { ChecklistForm } from './components/ChecklistForm';
import { PDFService } from './services/PDFService';
import { compressImage } from './lib/imageUtils';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loginStep, setLoginStep] = useState<'profile' | 'pin'>('profile');
  const [selectedProfile, setSelectedProfile] = useState<typeof PROFILES_LIST[0] | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showChecklist, setShowChecklist] = useState<string | null>(null);
  const [isAuditMode, setIsAuditMode] = useState(false);
  const [dataAtual, setDataAtual] = useState('20/04/2026');
  const [completedChecklists, setCompletedChecklists] = useState<any[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [isFirestoreOffline, setIsFirestoreOffline] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [resetStatus, setResetStatus] = useState('PRONTO');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [showSafetyForm, setShowSafetyForm] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SafetyAlert | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'alert' | 'error' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState<number | null>(null);

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // PWA Install Logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  // Connection Test
  async function testConnection() {
    try {
      await getDocFromServer(doc(db, 'system_test', 'connection'));
      setIsFirestoreOffline(false);
    } catch (error: any) {
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded' || error.message?.includes('client is offline')) {
        setIsFirestoreOffline(true);
      } else {
        setIsFirestoreOffline(false);
      }
    }
  }

  useEffect(() => {
    testConnection();
    const interval = setInterval(testConnection, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const [localGrounding, setLocalGrounding] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('statusAterramentos') || '{}');
    } catch { return {}; }
  });

  const [liberacoes, setLiberacoes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    
    // Sincronização em tempo real das liberações do dia
    const q = query(collection(db, 'releases'), where('data', '==', dataAtual));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const status: Record<string, boolean> = {};
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data();
          if (data.liberado && user.teamNumber === data.teamId) {
            setToast({ message: `EQUIPE ${data.teamId} LIBERADA PELA ENGENHARIA`, type: 'success' });
            
            // Push Notification de Sistema
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Equipe Liberada! ⚡", {
                body: `Engenharia autorizou o início das atividades para a Equipe 0${data.teamId}.`,
                icon: 'https://picsum.photos/seed/alupar/192/192',
                badge: 'https://picsum.photos/seed/alupar/96/96',
                tag: 'release-notification'
              });
            }
          }
        }
      });
      snapshot.forEach(doc => {
        const data = doc.data();
        status[data.teamId] = data.liberado;
      });
      setLiberacoes(status);
    });

    return () => unsubscribe();
  }, [user, dataAtual]);

  useEffect(() => {
    const restoreSession = async () => {
      const savedUserStr = localStorage.getItem('userLogadoData');
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          await signInAnonymously(auth);
          setUser(savedUser);
        } catch (e) {
          console.error("Auth restoration failed", e);
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Safety check: ensure profile exists in DB before starting listeners to avoid rules errors
    const verifyProfileAndStart = async () => {
      try {
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await getDocFromServer(profileRef);
        
        if (!profileSnap.exists()) {
          console.warn("Perfil não encontrado no Firestore. Aguardando sincronização...");
          return;
        }

        let q;
        const isManager = user.role === 'admin' || user.role === 'engineer' || user.role === 'coordinator';
        
        if (isManager) {
          q = query(collection(db, 'tasks'));
        } else {
          // If teamNumber is not yet set, don't start the listener to avoid rules errors
          if (user.teamNumber === undefined || user.teamNumber === null) {
            console.warn("Número da equipe não definido. Pulando listener de tarefas.");
            return;
          }
          q = query(collection(db, 'tasks'), where('assignedTeams', 'array-contains', user.teamNumber));
        }

        console.log(`Iniciando listener de Tasks para: ${user.name} (${user.role})`);
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const taskList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MaintenanceTask));
          // Client-side sort
          taskList.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
          console.log(`Tasks listener: ${taskList.length} tarefas encontradas.`);
          
          if (taskList.length === 0 && isManager) {
            // Seed logic...
            const seedTasks = async () => {
              try {
                const initialTasks = [
                  {
                    title: 'Obras AT6-01 e AT6-02 (Abril 2026)',
                    startDate: '2026-04-20T08:00:00Z',
                    endDate: '2026-04-24T18:00:00Z',
                    spans: 'Torres 01 a 19',
                    assignedTeams: [1, 2, 5],
                    isEngineeringApproved: false,
                    engineeringApprovals: {},
                    groundingConfirmed: { '1': false, '2': false, '5': false },
                    status: 'scheduled' as const,
                    createdAt: Timestamp.now()
                  }
                ];
                for (const t of initialTasks) {
                  const taskId = t.title.substring(0, 15).replace(/\s/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '_2026';
                  await setDoc(doc(db, 'tasks', taskId), t);
                }
              } catch (err) {
                console.error("Falha ao criar tarefas iniciais:", err);
              }
            };
            seedTasks();
          }
          setTasks(taskList);
        }, (err) => {
          console.error("Erro no listener de Tasks:", err);
        });

        return unsubscribe;
      } catch (e) {
        console.error("Erro ao verificar perfil:", e);
      }
    };

    const cleanupPromise = verifyProfileAndStart();
    return () => {
      cleanupPromise.then(unsub => unsub && unsub());
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    let q;
    const isManager = user.role === 'admin' || user.role === 'engineer' || user.role === 'coordinator';
    
    if (isManager) {
      q = query(collection(db, 'checklists'));
    } else {
      q = query(collection(db, 'checklists'), where('authorUid', '==', user.uid));
    }

    console.log(`Iniciando listener de Checklists para: ${user.name} (${user.role})`);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Client-side sort by timestamp desc
      docs.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setCompletedChecklists(docs);
    }, (err) => {
      console.error("Erro no listener de Checklists:", err);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    let q;
    const isSafetyManager = user.role === 'admin' || user.role === 'engineer' || user.role === 'tst' || user.role === 'coordinator';
    
    if (isSafetyManager) {
      q = query(collection(db, 'safety_alerts'));
    } else {
      q = query(collection(db, 'safety_alerts'), where('authorUid', '==', user.uid));
    }

    console.log(`Iniciando listener de Alertas para: ${user.name} (${user.role})`);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SafetyAlert));
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.severity === 'Alta' || data.severity === 'Crítica') {
            setToast({ message: `ALERTA DE SEGURANÇA ${data.severity.toUpperCase()}: ${data.equipmentTag}`, type: 'alert' });
          }
        }
      });
      // Client-side sort by timestamp desc
      docs.sort((a, b) => {
        const timeA = (a.timestamp as any)?.seconds || 0;
        const timeB = (b.timestamp as any)?.seconds || 0;
        return timeB - timeA;
      });
      setSafetyAlerts(docs);
    }, (err) => {
      console.error("Erro no listener de Alertas:", err);
    });
    return unsubscribe;
  }, [user]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProfile) return;
    
    setError('');
    const targetPin = selectedProfile.pin;

    if (pin === targetPin) {
      try {
        console.log("Iniciando autenticação anônima...");
        const cred = await signInAnonymously(auth);
        
        const roleData = ROLE_PINS[pin];
        const userProfile: UserProfile = {
          uid: cred.user.uid,
          pin,
          role: roleData.role,
          name: roleData.name,
          ...(roleData.team !== undefined && { teamNumber: roleData.team })
        };

        // Sync to Firestore - Only minimal data
        await setDoc(doc(db, 'profiles', cred.user.uid), {
          uid: userProfile.uid,
          role: userProfile.role,
          name: userProfile.name,
          ...(userProfile.teamNumber !== undefined && { teamNumber: userProfile.teamNumber })
        });
        
        localStorage.setItem('userLogadoData', JSON.stringify(userProfile));
        setUser(userProfile);
        setPin('');

        // Request Notifications Permission
        if ("Notification" in window) {
          Notification.requestPermission().then(permission => {
            if (permission === "granted") {
              console.log("Notificações de sistema ativadas!");
            }
          });
        }
      } catch (err: any) {
        console.error("Erro no login:", err);
        // If it's a permission error or field error, we still allow local login for continuity
        const roleData = ROLE_PINS[pin];
        const userProfile: UserProfile = {
          uid: `local_${Date.now()}`,
          pin,
          role: roleData.role,
          name: roleData.name,
          ...(roleData.team !== undefined && { teamNumber: roleData.team })
        };
        setUser(userProfile);
      }
    } else if (pin.length === 4) {
      setError('PIN Incorreto');
      setTimeout(() => setPin(''), 1000);
    }
  };

  // Auto-submit handle
  useEffect(() => {
    if (pin.length === 4 && loginStep === 'pin') {
      handleLogin();
    }
  }, [pin]);

  const handleLogout = async () => {
    localStorage.removeItem('userLogadoData');
    await signOut(auth);
    setUser(null);
    setLoginStep('profile');
    setSelectedProfile(null);
  };

  const toggleTower = (tower: string) => {
    setLocalGrounding(prev => {
      const newState = { ...prev, [tower]: !prev[tower] };
      const required = GROUNDING_LISTS[user?.teamNumber!] || [];
      const allChecked = required.every(t => newState[t]);
      if (allChecked && tasks[0] && !tasks[0].groundingConfirmed[user?.teamNumber!]) {
        updateDoc(doc(db, 'tasks', tasks[0].id), { [`groundingConfirmed.${user?.teamNumber}`]: true });
      }
      return newState;
    });
  };

  const handleEngineeringApproval = async (teamId: number) => {
    try {
      const releaseId = `${dataAtual.replace(/\//g, '')}_team${teamId}`;
      await setDoc(doc(db, 'releases', releaseId), {
        data: dataAtual,
        teamId: teamId,
        liberado: true,
        autorizadoPor: user?.name,
        timestamp: Timestamp.now()
      });
      console.log(`Equipe ${teamId} liberada com sucesso.`);
    } catch (err) {
      console.error("Erro ao liberar equipe:", err);
      alert("Falha ao liberar equipe no servidor.");
    }
  };

  const handleGroundingConfirm = async (taskId: string, teamId: number) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const updatePath = `groundingConfirmed.${teamId}`;
      await updateDoc(taskRef, {
        [updatePath]: true,
        [`groundingTimestamp_${teamId}`]: Timestamp.now()
      });
      console.log(`Equipe ${teamId} confirmou aterramento.`);
    } catch (err) {
      console.error("Erro ao confirmar aterramento:", err);
      alert("Erro ao confirmar aterramento.");
    }
  };

  const submitChecklist = async (data: any) => {
    if (isAuditMode) { setIsAuditMode(false); setShowChecklist(null); return; }
    const teamNum = user?.teamNumber || 0;
    
    // Create copy and remove string timestamp from form data if present
    const cleanData = { ...data };
    delete cleanData.timestamp;

    await setDoc(doc(db, 'checklists', `chk_${Date.now()}`), {
      taskId: selectedTask?.id || 'manual',
      teamId: teamNum,
      authorUid: user.uid, // Track authorship for secure listing
      pmoType: showChecklist,
      tag: (selectedTask as any)?.TAG || selectedTask?.tag,
      ...cleanData,
      timestamp: Timestamp.now() // Official server-side timestamp
    });
    setShowChecklist(null);
    setSelectedTask(null);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-alupar-dark"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-alupar-blue"></div></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-alupar-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background elements for depth */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-alupar-blue/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl z-10"
        >
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="flex items-center gap-3"
            >
              <h1 className="text-5xl font-black text-white italic tracking-tighter">ALUPAR</h1>
            </motion.div>
            <div className="h-[2px] w-12 bg-alupar-blue mt-4" />
            <p className="text-blue-200/40 text-[10px] uppercase font-black tracking-[0.5em] mt-4">Gestão de Manutenção</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl">
            <AnimatePresence mode="wait">
              {loginStep === 'profile' ? (
                <motion.div 
                  key="profile-grid"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  {PROFILES_LIST.map((p) => {
                    const Icon = (p as any).icon || ShieldCheck;
                    return (
                      <button 
                        key={p.id} 
                        onClick={() => { setSelectedProfile(p); setLoginStep('pin'); }} 
                        className="group flex flex-col items-center p-6 bg-white/5 border border-white/5 rounded-[32px] hover:bg-alupar-blue transition-all duration-300 hover:scale-105 active:scale-95"
                      >
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                          <Icon size={24} className="text-white group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-[9px] font-black text-white/60 group-hover:text-white uppercase text-center leading-tight">{p.label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div 
                  key="pin-entry"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8 max-w-sm mx-auto"
                >
                  <button 
                    onClick={() => { setLoginStep('profile'); setError(''); setPin(''); }} 
                    className="flex items-center gap-2 text-[10px] uppercase font-black text-white/40 hover:text-alupar-blue transition-colors group mb-6"
                  >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Alterar Perfil
                  </button>

                  <div className="text-center">
                     <div className="w-24 h-24 bg-alupar-blue/20 border border-alupar-blue/30 rounded-[32px] mx-auto mb-6 flex items-center justify-center text-alupar-blue shadow-2xl shadow-alupar-blue/20">
                        {selectedProfile && React.createElement((selectedProfile as any).icon || ShieldCheck, { size: 48, className: "text-white" })}
                     </div>
                     <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">{selectedProfile?.label}</h2>
                     <p className="text-[10px] text-white/30 font-bold uppercase mt-2 tracking-widest italic">Acesso Restrito ao Sistema</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="relative">
                      <input 
                        type="password" 
                        maxLength={4} 
                        autoFocus 
                        value={pin} 
                        onChange={(e) => setPin(e.target.value)} 
                        placeholder="••••" 
                        className={`w-full text-center text-6xl font-mono py-8 bg-white/5 rounded-[32px] border-2 transition-all outline-none text-white ${error ? 'border-safety-red text-safety-red animate-shake' : 'border-white/10 focus:border-alupar-blue focus:bg-white/10'}`} 
                      />
                      {error && (
                        <p className="text-[10px] text-safety-red font-black uppercase text-center mt-4 animate-pulse">{error}</p>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => handleLogin()} 
                      disabled={pin.length < 4}
                      className={`w-full py-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-sm transition-all shadow-2xl ${pin.length === 4 ? 'bg-alupar-blue text-white shadow-alupar-blue/40 hover:scale-[1.02] active:scale-95' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                    >
                      AUTENTICAR
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <p className="text-center text-white/20 text-[9px] font-bold uppercase mt-10 tracking-[0.2em]">
            © 2026 ALUPAR INVESTIMENTOS S.A. • INFRAESTRUTURA DE ENERGIA
          </p>
        </motion.div>
      </div>
    );
  }

  const handleSafetySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const severity = formData.get('severity') as any;
    const newAlert = {
      severity,
      equipmentTag: formData.get('tag') as string,
      description: formData.get('description') as string,
      photo: photoPreview,
      authorUid: user.uid, // Track authorship for secure listing
      reporterName: user.name,
      reporterUid: user.uid,
      timestamp: Timestamp.now(),
      status: 'pending' as const
    };

    try {
      await setDoc(doc(db, 'safety_alerts', `alert_${Date.now()}`), newAlert);
      setShowSafetyForm(false);
      setPhotoPreview(null);
      setToast({ message: "Alerta de segurança enviado com sucesso", type: 'success' });
    } catch (err) {
      console.error("Erro ao enviar alerta:", err);
      alert("Erro ao enviar alerta de segurança.");
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 800, 0.7);
      setPhotoPreview(compressed);
    }
  };

  const handleApproveChecklist = async (checklistId: string) => {
    try {
      await updateDoc(doc(db, 'checklists', checklistId), {
        status: 'approved',
        approvedBy: user?.name,
        approvedAt: Timestamp.now()
      });
      setToast({ message: "Checklist aprovado com sucesso", type: 'success' });
    } catch (err) {
      console.error("Erro ao aprovar checklist:", err);
      setToast({ message: "Erro ao aprovar checklist", type: 'error' });
    }
  };

  const filteredChecklists = completedChecklists.filter(c => {
    const matchesSearch = c.tag.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.pmoType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = filterTeam ? c.teamId === filterTeam : true;
    return matchesSearch && matchesTeam;
  });

  const handleGlobalReset = async () => {
    if (!user || user.role !== 'admin') return;
    setIsResetting(true);
    setResetStatus('ZERANDO...');
    
    try {
      // 1. Clear Checklists
      const checklistsSnap = await getDocs(collection(db, 'checklists'));
      for (const docSnap of checklistsSnap.docs) {
        await deleteDoc(doc(db, 'checklists', docSnap.id));
      }

      // 2. Clear Releases (locks teams)
      const releasesSnap = await getDocs(collection(db, 'releases'));
      for (const docSnap of releasesSnap.docs) {
        await deleteDoc(doc(db, 'releases', docSnap.id));
      }

      // 3. Clear Safety Alerts
      const alertsSnap = await getDocs(collection(db, 'safety_alerts'));
      for (const docSnap of alertsSnap.docs) {
        await deleteDoc(doc(db, 'safety_alerts', docSnap.id));
      }

      setToast({ message: "DADOS DE TESTES ZERADOS COM SUCESSO", type: 'success' });
      setShowResetConfirm(false);
    } catch (err) {
      console.error("Erro ao zerar dados:", err);
      setToast({ message: "ERRO AO ZERAR DADOS DO SISTEMA", type: 'error' });
    } finally {
      setIsResetting(false);
      setResetStatus('PRONTO');
    }
  };

  const isEng = user.role === 'engineer' || user.role === 'admin' || user.role === 'coordinator';

  const abrirChecklist = (task: any, teamNum: number) => {
    setSelectedTask({ ...task, teamId: teamNum } as any);
    setShowChecklist(task["DESCRIÇÃO TECNICA"] || task.pmoType || task.type || "PMO");
  };

  // Stats Logic for Módulo 3
  const dashboardStats = {
    checklistsByTeam: [1, 2, 3, 4, 5].map(team => ({
      name: `EQP 0${team}`,
      total: completedChecklists.filter(c => c.teamId === team).length
    })),
    safetyBySeverity: [
      { name: 'Baixa', value: safetyAlerts.filter(s => s.severity === 'Baixa').length, color: '#10b981' },
      { name: 'Média', value: safetyAlerts.filter(s => s.severity === 'Média').length, color: '#f59e0b' },
      { name: 'Alta', value: safetyAlerts.filter(s => s.severity === 'Alta').length, color: '#ef4444' },
      { name: 'Crítica', value: safetyAlerts.filter(s => s.severity === 'Crítica').length, color: '#7f1d1d' },
    ].filter(s => s.value > 0),
    totalTasks: BANCO_DE_DADOS_CRONOGRAMA.filter(i => i.DATA === dataAtual).length,
    completedToday: completedChecklists.filter(c => {
      const date = c.timestamp instanceof Timestamp ? c.timestamp.toDate() : new Date(c.timestamp);
      return date.toLocaleDateString('pt-BR') === dataAtual;
    }).length
  };

  return (
    <div className="flex h-screen bg-bg-body font-sans text-text-dark overflow-hidden flex-col">
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[240px] bg-alupar-dark text-white p-5 flex flex-col border-r border-black/30">
          <div className="text-xl font-black italic mb-10 tracking-widest uppercase">ALUPAR</div>
          <nav className="flex-1 space-y-1">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-2 rounded text-[11px] font-bold uppercase ${activeTab === 'dashboard' ? 'bg-alupar-blue' : 'opacity-60'}`}><Activity size={16} /> Dashboard</button>
            <button onClick={() => setActiveTab('liberacao')} className={`w-full flex items-center gap-3 px-4 py-2 rounded text-[11px] font-bold uppercase ${activeTab === 'liberacao' ? 'bg-alupar-blue' : 'opacity-60'}`}><Shield size={16} /> Liberação</button>
            {user.role === 'team' && <button onClick={() => setActiveTab('execucao')} className={`w-full flex items-center gap-3 px-4 py-2 rounded text-[11px] font-bold uppercase ${activeTab === 'execucao' ? 'bg-alupar-blue' : 'opacity-60'}`}><HardHat size={16} /> Execução</button>}
            {isEng && <button onClick={() => setActiveTab('relatorios')} className={`w-full flex items-center gap-3 px-4 py-2 rounded text-[11px] font-bold uppercase ${activeTab === 'relatorios' ? 'bg-alupar-blue' : 'opacity-60'}`}><FileText size={16} /> Relatórios</button>}
            <button onClick={() => setShowSafetyForm(true)} className="w-full flex items-center gap-3 px-4 py-2 rounded text-[11px] font-bold uppercase bg-safety-red text-white mt-4"><AlertTriangle size={16} /> Alerta de Seg.</button>
          </nav>
          <div className="mt-auto space-y-2 p-4 bg-black/20 rounded">
            <p className="text-[10px] font-black uppercase opacity-40">{user.name}</p>
            {user.role === 'admin' && (
              <button 
                onClick={() => setShowResetConfirm(true)} 
                className="w-full py-2.5 bg-amber-400/10 text-amber-400 text-[10px] font-black rounded-lg flex items-center justify-center gap-2 uppercase hover:bg-amber-400/20 transition-all border border-amber-400/30 group shadow-lg shadow-amber-400/5"
              >
                <RotateCcw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                Zerar Testes
              </button>
            )}
            <button onClick={handleLogout} className="w-full py-2 bg-red-500/20 text-red-500 text-[9px] font-black rounded uppercase">Sair</button>
          </div>
        </aside>
        <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
          <header className="flex justify-between items-center bg-white p-4 rounded-xl border">
            <div><h2 className="text-sm font-black uppercase text-alupar-dark">Centro de Controle - Rio Novo</h2><p className="text-[10px] opacity-40 uppercase font-black">{dataAtual}</p></div>
            <WeatherWidget />
          </header>
          <div className="flex-1">
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="hd-card border-b-4 border-alupar-blue p-4">
                    <span className="text-[9px] font-black opacity-40 uppercase">Eficiência Diária</span>
                    <p className="text-2xl font-black uppercase text-alupar-blue">
                      {dashboardStats.totalTasks > 0 ? Math.round((dashboardStats.completedToday / dashboardStats.totalTasks) * 100) : 0}%
                    </p>
                  </div>
                  <div className="hd-card border-b-4 border-safety-green p-4">
                    <span className="text-[9px] font-black opacity-40 uppercase">Checklists Enviados</span>
                    <p className="text-2xl font-black uppercase">{completedChecklists.length}</p>
                  </div>
                  <div className="hd-card border-b-4 border-safety-red p-4">
                    <span className="text-[9px] font-black opacity-40 uppercase">Alertas Ativos</span>
                    <p className="text-2xl font-black uppercase">{safetyAlerts.filter(s => s.status === 'pending').length}</p>
                  </div>
                  <div className="hd-card border-b-4 border-gray-400 p-4">
                    <span className="text-[9px] font-black opacity-40 uppercase">Ativos Monitorados</span>
                    <p className="text-2xl font-black uppercase">181</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="hd-card p-6 min-h-[350px] flex flex-col">
                    <h3 className="text-[10px] font-black uppercase mb-6 flex items-center gap-2">
                      <Activity size={14} className="text-alupar-blue" />
                      Produção por Equipe (Acumulado)
                    </h3>
                    <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashboardStats.checklistsByTeam}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#001f3f', border: 'none', borderRadius: '12px', padding: '12px' }}
                            itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                          />
                          <Bar dataKey="total" fill="#003566" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="hd-card p-6 min-h-[350px] flex flex-col">
                    <h3 className="text-[10px] font-black uppercase mb-6 flex items-center gap-2">
                      <Shield size={14} className="text-safety-red" />
                      Severidade dos Alertas
                    </h3>
                    <div className="flex-1 w-full flex items-center justify-center">
                      {dashboardStats.safetyBySeverity.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={dashboardStats.safetyBySeverity}
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {dashboardStats.safetyBySeverity.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center opacity-20">
                          <ShieldCheck size={48} className="mx-auto mb-2" />
                          <p className="text-[10px] font-black uppercase">Nenhum alerta registrado</p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {dashboardStats.safetyBySeverity.map(s => (
                        <div key={s.name} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                          <span className="text-[9px] font-black uppercase opacity-60">{s.name}: {s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="hd-card min-h-[300px]">
                  <h3 className="hd-card-header flex justify-between items-center">
                    Checklists de Hoje ({dataAtual})
                    <span className="text-[9px] px-2 py-1 bg-alupar-blue/10 text-alupar-blue rounded">Tempo Real</span>
                  </h3>
                  <div className="p-4 space-y-2">
                    {BANCO_DE_DADOS_CRONOGRAMA.filter(i => i.DATA === dataAtual).map((item, id) => {
                      const isDone = completedChecklists.some(c => c.tag === item.TAG);
                      return (
                        <div key={id} className={`flex p-4 border rounded items-center justify-between transition-all ${isDone ? 'bg-safety-green/5 border-safety-green/20' : 'bg-gray-50/50'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isDone ? 'bg-safety-green text-white' : 'bg-gray-200 text-gray-400'}`}>
                              <Check size={12} />
                            </div>
                            <div>
                              <div className="font-bold text-[11px] uppercase">{item.TAG}</div>
                              <div className="text-[9px] opacity-40 uppercase font-bold">{item["DESCRIÇÃO TECNICA"]}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] font-black opacity-30 uppercase">Equipe 0{item.EQUIPE}</div>
                            {isDone && <div className="text-[8px] font-black text-safety-green uppercase mt-1">Concluído</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'execucao' && (
              <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                <div className="hd-card p-6 bg-alupar-dark text-white">
                  <h3 className="text-sm font-black uppercase mb-4 flex items-center gap-2">
                    <ShieldCheck className="text-safety-green" size={20} />
                    Status de Liberação - Equipe 0{user.teamNumber}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${liberacoes[user.teamNumber!] ? 'bg-safety-green text-white' : 'bg-safety-red text-white'}`}>
                      {liberacoes[user.teamNumber!] ? 'LIBERADA PELA ENGENHARIA' : 'AGUARDANDO LIBERAÇÃO'}
                    </div>
                    {liberacoes[user.teamNumber!] && (
                      <div className="text-[10px] font-bold opacity-60 uppercase flex items-center gap-2">
                        <Check size={14} className="text-safety-green" />
                        Pode iniciar as atividades
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {BANCO_DE_DADOS_CRONOGRAMA.filter(i => i.DATA === dataAtual && String(i.EQUIPE) === String(user.teamNumber)).map((item, id) => {
                    const taskInDb = tasks.find(t => t.assignedTeams.includes(user.teamNumber!));
                    const isGroundingDone = taskInDb?.groundingConfirmed?.[user.teamNumber!] || false;

                    return (
                      <div key={id} className="hd-card overflow-hidden group">
                        <div className="p-6">
                           <h4 className="font-black text-sm uppercase mb-4">{item.TAG}</h4>
                           <div className="space-y-4">
                              <button 
                                onClick={() => handleGroundingConfirm(taskInDb?.id || 'main_task', user.teamNumber!)}
                                disabled={isGroundingDone}
                                className={`w-full p-4 rounded-xl flex items-center justify-between border-2 transition-all ${isGroundingDone ? 'bg-safety-green/10 border-safety-green text-safety-green' : 'border-dashed border-gray-200 hover:border-alupar-blue group-hover:bg-gray-50'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isGroundingDone ? 'bg-safety-green text-white' : 'bg-gray-100'}`}>
                                    <Zap size={16} />
                                  </div>
                                  <span className="text-[10px] font-black uppercase italic">Confirmar Aterramento</span>
                                </div>
                                {isGroundingDone && <Check size={16} />}
                              </button>

                              <button 
                                onClick={() => abrirChecklist(item, user.teamNumber!)}
                                disabled={!liberacoes[user.teamNumber!] || !isGroundingDone}
                                className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${(!liberacoes[user.teamNumber!] || !isGroundingDone) ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' : 'bg-alupar-blue text-white shadow-lg shadow-alupar-blue/20 hover:scale-[1.02] active:scale-95'}`}
                              >
                                {completedChecklists.some(c => c.tag === item.TAG) ? 'Atualizar Checklist' : 'Iniciar Checklist PMO'}
                              </button>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {activeTab === 'liberacao' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in zoom-in duration-500">
                <div className="hd-card bg-alupar-dark text-white p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black italic text-alupar-blue uppercase tracking-tighter">Auditoria de Segurança</h3>
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Controle de Liberação de Equipes</p>
                    </div>
                    <Shield size={32} className="text-alupar-blue opacity-50" />
                  </div>
                  
                  <div className="space-y-3">
                    {BANCO_DE_DADOS_CRONOGRAMA.map((i, id) => (
                      <button 
                        key={id} 
                        onClick={() => { setIsAuditMode(true); abrirChecklist(i, 0); }} 
                        className="w-full flex items-center justify-between p-4 border border-white/5 rounded-xl uppercase text-[10px] font-black hover:bg-white/5 hover:border-alupar-blue transition-all group"
                      >
                        <div className="flex items-center gap-3">
                           <span className="opacity-40">{id + 1}</span>
                           <span>{i.TAG}</span>
                        </div>
                        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all text-alupar-blue" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(num => {
                    const isLiberada = liberacoes[num] || false;
                    const taskInDb = tasks.find(t => t.assignedTeams.includes(num));
                    const isGroundingDone = taskInDb?.groundingConfirmed?.[num] || false;
                    const canRelease = isGroundingDone || num === 3 || num === 4; // Exceção para Proteção/Disjuntor se aplicar

                    return (
                      <div key={num} className={`hd-card p-6 border-l-4 transition-all ${isLiberada ? 'border-l-safety-green' : isGroundingDone ? 'border-l-alupar-blue shadow-lg' : 'border-l-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-black uppercase italic">Equipe 0{num}</p>
                              {isGroundingDone && <Zap size={14} className="text-alupar-blue animate-pulse" title="Aterramento Confirmado" />}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${isGroundingDone ? 'bg-alupar-blue/10 text-alupar-blue' : 'bg-gray-100 text-gray-400'}`}>
                                {isGroundingDone ? 'Aterramento OK' : 'Aguardando Aterramento'}
                              </span>
                              {isLiberada && <span className="text-[8px] font-black px-2 py-0.5 bg-safety-green/10 text-safety-green rounded uppercase italic">Liberado pela Engenharia</span>}
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => handleEngineeringApproval(num)} 
                            disabled={isLiberada || !canRelease}
                            className={`px-8 py-3 font-black text-[10px] rounded-xl uppercase transition-all shadow-lg ${isLiberada ? 'bg-safety-green text-white shadow-safety-green/20' : !canRelease ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none' : 'bg-alupar-blue text-white shadow-alupar-blue/20 hover:scale-105 active:scale-95'}`}
                          >
                            {isLiberada ? 'Liberada' : isGroundingDone ? 'Liberar Equipe' : 'Bloqueado'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {activeTab === 'relatorios' && (
              <div className="space-y-6 animate-in slide-in-from-right duration-500">
                <div className="hd-card p-6 flex flex-wrap gap-4 items-center justify-between bg-alupar-dark text-white border-none shadow-alupar-blue/10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-alupar-blue rounded-2xl">
                      <FileText size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase italic tracking-tighter">Central de Relatórios</h3>
                      <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Base de Dados de Manutenção</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-1 max-w-md mx-4">
                    <div className="relative w-full">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                      <input 
                        type="text" 
                        placeholder="BUSCAR POR TAG OU TIPO..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/10 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-[10px] font-black uppercase outline-none focus:border-alupar-blue transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setFilterTeam(null)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${!filterTeam ? 'bg-alupar-blue text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                    >
                      GERAL
                    </button>
                    {[1, 2, 3, 4, 5].map(t => (
                      <button 
                        key={t} 
                        onClick={() => setFilterTeam(t)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${filterTeam === t ? 'bg-alupar-blue text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                      >
                        EQP 0{t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {filteredChecklists.length > 0 ? (
                    filteredChecklists.map(c => (
                      <div key={c.id} className="hd-card group flex flex-col md:flex-row items-start md:items-center justify-between p-6 hover:border-alupar-blue transition-all gap-4">
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center transition-all ${c.status === 'approved' ? 'bg-safety-green/10 text-safety-green' : 'bg-alupar-blue/5 text-alupar-blue group-hover:bg-alupar-blue group-hover:text-white'}`}>
                            {c.status === 'approved' ? <ShieldCheck size={28} /> : <FileText size={28} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-black text-sm uppercase tracking-tight">{c.tag}</h4>
                              {c.status === 'approved' && (
                                <span className="text-[8px] font-black bg-safety-green text-white px-2 py-0.5 rounded uppercase italic">Aprovado pelo Eng.</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-[9px] px-3 py-1 bg-gray-100 rounded-lg text-gray-600 font-black uppercase tracking-tight">{c.pmoType}</span>
                              <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase">
                                <Users size={12} />
                                EQUIPE 0{c.teamId}
                              </div>
                              <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase border-l pl-3">
                                <Calendar size={12} />
                                {c.timestamp instanceof Timestamp ? c.timestamp.toDate().toLocaleString('pt-BR') : new Date(c.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto">
                          {isEng && c.status !== 'approved' && (
                            <button 
                              onClick={() => handleApproveChecklist(c.id)}
                              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-safety-green/10 text-safety-green text-[10px] font-black px-6 py-4 rounded-2xl hover:bg-safety-green hover:text-white transition-all active:scale-95 border border-safety-green/20"
                            >
                              <CheckCircle2 size={16} />
                              APROVAR
                            </button>
                          )}
                          <button 
                            onClick={() => PDFService.generatePMO(c.pmoType, c, c.tag)} 
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-alupar-dark text-white text-[10px] font-black px-8 py-4 rounded-2xl hover:bg-alupar-blue transition-all shadow-xl active:scale-95"
                          >
                            <FileText size={16} />
                            EXPORTAR PDF
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="hd-card py-32 text-center opacity-20">
                      <Library size={80} className="mx-auto mb-6" />
                      <p className="text-xl font-black uppercase tracking-widest italic">Nenhum registro encontrado</p>
                      <p className="text-[10px] font-bold uppercase mt-2">Ajuste os filtros ou verifique a conexão</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      {showChecklist && <ChecklistForm type={showChecklist} taskId={selectedTask?.id} onSubmit={submitChecklist} onCancel={() => setShowChecklist(null)} />}
      
      {showResetConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-alupar-dark border border-white/10 rounded-[32px] p-8 text-center"
          >
            <div className="w-20 h-20 bg-safety-red/20 text-safety-red rounded-[24px] flex items-center justify-center mx-auto mb-6">
              <Bolt size={40} className="animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">Zerar Dados de Testes?</h3>
            <p className="text-[10px] text-white/40 font-bold uppercase leading-relaxed mb-8">
              Esta ação irá apagar todos os checklists, alertas e liberações de hoje. As estruturas e perfis não serão afetados.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleGlobalReset()}
                disabled={isResetting}
                className="w-full py-4 bg-safety-red text-white text-[11px] font-black uppercase rounded-2xl shadow-xl shadow-safety-red/20 active:scale-95 disabled:opacity-50 transition-all"
              >
                {isResetting ? 'LIMPANDO BANCO...' : 'CONFIRMAR E LIMPAR TUDO'}
              </button>
              <button 
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="w-full py-4 bg-white/5 text-white text-[11px] font-black uppercase rounded-2xl hover:bg-white/10 transition-all"
              >
                CANCELAR
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showSafetyForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in slide-in-from-bottom duration-300">
            <div className="bg-safety-red p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} />
                <h3 className="font-black uppercase tracking-tight">Reportar Alerta de Segurança</h3>
              </div>
              <button onClick={() => setShowSafetyForm(false)} className="opacity-60 hover:opacity-100 transition-opacity"><ArrowLeft size={20} /></button>
            </div>
            
            <form onSubmit={handleSafetySubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 mb-1 block">Severidade</label>
                  <select name="severity" required className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-safety-red transition-all font-bold text-sm">
                    <option value="Baixa">BAIXA</option>
                    <option value="Média">MÉDIA</option>
                    <option value="Alta">ALTA</option>
                    <option value="Crítica">CRÍTICA (PARALISA OBRATORIAMENTE)</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 mb-1 block">TAG / Equipamento</label>
                  <input name="tag" type="text" required placeholder="Ex: RNAT1-SD5-01" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-safety-red transition-all font-bold text-sm uppercase" />
                </div>
                
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 mb-1 block">Descrição do Desvio</label>
                  <textarea name="description" required rows={3} placeholder="Descreva o que foi identificado..." className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-safety-red transition-all font-bold text-sm" />
                </div>
                
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50/50 hover:bg-gray-50 hover:border-safety-red/30 transition-all cursor-pointer relative overflow-hidden group">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-32 object-cover rounded-xl" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-center">
                      <Zap size={32} className="mx-auto text-gray-300 group-hover:text-safety-red transition-colors" />
                      <p className="text-[10px] font-black uppercase text-gray-400 mt-2">Anexar Foto da Evidência</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowSafetyForm(false)} className="flex-1 py-4 text-[10px] font-black uppercase border rounded-xl hover:bg-gray-50 transition-all">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 text-[10px] font-black uppercase bg-safety-red text-white rounded-xl shadow-lg shadow-safety-red/20 active:scale-95 transition-all">Enviar Alerta Agora</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, x: '-50%', y: 20 }}
            className={`fixed bottom-8 left-1/2 z-[100] min-w-[320px] p-1 rounded-3xl shadow-2xl backdrop-blur-xl ${
              toast.type === 'success' ? 'bg-safety-green/90' : 
              toast.type === 'alert' ? 'bg-safety-red/90' : 
              'bg-gray-800/90'
            }`}
          >
            <div className="flex items-center gap-4 px-4 py-3 text-white">
              <div className="bg-white/20 p-2 rounded-xl">
                {toast.type === 'success' ? <CheckCircle2 size={24} /> : 
                 toast.type === 'alert' ? <AlertTriangle size={24} /> : 
                 <Activity size={24} />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{toast.message}</p>
              </div>
              <button onClick={() => setToast(null)} className="bg-white/20 hover:bg-white/40 w-8 h-8 flex items-center justify-center rounded-full text-lg leading-none transition-all">×</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
