import React from 'react';
import { Database as DBRef, ref, onValue, set } from 'firebase/database';
import { ChevronDown, ChevronUp, Plus, Trash2, User, Users, Truck, ArrowUpDown, Calendar, Phone, MapPin, CreditCard, Tag, Edit2, Save, X, Check, Map } from 'lucide-react';
import { GeneralData, GeneralItem, Employee, Supplier, Client } from '../types';
import { generateId, formatCurrency } from '../utils';

interface GeneralDataAppProps {
  db: DBRef | null;
}

const createInitialState = (): GeneralData => ({
  clients: [],
  suppliers: [],
  employees: []
});

export const GeneralDataApp: React.FC<GeneralDataAppProps> = ({ db }) => {
  const [data, setData] = React.useState<GeneralData>(createInitialState());
  const [loading, setLoading] = React.useState(true);
  
  // Accordion State
  const [openSection, setOpenSection] = React.useState<string | null>('employees');

  // Load Data
  React.useEffect(() => {
    if (db) {
      setLoading(true);
      const dataRef = ref(db, 'general_data');
      const unsubscribe = onValue(dataRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          setData({
            clients: val.clients || [],
            suppliers: val.suppliers || [],
            employees: val.employees || []
          });
        } else {
          setData(createInitialState());
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      const saved = localStorage.getItem('general_data');
      if (saved) {
        try { setData(JSON.parse(saved)); } catch (e) { setData(createInitialState()); }
      }
      setLoading(false);
    }
  }, [db]);

  const saveData = (newData: GeneralData) => {
    if (db) {
      set(ref(db, 'general_data'), newData);
    } else {
      setData(newData);
      localStorage.setItem('general_data', JSON.stringify(newData));
    }
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 overflow-y-auto custom-scrollbar transition-colors duration-300">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest text-center sm:text-left mb-6">Datos Generales</h2>

        {loading ? (
            <div className="text-cyan-500 p-8 animate-pulse text-center">Cargando Datos...</div>
        ) : (
            <div className="space-y-6">
                <EmployeeSection 
                    items={data.employees}
                    isOpen={openSection === 'employees'}
                    onToggle={() => toggleSection('employees')}
                    onUpdate={(items) => saveData({ ...data, employees: items })}
                />
                
                <SupplierSection 
                    items={data.suppliers}
                    isOpen={openSection === 'suppliers'}
                    onToggle={() => toggleSection('suppliers')}
                    onUpdate={(items) => saveData({ ...data, suppliers: items })}
                />

                <ClientSection 
                    items={data.clients} 
                    isOpen={openSection === 'clients'}
                    onToggle={() => toggleSection('clients')}
                    onUpdate={(items) => saveData({ ...data, clients: items })}
                />
            </div>
        )}
      </div>
    </div>
  );
};

// --- EMPLOYEE SECTION ---

interface EmployeeSectionProps {
    items: Employee[];
    isOpen: boolean;
    onToggle: () => void;
    onUpdate: (items: Employee[]) => void;
}

const EmployeeSection: React.FC<EmployeeSectionProps> = ({ items, isOpen, onToggle, onUpdate }) => {
    // Form State for New Entry
    const [formData, setFormData] = React.useState({
        firstName: '', lastName: '', dni: '', cuil: '',
        address: '', startDate: '', birthDate: '', phone: ''
    });

    // Editing State
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editForm, setEditForm] = React.useState<Employee | null>(null);

    // Sort State
    const [sortConfig, setSortConfig] = React.useState<{ key: 'lastName' | 'startDate' | null, direction: 'asc' | 'desc' }>({
        key: 'lastName', direction: 'asc'
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const newEmployee: Employee = {
            id: generateId(),
            ...formData
        };
        onUpdate([...items, newEmployee]);
        setFormData({
            firstName: '', lastName: '', dni: '', cuil: '',
            address: '', startDate: '', birthDate: '', phone: ''
        });
    };

    const startEditing = (emp: Employee) => {
        setEditingId(emp.id);
        setEditForm({ ...emp });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm(null);
    };

    const saveEditing = () => {
        if (!editForm) return;
        const updatedList = items.map(i => i.id === editForm.id ? editForm : i);
        onUpdate(updatedList);
        setEditingId(null);
        setEditForm(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("¿Eliminar empleado?")) {
            onUpdate(items.filter(i => i.id !== id));
        }
    };

    const handleSort = (key: 'lastName' | 'startDate') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedItems = React.useMemo(() => {
        let sortable = [...items];
        if (sortConfig.key) {
            sortable.sort((a, b) => {
                let valA = a[sortConfig.key!].toLowerCase();
                let valB = b[sortConfig.key!].toLowerCase();
                
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortable;
    }, [items, sortConfig]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const InputCell = ({ val, onChange, type = "text" }: { val: string, onChange: (v: string) => void, type?: string }) => (
        <input 
            type={type}
            value={val}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-amber-500/50 rounded px-2 py-1 text-sm text-amber-700 dark:text-amber-100 focus:outline-none focus:border-amber-400"
        />
    );

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-xl border ${isOpen ? 'border-amber-500/50' : 'border-slate-200 dark:border-slate-800'} overflow-hidden transition-all shadow-lg`}>
            <button 
                onClick={onToggle}
                className={`w-full flex items-center justify-between p-5 ${isOpen ? 'bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'} transition-colors`}
            >
                <div className="flex items-center gap-3">
                    <User className="text-amber-500 dark:text-amber-400" size={24} />
                    <span className={`text-lg font-bold ${isOpen ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>Empleados</span>
                    <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700">
                        {items.length}
                    </span>
                </div>
                {isOpen ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
            </button>

            {isOpen && (
                <div className="p-5 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
                    
                    {/* ADD FORM */}
                    <form onSubmit={handleAdd} className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
                        <h3 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase mb-3">Nuevo Empleado</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <input required placeholder="Nombre" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-white focus:border-amber-500 focus:outline-none" />
                            <input required placeholder="Apellido" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-white focus:border-amber-500 focus:outline-none" />
                            <input placeholder="DNI" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-white focus:border-amber-500 focus:outline-none" />
                            <input placeholder="CUIL" value={formData.cuil} onChange={e => setFormData({...formData, cuil: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-white focus:border-amber-500 focus:outline-none" />
                            <input placeholder="Domicilio" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-white focus:border-amber-500 focus:outline-none" />
                            <input placeholder="Teléfono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-white focus:border-amber-500 focus:outline-none" />
                            <div className="relative">
                                <span className="text-[10px] text-slate-500 absolute -top-1.5 left-2 bg-slate-50 dark:bg-slate-900 px-1">F. Nacimiento</span>
                                <input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-500 dark:text-slate-400 focus:text-slate-900 dark:focus:text-white focus:border-amber-500 focus:outline-none" />
                            </div>
                            <div className="relative">
                                <span className="text-[10px] text-slate-500 absolute -top-1.5 left-2 bg-slate-50 dark:bg-slate-900 px-1">F. Ingreso</span>
                                <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-500 dark:text-slate-400 focus:text-slate-900 dark:focus:text-white focus:border-amber-500 focus:outline-none" />
                            </div>
                        </div>
                        <button type="submit" className="mt-3 w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <Plus size={16} /> Agregar
                        </button>
                    </form>

                    {/* TABLE */}
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-500 uppercase">
                                    <th className="p-3 min-w-[150px] cursor-pointer hover:text-amber-500" onClick={() => handleSort('lastName')}>Apellido y Nombre <ArrowUpDown size={12} className="inline"/></th>
                                    <th className="p-3 min-w-[100px]">DNI / CUIL</th>
                                    <th className="p-3 min-w-[150px]">Domicilio</th>
                                    <th className="p-3 min-w-[120px]">Teléfono</th>
                                    <th className="p-3 min-w-[120px] cursor-pointer hover:text-amber-500" onClick={() => handleSort('startDate')}>Ingreso <ArrowUpDown size={12} className="inline"/></th>
                                    <th className="p-3 min-w-[120px]">Nacimiento</th>
                                    <th className="p-3 w-20 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sortedItems.map(emp => {
                                    const isEditing = editingId === emp.id;
                                    return (
                                        <tr key={emp.id} className="bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            {isEditing && editForm ? (
                                                <>
                                                    <td className="p-2 space-y-1">
                                                        <InputCell val={editForm.lastName} onChange={v => setEditForm({...editForm, lastName: v})} />
                                                        <InputCell val={editForm.firstName} onChange={v => setEditForm({...editForm, firstName: v})} />
                                                    </td>
                                                    <td className="p-2 space-y-1">
                                                        <InputCell val={editForm.dni} onChange={v => setEditForm({...editForm, dni: v})} />
                                                        <InputCell val={editForm.cuil} onChange={v => setEditForm({...editForm, cuil: v})} />
                                                    </td>
                                                    <td className="p-2"><InputCell val={editForm.address} onChange={v => setEditForm({...editForm, address: v})} /></td>
                                                    <td className="p-2"><InputCell val={editForm.phone} onChange={v => setEditForm({...editForm, phone: v})} /></td>
                                                    <td className="p-2"><InputCell type="date" val={editForm.startDate} onChange={v => setEditForm({...editForm, startDate: v})} /></td>
                                                    <td className="p-2"><InputCell type="date" val={editForm.birthDate} onChange={v => setEditForm({...editForm, birthDate: v})} /></td>
                                                    <td className="p-2 text-center">
                                                        <div className="flex flex-col gap-1 items-center">
                                                            <button onClick={saveEditing} className="p-1.5 bg-emerald-600 rounded text-white"><Check size={14}/></button>
                                                            <button onClick={cancelEditing} className="p-1.5 bg-slate-600 rounded text-white"><X size={14}/></button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{emp.lastName}, {emp.firstName}</td>
                                                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                                                        <div>{emp.dni}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-600">{emp.cuil}</div>
                                                    </td>
                                                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400 truncate max-w-[150px]" title={emp.address}>{emp.address || '-'}</td>
                                                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400">{emp.phone || '-'}</td>
                                                    <td className="p-3 text-sm text-slate-700 dark:text-slate-300 font-mono">{formatDate(emp.startDate)}</td>
                                                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400 font-mono">{formatDate(emp.birthDate)}</td>
                                                    <td className="p-3 text-center">
                                                        <div className="flex gap-2 justify-center">
                                                            <button onClick={() => startEditing(emp)} className="p-1.5 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><Edit2 size={16}/></button>
                                                            <button onClick={() => handleDelete(emp.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><Trash2 size={16}/></button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SUPPLIER SECTION ---

interface SupplierSectionProps {
    items: Supplier[];
    isOpen: boolean;
    onToggle: () => void;
    onUpdate: (items: Supplier[]) => void;
}

const SupplierSection: React.FC<SupplierSectionProps> = ({ items, isOpen, onToggle, onUpdate }) => {
    // Form State
    const [formData, setFormData] = React.useState({
        name: '', product: '', price: 0, phone: ''
    });
    const [priceDisplay, setPriceDisplay] = React.useState(''); // For input masking

    // Editing State
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editForm, setEditForm] = React.useState<Supplier | null>(null);
    const [editPriceDisplay, setEditPriceDisplay] = React.useState('');

    // Sort State
    const [sortConfig, setSortConfig] = React.useState<{ key: 'name' | 'price' | null, direction: 'asc' | 'desc' }>({
        key: 'name', direction: 'asc'
    });

    const handlePriceInput = (val: string, setDisplay: (v: string) => void, setVal: (v: number) => void) => {
        const digits = val.replace(/\D/g, '');
        if (digits === '') {
            setDisplay('');
            setVal(0);
            return;
        }
        const num = parseInt(digits, 10);
        const formatted = new Intl.NumberFormat('es-AR').format(num);
        setDisplay(formatted);
        setVal(num);
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const newSupplier: Supplier = {
            id: generateId(),
            ...formData
        };
        onUpdate([...items, newSupplier]);
        setFormData({ name: '', product: '', price: 0, phone: '' });
        setPriceDisplay('');
    };

    const startEditing = (sup: Supplier) => {
        setEditingId(sup.id);
        setEditForm({ ...sup });
        setEditPriceDisplay(new Intl.NumberFormat('es-AR').format(sup.price));
    };

    const saveEditing = () => {
        if (!editForm) return;
        const updatedList = items.map(i => i.id === editForm.id ? editForm : i);
        onUpdate(updatedList);
        setEditingId(null);
        setEditForm(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("¿Eliminar proveedor?")) {
            onUpdate(items.filter(i => i.id !== id));
        }
    };

    const handleSort = (key: 'name' | 'price') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedItems = React.useMemo(() => {
        let sortable = [...items];
        if (sortConfig.key) {
            sortable.sort((a, b) => {
                if (sortConfig.key === 'price') {
                     const valA = a.price || 0;
                     const valB = b.price || 0;
                     return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
                }
                const valA = (a.name || '').toLowerCase();
                const valB = (b.name || '').toLowerCase();
                return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            });
        }
        return sortable;
    }, [items, sortConfig]);

    const InputCell = ({ val, onChange }: { val: string, onChange: (v: string) => void }) => (
        <input 
            value={val}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-emerald-500/50 rounded px-2 py-1 text-sm text-emerald-700 dark:text-emerald-100 focus:outline-none focus:border-emerald-400"
        />
    );

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-xl border ${isOpen ? 'border-emerald-500/50' : 'border-slate-200 dark:border-slate-800'} overflow-hidden transition-all shadow-lg`}>
            <button 
                onClick={onToggle}
                className={`w-full flex items-center justify-between p-5 ${isOpen ? 'bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'} transition-colors`}
            >
                <div className="flex items-center gap-3">
                    <Truck className="text-emerald-500 dark:text-emerald-400" size={24} />
                    <span className={`text-lg font-bold ${isOpen ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>Proveedores</span>
                    <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700">
                        {items.length}
                    </span>
                </div>
                {isOpen ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
            </button>

            {isOpen && (
                <div className="p-5 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
                    
                    {/* ADD FORM */}
                    <form onSubmit={handleAdd} className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
                        <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase mb-3">Nuevo Proveedor</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <input required placeholder="Nombre" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none" />
                            <input required placeholder="Producto" value={formData.product} onChange={e => setFormData({...formData, product: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none" />
                            <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                                <input required placeholder="Precio" value={priceDisplay} onChange={e => handlePriceInput(e.target.value, setPriceDisplay, (v) => setFormData({...formData, price: v}))} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 pl-5 py-2 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none" />
                            </div>
                            <input placeholder="Teléfono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none" />
                        </div>
                        <button type="submit" className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <Plus size={16} /> Agregar
                        </button>
                    </form>

                    {/* TABLE */}
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-500 uppercase">
                                    <th className="p-3 min-w-[150px] cursor-pointer hover:text-emerald-500" onClick={() => handleSort('name')}>Nombre <ArrowUpDown size={12} className="inline"/></th>
                                    <th className="p-3 min-w-[150px]">Producto</th>
                                    <th className="p-3 min-w-[100px] text-right cursor-pointer hover:text-emerald-500" onClick={() => handleSort('price')}>Precio <ArrowUpDown size={12} className="inline"/></th>
                                    <th className="p-3 min-w-[120px]">Teléfono</th>
                                    <th className="p-3 w-20 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sortedItems.map(sup => {
                                    const isEditing = editingId === sup.id;
                                    return (
                                        <tr key={sup.id} className="bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            {isEditing && editForm ? (
                                                <>
                                                    <td className="p-2"><InputCell val={editForm.name} onChange={v => setEditForm({...editForm, name: v})} /></td>
                                                    <td className="p-2"><InputCell val={editForm.product} onChange={v => setEditForm({...editForm, product: v})} /></td>
                                                    <td className="p-2">
                                                        <input 
                                                            value={editPriceDisplay}
                                                            onChange={e => handlePriceInput(e.target.value, setEditPriceDisplay, (v) => setEditForm({...editForm, price: v}))}
                                                            className="w-full bg-white dark:bg-slate-950 border border-emerald-500/50 rounded px-2 py-1 text-sm text-emerald-700 dark:text-emerald-100 focus:outline-none focus:border-emerald-400 text-right"
                                                        />
                                                    </td>
                                                    <td className="p-2"><InputCell val={editForm.phone} onChange={v => setEditForm({...editForm, phone: v})} /></td>
                                                    <td className="p-2 text-center">
                                                        <div className="flex flex-col gap-1 items-center">
                                                            <button onClick={saveEditing} className="p-1.5 bg-emerald-600 rounded text-white"><Check size={14}/></button>
                                                            <button onClick={() => { setEditingId(null); setEditForm(null); }} className="p-1.5 bg-slate-600 rounded text-white"><X size={14}/></button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{sup.name}</td>
                                                    <td className="p-3 text-sm text-slate-600 dark:text-slate-300"><Tag size={12} className="inline mr-1 text-slate-400 dark:text-slate-500"/>{sup.product || '-'}</td>
                                                    <td className="p-3 text-sm font-mono text-emerald-600 dark:text-emerald-400 text-right">{formatCurrency(sup.price || 0)}</td>
                                                    <td className="p-3 text-sm text-slate-500 dark:text-slate-400">{sup.phone || '-'}</td>
                                                    <td className="p-3 text-center">
                                                        <div className="flex gap-2 justify-center">
                                                            <button onClick={() => startEditing(sup)} className="p-1.5 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><Edit2 size={16}/></button>
                                                            <button onClick={() => handleDelete(sup.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><Trash2 size={16}/></button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- CLIENT SECTION (Refactored to Table) ---

interface ClientSectionProps {
    items: Client[];
    isOpen: boolean;
    onToggle: () => void;
    onUpdate: (items: Client[]) => void;
}

const ClientSection: React.FC<ClientSectionProps> = ({ items, isOpen, onToggle, onUpdate }) => {
    // Form State
    const [formData, setFormData] = React.useState({
        name: '', cuil: '', phone: '', location: ''
    });

    // Editing State
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editForm, setEditForm] = React.useState<Client | null>(null);

    // Sort State
    const [sortConfig, setSortConfig] = React.useState<{ key: 'name' | 'location' | null, direction: 'asc' | 'desc' }>({
        key: 'name', direction: 'asc'
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const newClient: Client = {
            id: generateId(),
            ...formData
        };
        onUpdate([...items, newClient]);
        setFormData({ name: '', cuil: '', phone: '', location: '' });
    };

    const handleDelete = (id: string) => {
        if (window.confirm("¿Eliminar cliente?")) {
            onUpdate(items.filter(i => i.id !== id));
        }
    };

    const startEditing = (client: Client) => {
        setEditingId(client.id);
        setEditForm({ ...client });
    };

    const saveEditing = () => {
        if (!editForm) return;
        const updatedList = items.map(i => i.id === editForm.id ? editForm : i);
        onUpdate(updatedList);
        setEditingId(null);
        setEditForm(null);
    };

    const handleSort = (key: 'name' | 'location') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedItems = React.useMemo(() => {
        let sortable = [...items];
        if (sortConfig.key) {
            sortable.sort((a, b) => {
                const valA = (a[sortConfig.key!] || '').toLowerCase();
                const valB = (b[sortConfig.key!] || '').toLowerCase();
                return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            });
        }
        return sortable;
    }, [items, sortConfig]);

    const InputCell = ({ val, onChange }: { val: string, onChange: (v: string) => void }) => (
        <input 
            value={val}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-cyan-500/50 rounded px-2 py-1 text-sm text-cyan-700 dark:text-cyan-100 focus:outline-none focus:border-cyan-400"
        />
    );

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-xl border ${isOpen ? 'border-cyan-500/50' : 'border-slate-200 dark:border-slate-800'} overflow-hidden transition-all shadow-lg`}>
            <button 
                onClick={onToggle}
                className={`w-full flex items-center justify-between p-5 ${isOpen ? 'bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'} transition-colors`}
            >
                <div className="flex items-center gap-3">
                    <Users className="text-cyan-500 dark:text-cyan-400" size={24} />
                    <span className={`text-lg font-bold ${isOpen ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>Clientes</span>
                    <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700">
                        {items.length}
                    </span>
                </div>
                {isOpen ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
            </button>

            {isOpen && (
                <div className="p-5 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
                    
                    {/* ADD FORM */}
                    <form onSubmit={handleAdd} className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
                        <h3 className="text-xs font-bold text-cyan-600 dark:text-cyan-500 uppercase mb-3">Nuevo Cliente</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <input required placeholder="Nombre" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                            <input placeholder="CUIL" value={formData.cuil} onChange={e => setFormData({...formData, cuil: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                            <input placeholder="Teléfono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                            <input placeholder="Lugar / Dirección" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                        <button type="submit" className="mt-3 w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <Plus size={16} /> Agregar
                        </button>
                    </form>

                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                         <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-500 uppercase">
                                    <th className="p-3 min-w-[150px] cursor-pointer hover:text-cyan-500" onClick={() => handleSort('name')}>Nombre <ArrowUpDown size={12} className="inline"/></th>
                                    <th className="p-3 min-w-[120px]">CUIL</th>
                                    <th className="p-3 min-w-[120px]">Teléfono</th>
                                    <th className="p-3 min-w-[150px] cursor-pointer hover:text-cyan-500" onClick={() => handleSort('location')}>Lugar <ArrowUpDown size={12} className="inline"/></th>
                                    <th className="p-3 w-20 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sortedItems.length === 0 ? (
                                    <tr><td colSpan={5} className="p-4 text-center text-slate-500 italic">Sin clientes registrados.</td></tr>
                                ) : (
                                    sortedItems.map(item => {
                                        const isEditing = editingId === item.id;
                                        return (
                                            <tr key={item.id} className="bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                                {isEditing && editForm ? (
                                                    <>
                                                        <td className="p-2"><InputCell val={editForm.name} onChange={v => setEditForm({...editForm, name: v})} /></td>
                                                        <td className="p-2"><InputCell val={editForm.cuil} onChange={v => setEditForm({...editForm, cuil: v})} /></td>
                                                        <td className="p-2"><InputCell val={editForm.phone} onChange={v => setEditForm({...editForm, phone: v})} /></td>
                                                        <td className="p-2"><InputCell val={editForm.location} onChange={v => setEditForm({...editForm, location: v})} /></td>
                                                        <td className="p-2 text-center">
                                                            <div className="flex flex-col gap-1 items-center">
                                                                <button onClick={saveEditing} className="p-1.5 bg-emerald-600 rounded text-white"><Check size={14}/></button>
                                                                <button onClick={() => { setEditingId(null); setEditForm(null); }} className="p-1.5 bg-slate-600 rounded text-white"><X size={14}/></button>
                                                            </div>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                                                        <td className="p-3 text-sm text-slate-600 dark:text-slate-400">{item.cuil || '-'}</td>
                                                        <td className="p-3 text-sm text-slate-600 dark:text-slate-400">{item.phone || '-'}</td>
                                                        <td className="p-3 text-sm text-slate-600 dark:text-slate-400"><MapPin size={12} className="inline mr-1 text-slate-500"/>{item.location || '-'}</td>
                                                        <td className="p-3 text-center">
                                                            <div className="flex gap-2 justify-center">
                                                                <button onClick={() => startEditing(item)} className="p-1.5 text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><Edit2 size={16}/></button>
                                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><Trash2 size={16}/></button>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};