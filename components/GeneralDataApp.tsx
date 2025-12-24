import React from 'react';
import { Database as DBRef, ref, onValue, set } from 'firebase/database';
import { ChevronDown, ChevronUp, Plus, Minus, Trash2, User, Users, Truck, ArrowUpDown, MapPin, Edit2, Check, X, Tag, UserPlus, Phone, Calendar, CreditCard, Home } from 'lucide-react';
import { GeneralData, Employee, Supplier, Client } from '../types';
import { generateId, formatCurrency } from '../utils';

interface GeneralDataAppProps {
  db: DBRef | null;
}

const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', lastName: 'BUSTAMANTE', firstName: 'Ramón Emanuel', dni: '36.431.396', cuil: '23-36431396-9', address: 'Calle 3 N° 78 - B° Remedios de escalada', startDate: '2007-11-21', birthDate: '1991-09-22', phone: '152686790' },
  { id: '2', lastName: 'POLANCO', firstName: 'Mauro Gabriel', dni: '33.893.482', cuil: '20-33893482-4', address: 'Ibar Segura Funes 9064', startDate: '2006-09-07', birthDate: '1987-12-24', phone: '152655459' },
  { id: '3', lastName: 'BUSTAMANTE', firstName: 'José Roque', dni: '11.558.586', cuil: '20-11558586-0', address: 'Calle 3 N° 78 - B° Remedios de escalada', startDate: '2007-06-01', birthDate: '1955-03-31', phone: '152827732' },
  { id: '4', lastName: 'GODOY', firstName: 'Walter Daniel', dni: '27.172.575', cuil: '20-27172575-3', address: 'Mza. 2 Lote 13 - B° 1ro de Agosto', startDate: '1999-01-02', birthDate: '1979-02-04', phone: '157665974' },
  { id: '5', lastName: 'HERRERA', firstName: 'Ruben Alberto', dni: '26.994.733', cuil: '20-26994733-1', address: 'De la Cueca 342 Guiñazú', startDate: '1996-01-02', birthDate: '1979-01-21', phone: '156259100' },
  { id: '6', lastName: 'LUNA', firstName: 'Guillermo Damian', dni: '27.246.128', cuil: '20-27246128-8', address: 'Mza. 107 lote 16 - Juan Pablo II', startDate: '2007-03-06', birthDate: '1979-03-07', phone: '153528809' },
  { id: '7', lastName: 'MEDRANO', firstName: 'Martín Miguel', dni: '18.593.831', cuil: '20-18593831-0', address: 'Del gato s/n Guiñazú', startDate: '1997-01-02', birthDate: '1967-09-19', phone: '153600063' },
  { id: '8', lastName: 'ROMERO', firstName: 'Jonatan', dni: '37.133.412', cuil: '20-37133412-3', address: 'Pujada casa 49 R Escalada', startDate: '2010-10-01', birthDate: '1992-11-22', phone: '156572393' },
  { id: '9', lastName: 'BUSTO', firstName: 'Eduardo Javier', dni: '31.742.880', cuil: '20-31742880-5', address: 'Del Cielito 53 B° Guiñazú', startDate: '2012-01-03', birthDate: '1985-02-14', phone: '152413998' },
  { id: '10', lastName: 'ARTEGA REINAGA', firstName: 'Zenobio', dni: '94.136.450', cuil: '20-94136450-1', address: 'José R. Figueroa N° 604 - B° San Ignacio', startDate: '2009-06-02', birthDate: '1986-02-20', phone: '153168869' },
  { id: '11', lastName: 'Leiva', firstName: 'Maximiliano', dni: '36.983.515', cuil: '20-36983515-8', address: 'De la Cueca 329 Guiñazú', startDate: '2013-10-01', birthDate: '1992-10-10', phone: '152641452' },
  { id: '12', lastName: 'Leiva', firstName: 'Sergio Matias', dni: '39.444.292', cuil: '20-39444292-6', address: 'Del gato 355 Guiñazú', startDate: '2013-10-01', birthDate: '1996-01-04', phone: '153198710' },
  { id: '13', lastName: 'Villán', firstName: 'Leonardo', dni: '31.056.879', cuil: '20-31056879-2', address: 'Miguel Cané 252 B norte', startDate: '2012-10-23', birthDate: '1984-12-05', phone: '157461099' },
  { id: '14', lastName: 'Gutierrez', firstName: 'Maximiliano', dni: '34.069.177', cuil: '20-34069177-7', address: 'Del Gato325 Guiñazú', startDate: '2011-12-07', birthDate: '1988-10-17', phone: '152604479' },
  { id: '15', lastName: 'Villán', firstName: 'Gastón Alan', dni: '37.314.730', cuil: '20-37314730-4', address: 'Miguel Cané 252 B norte', startDate: '2010-09-10', birthDate: '1991-10-02', phone: '155101405' },
  { id: '16', lastName: 'Righes', firstName: 'Sergio Eduardo', dni: '32.458.486', cuil: '20-32458486-3', address: 'Av. Japón 500', startDate: '2012-10-01', birthDate: '1986-09-29', phone: '156452071' },
  { id: '17', lastName: 'González', firstName: 'Rodolfo Eduardo', dni: '16.907.860', cuil: '20-16907860-3', address: 'El Pehual 685 Guiñazú', startDate: '2014-07-01', birthDate: '1964-05-03', phone: '153977709' },
  { id: '18', lastName: 'Gómez', firstName: 'Jorge Ignacio', dni: '24.394.772', cuil: '20-24394772-4', address: 'Jose Superí 2984 Los Paraísos', startDate: '2013-10-17', birthDate: '1975-03-24', phone: '157382255' },
  { id: '19', lastName: 'Gómez', firstName: 'Franco Maximiliano', dni: '39.495.132', cuil: '20-39495132-4', address: 'Jose Superí 2984 Los Paraísos', startDate: '2013-10-31', birthDate: '1996-01-15', phone: '156349036' },
  { id: '20', lastName: 'Yudicello', firstName: 'Lorena Jaquelina', dni: '27.921.684', cuil: '27-27921684-4', address: 'Arquímedes 2837 Los Paraísos', startDate: '2014-08-01', birthDate: '1980-02-09', phone: '153907513' }
];

const createInitialState = (): GeneralData => ({
  clients: [],
  suppliers: [],
  employees: []
});

export const GeneralDataApp: React.FC<GeneralDataAppProps> = ({ db }) => {
  const [data, setData] = React.useState<GeneralData>(createInitialState());
  const [loading, setLoading] = React.useState(true);
  const [openSection, setOpenSection] = React.useState<string | null>('employees');

  React.useEffect(() => {
    if (db) {
      setLoading(true);
      const dataRef = ref(db, 'general_data');
      const unsubscribe = onValue(dataRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          let employees = val.employees || [];
          if (employees.length === 0) {
              employees = INITIAL_EMPLOYEES;
              set(ref(db, 'general_data/employees'), employees).catch(console.error);
          }
          setData({
            clients: val.clients || [],
            suppliers: val.suppliers || [],
            employees: employees
          });
        } else {
          setData({ clients: [], suppliers: [], employees: INITIAL_EMPLOYEES });
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      const saved = localStorage.getItem('general_data');
      if (saved) {
        try { 
            const parsed = JSON.parse(saved);
            if (!parsed.employees || parsed.employees.length === 0) parsed.employees = INITIAL_EMPLOYEES;
            setData(parsed);
        } catch (e) { setData({ ...createInitialState(), employees: INITIAL_EMPLOYEES }); }
      } else {
        setData({ ...createInitialState(), employees: INITIAL_EMPLOYEES });
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
    <div className="h-full flex flex-col bg-slate-950 p-4 sm:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        <h2 className="text-2xl font-bold text-cyan-400 uppercase tracking-widest text-center sm:text-left mb-6">Datos Generales</h2>

        {loading ? (
            <div className="text-cyan-400 p-8 animate-pulse text-center">Cargando Datos...</div>
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
    const [formData, setFormData] = React.useState({ firstName: '', lastName: '', dni: '', cuil: '', address: '', startDate: '', birthDate: '', phone: '' });
    const [showForm, setShowForm] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editForm, setEditForm] = React.useState<Employee | null>(null);
    const [expandedId, setExpandedId] = React.useState<string | null>(null);
    const [sortConfig, setSortConfig] = React.useState<{ key: keyof Employee | null, direction: 'asc' | 'desc' }>({ key: 'lastName', direction: 'asc' });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate([...items, { id: generateId(), ...formData }]);
        setFormData({ firstName: '', lastName: '', dni: '', cuil: '', address: '', startDate: '', birthDate: '', phone: '' });
        setShowForm(false);
    };

    const startEditing = (emp: Employee) => { setEditingId(emp.id); setEditForm({ ...emp }); };
    const cancelEditing = () => { setEditingId(null); setEditForm(null); };
    const saveEditing = () => { if (!editForm) return; onUpdate(items.map(i => i.id === editForm.id ? editForm : i)); setEditingId(null); setEditForm(null); };
    const handleDelete = (id: string) => { if (window.confirm("¿Eliminar empleado?")) onUpdate(items.filter(i => i.id !== id)); };

    const handleSort = (key: keyof Employee) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedItems = React.useMemo(() => {
        let sortable = [...items];
        if (sortConfig.key) {
            sortable.sort((a, b) => {
                const valA = (a[sortConfig.key!] || '').toString().toLowerCase();
                const valB = (b[sortConfig.key!] || '').toString().toLowerCase();
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
        <input type={type} value={val} onChange={e => onChange(e.target.value)} className="w-full bg-slate-950 border border-amber-500/50 rounded px-2 py-1 text-sm text-amber-100 focus:outline-none focus:border-amber-400" />
    );

    return (
        <div className={`bg-slate-900 rounded-xl border ${isOpen ? 'border-amber-500/50' : 'border-slate-800'} overflow-hidden transition-all shadow-lg`}>
            <button onClick={onToggle} className={`w-full flex items-center justify-between p-5 ${isOpen ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'} transition-colors`}>
                <div className="flex items-center gap-3">
                    <User className="text-amber-400" size={24} />
                    <span className={`text-lg font-bold ${isOpen ? 'text-slate-100' : 'text-slate-300'}`}>Empleados</span>
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">{items.length}</span>
                </div>
                {isOpen ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
            </button>

            {isOpen && (
                <div className="p-5 border-t border-slate-800 animate-in slide-in-from-top-2 duration-200">
                    <button onClick={() => setShowForm(!showForm)} className={`mb-4 w-full flex items-center justify-between p-3 rounded-xl border border-dashed transition-all ${showForm ? 'bg-amber-900/20 border-amber-500/50 text-amber-100' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-amber-500/30'}`}>
                        <div className="flex items-center gap-2">
                            <UserPlus size={18} className={showForm ? 'text-amber-400' : 'text-slate-500'} />
                            <span className="text-sm font-bold uppercase tracking-wider">Nuevo Empleado</span>
                        </div>
                        {showForm ? <Minus size={18} /> : <Plus size={18} />}
                    </button>

                    {showForm && (
                        <form onSubmit={handleAdd} className="bg-slate-950/50 p-4 rounded-xl border border-amber-500/20 mb-6 animate-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                <input required placeholder="Nombre" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none" />
                                <input required placeholder="Apellido" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none" />
                                <input placeholder="DNI" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none" />
                                <input placeholder="CUIL" value={formData.cuil} onChange={e => setFormData({...formData, cuil: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none" />
                                <input placeholder="Domicilio" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none" />
                                <input placeholder="Teléfono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none" />
                                <div className="relative"><span className="text-[10px] text-slate-500 absolute -top-1.5 left-2 bg-slate-900 px-1">F. Nacimiento</span><input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-400 focus:text-white focus:border-amber-500 focus:outline-none" /></div>
                                <div className="relative"><span className="text-[10px] text-slate-500 absolute -top-1.5 left-2 bg-slate-900 px-1">F. Ingreso</span><input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-400 focus:text-white focus:border-amber-500 focus:outline-none" /></div>
                            </div>
                            <button type="submit" className="mt-3 w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"><Plus size={16} /> Agregar Empleado</button>
                        </form>
                    )}

                    <div className="overflow-x-auto rounded-lg border border-slate-800">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950 text-xs font-bold text-slate-500 uppercase">
                                    <th className="p-3 min-w-[150px] cursor-pointer hover:text-amber-400" onClick={() => handleSort('lastName')}>Apellido y Nombre <ArrowUpDown size={12} className="inline"/></th>
                                    <th className="p-3 min-w-[100px] hidden md:table-cell">DNI / CUIL</th>
                                    <th className="p-3 min-w-[150px] hidden md:table-cell">Domicilio</th>
                                    <th className="p-3 min-w-[120px] hidden md:table-cell">Teléfono</th>
                                    <th className="p-3 min-w-[120px] cursor-pointer hover:text-amber-400 hidden md:table-cell" onClick={() => handleSort('startDate')}>Ingreso <ArrowUpDown size={12} className="inline"/></th>
                                    <th className="p-3 min-w-[120px] hidden md:table-cell">Nacimiento</th>
                                    <th className="p-3 w-20 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {sortedItems.map(emp => {
                                    const isEditing = editingId === emp.id;
                                    const isExpanded = expandedId === emp.id;
                                    return (
                                        <React.Fragment key={emp.id}>
                                            <tr 
                                              onClick={() => !isEditing && setExpandedId(isExpanded ? null : emp.id)}
                                              className={`bg-slate-900/50 hover:bg-slate-800 transition-colors ${!isEditing ? 'cursor-pointer' : ''}`}
                                            >
                                                {isEditing && editForm ? (
                                                    <>
                                                        <td className="p-2 space-y-1"><InputCell val={editForm.lastName} onChange={v => setEditForm({...editForm, lastName: v})} /><InputCell val={editForm.firstName} onChange={v => setEditForm({...editForm, firstName: v})} /></td>
                                                        <td className="p-2 space-y-1 hidden md:table-cell"><InputCell val={editForm.dni} onChange={v => setEditForm({...editForm, dni: v})} /><InputCell val={editForm.cuil} onChange={v => setEditForm({...editForm, cuil: v})} /></td>
                                                        <td className="p-2 hidden md:table-cell"><InputCell val={editForm.address} onChange={v => setEditForm({...editForm, address: v})} /></td>
                                                        <td className="p-2 hidden md:table-cell"><InputCell val={editForm.phone} onChange={v => setEditForm({...editForm, phone: v})} /></td>
                                                        <td className="p-2 hidden md:table-cell"><InputCell type="date" val={editForm.startDate} onChange={v => setEditForm({...editForm, startDate: v})} /></td>
                                                        <td className="p-2 hidden md:table-cell"><InputCell type="date" val={editForm.birthDate} onChange={v => setEditForm({...editForm, birthDate: v})} /></td>
                                                        <td className="p-2 text-center"><div className="flex flex-col gap-1 items-center"><button onClick={(e) => { e.stopPropagation(); saveEditing(); }} className="p-1.5 bg-emerald-600 rounded text-white"><Check size={14}/></button><button onClick={(e) => { e.stopPropagation(); cancelEditing(); }} className="p-1.5 bg-slate-600 rounded text-white"><X size={14}/></button></div></td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="p-3 font-medium text-slate-200">
                                                          <div className="flex items-center gap-2">
                                                            <span className="md:hidden">{isExpanded ? <ChevronUp size={14} className="text-amber-500" /> : <ChevronDown size={14} className="text-slate-500" />}</span>
                                                            {emp.lastName}, {emp.firstName}
                                                          </div>
                                                        </td>
                                                        <td className="p-3 text-sm text-slate-400 hidden md:table-cell"><div>{emp.dni}</div><div className="text-xs text-slate-600">{emp.cuil}</div></td>
                                                        <td className="p-3 text-sm text-slate-400 truncate max-w-[150px] hidden md:table-cell" title={emp.address}>{emp.address || '-'}</td>
                                                        <td className="p-3 text-sm text-slate-400 hidden md:table-cell">{emp.phone || '-'}</td>
                                                        <td className="p-3 text-sm text-slate-300 font-mono hidden md:table-cell">{formatDate(emp.startDate)}</td>
                                                        <td className="p-3 text-sm text-slate-400 font-mono hidden md:table-cell">{formatDate(emp.birthDate)}</td>
                                                        <td className="p-3 text-center"><div className="flex gap-2 justify-center"><button onClick={(e) => { e.stopPropagation(); startEditing(emp); }} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded"><Edit2 size={16}/></button><button onClick={(e) => { e.stopPropagation(); handleDelete(emp.id); }} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-700 rounded"><Trash2 size={16}/></button></div></td>
                                                    </>
                                                )}
                                            </tr>
                                            {isExpanded && !isEditing && (
                                              <tr className="bg-slate-900/80 md:hidden animate-in slide-in-from-top-1 duration-200">
                                                <td colSpan={2} className="p-4">
                                                  <div className="space-y-3">
                                                    <div className="flex items-center gap-3"><CreditCard size={14} className="text-slate-500"/><div className="text-xs uppercase font-bold text-slate-500 w-24">DNI / CUIL:</div><div className="text-sm text-slate-300">{emp.dni} <span className="text-slate-600 ml-1">({emp.cuil})</span></div></div>
                                                    <div className="flex items-center gap-3"><Home size={14} className="text-slate-500"/><div className="text-xs uppercase font-bold text-slate-500 w-24">Domicilio:</div><div className="text-sm text-slate-300">{emp.address || '-'}</div></div>
                                                    <div className="flex items-center gap-3"><Phone size={14} className="text-slate-500"/><div className="text-xs uppercase font-bold text-slate-500 w-24">Teléfono:</div><div className="text-sm text-slate-300">{emp.phone || '-'}</div></div>
                                                    <div className="flex items-center gap-3"><Calendar size={14} className="text-slate-500"/><div className="text-xs uppercase font-bold text-slate-500 w-24">Ingreso:</div><div className="text-sm text-slate-300 font-mono">{formatDate(emp.startDate)}</div></div>
                                                    <div className="flex items-center gap-3"><Calendar size={14} className="text-slate-500"/><div className="text-xs uppercase font-bold text-slate-500 w-24">Nacimiento:</div><div className="text-sm text-slate-300 font-mono">{formatDate(emp.birthDate)}</div></div>
                                                  </div>
                                                </td>
                                              </tr>
                                            )}
                                        </React.Fragment>
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
    const [formData, setFormData] = React.useState({ name: '', product: '', price: 0, phone: '' });
    const [priceDisplay, setPriceDisplay] = React.useState('');
    const [showForm, setShowForm] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editForm, setEditForm] = React.useState<Supplier | null>(null);
    const [editPriceDisplay, setEditPriceDisplay] = React.useState('');
    const [expandedId, setExpandedId] = React.useState<string | null>(null);
    const [sortConfig, setSortConfig] = React.useState<{ key: keyof Supplier | null, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

    const handlePriceInput = (val: string, setDisplay: (v: string) => void, setVal: (v: number) => void) => {
        const digits = val.replace(/\D/g, '');
        if (digits === '') { setDisplay(''); setVal(0); return; }
        const num = parseInt(digits, 10);
        setDisplay(new Intl.NumberFormat('es-AR').format(num));
        setVal(num);
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate([...items, { id: generateId(), ...formData }]);
        setFormData({ name: '', product: '', price: 0, phone: '' });
        setPriceDisplay('');
        setShowForm(false);
    };

    const startEditing = (sup: Supplier) => { setEditingId(sup.id); setEditForm({ ...sup }); setEditPriceDisplay(new Intl.NumberFormat('es-AR').format(sup.price)); };
    const saveEditing = () => { if (!editForm) return; onUpdate(items.map(i => i.id === editForm.id ? editForm : i)); setEditingId(null); setEditForm(null); };
    const handleDelete = (id: string) => { if (window.confirm("¿Eliminar proveedor?")) onUpdate(items.filter(i => i.id !== id)); };

    const handleSort = (key: keyof Supplier) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedItems = React.useMemo(() => {
        let sortable = [...items];
        if (sortConfig.key) {
            sortable.sort((a, b) => {
                if (sortConfig.key === 'price') return sortConfig.direction === 'asc' ? (a.price || 0) - (b.price || 0) : (b.price || 0) - (a.price || 0);
                const valA = (a[sortConfig.key!] || '').toString().toLowerCase();
                const valB = (b[sortConfig.key!] || '').toString().toLowerCase();
                return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            });
        }
        return sortable;
    }, [items, sortConfig]);

    const InputCell = ({ val, onChange }: { val: string, onChange: (v: string) => void }) => (
        <input value={val} onChange={e => onChange(e.target.value)} className="w-full bg-slate-950 border border-emerald-500/50 rounded px-2 py-1 text-sm text-emerald-100 focus:outline-none focus:border-emerald-400" />
    );

    return (
        <div className={`bg-slate-900 rounded-xl border ${isOpen ? 'border-emerald-500/50' : 'border-slate-800'} overflow-hidden transition-all shadow-lg`}>
            <button onClick={onToggle} className={`w-full flex items-center justify-between p-5 ${isOpen ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'} transition-colors`}>
                <div className="flex items-center gap-3">
                    <Truck className="text-emerald-400" size={24} />
                    <span className={`text-lg font-bold ${isOpen ? 'text-slate-100' : 'text-slate-300'}`}>Proveedores</span>
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">{items.length}</span>
                </div>
                {isOpen ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
            </button>

            {isOpen && (
                <div className="p-5 border-t border-slate-800 animate-in slide-in-from-top-2 duration-200">
                    <button onClick={() => setShowForm(!showForm)} className={`mb-4 w-full flex items-center justify-between p-3 rounded-xl border border-dashed transition-all ${showForm ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-100' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-emerald-500/30'}`}>
                        <div className="flex items-center gap-2">
                            <Truck size={18} className={showForm ? 'text-emerald-400' : 'text-slate-500'} />
                            <span className="text-sm font-bold uppercase tracking-wider">Nuevo Proveedor</span>
                        </div>
                        {showForm ? <Minus size={18} /> : <Plus size={18} />}
                    </button>

                    {showForm && (
                        <form onSubmit={handleAdd} className="bg-slate-950/50 p-4 rounded-xl border border-emerald-500/20 mb-6 animate-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                <input required placeholder="Nombre" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                                <input required placeholder="Producto" value={formData.product} onChange={e => setFormData({...formData, product: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                                <div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span><input required placeholder="Precio" value={priceDisplay} onChange={e => handlePriceInput(e.target.value, setPriceDisplay, (v) => setFormData({...formData, price: v}))} className="w-full bg-slate-900 border border-slate-700 rounded px-3 pl-5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" /></div>
                                <input placeholder="Teléfono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                            </div>
                            <button type="submit" className="mt-3 w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"><Plus size={16} /> Agregar Proveedor</button>
                        </form>
                    )}

                    <div className="overflow-x-auto rounded-lg border border-slate-800">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950 text-xs font-bold text-slate-500 uppercase">
                                    <th className="p-3 min-w-[150px] cursor-pointer hover:text-emerald-400" onClick={() => handleSort('name')}>Nombre <ArrowUpDown size={12} className="inline"/></th>
                                    <th className="p-3 min-w-[150px] hidden md:table-cell">Producto</th>
                                    <th className="p-3 min-w-[100px] text-right cursor-pointer hover:text-emerald-400 hidden md:table-cell" onClick={() => handleSort('price')}>Precio <ArrowUpDown size={12} className="inline"/></th>
                                    <th className="p-3 min-w-[120px] hidden md:table-cell">Teléfono</th>
                                    <th className="p-3 w-20 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {sortedItems.map(sup => {
                                    const isEditing = editingId === sup.id;
                                    const isExpanded = expandedId === sup.id;
                                    return (
                                        <React.Fragment key={sup.id}>
                                            <tr 
                                              onClick={() => !isEditing && setExpandedId(isExpanded ? null : sup.id)}
                                              className={`bg-slate-900/50 hover:bg-slate-800 transition-colors ${!isEditing ? 'cursor-pointer' : ''}`}
                                            >
                                                {isEditing && editForm ? (
                                                    <>
                                                        <td className="p-2"><InputCell val={editForm.name} onChange={v => setEditForm({...editForm, name: v})} /></td>
                                                        <td className="p-2 hidden md:table-cell"><InputCell val={editForm.product} onChange={v => setEditForm({...editForm, product: v})} /></td>
                                                        <td className="p-2 hidden md:table-cell"><input value={editPriceDisplay} onChange={e => handlePriceInput(e.target.value, setEditPriceDisplay, (v) => setEditForm({...editForm, price: v}))} className="w-full bg-slate-950 border border-emerald-500/50 rounded px-2 py-1 text-sm text-emerald-100 focus:outline-none focus:border-emerald-400 text-right" /></td>
                                                        <td className="p-2 hidden md:table-cell"><InputCell val={editForm.phone} onChange={v => setEditForm({...editForm, phone: v})} /></td>
                                                        <td className="p-2 text-center"><div className="flex flex-col gap-1 items-center"><button onClick={(e) => { e.stopPropagation(); saveEditing(); }} className="p-1.5 bg-emerald-600 rounded text-white"><Check size={14}/></button><button onClick={(e) => { e.stopPropagation(); setEditingId(null); setEditForm(null); }} className="p-1.5 bg-slate-600 rounded text-white"><X size={14}/></button></div></td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="p-3 font-bold text-slate-200">
                                                          <div className="flex items-center gap-2">
                                                            <span className="md:hidden">{isExpanded ? <ChevronUp size={14} className="text-emerald-500" /> : <ChevronDown size={14} className="text-slate-500" />}</span>
                                                            {sup.name}
                                                          </div>
                                                        </td>
                                                        <td className="p-3 text-sm text-slate-300 hidden md:table-cell"><Tag size={12} className="inline mr-1 text-slate-500"/>{sup.product || '-'}</td>
                                                        <td className="p-3 text-sm font-mono text-emerald-400 text-right hidden md:table-cell">{formatCurrency(sup.price || 0)}</td>
                                                        <td className="p-3 text-sm text-slate-400 hidden md:table-cell">{sup.phone || '-'}</td>
                                                        <td className="p-3 text-center"><div className="flex gap-2 justify-center"><button onClick={(e) => { e.stopPropagation(); startEditing(sup); }} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded"><Edit2 size={16}/></button><button onClick={(e) => { e.stopPropagation(); handleDelete(sup.id); }} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-700 rounded"><Trash2 size={16}/></button></div></td>
                                                    </>
                                                )}
                                            </tr>
                                            {isExpanded && !isEditing && (
                                              <tr className="bg-slate-900/80 md:hidden animate-in slide-in-from-top-1 duration-200">
                                                <td colSpan={2} className="p-4">
                                                  <div className="space-y-3 text-sm">
                                                    <div className="flex items-center gap-3"><Tag size={14} className="text-slate-500"/><div className="text-xs uppercase font-bold text-slate-500 w-24">Producto:</div><div className="text-slate-300">{sup.product || '-'}</div></div>
                                                    <div className="flex items-center gap-3"><CreditCard size={14} className="text-slate-500"/><div className="text-xs uppercase font-bold text-slate-500 w-24">Precio:</div><div className="text-emerald-400 font-mono font-bold">{formatCurrency(sup.price || 0)}</div></div>
                                                    <div className="flex items-center gap-3"><Phone size={14} className="text-slate-500"/><div className="text-xs uppercase font-bold text-slate-500 w-24">Teléfono:</div><div className="text-slate-300">{sup.phone || '-'}</div></div>
                                                  </div>
                                                </td>
                                              </tr>
                                            )}
                                        </React.Fragment>
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


// --- CLIENT SECTION ---

interface ClientSectionProps {
    items: Client[];
    isOpen: boolean;
    onToggle: () => void;
    onUpdate: (items: Client[]) => void;
}

const ClientSection: React.FC<ClientSectionProps> = ({ items, isOpen, onToggle, onUpdate }) => {
    const [formData, setFormData] = React.useState({ name: '', cuil: '', phone: '', location: '' });
    const [showForm, setShowForm] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editForm, setEditForm] = React.useState<Client | null>(null);
    const [expandedId, setExpandedId] = React.useState<string | null>(null);
    const [sortConfig, setSortConfig] = React.useState<{ key: keyof Client | null, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate([...items, { id: generateId(), ...formData }]);
        setFormData({ name: '', cuil: '', phone: '', location: '' });
        setShowForm(false);
    };

    const handleDelete = (id: string) => { if (window.confirm("¿Eliminar cliente?")) onUpdate(items.filter(i => i.id !== id)); };
    const startEditing = (client: Client) => { setEditingId(client.id); setEditForm({ ...client }); };
    const saveEditing = () => { if (!editForm) return; onUpdate(items.map(i => i.id === editForm.id ? editForm : i)); setEditingId(null); setEditForm(null); };

    const handleSort = (key: keyof Client) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedItems = React.useMemo(() => {
        let sortable = [...items];
        if (sortConfig.key) {
            sortable.sort((a, b) => {
                const valA = (a[sortConfig.key!] || '').toString().toLowerCase();
                const valB = (b[sortConfig.key!] || '').toString().toLowerCase();
                return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            });
        }
        return sortable;
    }, [items, sortConfig]);

    const InputCell = ({ val, onChange }: { val: string, onChange: (v: string) => void }) => (
        <input value={val} onChange={e => onChange(e.target.value)} className="w-full bg-slate-950 border border-cyan-500/50 rounded px-2 py-1 text-sm text-cyan-100 focus:outline-none focus:border-cyan-400" />
    );

    return (
        <div className={`bg-slate-900 rounded-xl border ${isOpen ? 'border-cyan-500/50' : 'border-slate-800'} overflow-hidden transition-all shadow-lg`}>
            <button onClick={onToggle} className={`w-full flex items-center justify-between p-5 ${isOpen ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'} transition-colors`}>
                <div className="flex items-center gap-3">
                    <Users className="text-cyan-400" size={24} />
                    <span className={`text-lg font-bold ${isOpen ? 'text-slate-100' : 'text-slate-300'}`}>Clientes</span>
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">{items.length}</span>
                </div>
                {isOpen ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
            </button>

            {isOpen && (
                <div className="p-5 border-t border-slate-800 animate-in slide-in-from-top-2 duration-200">
                    <button onClick={() => setShowForm(!showForm)} className={`mb-4 w-full flex items-center justify-between p-3 rounded-xl border border-dashed transition-all ${showForm ? 'bg-cyan-900/20 border-cyan-500/50 text-cyan-100' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-cyan-500/30'}`}>
                        <div className="flex items-center gap-2">
                            <Users size={18} className={showForm ? 'text-cyan-400' : 'text-slate-500'} />
                            <span className="text-sm font-bold uppercase tracking-wider">Nuevo Cliente</span>
                        </div>
                        {showForm ? <Minus size={18} /> : <Plus size={18} />}
                    </button>

                    {showForm && (
                        <form onSubmit={handleAdd} className="bg-slate-950/50 p-4 rounded-xl border border-cyan-500/20 mb-6 animate-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                <input required placeholder="Nombre" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none" />
                                <input placeholder="CUIL" value={formData.cuil} onChange={e => setFormData({...formData, cuil: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none" />
                                <input placeholder="Teléfono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none" />
                                <input placeholder="Lugar / Dirección" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none" />
                            </div>
                            <button type="submit" className="mt-3 w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"><Plus size={16} /> Agregar Cliente</button>
                        </form>
                    )}

                    <div className="overflow-x-auto rounded-lg border border-slate-800">
                         <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950 text-xs font-bold text-slate-500 uppercase">
                                    <th className="p-3 min-w-[150px] cursor-pointer hover:text-cyan-400" onClick={() => handleSort('name')}>Nombre <ArrowUpDown size={12} className="inline"/></th>
                                    <th className="p-3 min-w-[120px] hidden md:table-cell">CUIL</th>
                                    <th className="p-3 min-w-[120px] hidden md:table-cell">Teléfono</th>
                                    <th className="p-3 min-w-[150px] cursor-pointer hover:text-cyan-400 hidden md:table-cell" onClick={() => handleSort('location')}>Lugar <ArrowUpDown size={12} className="inline"/></th>
                                    <th className="p-3 w-20 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {sortedItems.length === 0 ? (
                                    <tr><td colSpan={5} className="p-4 text-center text-slate-500 italic">Sin clientes registrados.</td></tr>
                                ) : (
                                    sortedItems.map(item => {
                                        const isEditing = editingId === item.id;
                                        const isExpanded = expandedId === item.id;
                                        return (
                                            <React.Fragment key={item.id}>
                                                <tr 
                                                  onClick={() => !isEditing && setExpandedId(isExpanded ? null : item.id)}
                                                  className={`bg-slate-900/50 hover:bg-slate-800 transition-colors ${!isEditing ? 'cursor-pointer' : ''}`}
                                                >
                                                    {isEditing && editForm ? (
                                                        <>
                                                            <td className="p-2"><InputCell val={editForm.name} onChange={v => setEditForm({...editForm, name: v})} /></td>
                                                            <td className="p-2 hidden md:table-cell"><InputCell val={editForm.cuil} onChange={v => setEditForm({...editForm, cuil: v})} /></td>
                                                            <td className="p-2 hidden md:table-cell"><InputCell val={editForm.phone} onChange={v => setEditForm({...editForm, phone: v})} /></td>
                                                            <td className="p-2 hidden md:table-cell"><InputCell val={editForm.location} onChange={v => setEditForm({...editForm, location: v})} /></td>
                                                            <td className="p-2 text-center"><div className="flex flex-col gap-1 items-center"><button onClick={(e) => { e.stopPropagation(); saveEditing(); }} className="p-1.5 bg-emerald-600 rounded text-white"><Check size={14}/></button><button onClick={(e) => { e.stopPropagation(); setEditingId(null); setEditForm(null); }} className="p-1.5 bg-slate-600 rounded text-white"><X size={14}/></button></div></td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="p-3 font-medium text-slate-200">
                                                              <div className="flex items-center gap-2">
                                                                <span className="md:hidden">{isExpanded ? <ChevronUp size={14} className="text-cyan-500" /> : <ChevronDown size={14} className="text-slate-500" />}</span>
                                                                {item.name}
                                                              </div>
                                                            </td>
                                                            <td className="p-3 text-sm text-slate-400 hidden md:table-cell">{item.cuil || '-'}</td>
                                                            <td className="p-3 text-sm text-slate-400 hidden md:table-cell">{item.phone || '-'}</td>
                                                            <td className="p-3 text-sm text-slate-400 hidden md:table-cell"><MapPin size={12} className="inline mr-1 text-slate-500"/>{item.location || '-'}</td>
                                                            <td className="p-3 text-center"><div className="flex gap-2 justify-center"><button onClick={(e) => { e.stopPropagation(); startEditing(item); }} className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded"><Edit2 size={16}/></button><button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-700 rounded"><Trash2 size={16}/></button></div></td>
                                                        </>
                                                    )}
                                                </tr>
                                                {isExpanded && !isEditing && (
                                                  <tr className="bg-slate-900/80 md:hidden animate-in slide-in-from-top-1 duration-200">
                                                    <td colSpan={2} className="p-4">
                                                      <div className="space-y-3 text-sm">
                                                        <div className="flex items-center gap-3"><CreditCard size={14} className="text-slate-500"/><div className="text-xs uppercase font-bold text-slate-500 w-24">CUIL:</div><div className="text-slate-300">{item.cuil || '-'}</div></div>
                                                        <div className="flex items-center gap-3"><Phone size={14} className="text-slate-500"/><div className="text-xs uppercase font-bold text-slate-500 w-24">Teléfono:</div><div className="text-slate-300">{item.phone || '-'}</div></div>
                                                        <div className="flex items-center gap-3"><MapPin size={14} className="text-slate-500"/><div className="text-xs uppercase font-bold text-slate-500 w-24">Lugar:</div><div className="text-slate-300">{item.location || '-'}</div></div>
                                                      </div>
                                                    </td>
                                                  </tr>
                                                )}
                                            </React.Fragment>
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
